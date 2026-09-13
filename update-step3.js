const fs = require('fs');

let content = fs.readFileSync('components/registration/Step3Verify.tsx', 'utf8');

// Replace "Verify Your Email Address" with "Verify Your Phone Number"
content = content.replace(
  /<h2.*?Verify Your Email Address<\/h2>/s,
  '<h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Verify Your Phone Number</h2>'
);

// Replace "A 6-digit verification code has been sent to ..."
content = content.replace(
  /A 6-digit verification code has been sent to <span.*?\{formData\.email \|\| 'your email address'\}.*?<\/span>\. Enter the code below to complete verification\./s,
  'A 6-digit verification code has been sent to your phone number <span className="font-semibold text-gray-900">{formData.phoneNumber || \'your phone\'}</span> via SMS. Enter the code below to complete verification.'
);

// Replace the resend button onClick logic
content = content.replace(
  /onClick=\{\(\) => \{\s*toast\.success\(`Verification code re-sent to \$\{formData\.email \|\| 'your email'\}`\);\s*\}\}/s,
  `onClick={async () => {
            const loadingToast = toast.loading('Resending verification code...');
            try {
              const res = await fetch('/api/auth/send-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phoneNumber: formData.phoneNumber })
              });
              if (res.ok) {
                toast.success(\`Verification code re-sent to \${formData.phoneNumber || 'your phone'}\`, { id: loadingToast });
              } else {
                const data = await res.json();
                toast.error(data.error || 'Failed to resend code', { id: loadingToast });
              }
            } catch (err) {
              toast.error('Failed to resend code', { id: loadingToast });
            }
          }}`
);

// Replace "Didn't receive code? Resend Code to Email"
content = content.replace(
  /Didn't receive code\? Resend Code to Email/s,
  "Didn't receive code? Resend Code via SMS"
);

// Ensure we include 'useState' if needed? No state needed since we just await fetch.

fs.writeFileSync('components/registration/Step3Verify.tsx', content, 'utf8');
console.log('Step3Verify.tsx updated');
