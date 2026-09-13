const fs = require('fs');

let content = fs.readFileSync('app/dashboard/page.tsx', 'utf8');

// 1. Update fetchApplication logic
const fetchApplicationRegex = /const fetchApplication = async \(\) => \{[\s\S]*?\}\s*catch \(error: any\) \{/m;
const fetchApplicationReplacement = `const fetchApplication = async () => {
    const safetyTimer = setTimeout(() => {
      setLoading(false);
    }, 2000);

    try {
      const token = getValidAuthToken();
      if (!token) {
        clearAuthSession();
        router.replace('/login');
        return;
      }
      const response = await axios.get(
        '/api/applications/my-application',
        {
          headers: { Authorization: \`Bearer \${token}\` },
          timeout: 2000,
        }
      );
      
      const app = response.data.application;
      if (!app || app.status === 'draft') {
        router.replace('/register');
        return;
      }
      
      setApplication(app);
    } catch (error: any) {`;

content = content.replace(fetchApplicationRegex, fetchApplicationReplacement);

// 2. Remove the "Resume Draft" UI and just render the cards if application exists.
const renderDraftRegex = /\{!application \|\| application\.status === 'draft' \? \([\s\S]*?\) : \(\s*<>/m;
const renderDraftReplacement = `{!application || application.status === 'draft' ? (
              <div className="col-span-2 py-12 flex justify-center text-gray-500">Redirecting to application form...</div>
            ) : (
              <>`;

content = content.replace(renderDraftRegex, renderDraftReplacement);

fs.writeFileSync('app/dashboard/page.tsx', content, 'utf8');
console.log('app/dashboard/page.tsx updated to enforce redirect');
