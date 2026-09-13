const fs = require('fs');

let content = fs.readFileSync('app/register/page.tsx', 'utf8');

// 1. Update initial formData state
const stateRegex = /const \[formData, setFormData\] = useState\(\{([\s\S]*?)\}\);/m;
content = content.replace(stateRegex, (match, inner) => {
  if (inner.includes('postingRegion')) return match;
  return `const [formData, setFormData] = useState({${inner}
    postingRegion: '',
    postingDistrict: '',
    servicePeriodStart: '',
    servicePeriodEnd: '',
    additionalInfo: '',
  });`;
});

// 2. Update draft prepopulation mapping in fix-resume logic
const draftRegex = /serviceYear: app\.service_year \|\| String\(new Date\(\)\.getFullYear\(\)\),/m;
content = content.replace(draftRegex, (match) => {
  return `${match}
              postingRegion: app.posting_region || '',
              postingDistrict: app.posting_district || '',
              servicePeriodStart: app.service_period_start ? app.service_period_start.split('T')[0] : '',
              servicePeriodEnd: app.service_period_end ? app.service_period_end.split('T')[0] : '',
              additionalInfo: app.additional_info || '',`;
});

const submitBodyRegex = /body: JSON\.stringify\(\{([\s\S]*?\.\.\.formData,[\s\S]*?)\}\)/m;
content = content.replace(submitBodyRegex, (match, inner) => {
  if (inner.includes('posting_region: formData.postingRegion')) return match;
  return `body: JSON.stringify({${inner}
          posting_region: formData.postingRegion,
          posting_district: formData.postingDistrict,
          service_period_start: formData.servicePeriodStart,
          service_period_end: formData.servicePeriodEnd,
          additional_info: formData.additionalInfo,
        })`;
});

fs.writeFileSync('app/register/page.tsx', content, 'utf8');
console.log('app/register/page.tsx updated with new fields');
