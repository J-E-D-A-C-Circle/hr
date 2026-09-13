import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface VerifyPhoneStepProps {
  phoneNumber: string;
  onNext: () => void;
  onBack: () => void;
}

export function VerifyPhoneStep({ phoneNumber, onNext, onBack }: VerifyPhoneStepProps) {
  const [otp, setOtp] = useState<string[]>(Array(6).fill(''));
  const [isVerifying, setIsVerifying] = useState(false);

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) {
      value = value[value.length - 1];
    }
    if (!/^[0-9]*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-input-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-input-${index - 1}`);
      prevInput?.focus();
    }
  };

  const resendOtp = async () => {
    try {
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber }),
      });
      if (!response.ok) throw new Error('Failed to send OTP');
      toast.success(`Verification code re-sent to ${phoneNumber}`);
    } catch (error) {
      toast.error('Failed to resend OTP');
    }
  };

  const handleVerify = async () => {
    const code = otp.join('');
    if (code.length !== 6) {
      toast.error('Please enter the 6-digit code');
      return;
    }

    setIsVerifying(true);
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber, code }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Invalid code');
      }

      toast.success('Phone verified successfully!');
      onNext();
    } catch (error: any) {
      toast.error(error.message || 'Verification failed');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="space-y-8 max-w-xl mx-auto w-full flex flex-col items-center">
      <div className="w-full flex items-center mb-2">
        <Button
          type="button"
          variant="ghost"
          onClick={onBack}
          className="text-gray-900 font-medium hover:text-[#16a34a] transition-colors flex items-center gap-2 w-fit px-2 py-1 rounded-lg hover:bg-gray-100"
        >
          <ArrowLeft className="w-4 h-4 mr-1" /> Back
        </Button>
      </div>
      <div className="mb-4 text-center">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Verify Your Phone Number</h2>
        <p className="text-sm md:text-base text-gray-600">
          A 6-digit verification code has been sent to <span className="font-semibold text-gray-900">{phoneNumber || 'your phone number'}</span>. Enter the code below to complete verification.
        </p>
      </div>
      <div className="flex gap-4 md:gap-6 items-center justify-center mb-2">
        {[0,1,2,3,4,5].map(i => (
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
            className={`w-12 h-12 md:w-16 md:h-16 text-center text-xl md:text-2xl font-semibold border border-gray-200 focus:border-[#16a34a] focus:ring-[#16a34a] rounded-xl bg-white`}
          />
        ))}
      </div>
      <div className="flex flex-col items-center gap-2 mb-2">
        <button
          type="button"
          onClick={resendOtp}
          className="text-emerald-700 hover:text-emerald-800 text-sm font-semibold hover:underline transition-colors cursor-pointer"
        >
          Didn't receive code? Resend Code via SMS
        </button>
      </div>
      <div>
        <Button type="button" onClick={handleVerify} disabled={isVerifying} className="px-10">
          {isVerifying ? 'Verifying...' : 'Continue'}
        </Button>
      </div>
    </div>
  );
}
