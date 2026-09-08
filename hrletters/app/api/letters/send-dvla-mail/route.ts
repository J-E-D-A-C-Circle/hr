import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { letterId, recipientEmail, ccEmail, customSubject, customMessage, actorName } = body;

    if (!recipientEmail || !recipientEmail.includes("@")) {
      return NextResponse.json(
        { success: false, error: "Valid recipient email address is required (e.g. staff@dvla.gov.gh)" },
        { status: 400 }
      );
    }

    let letter: any = null;
    if (letterId) {
      letter = await prisma.letterDocument.findUnique({
        where: { id: letterId },
        include: { staff: true },
      });
    }

    const emailSubject = customSubject || (letter ? `[DVLA HR Official] ${letter.title}` : "Official DVLA HR Document");
    const recipient = recipientEmail.trim();

    const host = req.headers.get("host") || "localhost:3005";
    const protocol = req.headers.get("x-forwarded-proto") || "http";
    const originUrl = `${protocol}://${host}`;

    // Prepare styled HTML content for webmail display
    const htmlBody = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; background-color: #f4f6f8; color: #1f2937; margin: 0; padding: 20px; }
          .card { max-width: 650px; margin: 0 auto; background: #ffffff; border-radius: 8px; border: 1px solid #e5e7eb; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
          .header { background: #0F5132; color: #ffffff; padding: 20px; text-align: center; border-bottom: 4px solid #D97706; }
          .header h1 { margin: 0; font-size: 20px; font-weight: bold; text-transform: uppercase; tracking: 1px; }
          .header p { margin: 4px 0 0; font-size: 12px; opacity: 0.9; }
          .content { padding: 24px; line-height: 1.6; }
          .badge { display: inline-block; background: #E0E7FF; color: #3730A3; font-size: 11px; font-weight: bold; padding: 4px 8px; border-radius: 4px; text-transform: uppercase; margin-bottom: 12px; }
          .details-box { background: #F8FAFC; border-left: 4px solid #0F5132; padding: 14px; margin: 16px 0; border-radius: 4px; font-size: 13px; }
          .message-box { background: #FFFBEB; border: 1px solid #FDE68A; padding: 14px; border-radius: 6px; font-size: 13px; color: #92400E; margin: 16px 0; }
          .button { display: inline-block; background: #0F5132; color: #ffffff !important; text-decoration: none; padding: 10px 20px; border-radius: 6px; font-weight: bold; font-size: 13px; margin-top: 16px; }
          .footer { background: #F9FAFB; padding: 14px; text-align: center; font-size: 11px; color: #6B7280; border-top: 1px solid #E5E7EB; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="header">
            <h1>DRIVER AND VEHICLE LICENSING AUTHORITY</h1>
            <p>Official HR Webmail Notification System &bull; webmail.dvla.gov.gh</p>
          </div>
          <div class="content">
            <span class="badge">Official HR Correspondence</span>
            <p>Dear Colleague / Recipient,</p>
            
            ${customMessage ? `<div class="message-box"><strong>HR Officer Note:</strong><br>${customMessage}</div>` : ''}

            ${
              letter
                ? `
                <div class="details-box">
                  <strong>Document Title:</strong> ${letter.title}<br>
                  <strong>Ref Number:</strong> ${letter.customRefNumber || 'N/A'}<br>
                  <strong>Staff ID:</strong> ${letter.staff?.staffId || 'N/A'}<br>
                  <strong>Staff Name:</strong> ${letter.staff?.fullName || 'N/A'}<br>
                  <strong>Department:</strong> ${letter.staff?.department || 'N/A'}<br>
                  <strong>Verification Code:</strong> <code>${letter.verificationCode}</code>
                </div>
                <p>Please find the generated official letter details attached to your DVLA Mail profile.</p>
                ${
                  letter.verificationCode
                    ? `<a href="${originUrl}/verify?code=${letter.verificationCode}" class="button">View & Verify Document Portal</a>`
                    : ''
                }
              `
                : `<p>An official HR letter dispatch has been sent to your inbox.</p>`
            }

            <p style="margin-top: 24px; font-size: 12px; color: #6b7280;">
              Sent via DVLA Webmail Gateway (<code>webmail.dvla.gov.gh</code>)<br>
              Directorate of Human Resources & Administration, Head Office Accra.
            </p>
          </div>
          <div class="footer">
            &copy; ${new Date().getFullYear()} Driver and Vehicle Licensing Authority (DVLA). All rights reserved.
          </div>
        </div>
      </body>
      </html>
    `;

    // Real SMTP transport or simulated fallback
    let sendResult: any = { success: true, mode: "SIMULATED" };
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = parseInt(process.env.SMTP_PORT || "587", 10);
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    const smtpSecure = process.env.SMTP_SECURE === "true";

    try {
      const nodemailer = require("nodemailer");

      if (smtpHost && smtpUser && smtpPass) {
        // Production Real SMTP Transport (Office365 / Gmail / DVLA Exchange / SendGrid)
        const transporter = nodemailer.createTransport({
          host: smtpHost,
          port: smtpPort,
          secure: smtpSecure,
          auth: {
            user: smtpUser,
            pass: smtpPass,
          },
          tls: {
            rejectUnauthorized: false,
          },
        });

        const info = await transporter.sendMail({
          from: process.env.SMTP_FROM || `DVLA HR Webmail <${smtpUser}>`,
          to: recipient,
          cc: ccEmail || undefined,
          subject: emailSubject,
          html: htmlBody,
        });

        sendResult = {
          success: true,
          mode: "REAL_SMTP_DELIVERED",
          messageId: info.messageId,
          smtpHost,
        };
      } else {
        // Fallback when SMTP credentials are not yet configured in .env
        sendResult = {
          success: true,
          mode: "SMTP_CONFIG_REQUIRED",
          warning:
            "Email logged to system portal. To send to real external inbox, configure SMTP_HOST, SMTP_USER, and SMTP_PASS in .env file.",
        };
      }
    } catch (smtpErr: any) {
      console.error("[DVLA Mail Dispatch Error]:", smtpErr);
      sendResult = {
        success: false,
        mode: "SMTP_FAILED",
        error: smtpErr.message || "Failed to reach SMTP mail server.",
      };
    }

    // Save notification in database
    await prisma.notification.create({
      data: {
        recipientEmail: recipient,
        recipientRole: "Staff",
        channel: "EMAIL",
        subject: emailSubject,
        message: `Official DVLA HR Mail sent to ${recipient}. Subject: ${emailSubject}`,
      },
    });

    // Record audit log
    await prisma.auditLog.create({
      data: {
        action: "LETTER_EMAILED_DVLA_WEBMAIL",
        actorName: actorName || "HR Officer",
        actorRole: "HR_OFFICER",
        targetId: letterId || null,
        targetType: "LetterDocument",
        details: `Dispatched document to DVLA Mail (${recipient}) via webmail.dvla.gov.gh gateway. Delivery mode: ${sendResult.mode}`,
      },
    });

    if (sendResult.success === false) {
      return NextResponse.json(
        {
          success: false,
          error: `Email sending error: ${sendResult.error}. Please configure valid SMTP credentials in .env`,
          details: sendResult,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message:
        sendResult.mode === "REAL_SMTP_DELIVERED"
          ? `Official email successfully delivered to real inbox at ${recipient} via SMTP server (${sendResult.smtpHost}).`
          : `Dispatch recorded for ${recipient} in DVLA HR Portal. (Note: Add SMTP_USER and SMTP_PASS in .env to deliver to real external mailboxes).`,
      details: sendResult,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
