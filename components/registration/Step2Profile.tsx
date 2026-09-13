import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft } from 'lucide-react';

interface Step2ProfileProps {
  formData: any;
  handleInputChange: (field: any, value: any) => void;
  handleContinue: (e: React.FormEvent) => void;
  setCurrentStep: (step: number) => void;
  currentStep: number;
}

function formatGhanaCard(input: string): string {
  if (!input) return '';
  const rawDigits = input.replace(/\D/g, '').slice(0, 10);
  
  if (rawDigits.length === 0) {
    return input.trim().toUpperCase().startsWith('G') ? 'GHA-' : '';
  }

  const part1 = rawDigits.slice(0, 9);
  const part2 = rawDigits.slice(9, 10);

  if (rawDigits.length > 9) {
    return `GHA-${part1}-${part2}`;
  }
  
  return `GHA-${part1}`;
}

const nationalities = [
  "Ghanaian", "Nigerian", "Kenyan", "South African", "Egyptian", "Ethiopian", "Tanzanian",
  "Ugandan", "Algerian", "Sudanese", "Moroccan", "Angolan", "Mozambican", "Madagascan",
  "Cameroonian", "Ivory Coast", "Malagasy", "Burkina Faso", "Malawi", "Zambian", "Senegalese",
  "Zimbabwean", "Guinean", "Rwandan", "Beninese", "Burundian", "Tunisian", "South Sudanese",
  "Somalian", "Togolese", "Sierra Leonean", "Libyan", "Liberian", "Central African",
  "Mauritanian", "Eritrean", "Gambian", "Botswanan", "Namibian", "Gabonese", "Lesotho",
  "Guinea-Bissau", "Equatorial Guinean", "Mauritian", "Eswatini", "Djiboutian", "Comorian",
  "Cabo Verdean", "Sao Tomean", "Seychellois", "British", "American", "Canadian", "Australian",
  "Indian", "Chinese", "Japanese", "Korean", "Pakistani", "Bangladeshi", "Filipino",
  "Vietnamese", "Thai", "Indonesian", "Malaysian", "Singaporean", "Sri Lankan", "Nepalese",
  "Afghan", "Iranian", "Iraqi", "Saudi Arabian", "Emirati", "Kuwaiti", "Qatari", "Omani",
  "Bahraini", "Yemeni", "Jordanian", "Lebanese", "Syrian", "Israeli", "Palestinian", "Turkish",
  "Greek", "Italian", "Spanish", "French", "German", "Dutch", "Belgian", "Swiss", "Austrian",
  "Portuguese", "Polish", "Russian", "Ukrainian", "Romanian", "Hungarian", "Czech", "Swedish",
  "Norwegian", "Danish", "Finnish", "Irish", "Scottish", "Welsh", "Brazilian", "Argentine",
  "Mexican", "Colombian", "Peruvian", "Venezuelan", "Chilean", "Ecuadorian", "Guatemalan",
  "Cuban", "Haitian", "Dominican", "Jamaican", "Trinidadian", "Barbadian", "Bahamian", "Other"
].sort();

export function Step2Profile({
  formData,
  handleInputChange,
  handleContinue,
  setCurrentStep,
  currentStep
}: Step2ProfileProps) {
  const [nationalityInput, setNationalityInput] = useState(formData.nationality || "");
  const [nationalityDropdown, setNationalityDropdown] = useState(false);
  const filteredNationalities = nationalities.filter(nat => nat.toLowerCase().includes(nationalityInput.toLowerCase()));

  useEffect(() => {
    function closeDropdowns(e: MouseEvent) {
      const target = e.target as HTMLElement;
      if (!target.closest('#nationality') && !target.closest('.nationality-dropdown')) {
        setNationalityDropdown(false);
      }
    }
    document.addEventListener('click', closeDropdowns);
    return () => document.removeEventListener('click', closeDropdowns);
  }, []);

  return (
    <form onSubmit={handleContinue} className="space-y-6">
      <div className="flex items-center mb-6">
        <Button
          type="button"
          variant="ghost"
          onClick={() => setCurrentStep(currentStep - 1)}
          className="text-gray-900 font-medium hover:text-[#16a34a] transition-colors flex items-center gap-2 w-fit px-2 py-1 rounded-lg hover:bg-gray-100"
        >
          <ArrowLeft className="w-4 h-4 mr-1" /> Back
        </Button>
      </div>

      <div>
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">Create an account.</h2>
        <p className="text-base md:text-lg text-gray-600">Provide your personal information to get started.</p>
      </div>

      {/* Two Column Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          {/* First Name */}
          <div>
            <Label htmlFor="firstName" className="block text-sm font-medium text-gray-900 mb-2">
              Your First Name
            </Label>
            <Input
              type="text"
              id="firstName"
              required
              value={formData.firstName}
              onChange={(e) => handleInputChange('firstName', e.target.value)}
              placeholder="Enter Your First Name"
            />
          </div>

          {/* Last Name */}
          <div>
            <Label htmlFor="lastName" className="block text-sm font-medium text-gray-900 mb-2">
              Your Last Name
            </Label>
            <Input
              type="text"
              id="lastName"
              required
              value={formData.lastName}
              onChange={(e) => handleInputChange('lastName', e.target.value)}
              placeholder="Enter Your Last Name"
            />
          </div>

          {/* Phone Number */}
          <div>
            <Label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-900 mb-2">
              Your Phone Number
            </Label>
            <div className="relative w-full">
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 flex items-center gap-2 z-10 pointer-events-none">
                <span className="text-sm font-semibold text-gray-700">GH</span>
                <span className="text-gray-400">|</span>
              </div>
              <Input
                type="tel"
                id="phoneNumber"
                required
                value={formData.phoneNumber}
                onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                className="pl-12 w-full"
                placeholder="Enter phone number"
              />
            </div>
          </div>

          {/* Date of Birth */}
          <div>
            <Label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-900 mb-2">
              Date of Birth <span className="text-gray-400 font-normal text-xs">(DD/MM/YYYY)</span>
            </Label>
            <Input
              type="date"
              id="dateOfBirth"
              required
              value={formData.dateOfBirth}
              onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
              className="w-full"
              max={new Date().toISOString().split('T')[0]}
            />
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Middle Name */}
          <div>
            <Label htmlFor="middleName" className="block text-sm font-medium text-gray-900 mb-2">
              Your Middle Name
            </Label>
            <Input
              type="text"
              id="middleName"
              value={formData.middleName}
              onChange={(e) => handleInputChange('middleName', e.target.value)}
              placeholder="Enter Other Names"
            />
          </div>

          {/* Gender */}
          <div>
            <Label htmlFor="gender" className="block text-sm font-medium text-gray-900 mb-2">
              Select Your Gender
            </Label>
            <div className="relative">
              <Select
                value={formData.gender || undefined}
                onValueChange={(value) => {
                  if (value === "__clear__") {
                    handleInputChange('gender', "");
                    const trigger = document.getElementById('gender');
                    if (trigger) trigger.click();
                  } else {
                    handleInputChange('gender', value);
                  }
                }}
              >
                <SelectTrigger id="gender" className="w-full h-14 text-base">
                  <SelectValue placeholder="Select Gender" />
                </SelectTrigger>
                <SelectContent position="popper" sideOffset={4}>
                  {formData.gender && (
                    <SelectItem value="__clear__" className="text-sm cursor-pointer text-gray-500 hover:text-gray-700 hover:bg-gray-50 border-b border-gray-200">
                      Clear selection
                    </SelectItem>
                  )}
                  <SelectItem value="Male" className="text-base cursor-pointer">Male</SelectItem>
                  <SelectItem value="Female" className="text-base cursor-pointer">Female</SelectItem>
                </SelectContent>
              </Select>
              {formData.gender && (
                <button
                  type="button"
                  onClick={() => handleInputChange('gender', "")}
                  className="absolute right-10 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label="Clear gender selection"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Ghana Card */}
          <div>
            <Label htmlFor="ghanaCard" className="block text-sm font-medium text-gray-900 mb-2">
              Ghana Card Number <span className="text-red-500">*</span>
            </Label>
            <div className="relative flex items-center">
              <Input
                type="text"
                id="ghanaCard"
                value={formData.ghanaCard}
                onFocus={(e) => {
                  if (!e.target.value) handleInputChange('ghanaCard', 'GHA-');
                }}
                onChange={(e) => {
                  const formatted = formatGhanaCard(e.target.value);
                  handleInputChange('ghanaCard', formatted);
                }}
                placeholder="GHA-123456789-0"
                maxLength={15}
                className="w-full font-mono text-sm tracking-wider font-medium"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1.5 flex items-center gap-1">
              <span>Format:</span>
              <span className="font-mono font-bold text-gray-700 bg-gray-100 px-1.5 py-0.5 rounded">GHA-XXXXXXXXX-X</span>
              <span className="text-emerald-700 font-medium">(Auto-formats as you type)</span>
            </p>
          </div>

          {/* Nationality */}
          <div className="relative nationality-dropdown">
            <Label htmlFor="nationality" className="block text-sm font-medium text-gray-900 mb-2">
              Nationality
            </Label>
            <Input
              id="nationality"
              name="nationality"
              autoComplete="off"
              required
              value={nationalityInput || formData.nationality || ''}
              onFocus={() => {
                setNationalityDropdown(true);
                setNationalityInput(formData.nationality || '');
              }}
              onChange={e => {
                setNationalityInput(e.target.value);
                setNationalityDropdown(true);
                handleInputChange('nationality', e.target.value);
              }}
              placeholder="Start typing nationality..."
              className="w-full"
            />
            {nationalityDropdown && (
              <ul className="absolute left-0 z-50 max-h-60 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg overflow-y-auto">
                {filteredNationalities.length === 0 && (
                  <li className="px-4 py-2 text-gray-400">No results</li>
                )}
                {filteredNationalities.map((nationality) => (
                  <li
                    key={nationality}
                    className="px-4 py-2 hover:bg-emerald-100 cursor-pointer text-sm"
                    onClick={() => {
                      handleInputChange('nationality', nationality);
                      setNationalityDropdown(false);
                      setNationalityInput(nationality);
                    }}
                  >
                    {nationality}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* Continue Button */}
      <div className="flex justify-end mt-8">
        <Button type="submit">Continue</Button>
      </div>
    </form>
  );
}
