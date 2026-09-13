const fs = require('fs');
let content = fs.readFileSync('app/register/page.tsx', 'utf8');

// I will find everything from 'interface FormData' to '// Hydrated flag' and replace it precisely.

const searchRegex = /interface FormData \{[\s\S]*?\/\/ Hydrated flag - only render after client hydration/m;

const replacement = \`interface FormData {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  middleName: string;
  lastName: string;
  gender: string;
  phoneNumber: string;
  ghanaCard: string;
  school: string;
  branch: string;
  dateOfBirth: string;
  nationality: string;
  region: string;
  district: string;
  address: string;
  course: string;
  yearOfCompletion: string;
  serviceYear: string;
  nssPin: string;
  postingRegion?: string;
  postingDistrict?: string;
  servicePeriodStart?: string;
  servicePeriodEnd?: string;
  additionalInfo?: string;
}

function formatGhanaCard(input: string): string {
  if (!input) return '';
  const rawDigits = input.replace(/\\D/g, '').slice(0, 10);
  
  if (rawDigits.length === 0) {
    return input.trim().toUpperCase().startsWith('G') ? 'GHA-' : '';
  }

  const part1 = rawDigits.slice(0, 9);
  const part2 = rawDigits.slice(9, 10);

  if (rawDigits.length > 9) {
    return \\\`GHA-\\\${part1}-\\\${part2}\\\`;
  }
  
  return \\\`GHA-\\\${part1}\\\`;
}

export default function RegisterPage() {
  const router = useRouter();

  // Hydrated flag - only render after client hydration\`;

content = content.replace(searchRegex, replacement);

fs.writeFileSync('app/register/page.tsx', content, 'utf8');
console.log('Fixed top of page.tsx');
