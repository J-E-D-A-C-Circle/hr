const fs = require('fs');

let content = fs.readFileSync('app/register/page.tsx', 'utf8');

// The file is currently a mess around lines 90-130.
// Let's use regex to clean up everything between interface FormData { and useEffect(() => {

const interfaceStart = content.indexOf('interface FormData {');
const useEffectStart = content.indexOf('  // Redirect if already authenticated or Load Draft');

if (interfaceStart !== -1 && useEffectStart !== -1) {
    const before = content.substring(0, interfaceStart);
    const after = content.substring(useEffectStart);
    
    const properMiddle = `interface FormData {
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
    return \`GHA-\${part1}-\${part2}\`;
  }
  
  return \`GHA-\${part1}\`;
}

export default function RegisterPage() {
  const router = useRouter();

  // Hydrated flag - only render after client hydration
  const [hydrated, setHydrated] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);
  const [existingAccountNotice, setExistingAccountNotice] = useState<{ email: string; isDraft: boolean } | null>(null);
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    middleName: '',
    lastName: '',
    gender: '',
    phoneNumber: '',
    ghanaCard: '',
    school: '',
    branch: '',
    dateOfBirth: '',
    nationality: 'Ghanaian',
    region: '',
    district: '',
    address: '',
    course: '',
    yearOfCompletion: '',
    serviceYear: String(new Date().getFullYear()),
    nssPin: '',
    postingRegion: '',
    postingDistrict: '',
    servicePeriodStart: '',
    servicePeriodEnd: '',
    additionalInfo: '',
  });

`;

    fs.writeFileSync('app/register/page.tsx', before + properMiddle + after, 'utf8');
    console.log("Successfully fixed page.tsx");
} else {
    console.log("Could not find boundaries");
}
