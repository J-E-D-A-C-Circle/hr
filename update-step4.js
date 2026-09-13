const fs = require('fs');

let content = fs.readFileSync('components/registration/Step4Complete.tsx', 'utf8');

// 1. Add ghanaianRegions
const regionsRegex = /const ghanianCourses = \[.*?\];/s;
const regionsReplacement = `$&

const ghanaianRegions = [
  'Greater Accra', 'Ashanti', 'Western', 'Eastern', 'Central', 'Northern',
  'Volta', 'Upper East', 'Upper West', 'Brong Ahafo', 'Western North', 'Ahafo',
  'Bono', 'Bono East', 'Oti', 'North East', 'Savannah'
];`;

content = content.replace(regionsRegex, regionsReplacement);

// 2. Add Select to imports
if (!content.includes('SelectContent')) {
  content = content.replace(
    /import \{ Label \} from '@\/components\/ui\/label';/,
    `import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';`
  );
}

// 3. Add fields into the form right after "DVLA Branch Posted To"
const branchInputRegex = /(<div className="relative branch-dropdown">.*?<\/div>)/s;
const branchInputReplacement = `$1

        {/* NSS Assignment Details (New Fields) */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4 mt-6">NSS Assignment Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="block text-sm font-medium text-gray-900 mb-2">Posting Region</Label>
              <Select
                value={formData.postingRegion}
                onValueChange={(val) => handleInputChange('postingRegion', val)}
              >
                <SelectTrigger className="w-full h-10 border-gray-200 rounded-md">
                  <SelectValue placeholder="Select Region" />
                </SelectTrigger>
                <SelectContent position="popper">
                  {ghanaianRegions.map(region => (
                    <SelectItem key={region} value={region}>{region}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="block text-sm font-medium text-gray-900 mb-2">Posting District</Label>
              <Input
                type="text"
                name="postingDistrict"
                value={formData.postingDistrict || ''}
                onChange={e => handleInputChange('postingDistrict', e.target.value)}
              />
            </div>
            <div>
              <Label className="block text-sm font-medium text-gray-900 mb-2">Service Period Start <span className="text-gray-400 font-normal text-xs">(DD/MM/YYYY)</span></Label>
              <Input
                type="date"
                name="servicePeriodStart"
                value={formData.servicePeriodStart || ''}
                onChange={e => handleInputChange('servicePeriodStart', e.target.value)}
              />
            </div>
            <div>
              <Label className="block text-sm font-medium text-gray-900 mb-2">Service Period End <span className="text-gray-400 font-normal text-xs">(DD/MM/YYYY)</span></Label>
              <Input
                type="date"
                name="servicePeriodEnd"
                value={formData.servicePeriodEnd || ''}
                onChange={e => handleInputChange('servicePeriodEnd', e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Additional Information */}
        <div>
          <Label className="block text-sm font-medium text-gray-900 mb-2 mt-2">Additional Information</Label>
          <textarea
            name="additionalInfo"
            value={formData.additionalInfo || ''}
            onChange={e => handleInputChange('additionalInfo', e.target.value)}
            rows={4}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#16a34a]"
            placeholder="Any additional information you'd like to provide..."
          />
        </div>`;

content = content.replace(branchInputRegex, branchInputReplacement);

fs.writeFileSync('components/registration/Step4Complete.tsx', content, 'utf8');
console.log('Step4Complete.tsx updated');
