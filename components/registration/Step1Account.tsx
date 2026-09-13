import React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff } from 'lucide-react';

interface Step1AccountProps {
  formData: any;
  handleInputChange: (field: any, value: any) => void;
  handleContinue: (e: React.FormEvent) => void;
  existingAccountNotice: { email: string; isDraft: boolean } | null;
  showPassword: boolean;
  setShowPassword: (show: boolean) => void;
  showConfirmPassword: boolean;
  setShowConfirmPassword: (show: boolean) => void;
  passwordStrength: string;
}

export function Step1Account({
  formData,
  handleInputChange,
  handleContinue,
  existingAccountNotice,
  showPassword,
  setShowPassword,
  showConfirmPassword,
  setShowConfirmPassword,
  passwordStrength
}: Step1AccountProps) {
  const router = useRouter();

  return (
    <form onSubmit={handleContinue} className="space-y-6">
      <div>
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">Create an account.</h2>
        <p className="text-base md:text-lg text-gray-600">Provide your account information to continue.</p>
      </div>

      {existingAccountNotice && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-950 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3 animate-fadeIn">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#0d5c2e]/15 flex items-center justify-center text-[#0d5c2e] shrink-0 font-bold text-lg">
              💡
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-sm">Account Already Exists</h4>
              <p className="text-xs text-slate-700">
                An account for <span className="font-semibold text-slate-900">{existingAccountNotice.email}</span> already exists. Log in to resume your application!
              </p>
            </div>
          </div>
          <Button
            type="button"
            onClick={() => router.push(`/login?email=${encodeURIComponent(existingAccountNotice.email)}`)}
            className="bg-[#0d5c2e] hover:bg-[#073e1e] text-white text-xs font-bold px-4 py-2.5 rounded-lg shrink-0 transition-all shadow-md"
          >
            Sign In & Resume Draft →
          </Button>
        </div>
      )}

      {/* Email Input */}
      <div>
        <Label htmlFor="email" className="block text-sm font-medium text-gray-900 mb-2">
          Your Email
        </Label>
        <Input
          type="email"
          id="email"
          required
          value={formData.email}
          onChange={(e) => handleInputChange('email', e.target.value)}
          placeholder="Enter your email"
        />
      </div>

      {/* Password Input */}
      <div>
        <Label htmlFor="password" className="block text-sm font-medium text-gray-900 mb-2">
          Your Password
        </Label>
        <div className="relative">
          <Input
            type={showPassword ? 'text' : 'password'}
            id="password"
            required
            value={formData.password}
            onChange={(e) => handleInputChange('password', e.target.value)}
            placeholder="Create a password."
            className="pr-10"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-[#0d5c2e] transition-colors focus:outline-none"
            tabIndex={-1}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? (
              <EyeOff className="w-5 h-5" />
            ) : (
              <Eye className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      {/* Password Requirements */}
      <div className="text-sm text-gray-600 space-y-1">
        {formData.password && passwordStrength && (
          <div className="mb-2">
            <span className="font-normal">{passwordStrength}</span>
          </div>
        )}
        <ul className="list-disc list-inside space-y-1 ml-2 font-normal">
          <li>Use at least 8 characters</li>
          <li>Besides letters, include at least a number or symbol (!@#$%^&*-_+=).</li>
          <li>Password is case sensitive.</li>
        </ul>
      </div>

      {/* Confirm Password Input */}
      <div>
        <Label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-900 mb-2">
          Confirm Your Password
        </Label>
        <div className="relative">
          <Input
            type={showConfirmPassword ? 'text' : 'password'}
            id="confirmPassword"
            required
            value={formData.confirmPassword}
            onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
            placeholder="Confirm your password."
            className="pr-10"
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-[#0d5c2e] transition-colors focus:outline-none"
            tabIndex={-1}
            aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
          >
            {showConfirmPassword ? (
              <EyeOff className="w-5 h-5" />
            ) : (
              <Eye className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      {/* Continue Button */}
      <div className="flex justify-end mt-8">
        <Button type="submit">Continue</Button>
      </div>
    </form>
  );
}
