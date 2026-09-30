import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

interface Step3VerifyProps {
  formData: any;
  handleContinue: (e: React.FormEvent) => void;
  setCurrentStep: (step: number) => void;
  currentStep: number;
  otp: string[];
  handleOtpChange: (index: number, value: string) => void;
  handleOtpKeyDown: (index: number, e: React.KeyboardEvent<HTMLInputElement>) => void;
}

export function Step3Verify({
  formData,
  handleContinue,
  setCurrentStep,
  currentStep,
  otp,
  handleOtpChange,
  handleOtpKeyDown
}: Step3VerifyProps) {
  return (
    <form onSubmit={handleContinue} className="space-y-6 md:space-y-8 max-w-xl mx-auto w-full flex flex-col items-center px-1 sm:px-4">
      <div className="w-full flex items-center mb-1">
        <Button
          type="button"
          variant="ghost"
          onClick={() => setCurrentStep(currentStep - 1)}
          className="text-gray-900 font-medium hover:text-[#16a34a] transition-colors flex items-center gap-2 w-fit px-2 py-1 rounded-lg hover:bg-gray-100"
        >
          <ArrowLeft className="w-4 h-4 mr-1" /> Back
        </Button>
      </div>
      <div className="mb-2 text-center w-full">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Verify Your Phone Number</h2>
        <p className="text-sm md:text-base text-gray-600 max-w-md mx-auto">
          A 6-digit verification code has been sent to your phone number <span className="font-semibold text-gray-900">{formData.phoneNumber || 'your phone'}</span> via SMS. Enter the code below to complete verification.
        </p>
      </div>
      <div className="grid grid-cols-6 gap-1.5 sm:gap-3 md:gap-4 w-full max-w-[340px] xs:max-w-[380px] sm:max-w-md mx-auto items-center justify-center my-2">
        {[0, 1, 2, 3, 4, 5].map(i => (
          <Input
            key={i}
            id={`otp-input-${i}`}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6}
            value={otp[i] || ''}
            onChange={e => handleOtpChange(i, e.target.value)}
            onKeyDown={e => handleOtpKeyDown(i, e)}
            className="w-full h-11 sm:h-14 md:h-16 text-center text-lg sm:text-xl md:text-2xl font-bold border border-gray-200 focus:border-[#16a34a] focus:ring-2 focus:ring-[#16a34a] rounded-lg sm:rounded-xl bg-white p-0 shadow-sm transition-all"
          />
        ))}
      </div>
      <div className="flex flex-col items-center gap-2 mb-2 text-center">
        <button
          type="button"
          onClick={async () => {
            const loadingToast = toast.loading('Resending verification code...');
            try {
              const res = await fetch('/api/auth/send-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phoneNumber: formData.phoneNumber })
              });
              if (res.ok) {
                toast.success(`Verification code re-sent to ${formData.phoneNumber || 'your phone'}`, { id: loadingToast });
              } else {
                const data = await res.json();
                toast.error(data.error || 'Failed to resend code', { id: loadingToast });
              }
            } catch (err) {
              toast.error('Failed to resend code', { id: loadingToast });
            }
          }}
          className="text-emerald-700 hover:text-emerald-800 text-xs sm:text-sm font-semibold hover:underline transition-colors cursor-pointer"
        >
          Didn't receive code? Resend Code via SMS
        </button>
      </div>
      <div className="w-full sm:w-auto">
        <Button type="submit" className="w-full sm:w-auto px-10">Continue</Button>
      </div>
    </form>
  );
}
