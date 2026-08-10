import nodemailer from 'nodemailer';

const host = process.env.SMTP_HOST || '127.0.0.1';
const port = parseInt(process.env.SMTP_PORT || '1025', 10);
const fromAddress = process.env.SMTP_FROM || 'DVLA Recruitment & Attachment Portal <recruitment@dvla.gov.gh>';

export const transporter = nodemailer.createTransport({
  host,
  port,
  secure: false, // TLS false for local Mailhog
  ignoreTLS: true,
});

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  attachments?: Array<{
    filename: string;
    path?: string;
    content?: Buffer | string;
    contentType?: string;
  }>;
}

export async function sendEmail({ to, subject, html, attachments }: SendEmailOptions) {
  try {
    const info = await transporter.sendMail({
      from: fromAddress,
      to,
      subject,
      html,
      attachments,
    });
    console.log(`[Email Engine] Sent email to ${to}. MessageId: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`[Email Engine] Failed to send email to ${to}:`, error);
    return { success: false, error: (error as Error).message };
  }
}

export function getStageChangeEmailTemplate({
  applicantName,
  referenceNumber,
  positionTitle,
  newStage,
  notes,
  toEmail,
}: {
  applicantName: string;
  referenceNumber: string;
  positionTitle: string;
  newStage: string;
  notes?: string;
  toEmail?: string;
}) {
  const stageLabels: Record<string, { label: string; color: string; description: string }> = {
    SUBMITTED: {
      label: 'Application Submitted',
      color: '#0F5132',
      description: 'Your application has been received and registered in our portal.',
    },
    UNDER_REVIEW: {
      label: 'Under Review',
      color: '#D97706',
      description: 'Your application is currently being reviewed by the DVLA Recruitment Committee.',
    },
    SHORTLISTED: {
      label: 'Shortlisted',
      color: '#059669',
      description: 'Congratulations! You have been shortlisted for further evaluation.',
    },
    PANEL_SCORING: {
      label: 'Panel Assessment & Scoring',
      color: '#2563EB',
      description: 'Your application is undergo scoring by our official evaluation panel.',
    },
    APPROVED: {
      label: 'Application Approved / Appointed',
      color: '#0F5132',
      description: 'Congratulations! Your application has been approved. Please find your official appointment letter attached and access your Post-Acceptance Document Center.',
    },
    REJECTED: {
      label: 'Application Unsuccessful',
      color: '#DC2626',
      description: 'We regret to inform you that your application was not selected for this role.',
    },
  };

  const stageInfo = stageLabels[newStage] || {
    label: newStage,
    color: '#1F2937',
    description: 'Your application status has been updated.',
  };

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #FDF6E3; color: #1F2937; margin: 0; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.08); border: 1px solid #E5E7EB; }
        .header { background-color: #0F5132; color: #ffffff; padding: 24px; text-align: center; }
        .header h1 { margin: 0; font-size: 20px; font-weight: 700; letter-spacing: 0.5px; }
        .header p { margin: 4px 0 0 0; font-size: 13px; opacity: 0.9; }
        .content { padding: 32px 24px; }
        .stage-badge { display: inline-block; background-color: ${stageInfo.color}; color: #ffffff; padding: 6px 14px; border-radius: 20px; font-weight: 600; font-size: 14px; margin-bottom: 16px; }
        .details-box { background-color: #FDF6E3; border-left: 4px solid #0F5132; padding: 16px; margin: 20px 0; border-radius: 4px; }
        .button { display: inline-block; background-color: #0F5132; color: #ffffff !important; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 600; font-size: 14px; margin-top: 20px; }
        .footer { background-color: #F9FAFB; padding: 16px 24px; text-align: center; font-size: 12px; color: #6B7280; border-top: 1px solid #E5E7EB; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>DRIVER & VEHICLE LICENSING AUTHORITY</h1>
          <p>DVLA Recruitment & Attachment Portal (DRAP)</p>
        </div>
        <div class="content">
          <p>Dear <strong>${applicantName}</strong>,</p>
          <p>This is an official update regarding your application for <strong>${positionTitle}</strong> (Reference Number: <strong>${referenceNumber}</strong>).</p>
          
          <div style="text-align: center; margin: 24px 0;">
            <div class="stage-badge">${stageInfo.label}</div>
          </div>
          
          <p>${stageInfo.description}</p>
          
          ${notes ? `<div class="details-box"><strong>Officer Notes:</strong><br>${notes}</div>` : ''}

          <div class="details-box">
            <strong>Application Reference:</strong> ${referenceNumber}<br>
            <strong>Position:</strong> ${positionTitle}<br>
            <strong>Current Stage:</strong> ${stageInfo.label}
          </div>

          ${
            newStage === 'APPROVED'
              ? `<p>Please log in to the Post-Acceptance Document Center using your Reference Number and Email to complete your onboarding requirements.</p>
                 <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/document-center?ref=${referenceNumber}&email=${encodeURIComponent(toEmail || '')}" class="button">Access Document Center</a>`
              : `<a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/status?ref=${referenceNumber}" class="button">Check Status Portal</a>`
          }
        </div>
        <div class="footer">
          &copy; ${new Date().getFullYear()} Driver and Vehicle Licensing Authority (DVLA), Ghana. All rights reserved.
        </div>
      </div>
    </body>
    </html>
  `;
}
