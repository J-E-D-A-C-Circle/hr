const fs = require('fs');

let content = fs.readFileSync('app/register/page.tsx', 'utf8');

// Update Step 2: after registration, save draft and send OTP
const step2Regex = /\/\/ Save token for later use.*?setCurrentStep\(3\);/s;
const step2Replacement = `// Save token for later use
        if (data.token) {
          localStorage.setItem('token', data.token);
          localStorage.setItem('user', JSON.stringify(data.user));
          
          // Save draft to database
          try {
            await fetch('/api/applications/draft', {
              method: 'POST',
              headers: { 
                'Content-Type': 'application/json',
                'Authorization': \`Bearer \${data.token}\`
              },
              body: JSON.stringify({ ...formData, currentStep: 3 })
            });
          } catch (e) {
            console.error('Failed to save draft:', e);
          }

          // Send OTP via SMS
          try {
            await fetch('/api/auth/send-otp', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ phoneNumber: formData.phoneNumber })
            });
          } catch (e) {
            console.error('Failed to send OTP:', e);
          }
        }
        
        console.log('Account created successfully!', data.user);
        toast.success(\`Verification code sent to \${formData.phoneNumber || 'your phone'}\`);
        setCurrentStep(3);`;

content = content.replace(step2Regex, step2Replacement);


// Update Step 3: call verify-otp
const step3Regex = /if \(currentStep === 3\) \{.*?toast\.success\('Email address verified successfully!'\);\s*setCurrentStep\(4\);\s*return;\s*\}/s;
const step3Replacement = `if (currentStep === 3) {
      if (otp.join('').length !== 6) {
        toast.error('Please enter the 6-digit verification code sent to your phone');
        return;
      }
      
      setIsSubmitting(true);
      try {
        const response = await fetch('/api/auth/verify-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phoneNumber: formData.phoneNumber,
            token: otp.join('')
          })
        });
        
        const data = await response.json();
        if (!response.ok) {
          toast.error(data.error || 'Invalid verification code');
          setIsSubmitting(false);
          return;
        }
        
        toast.success('Phone number verified successfully!');
        
        // Update draft to Step 4
        const token = localStorage.getItem('token');
        if (token) {
          fetch('/api/applications/draft', {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': \`Bearer \${token}\`
            },
            body: JSON.stringify({ ...formData, currentStep: 4 })
          }).catch(console.error);
        }
        
        setCurrentStep(4);
      } catch (error: any) {
        toast.error('Failed to verify code. Please try again.');
      } finally {
        setIsSubmitting(false);
      }
      return;
    }`;

content = content.replace(step3Regex, step3Replacement);

fs.writeFileSync('app/register/page.tsx', content, 'utf8');
console.log('page.tsx updated');
