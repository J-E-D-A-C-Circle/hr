import React, { useRef, useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ImageIcon, ShieldCheck, FileText, Upload } from 'lucide-react';
import { RegistrationFormData } from '@/lib/validations/registration';

interface CompleteApplicationStepProps {
  onBack: () => void;
  onSubmit: (e?: React.BaseSyntheticEvent) => Promise<void>;
  isSubmitting: boolean;
  submitError: string | null;
  files: {
    passport: File | null;
    id_card: File | null;
    appointment: File | null;
    cv: File | null;
  };
  setFiles: React.Dispatch<React.SetStateAction<{
    passport: File | null;
    id_card: File | null;
    appointment: File | null;
    cv: File | null;
  }>>;
}

export function CompleteApplicationStep({ onBack, onSubmit, isSubmitting, submitError, files, setFiles }: CompleteApplicationStepProps) {
  const { register, formState: { errors } } = useFormContext<RegistrationFormData>();

  const passportFileRef = useRef<HTMLInputElement>(null);
  const idCardFileRef = useRef<HTMLInputElement>(null);
  const appointmentFileRef = useRef<HTMLInputElement>(null);
  const cvFileRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (field: keyof typeof files, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFiles(prev => ({ ...prev, [field]: e.target.files![0] }));
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-7 max-w-2xl mx-auto w-full">
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
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Complete your account</h2>
        <p className="text-lg text-gray-600">Provide your personal information to get started.</p>
      </div>
      <div className="space-y-5">
        <div>
          <Label htmlFor="nssPin" className="block text-sm font-medium text-gray-900 mb-2">Your National Service PIN</Label>
          <Input id="nssPin" placeholder="Eg. NSS 0345 067 856" {...register('nssPin')} />
          {errors.nssPin && <p className="text-red-500 text-xs mt-1">{errors.nssPin.message}</p>}
        </div>

        <div>
          <Label htmlFor="school" className="block text-sm font-medium text-gray-900 mb-2">School you attended</Label>
          <Input id="school" placeholder="e.g. University of Ghana" {...register('school')} />
          {errors.school && <p className="text-red-500 text-xs mt-1">{errors.school.message}</p>}
        </div>

        <div>
          <Label htmlFor="course" className="block text-sm font-medium text-gray-900 mb-2">Your course of study</Label>
          <Input id="course" placeholder="e.g. BSc Computer Science" {...register('course')} />
          {errors.course && <p className="text-red-500 text-xs mt-1">{errors.course.message}</p>}
        </div>

        <div>
          <Label htmlFor="yearOfCompletion" className="block text-sm font-medium text-gray-900 mb-2">Year of Completion</Label>
          <Input id="yearOfCompletion" type="number" min="2000" max={new Date().getFullYear() + 1} placeholder="e.g. 2024" {...register('yearOfCompletion')} />
          {errors.yearOfCompletion && <p className="text-red-500 text-xs mt-1">{errors.yearOfCompletion.message}</p>}
        </div>

        <div>
          <Label htmlFor="serviceYear" className="block text-sm font-medium text-gray-900 mb-2">Service Year</Label>
          <Input id="serviceYear" type="number" min="2020" max={new Date().getFullYear() + 2} placeholder={`e.g. ${new Date().getFullYear()}`} {...register('serviceYear')} />
          {errors.serviceYear && <p className="text-red-500 text-xs mt-1">{errors.serviceYear.message}</p>}
        </div>

        <div>
          <Label htmlFor="branch" className="block text-sm font-medium text-gray-900 mb-2">DVLA Branch Posted To</Label>
          <Input id="branch" placeholder="e.g. Accra" {...register('branch')} />
          {errors.branch && <p className="text-red-500 text-xs mt-1">{errors.branch.message}</p>}
        </div>

        {/* Uploads Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
          {[
            { id: 'passport', label: 'Passport Picture', icon: ImageIcon, accept: 'image/*' },
            { id: 'id_card', label: 'Ghana Card / ID Copy', icon: ShieldCheck, accept: 'image/*,application/pdf' },
            { id: 'appointment', label: 'NSS Appointment Letter', icon: FileText, accept: 'application/pdf,image/*' },
            { id: 'cv', label: 'Curriculum Vitae (CV) / Certificates', icon: Upload, accept: 'application/pdf' },
          ].map((uploadItem) => {
            const fileKey = uploadItem.id as keyof typeof files;
            const fileObj = files[fileKey];
            const Icon = uploadItem.icon;
            return (
              <div key={uploadItem.id} className="flex flex-col">
                <div className="flex items-center justify-between mb-2">
                  <Label className="block text-sm font-semibold text-gray-900">{uploadItem.label}</Label>
                  {fileObj && <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">✓ Attached</span>}
                </div>
                <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl flex flex-col md:flex-row items-start md:items-center px-4 py-3 gap-3 md:gap-4 shadow-sm">
                  <button type="button" onClick={() => {
                    if (fileKey === 'passport') passportFileRef.current?.click();
                    if (fileKey === 'id_card') idCardFileRef.current?.click();
                    if (fileKey === 'appointment') appointmentFileRef.current?.click();
                    if (fileKey === 'cv') cvFileRef.current?.click();
                  }} className="flex items-center px-3 py-2 bg-[#0d5c2e] text-white font-semibold rounded-lg gap-2 shadow hover:bg-[#073e1e] transition text-xs md:text-sm">
                    <Icon className="w-4 h-4" />
                    {fileObj ? 'Change' : 'Upload'}
                  </button>
                  <input
                    ref={fileKey === 'passport' ? passportFileRef : fileKey === 'id_card' ? idCardFileRef : fileKey === 'appointment' ? appointmentFileRef : cvFileRef}
                    type="file"
                    accept={uploadItem.accept}
                    className="hidden"
                    onChange={(e) => handleFileChange(fileKey, e)}
                  />
                  <div className="md:ml-2 text-xs text-gray-700 truncate mt-1 md:mt-0 max-w-[160px]">
                    {fileObj ? fileObj.name : 'No file selected'}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div className="flex justify-end mt-8">
        <Button type="submit" className="px-10" disabled={isSubmitting}>
          {isSubmitting ? 'Submitting Application...' : 'Submit Application'}
        </Button>
      </div>
      {submitError && (
        <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">
          {submitError}
        </div>
      )}
    </form>
  );
}
