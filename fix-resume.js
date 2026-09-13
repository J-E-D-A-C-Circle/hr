const fs = require('fs');
let content = fs.readFileSync('app/register/page.tsx', 'utf8');

// Replace the redirect useEffect
const redirectRegex = /\/\/ Redirect if already authenticated.*?\}, \[router\]\);/s;
const newRedirect = `// Redirect if already authenticated or Load Draft
  useEffect(() => {
    const checkAuthAndDraft = async () => {
      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');
      
      if (token && userStr) {
        try {
          const user = JSON.parse(userStr);
          if (user.role === 'admin') {
            router.replace('/admin/dashboard');
            return;
          }
          
          // Check if they have a draft
          const res = await fetch('/api/applications/draft', {
            headers: { 'Authorization': \`Bearer \${token}\` }
          });
          const data = await res.json();
          
          if (data.application && data.application.status === 'draft') {
            // Load draft into form data
            const app = data.application;
            const extra = app.additional_info ? JSON.parse(app.additional_info) : {};
            
            setFormData(prev => ({
              ...prev,
              firstName: app.first_name || '',
              lastName: app.last_name || '',
              middleName: app.middle_name || '',
              email: app.email || prev.email,
              phoneNumber: app.phone_number || '',
              ghanaCard: app.nss_number || prev.ghanaCard, // Stored ghanaCard here temporarily? Or nssPin?
              gender: app.gender || '',
              nationality: app.nationality || 'Ghanaian',
              region: app.region || '',
              district: app.district || '',
              address: app.residential_address || '',
              school: app.institution_name || '',
              course: app.course_program || '',
              yearOfCompletion: app.year_of_completion || '',
              serviceYear: app.service_year || String(new Date().getFullYear()),
              nssPin: app.nss_number || prev.nssPin,
            }));
            
            if (extra.currentStep) {
              setCurrentStep(extra.currentStep);
            } else {
              setCurrentStep(3); // Default to step 3 if they have an account but no step saved
            }
          } else {
            // Not a draft, or fully completed
            router.replace('/dashboard');
          }
        } catch (e) {
          router.replace('/dashboard');
        }
      }
    };
    
    if (typeof window !== 'undefined') {
      checkAuthAndDraft();
    }
  }, [router]);`;

content = content.replace(redirectRegex, newRedirect);
fs.writeFileSync('app/register/page.tsx', content, 'utf8');
console.log('Resume logic updated');
