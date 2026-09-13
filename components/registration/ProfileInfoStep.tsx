import React from 'react';
import { useFormContext } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { RegistrationFormData } from '@/lib/validations/registration';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ProfileInfoStepProps {
  onNext: () => void;
  onBack: () => void;
}

export function ProfileInfoStep({ onNext, onBack }: ProfileInfoStepProps) {
  const { register, trigger, formState: { errors }, setValue, watch } = useFormContext<RegistrationFormData>();

  const handleNext = async () => {
    const isStepValid = await trigger([
      'firstName', 'middleName', 'lastName', 'gender', 'dateOfBirth',
      'nationality', 'phoneNumber', 'ghanaCard', 'address', 'region', 'district'
    ]);
    if (isStepValid) {
      onNext();
    }
  };

  const handleGhanaCardChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Auto-format GHA-123456789-0
    let val = e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, '');
    if (!val.startsWith('GHA-') && val.length > 0) {
      val = val.replace(/^GHA-?/, '');
      val = 'GHA-' + val;
    }
    const parts = val.split('-');
    if (parts.length > 1 && parts[1].length > 9) {
      const p1 = parts[1].substring(0, 9);
      const p2 = parts[1].substring(9) + (parts[2] || '');
      val = `GHA-${p1}-${p2.substring(0, 1)}`;
    }
    setValue('ghanaCard', val, { shouldValidate: true });
  };

  return (
    <div className="space-y-7 max-w-2xl mx-auto w-full">
      <div className="flex items-center mb-6">
        <Button
          type="button"
          variant="ghost"
          onClick={onBack}
          className="text-gray-900 font-medium hover:text-[#16a34a] transition-colors flex items-center gap-2 w-fit px-2 py-1 rounded-lg hover:bg-gray-100"
        >
          <ArrowLeft className="w-4 h-4 mr-1" /> Back
        </Button>
      </div>
      <div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Profile Information</h2>
        <p className="text-lg text-gray-600">Provide your personal details</p>
      </div>
      
      <div className="bg-white p-6 md:p-8 rounded-2xl border border-gray-100 shadow-sm space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div>
            <Label htmlFor="firstName" className="block text-sm font-medium text-gray-900 mb-2">First Name</Label>
            <Input id="firstName" placeholder="e.g. Kwame" {...register('firstName')} />
            {errors.firstName && <p className="text-red-500 text-xs mt-1">{errors.firstName.message}</p>}
          </div>
          <div>
            <Label htmlFor="middleName" className="block text-sm font-medium text-gray-900 mb-2">Middle Name (Optional)</Label>
            <Input id="middleName" placeholder="e.g. Osei" {...register('middleName')} />
          </div>
          <div>
            <Label htmlFor="lastName" className="block text-sm font-medium text-gray-900 mb-2">Last Name</Label>
            <Input id="lastName" placeholder="e.g. Mensah" {...register('lastName')} />
            {errors.lastName && <p className="text-red-500 text-xs mt-1">{errors.lastName.message}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <Label htmlFor="gender" className="block text-sm font-medium text-gray-900 mb-2">Gender</Label>
            <Select onValueChange={(val) => setValue('gender', val as any, { shouldValidate: true })} value={watch('gender')}>
              <SelectTrigger>
                <SelectValue placeholder="Select gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Male">Male</SelectItem>
                <SelectItem value="Female">Female</SelectItem>
              </SelectContent>
            </Select>
            {errors.gender && <p className="text-red-500 text-xs mt-1">{errors.gender.message}</p>}
          </div>
          <div>
            <Label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-900 mb-2">Date of Birth</Label>
            <Input id="dateOfBirth" type="date" {...register('dateOfBirth')} />
            {errors.dateOfBirth && <p className="text-red-500 text-xs mt-1">{errors.dateOfBirth.message}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <Label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-900 mb-2">Phone Number</Label>
            <Input id="phoneNumber" placeholder="e.g. 0241234567" {...register('phoneNumber')} />
            {errors.phoneNumber && <p className="text-red-500 text-xs mt-1">{errors.phoneNumber.message}</p>}
          </div>
          <div>
            <Label htmlFor="ghanaCard" className="block text-sm font-medium text-gray-900 mb-2">Ghana Card Number</Label>
            <Input 
              id="ghanaCard" 
              placeholder="GHA-123456789-0" 
              {...register('ghanaCard')}
              onChange={(e) => {
                register('ghanaCard').onChange(e);
                handleGhanaCardChange(e);
              }}
              maxLength={15}
            />
            {errors.ghanaCard && <p className="text-red-500 text-xs mt-1">{errors.ghanaCard.message}</p>}
          </div>
        </div>

        <div>
          <Label htmlFor="nationality" className="block text-sm font-medium text-gray-900 mb-2">Nationality</Label>
          <Input id="nationality" placeholder="e.g. Ghanaian" {...register('nationality')} />
          {errors.nationality && <p className="text-red-500 text-xs mt-1">{errors.nationality.message}</p>}
        </div>

        <div>
          <Label htmlFor="address" className="block text-sm font-medium text-gray-900 mb-2">Residential Address</Label>
          <Input id="address" placeholder="Enter your address" {...register('address')} />
          {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address.message}</p>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <Label htmlFor="region" className="block text-sm font-medium text-gray-900 mb-2">Region</Label>
            <Input id="region" placeholder="e.g. Greater Accra" {...register('region')} />
            {errors.region && <p className="text-red-500 text-xs mt-1">{errors.region.message}</p>}
          </div>
          <div>
            <Label htmlFor="district" className="block text-sm font-medium text-gray-900 mb-2">District</Label>
            <Input id="district" placeholder="e.g. Accra Metro" {...register('district')} />
            {errors.district && <p className="text-red-500 text-xs mt-1">{errors.district.message}</p>}
          </div>
        </div>
      </div>
      
      <div className="flex justify-end mt-8">
        <Button type="button" onClick={handleNext} className="px-10">Continue</Button>
      </div>
    </div>
  );
}
