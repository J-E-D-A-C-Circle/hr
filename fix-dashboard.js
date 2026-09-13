const fs = require('fs');

let content = fs.readFileSync('app/admin/dashboard/page.tsx', 'utf8');

// Import getFileViewUrl
if (!content.includes('getFileViewUrl')) {
    content = content.replace(
        "import { getValidAuthToken, getStoredUser, clearAuthSession } from '@/lib/auth-client';",
        "import { getValidAuthToken, getStoredUser, clearAuthSession } from '@/lib/auth-client';\nimport { getFileViewUrl } from '@/lib/file-upload';"
    );
}

// Ensure Appointment Letter and Certificates are in the Application interface
if (!content.includes('appointment_letter?: string;')) {
    content = content.replace(
        '  status: string;',
        '  status: string;\n  passport_photo?: string;\n  id_card_copy?: string;\n  appointment_letter?: string;\n  certificates?: string;'
    );
}

// Find the start of the documents tab
const docTabStart = content.indexOf("{activeModalTab === 'documents' && (");
// Find the start of the review tab
const reviewTabStart = content.indexOf("{activeModalTab === 'review' && (");

if (docTabStart !== -1 && reviewTabStart !== -1) {
    const before = content.substring(0, docTabStart);
    const after = content.substring(reviewTabStart);
    
    const newDocTab = `{activeModalTab === 'documents' && (
                <div className="space-y-4">
                  <h4 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[#0d5c2e]" /> Attached Application Files
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Passport Photo */}
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
                      <div>
                        <span className="font-extrabold text-slate-900 block mb-1">Passport Photograph</span>
                        <span className="text-slate-500 text-[11px] block font-medium">Verified Image</span>
                      </div>
                      {selectedApplication.passport_photo ? (
                        <a
                          href={getFileViewUrl(selectedApplication.passport_photo)}
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
                      {selectedApplication.id_card_copy ? (
                        <a
                          href={getFileViewUrl(selectedApplication.id_card_copy)}
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
                      {selectedApplication.appointment_letter ? (
                        <a
                          href={getFileViewUrl(selectedApplication.appointment_letter)}
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
                      {selectedApplication.certificates ? (
                        <a
                          href={getFileViewUrl(selectedApplication.certificates)}
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
              )}

              `;
              
    fs.writeFileSync('app/admin/dashboard/page.tsx', before + newDocTab + after, 'utf8');
    console.log("Success");
} else {
    console.log("Failed to find boundaries");
}
