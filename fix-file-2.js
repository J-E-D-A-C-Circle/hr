const fs = require('fs');
let content = fs.readFileSync('app/register/page.tsx', 'utf8');

// I need to repair the file from line 31 downwards.
// Currently it looks like:
/*
  firstName: string;
  middleName: string;
  // Hydrated flag - only render after client hydration
*/

const targetPoint = '  // Hydrated flag - only render after client hydration';
const insertionPoint = content.indexOf(targetPoint);

if (insertionPoint === -1) {
    console.log("Could not find insertion point.");
    process.exit(1);
}

const beforeTarget = content.substring(0, insertionPoint);
const afterTarget = content.substring(insertionPoint);

// Clean up the `beforeTarget` because it ends right after `middleName: string;`
// Wait, looking at the previous output, line 30 is `  middleName: string;`
// and line 31 is `  // Hydrated flag...`

// So I just need to remove everything after `middleName: string;\n` and replace it with the correct interface fields and the function.

const correctInterfaceAndFunction = \`  lastName: string;
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

\`;

const newContent = beforeTarget + correctInterfaceAndFunction + afterTarget;

// Oh wait, `useState<FormData>({` also needs to have the new fields added to the initial state!
let finalContent = newContent.replace(
    /serviceYear: String\(new Date\(\)\.getFullYear\(\)\),\n    nssPin: '',\n  \}\);/g,
    \`serviceYear: String(new Date().getFullYear()),
    nssPin: '',
    postingRegion: '',
    postingDistrict: '',
    servicePeriodStart: '',
    servicePeriodEnd: '',
    additionalInfo: '',
  });\`
);

fs.writeFileSync('app/register/page.tsx', finalContent, 'utf8');
console.log('Fixed page.tsx');
