import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '465', 10),
  secure: process.env.SMTP_SECURE === 'true' || true, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS, // App Password for Gmail
  },
});

export interface ApplicationEmailOptions {
  to: string;
  applicantName: string;
  nssNumber: string;
  applicationId: number;
}

export async function sendApplicationReceipt(options: ApplicationEmailOptions) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn('SMTP credentials not configured. Skipping email receipt.');
    return;
  }

  const { to, applicantName, nssNumber, applicationId } = options;

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 12px;">
      <h2 style="color: #0d5c2e; text-align: center; margin-bottom: 24px;">National Service Scheme</h2>
      <div style="background-color: #f0fdf4; border-left: 4px solid #16a34a; padding: 16px; margin-bottom: 24px;">
        <p style="margin: 0; color: #166534; font-size: 16px;"><strong>Application Submitted Successfully!</strong></p>
      </div>
      <p style="color: #374151; font-size: 15px;">Dear <strong>${applicantName}</strong>,</p>
      <p style="color: #374151; font-size: 15px;">We have received your NSS application (ID: #${applicationId}). Your application is currently under review by our team.</p>
      
      <div style="background-color: #f9fafb; padding: 16px; border-radius: 8px; margin: 24px 0;">
        <h3 style="margin-top: 0; color: #111827; font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em;">Application Details</h3>
        <p style="margin: 8px 0; color: #4b5563; font-size: 14px;"><strong>NSS Number:</strong> ${nssNumber}</p>
        <p style="margin: 8px 0; color: #4b5563; font-size: 14px;"><strong>Application ID:</strong> #${applicationId}</p>
        <p style="margin: 8px 0; color: #4b5563; font-size: 14px;"><strong>Status:</strong> <span style="background-color: #fef08a; color: #854d0e; padding: 2px 6px; border-radius: 4px; font-weight: bold; font-size: 12px;">PENDING</span></p>
      </div>

      <p style="color: #6b7280; font-size: 14px;">You will receive another email once your application has been reviewed and approved.</p>
      
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
      <p style="color: #9ca3af; font-size: 12px; text-align: center;">This is an automated message from the NSS Portal. Please do not reply to this email.</p>
    </div>
  `;

  await transporter.sendMail({
    from: `"NSS Portal" <${process.env.SMTP_USER}>`,
    to,
    subject: `NSS Application Submitted - #${applicationId}`,
    html: htmlContent,
  });
}
