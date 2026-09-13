import React, { useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff } from 'lucide-react';
import { RegistrationFormData } from '@/lib/validations/registration';

interface CreateAccountStepProps {
  onNext: () => void;
}

export function CreateAccountStep({ onNext }: CreateAccountStepProps) {
  const { register, trigger, formState: { errors } } = useFormContext<RegistrationFormData>();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleNext = async () => {
    const isStepValid = await trigger(['email', 'password', 'confirmPassword']);
    if (isStepValid) {
      onNext();
    }
  };

  return (
    <div className="space-y-6 max-w-sm mx-auto w-full">
      <div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Create Account</h2>
        <p className="text-lg text-gray-600">Start your NSS registration</p>
      </div>
      <div className="space-y-5">
        <div>
          <Label htmlFor="email" className="block text-sm font-medium text-gray-900 mb-2">Email Address</Label>
          <Input 
            id="email" 
            type="email" 
            placeholder="you@example.com" 
            {...register('email')}
          />
          {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
        </div>
        <div>
          <Label htmlFor="password" className="block text-sm font-medium text-gray-900 mb-2">Password</Label>
          <div className="relative">
            <Input 
              id="password" 
              type={showPassword ? "text" : "password"}
              placeholder="••••••••" 
              {...register('password')}
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none p-1 rounded-full hover:bg-gray-100 transition-colors"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
        </div>
        <div>
          <Label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-900 mb-2">Confirm Password</Label>
          <div className="relative">
            <Input 
              id="confirmPassword" 
              type={showConfirmPassword ? "text" : "password"}
              placeholder="••••••••" 
              {...register('confirmPassword')}
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none p-1 rounded-full hover:bg-gray-100 transition-colors"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword.message}</p>}
        </div>
      </div>
      <div className="pt-2">
        <Button type="button" className="w-full text-base font-medium py-6" onClick={handleNext}>
          Create Account
        </Button>
      </div>
      <p className="text-center text-sm text-gray-600 mt-6">
        Already have an account?{' '}
        <a href="/login" className="text-[#16a34a] font-semibold hover:underline">Sign in</a>
      </p>
    </div>
  );
}
