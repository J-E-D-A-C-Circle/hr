"use client";
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Image from 'next/image';

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError("");
    // Simulate request delay
    setTimeout(() => { setSent(true); setLoading(false); }, 1400);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-white to-emerald-50">
      <div className="w-full max-w-md bg-white/90 backdrop-blur rounded-2xl shadow-lg px-6 py-10 flex flex-col items-center">
        <Image src="/oop.png" width={64} height={64} alt="DVLA Logo" className="mb-6 mt-2 rounded-full bg-white p-2" />
        <h2 className="text-2xl font-extrabold text-gray-900 text-center mb-1">Forgot your password?</h2>
        <div className="text-base text-gray-600 mb-7 text-center">Enter your email and we’ll send you a link to reset your password.</div>
        <form onSubmit={handleSubmit} className="w-full space-y-5">
          <Input
            type="email"
            required
            autoFocus
            placeholder="you@example.com"
            className="w-full"
            value={email}
            onChange={e => setEmail(e.target.value)}
            disabled={loading || sent}
          />
          {error && <div className="text-red-600 text-sm py-1">{error}</div>}
          <Button
            type="submit"
            disabled={loading || sent}
            className="bg-[#16a34a] hover:bg-[#15803d] text-white w-full rounded-xl py-3 font-bold text-base shadow"
          >
            {sent ? 'Email sent!' : loading ? 'Sending...' : 'Send password reset email'}
          </Button>
        </form>
      </div>
    </div>
  );
}
