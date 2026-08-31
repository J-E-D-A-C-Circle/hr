"use client";

export interface PrintLetterParams {
  title?: string;
  verificationCode?: string;
  customRefNumber?: string;
  yourRef?: string;
  issueDate?: string;
  applicantName?: string;
  applicantAddress?: string;
  salutation?: string;
  customSubject?: string;
  customBodyText?: string;
  signatoryName?: string;
  signatoryTitle?: string;
  signatoryForTitle?: string;
  ccList?: string | string[];
  digitalSignature?: string;
  letterType?: string;
  positionTitle?: string;
  departmentName?: string;
  effectiveDate?: string;
  salaryGrade?: string;
}

export function printOfficialLetter(params: PrintLetterParams) {
  const printWin = window.open("", "_blank");
  if (!printWin) return;

  const logoPath = "/oop.png";
  const displayRef =
    params.customRefNumber ||
    (params.verificationCode ? `DVLA/HR/07/26/PLACMT/${params.verificationCode.slice(-4)}` : "DVLA/HR/07/26/PLACMT/0127");
  const displayYourRef = params.yourRef || "....................................";
  const displayIssueDate =
    params.issueDate ||
    new Date().toLocaleDateString("en-GB", { month: "long", day: "numeric", year: "numeric" }).toUpperCase();
  const displayApplicantName = params.applicantName || "APPLICANT NAME";
  const displayApplicantAddress = params.applicantAddress || "ACCRA - GHANA";
  const displaySalutation = params.salutation || "Dear Sir/Madam,";
  const displaySubjectText =
    params.customSubject ||
    (params.letterType === "CONTRACT_RENEWAL"
      ? "OFFER OF CONTRACT RENEWAL"
      : params.letterType === "PROMOTION"
      ? "LETTER OF PROMOTION"
      : params.letterType === "CONFIRMATION"
      ? "CONFIRMATION OF APPOINTMENT"
      : params.letterType === "TRANSFER"
      ? "INTER-DEPARTMENTAL TRANSFER"
      : params.letterType === "WARNING"
      ? "FORMAL DISCIPLINARY WARNING"
      : params.letterType === "LEAVE_APPROVAL"
      ? "APPROVAL OF LEAVE"
      : "OFFER OF APPOINTMENT");

  const displayBodyText =
    params.customBodyText ||
    `I am pleased to inform you that Management has approved your appointment as ${params.positionTitle || "Officer"} in the ${params.departmentName || "Operations"} Department, effective ${params.effectiveDate || "Monday, September 1, 2026"}.\n\nYour appointment is subject to satisfactory performance and adherence to standard Authority policies. You are required to report to the Ag. Director Human Resource for formal documentation.\n\nKindly acknowledge receipt of this document.`;

  const displaySignatoryName = params.signatoryName || "EPHRAIM NII TAN SACKEY";
  const displaySignatoryTitle = params.signatoryTitle || "AG. DIRECTOR HR";
  const displaySignatoryForTitle = params.signatoryForTitle || "FOR: CHIEF EXECUTIVE";

  const ccListItems: string[] = typeof params.ccList === "string"
    ? params.ccList.split("\n").map((s) => s.trim()).filter(Boolean)
    : Array.isArray(params.ccList) && params.ccList.length > 0
    ? params.ccList
    : ["Chief Executive", "Deputy Chief Executives", "Ag. Director, IT", "Ag. Director Administration", "Manager, HR (C&B)"];

  printWin.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>DVLA Official Letter - ${displayApplicantName}</title>
      <style>
        @page {
          size: A4 portrait;
          margin: 0;
        }
        @media print {
          html, body {
            width: 210mm !important;
            min-height: 297mm !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #FDF3C0 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .letter-page {
            box-shadow: none !important;
            border: none !important;
            width: 210mm !important;
            min-height: 297mm !important;
            padding: 16mm 18mm !important;
            margin: 0 !important;
            background-color: #FDF3C0 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        html, body {
          width: 100%;
          margin: 0;
          padding: 0;
          background: #FDF3C0;
          font-family: 'Georgia', 'Times New Roman', serif;
          color: #111827;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        body {
          display: flex;
          justify-content: center;
        }
        .letter-page {
          position: relative;
          width: 210mm;
          min-height: 297mm;
          background-color: #FDF3C0;
          padding: 18mm 18mm 18mm 18mm;
          box-shadow: 0 10px 25px rgba(0,0,0,0.15);
          overflow: hidden;
          box-sizing: border-box;
          font-family: 'Times New Roman', Times, serif;
        }
        .watermark {
          position: absolute;
          top: 45%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 400px;
          height: 400px;
          opacity: 0.065;
          pointer-events: none;
          z-index: 1;
        }
        .content {
          position: relative;
          z-index: 10;
        }
        .header-title {
          text-align: center;
          font-size: 19px;
          font-weight: 900;
          color: #008053;
          letter-spacing: 0.5px;
          text-transform: uppercase;
          margin-bottom: 8px;
        }
        .header-grid {
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          align-items: center;
          font-family: Arial, Helvetica, sans-serif;
          font-size: 11px;
          color: #1f2937;
          margin-top: 8px;
        }
        .header-left { text-align: left; line-height: 1.4; }
        .header-center { text-align: center; padding: 0 15px; }
        .header-right { text-align: right; line-height: 1.4; }
        .header-logo { width: 75px; height: 75px; object-fit: contain; }
        .divider { border-top: 2.5px solid #008053; margin: 12px 0 20px 0; }

        .ref-section {
          font-size: 13px;
          margin-bottom: 20px;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .ref-top-row {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 16px;
        }
        .ref-box-my {
          display: flex;
          align-items: flex-end;
          gap: 6px;
          max-width: 320px;
          flex: 1;
        }
        .ref-box-date {
          display: flex;
          align-items: flex-end;
          gap: 6px;
          width: 200px;
          margin-left: auto;
        }
        .ref-box-your {
          display: flex;
          align-items: flex-end;
          gap: 6px;
          max-width: 320px;
        }
        .ref-label {
          font-weight: bold;
          white-space: nowrap;
          color: #111827;
          padding-bottom: 1px;
        }
        .dots-wrapper {
          position: relative;
          flex: 1;
          padding-bottom: 1px;
          overflow: hidden;
        }
        .dots-bg {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          color: #9ca3af;
          font-family: monospace;
          font-size: 10px;
          letter-spacing: 2.5px;
          line-height: 1;
          user-select: none;
          pointer-events: none;
          overflow: hidden;
          white-space: nowrap;
        }
        .dots-val {
          position: relative;
          font-weight: bold;
          color: #030712;
          margin-left: 8px;
        }
        .dots-val-upper {
          position: relative;
          font-weight: bold;
          color: #030712;
          margin-left: 8px;
          text-transform: uppercase;
        }

        .addressee {
          font-size: 14px;
          font-weight: bold;
          text-transform: uppercase;
          margin-bottom: 18px;
          line-height: 1.35;
        }
        .addressee-name { font-size: 15px; font-weight: 900; color: #030712; }
        .addressee-addr { color: #374151; font-weight: normal; }

        .salutation { font-size: 13px; margin-bottom: 16px; }

        .subject-heading { margin-bottom: 20px; }
        .subject-title {
          font-size: 13.5px;
          font-weight: 900;
          text-transform: uppercase;
          border-bottom: 1.5px solid #111827;
          padding-bottom: 2px;
          display: inline-block;
          letter-spacing: 0.5px;
        }

        .body-text {
          font-size: 13px;
          line-height: 1.65;
          text-align: justify;
          margin-bottom: 28px;
          white-space: pre-line;
        }

        .footer-block {
          margin-top: 24px;
          font-size: 12px;
        }
        .signature-img { height: 50px; object-fit: contain; margin: 6px 0; }
        .signature-svg { width: 140px; height: 46px; margin: 6px 0; }
        .signatory-name { font-weight: 900; text-transform: uppercase; font-size: 13px; color: #030712; }
        .signatory-title { font-weight: bold; color: #1f2937; }
        .signatory-for { font-size: 11px; font-weight: bold; color: #4b5563; text-transform: uppercase; }

        .cc-box { margin-top: 16px; font-size: 11px; line-height: 1.4; }
        .cc-box ul { list-style: none; padding-left: 0; margin-top: 3px; }
      </style>
    </head>
    <body>
      <div class="letter-page">
        <img src="${logoPath}" alt="DVLA Watermark" class="watermark" />
        <div class="content">
          <div class="header-title">DRIVER AND VEHICLE LICENSING AUTHORITY</div>
          <div class="header-grid">
            <div class="header-left">
              <div><strong>Tel:</strong> 0302 764 529</div>
              <div><strong>Website:</strong> http://www.dvla.gov.gh</div>
              <div><strong>Email:</strong> info@dvla.gov.gh</div>
            </div>
            <div class="header-center">
              <img src="${logoPath}" alt="DVLA Emblem" class="header-logo" />
            </div>
            <div class="header-right">
              <div style="font-weight: bold; color: #008053;">Head Office Address:</div>
              <div>1, Jawaharlal Nehru Road</div>
              <div>P. O. Box 9379, KIA-Accra</div>
            </div>
          </div>
          <div class="divider"></div>

          <div class="ref-section">
            <div class="ref-top-row">
              <div class="ref-box-my">
                <span class="ref-label">My Ref:</span>
                <div class="dots-wrapper">
                  <span class="dots-bg">..................................................</span>
                  <span class="dots-val">${displayRef}</span>
                </div>
              </div>
              <div class="ref-box-date">
                <span class="ref-label">Date:</span>
                <div class="dots-wrapper">
                  <span class="dots-bg">..................................................</span>
                  <span class="dots-val-upper">${displayIssueDate}</span>
                </div>
              </div>
            </div>
            <div class="ref-box-your">
              <span class="ref-label">Your Ref:</span>
              <div class="dots-wrapper">
                <span class="dots-bg">..................................................</span>
                <span class="dots-val">${displayYourRef}</span>
              </div>
            </div>
          </div>

          <div class="addressee">
            <div class="addressee-name">${displayApplicantName}</div>
            <div class="addressee-addr">${displayApplicantAddress}</div>
          </div>

          <div class="salutation">${displaySalutation}</div>

          <div class="subject-heading">
            <h2 class="subject-title">${displaySubjectText}</h2>
          </div>

          <div class="body-text">${displayBodyText}</div>

          <div class="footer-block">
            <div>Yours faithfully,</div>
            <div>
              ${
                params.digitalSignature
                  ? `<img src="${params.digitalSignature}" alt="Signature" class="signature-img" />`
                  : `<svg class="signature-svg" viewBox="0 0 200 60" fill="none" stroke="#1a365d" stroke-width="2">
                      <path d="M 10,45 Q 30,10 50,40 T 90,20 T 130,45 T 170,15" stroke-width="2.5" stroke-linecap="round" />
                      <path d="M 25,35 Q 60,5 110,40 T 180,25" stroke-width="1.5" stroke-linecap="round" />
                     </svg>`
              }
            </div>
            <div>
              <div class="signatory-name">${displaySignatoryName}</div>
              <div class="signatory-title">${displaySignatoryTitle}</div>
              <div class="signatory-for">${displaySignatoryForTitle}</div>
            </div>

            <div class="cc-box">
              <div style="display: flex; gap: 16px;">
                <strong>Cc:</strong>
                <ul>
                  ${ccListItems.map((item) => `<li>&bull; ${item}</li>`).join("")}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
      <script>
        window.onload = function() {
          setTimeout(function() {
            window.print();
          }, 300);
        }
      </script>
    </body>
    </html>
  `);
  printWin.document.close();
}
