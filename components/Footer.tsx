import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 text-sm border-t-4 border-[#0F5132] mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

          <div>
            <h3 className="font-bold text-white text-base mb-2">Driver & Vehicle Licensing Authority</h3>
            <p className="text-gray-400 text-xs leading-relaxed">
              Headquarters, 37 Military Hospital Road, Cantonments, Accra, Ghana.<br />
              Digital recruitment and attachment portal for student placements, temporary roles, and official staff openings.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-amber-400 text-xs uppercase tracking-wider mb-3">Quick Services</h4>
            <ul className="space-y-1.5 text-xs">
              <li><Link href="/positions" className="hover:text-white transition">View Available Vacancies</Link></li>
              <li><Link href="/apply" className="hover:text-white transition">Submit Attachment Application</Link></li>
              <li><Link href="/status" className="hover:text-white transition">Track Application Progress</Link></li>
              <li><Link href="/document-center" className="hover:text-white transition">Post-Acceptance Document Hub</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-amber-400 text-xs uppercase tracking-wider mb-3">Internal Access</h4>
            <ul className="space-y-1.5 text-xs">
              <li><Link href="/judge" className="hover:text-white transition">Panel Judge Evaluation Interface</Link></li>
              <li><Link href="/admin" className="hover:text-white transition">Department & HR Officer Portal</Link></li>
            </ul>
          </div>

        </div>

        <div className="mt-8 pt-6 border-t border-gray-800 text-center text-xs text-gray-500">
          &copy; {new Date().getFullYear()} Driver and Vehicle Licensing Authority (DVLA). All Rights Reserved.
        </div>
      </div>
    </footer>
  );
}
