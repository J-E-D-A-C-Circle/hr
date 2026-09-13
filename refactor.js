const fs = require('fs');

let content = fs.readFileSync('app/register/page.tsx', 'utf8');

// Add imports
content = content.replace(
  "import toast from 'react-hot-toast';",
  "import toast from 'react-hot-toast';\nimport { Step1Account } from '@/components/registration/Step1Account';\nimport { Step2Profile } from '@/components/registration/Step2Profile';\nimport { Step3Verify } from '@/components/registration/Step3Verify';\nimport { Step4Complete } from '@/components/registration/Step4Complete';"
);

// Remove arrays and local dropdown state
content = content.replace(
  /\/\/ Ghana universities and colleges \(partial, add as needed\).*?if \(\!hydrated\) return null;/s,
  "if (!hydrated) return null;"
);

// Replace Step 1
content = content.replace(
  /\{currentStep === 1 && \(\s*<form onSubmit=\{handleContinue\}.*?<\/form>\s*\)\}/s,
  `{currentStep === 1 && (
            <Step1Account 
              formData={formData}
              handleInputChange={handleInputChange}
              handleContinue={handleContinue}
              existingAccountNotice={existingAccountNotice}
              showPassword={showPassword}
              setShowPassword={setShowPassword}
              showConfirmPassword={showConfirmPassword}
              setShowConfirmPassword={setShowConfirmPassword}
              passwordStrength={passwordStrength}
            />
          )}`
);

// Replace Step 2
content = content.replace(
  /\{currentStep === 2 && \(\s*<form onSubmit=\{handleContinue\}.*?<\/form>\s*\)\}/s,
  `{currentStep === 2 && (
            <Step2Profile 
              formData={formData}
              handleInputChange={handleInputChange}
              handleContinue={handleContinue}
              setCurrentStep={setCurrentStep}
              currentStep={currentStep}
            />
          )}`
);

// Replace Step 3
content = content.replace(
  /\{currentStep === 3 && \(\s*<form onSubmit=\{handleContinue\}.*?<\/form>\s*\)\}/s,
  `{currentStep === 3 && (
            <Step3Verify 
              formData={formData}
              handleContinue={handleContinue}
              setCurrentStep={setCurrentStep}
              currentStep={currentStep}
              otp={otp}
              handleOtpChange={handleOtpChange}
              handleOtpKeyDown={handleOtpKeyDown}
            />
          )}`
);

// Replace Step 4
content = content.replace(
  /\{currentStep === 4 && \(\s*<form onSubmit=\{handleContinue\}.*?<\/form>\s*\)\}/s,
  `{currentStep === 4 && (
            <Step4Complete 
              formData={formData}
              handleInputChange={handleInputChange}
              handleContinue={handleContinue}
              setCurrentStep={setCurrentStep}
              currentStep={currentStep}
              isSubmitting={isSubmitting}
              submitError={submitError}
              passportFileName={passportFileName}
              idCardFileName={idCardFileName}
              appointmentFileName={appointmentFileName}
              cvFileName={cvFileName}
              passportFileRef={passportFileRef}
              idCardFileRef={idCardFileRef}
              appointmentFileRef={appointmentFileRef}
              cvFileRef={cvFileRef}
              handlePassportSelected={handlePassportSelected}
              handleIdCardSelected={handleIdCardSelected}
              handleAppointmentSelected={handleAppointmentSelected}
              handleCvSelected={handleCvSelected}
            />
          )}`
);

fs.writeFileSync('app/register/page.tsx', content, 'utf8');
console.log('Refactor complete');
