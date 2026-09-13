const fs = require('fs');

let content = fs.readFileSync('app/admin/applications/[id]/page.tsx', 'utf8');

// Import getFileViewUrl and Eye icon
if (!content.includes('getFileViewUrl')) {
    content = content.replace(
        "import { getValidAuthToken, getStoredUser, clearAuthSession } from '@/lib/auth-client';",
        "import { getValidAuthToken, getStoredUser, clearAuthSession } from '@/lib/auth-client';\nimport { getFileViewUrl } from '@/lib/file-upload';"
    );
}

if (!content.includes('Eye')) {
    content = content.replace(
        "import { FileText } from 'lucide-react';",
        "import { FileText, Eye } from 'lucide-react';"
    );
}

// Add the 4 document fields to the Application interface
if (!content.includes('appointment_letter: string;')) {
    content = content.replace(
        '  status: string;',
        '  status: string;\n  passport_photo?: string;\n  id_card_copy?: string;\n  appointment_letter?: string;\n  certificates?: string;'
    );
}

// Add the "Attached Documents" section right before "Review Form"
const targetStr = '{/* Review Form */}';

if (content.includes(targetStr) && !content.includes('Attached Application Files')) {
    const documentsSection = `{/* Attached Documents */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">Attached Documents</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Passport Photo */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
                  <div>
                    <span className="font-extrabold text-slate-900 block mb-1">Passport Photograph</span>
                    <span className="text-slate-500 text-[11px] block font-medium">Verified Image</span>
                  </div>
                  {application.passport_photo ? (
                    <a
                      href={getFileViewUrl(application.passport_photo)}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-4 flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-[#0d5c2e] text-xs font-bold border border-slate-200"
                    >
                      <Eye className="w-4 h-4" /> View Passport Photo
                    </a>
                  ) : (
                    <span className="mt-4 text-slate-400 italic text-[11px] font-medium">No photo uploaded</span>
                  )}
                </div>

                {/* ID Card Copy */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
                  <div>
                    <span className="font-extrabold text-slate-900 block mb-1">National ID Card</span>
                    <span className="text-slate-500 text-[11px] block font-medium">Ghana Card Copy</span>
                  </div>
                  {application.id_card_copy ? (
                    <a
                      href={getFileViewUrl(application.id_card_copy)}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-4 flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-[#0d5c2e] text-xs font-bold border border-slate-200"
                    >
                      <Eye className="w-4 h-4" /> View Ghana Card
                    </a>
                  ) : (
                    <span className="mt-4 text-slate-400 italic text-[11px] font-medium">No ID uploaded</span>
                  )}
                </div>
                
                {/* Appointment Letter */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
                  <div>
                    <span className="font-extrabold text-slate-900 block mb-1">Appointment Letter</span>
                    <span className="text-slate-500 text-[11px] block font-medium">Official DVLA Document</span>
                  </div>
                  {application.appointment_letter ? (
                    <a
                      href={getFileViewUrl(application.appointment_letter)}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-4 flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-[#0d5c2e] text-xs font-bold border border-slate-200"
                    >
                      <Eye className="w-4 h-4" /> View Appointment Letter
                    </a>
                  ) : (
                    <span className="mt-4 text-slate-400 italic text-[11px] font-medium">No letter uploaded</span>
                  )}
                </div>

                {/* CV / Certificates */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
                  <div>
                    <span className="font-extrabold text-slate-900 block mb-1">CV / Certificates</span>
                    <span className="text-slate-500 text-[11px] block font-medium">Additional Academic Records</span>
                  </div>
                  {application.certificates ? (
                    <a
                      href={getFileViewUrl(application.certificates)}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-4 flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-[#0d5c2e] text-xs font-bold border border-slate-200"
                    >
                      <Eye className="w-4 h-4" /> View Certificates
                    </a>
                  ) : (
                    <span className="mt-4 text-slate-400 italic text-[11px] font-medium">No CV uploaded</span>
                  )}
                </div>
              </div>
            </div>

            `;
            
    content = content.replace(targetStr, documentsSection + targetStr);
}

fs.writeFileSync('app/admin/applications/[id]/page.tsx', content, 'utf8');
console.log('app/admin/applications/[id]/page.tsx updated with full documents section');
