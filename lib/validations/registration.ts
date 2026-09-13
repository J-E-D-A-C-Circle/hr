import { z } from 'zod';

const phoneRegex = /^[0-9]{10,15}$/;

// Base schema for the entire registration flow
export const baseRegistrationSchema = z.object({
  // Step 1: Create Account
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),

  // Step 2: Profile Information
  firstName: z.string().min(1, 'First name is required'),
  middleName: z.string().optional(),
  lastName: z.string().min(1, 'Last name is required'),
  gender: z.enum(['Male', 'Female', 'Other'], {
    errorMap: () => ({ message: 'Please select a gender' }),
  }),
  dateOfBirth: z.string().min(1, 'Date of birth is required'),
  nationality: z.string().min(1, 'Nationality is required'),
  phoneNumber: z.string().regex(phoneRegex, 'Invalid phone number'),
  ghanaCard: z.string().min(1, 'Ghana Card is required'),
  address: z.string().min(1, 'Residential address is required'),
  region: z.string().min(1, 'Region is required'),
  district: z.string().min(1, 'District is required'),

  // Step 4: Complete Application (Step 3 is just OTP verification, no form state here)
  school: z.string().min(1, 'Institution name is required'),
  course: z.string().min(1, 'Course program is required'),
  yearOfCompletion: z.string().min(4, 'Year of completion is required'),
  serviceYear: z.string().min(4, 'Service year is required'),
  nssPin: z.string().min(1, 'NSS Number/PIN is required'),
  branch: z.string().min(1, 'DVLA Branch is required'),
});

export const registrationSchema = baseRegistrationSchema.refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

export type RegistrationFormData = z.infer<typeof registrationSchema>;

// Step-specific schemas for piecemeal validation
export const step1Schema = baseRegistrationSchema.pick({
  email: true,
  password: true,
  confirmPassword: true,
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

export const step2Schema = baseRegistrationSchema.pick({
  firstName: true,
  middleName: true,
  lastName: true,
  gender: true,
  dateOfBirth: true,
  nationality: true,
  phoneNumber: true,
  ghanaCard: true,
  address: true,
  region: true,
  district: true,
});

export const step4Schema = baseRegistrationSchema.pick({
  school: true,
  course: true,
  yearOfCompletion: true,
  serviceYear: true,
  nssPin: true,
  branch: true,
});
