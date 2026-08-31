'use server';

import { prisma } from '@/lib/prisma';
import { getAdminSession } from '@/lib/auth';

export async function searchCandidatesForScoring(query: string) {
  try {
    const cleanQuery = query.trim();
    if (!cleanQuery) return { success: true, candidates: [] };

    const applications = await prisma.application.findMany({
      where: {
        OR: [
          { applicant: { fullName: { contains: cleanQuery } } },
          { applicant: { email: { contains: cleanQuery } } },
          { referenceNumber: { contains: cleanQuery } },
        ],
      },
      include: {
        applicant: true,
        position: {
          include: {
            rubricCriteria: {
              include: {
                subcriteria: {
                  orderBy: { order: 'asc' },
                },
              },
              orderBy: { order: 'asc' },
            },
          },
        },
        department: true,
        documents: true,
      },
      take: 20,
    });

    // Sanitize documents to ONLY return CV for judge viewing
    const sanitizedCandidates = applications.map((app: any) => ({
      ...app,
      cvDocument: app.documents.find((d: any) => d.type === 'CV') || null,
      documents: undefined, // Strip other sensitive documents like cover letter and application letter
    }));

    return { success: true, candidates: sanitizedCandidates };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

export async function submitJudgeScore({
  applicationId,
  judgeName,
  judgeDepartment,
  judgeDesignation,
  scores,
  notes,
}: {
  applicationId: string;
  judgeName: string;
  judgeDepartment: string;
  judgeDesignation: string;
  scores: Array<{ subcriteriaId: string; score: number; comments?: string }>;
  notes?: string;
}) {
  try {
    if (!judgeName.trim() || !judgeDepartment.trim() || !judgeDesignation.trim()) {
      return { success: false, error: 'Judge Name, Department, and Designation are required.' };
    }

    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        position: {
          include: {
            rubricCriteria: {
              include: { subcriteria: true },
            },
          },
        },
      },
    });

    if (!application) {
      return { success: false, error: 'Target application not found.' };
    }

    // Check if the same judge has already submitted a score for this candidate
    const existingScore = await prisma.panelScore.findFirst({
      where: {
        applicationId,
        judgeName: judgeName.trim(),
      },
    });

    if (existingScore) {
      return {
        success: false,
        error: `Judge "${judgeName.trim()}" has already submitted an evaluation score for candidate ${application.referenceNumber}. Duplicate submissions for the same candidate are not permitted.`,
      };
    }

    // Map of subcriteria id to max mark
    const maxMarksMap = new Map<string, number>();
    application.position.rubricCriteria.forEach((crit: any) => {
      crit.subcriteria.forEach((sub: any) => {
        maxMarksMap.set(sub.id, sub.maxMark);
      });
    });

    // Validate scores against subcriteria max marks
    let totalScore = 0;
    for (const item of scores) {
      const maxAllowed = maxMarksMap.get(item.subcriteriaId);
      if (maxAllowed === undefined) {
        return { success: false, error: `Invalid rubric subcriteria item specified.` };
      }
      if (item.score < 0 || item.score > maxAllowed) {
        return {
          success: false,
          error: `Score of ${item.score} exceeds maximum allowed mark (${maxAllowed}) for subcriteria item.`,
        };
      }
      totalScore += Number(item.score);
    }

    // Save score in database
    const panelScore = await prisma.panelScore.create({
      data: {
        applicationId,
        judgeName: judgeName.trim(),
        judgeDepartment: judgeDepartment.trim(),
        judgeDesignation: judgeDesignation.trim(),
        totalScore,
        notes: notes?.trim(),
        scoreDetails: {
          create: scores.map((s) => ({
            rubricSubcriteriaId: s.subcriteriaId,
            score: Number(s.score),
            comments: s.comments?.trim(),
          })),
        },
      },
      include: { scoreDetails: true },
    });

    // Move stage to PANEL_SCORING if currently in SUBMITTED or UNDER_REVIEW
    if (application.currentStage === 'SUBMITTED' || application.currentStage === 'UNDER_REVIEW') {
      await prisma.application.update({
        where: { id: applicationId },
        data: { currentStage: 'PANEL_SCORING' },
      });
    }

    return { success: true, totalScore, panelScore };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

// REAL-TIME PANEL MONITOR & CONSENSUS/DIVERGENCE ACTIONS
export async function getPanelMonitorData() {
  try {
    const currentUser = await getAdminSession();
    if (!currentUser) {
      return { success: false, error: 'Unauthorized.' };
    }

    const applications = await prisma.application.findMany({
      where: {
        panelScores: { some: {} },
      },
      include: {
        applicant: true,
        position: true,
        department: true,
        panelScores: {
          include: {
            scoreDetails: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    const monitoredCandidates = applications.map((app: any) => {
      const scores = app.panelScores.map((s: any) => s.totalScore);
      const judgeCount = scores.length;
      
      let averageScore = 0;
      let minScore = 0;
      let maxScore = 0;
      let scoreDelta = 0;
      let stdDev = 0;
      let isWildDivergence = false;

      if (judgeCount > 0) {
        averageScore = scores.reduce((a: number, b: number) => a + b, 0) / judgeCount;
        minScore = Math.min(...scores);
        maxScore = Math.max(...scores);
        scoreDelta = maxScore - minScore;

        if (judgeCount > 1) {
          const variance = scores.reduce((sum: number, score: number) => sum + Math.pow(score - averageScore, 2), 0) / judgeCount;
          stdDev = Math.sqrt(variance);
          // Wild divergence trigger: delta > 20 points OR stdDev > 12
          isWildDivergence = scoreDelta >= 20 || stdDev >= 12;
        }
      }

      return {
        id: app.id,
        referenceNumber: app.referenceNumber,
        applicantName: app.applicant.fullName,
        positionTitle: app.position.title,
        departmentName: app.department.name,
        currentStage: app.currentStage,
        isFlaggedForDiscussion: (app as any).isFlaggedForDiscussion ?? false,
        discussionNotes: (app as any).discussionNotes ?? null,
        judgeCount,
        averageScore: Number(averageScore.toFixed(1)),
        minScore,
        maxScore,
        scoreDelta,
        stdDev: Number(stdDev.toFixed(1)),
        isWildDivergence,
        panelScores: app.panelScores,
      };
    });

    return { success: true, monitoredCandidates };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

export async function togglePanelDiscussionFlag(applicationId: string, isFlagged: boolean, discussionNotes?: string) {
  try {
    const currentUser = await getAdminSession();
    if (!currentUser) {
      return { success: false, error: 'Unauthorized.' };
    }

    const updatedApp = await prisma.application.update({
      where: { id: applicationId },
      data: {
        isFlaggedForDiscussion: isFlagged,
        discussionNotes: discussionNotes?.trim(),
      } as any,
    });

    return { success: true, application: updatedApp };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}
