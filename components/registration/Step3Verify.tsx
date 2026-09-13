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
    <form onSubmit={handleContinue} className="space-y-8 max-w-xl mx-auto w-full flex flex-col items-center">
      <div className="w-full flex items-center mb-2">
        <Button
          type="button"
          variant="ghost"
          onClick={() => setCurrentStep(currentStep - 1)}
          className="text-gray-900 font-medium hover:text-[#16a34a] transition-colors flex items-center gap-2 w-fit px-2 py-1 rounded-lg hover:bg-gray-100"
        >
          <ArrowLeft className="w-4 h-4 mr-1" /> Back
        </Button>
      </div>
      <div className="mb-4 text-center">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Verify Your Phone Number</h2>
        <p className="text-sm md:text-base text-gray-600">
          A 6-digit verification code has been sent to your phone number <span className="font-semibold text-gray-900">{formData.phoneNumber || 'your phone'}</span> via SMS. Enter the code below to complete verification.
        </p>
      </div>
      <div className="flex gap-4 md:gap-6 items-center justify-center mb-2">
        {[0, 1, 2, 3, 4, 5].map(i => (
          <Input
            key={i}
            id={`otp-input-${i}`}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={1}
            value={otp[i] || ''}
            onChange={e => handleOtpChange(i, e.target.value)}
            onKeyDown={e => handleOtpKeyDown(i, e)}
            className="w-12 h-12 md:w-16 md:h-16 text-center text-xl md:text-2xl font-semibold border border-gray-200 focus:border-[#16a34a] focus:ring-[#16a34a] rounded-xl bg-white"
          />
        ))}
      </div>
      <div className="flex flex-col items-center gap-2 mb-2">
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
          className="text-emerald-700 hover:text-emerald-800 text-sm font-semibold hover:underline transition-colors cursor-pointer"
        >
          Didn't receive code? Resend Code via SMS
        </button>
      </div>
      <div>
        <Button type="submit" className="px-10">Continue</Button>
      </div>
    </form>
  );
}
