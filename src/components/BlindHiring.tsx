import { useState } from 'react';
import { EyeOff, User, GraduationCap, Mail } from 'lucide-react';

export default function BlindHiring() {
  const [anonymizeNames, setAnonymizeNames] = useState(true);
  const [anonymizeEducation, setAnonymizeEducation] = useState(true);
  const [anonymizeLocation, setAnonymizeLocation] = useState(true);

  // Demo candidate data
  const originalName = "Sarah Jenkins";
  const originalBio = "She is a talented software engineer who graduated from Stanford University. Currently living in San Francisco, CA.";
  
  // Apply redactions based on state
  let redactedName = originalName;
  if (anonymizeNames) redactedName = "Candidate #8492";

  let redactedBio = originalBio;
  if (anonymizeNames) {
    redactedBio = redactedBio.replace(/Sarah Jenkins/g, 'Candidate');
    redactedBio = redactedBio.replace(/She is/g, 'They are');
  }
  if (anonymizeEducation) {
    redactedBio = redactedBio.replace(/Stanford University/g, '[Tier 1 University]');
  }
  if (anonymizeLocation) {
    redactedBio = redactedBio.replace(/San Francisco, CA/g, '[Major Tech Hub]');
  }

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto w-full">
      <div className="mb-8 text-center">
        <div className="inline-flex bg-indigo-100 dark:bg-indigo-500/20 p-3 rounded-2xl mb-4">
          <EyeOff className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
        </div>
        <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">Blind Hiring Settings</h2>
        <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-xl mx-auto">
          Configure which demographic and identifying information is hidden from recruiters during the initial screening phases to reduce unconscious bias.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-4">
        
        {/* Settings Panel */}
        <div className="bg-white dark:bg-slate-900/50 dark:backdrop-blur-xl p-6 rounded-2xl border border-slate-200 dark:border-slate-800/50 shadow-sm transition-colors">
          <h3 className="font-bold text-lg text-slate-800 dark:text-slate-200 mb-6">Bias Reduction Toggles</h3>
          
          <div className="space-y-6">
            
            {/* Toggle 1 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`p-2 rounded-lg ${anonymizeNames ? 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500'}`}>
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-semibold text-slate-700 dark:text-slate-200">Anonymize Names & Gender</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Replaces names with IDs and normalizes pronouns.</p>
                </div>
              </div>
              <button 
                onClick={() => setAnonymizeNames(!anonymizeNames)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900 ${
                  anonymizeNames ? 'bg-indigo-600 dark:bg-indigo-500' : 'bg-slate-200 dark:bg-slate-700'
                }`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  anonymizeNames ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </button>
            </div>

            {/* Toggle 2 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`p-2 rounded-lg ${anonymizeEducation ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500'}`}>
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-semibold text-slate-700 dark:text-slate-200">Redact University Names</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Hides specific alma maters to prevent pedigree bias.</p>
                </div>
              </div>
              <button 
                onClick={() => setAnonymizeEducation(!anonymizeEducation)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900 ${
                  anonymizeEducation ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-700'
                }`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  anonymizeEducation ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </button>
            </div>

            {/* Toggle 3 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`p-2 rounded-lg ${anonymizeLocation ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500'}`}>
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-semibold text-slate-700 dark:text-slate-200">Hide Geographic Location</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Removes addresses and city information.</p>
                </div>
              </div>
              <button 
                onClick={() => setAnonymizeLocation(!anonymizeLocation)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900 ${
                  anonymizeLocation ? 'bg-amber-500' : 'bg-slate-200 dark:bg-slate-700'
                }`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  anonymizeLocation ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </button>
            </div>

          </div>
        </div>

        {/* Live Preview Panel */}
        <div className="bg-slate-50 dark:bg-slate-800/30 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 border-dashed relative overflow-hidden transition-colors">
          <div className="absolute top-0 right-0 px-3 py-1 bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-400 text-xs font-bold rounded-bl-lg border-b border-l border-indigo-200 dark:border-indigo-500/30">
            LIVE RECRUITER VIEW
          </div>
          
          <h3 className="font-bold text-lg text-slate-800 dark:text-slate-200 mb-6">Candidate Preview</h3>
          
          <div className="bg-white dark:bg-slate-900 rounded-xl p-5 shadow-sm border border-slate-100 dark:border-slate-800 transition-colors">
            <div className="flex items-center gap-4 mb-4 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center border border-slate-200 dark:border-slate-700 overflow-hidden">
                {anonymizeNames ? (
                  <User className="w-6 h-6 text-slate-300 dark:text-slate-600" />
                ) : (
                   <span className="font-bold text-slate-500 dark:text-slate-400 text-lg">SJ</span>
                )}
              </div>
              <div>
                <h4 className="font-bold text-slate-900 dark:text-slate-100 text-lg transition-colors duration-300">
                  {redactedName}
                </h4>
                <p className="text-slate-500 dark:text-slate-400 text-sm">Frontend Engineer</p>
              </div>
            </div>

            <div>
              <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Summary Bio</p>
              <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed transition-all duration-300">
                {redactedBio.split(/(\[.*?\]|Candidate|They are)/g).map((part, i) => {
                  if (part.startsWith('[') || part === 'Candidate' || part === 'They are') {
                    return <span key={i} className="bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded font-mono text-xs mx-0.5 inline-block">{part}</span>
                  }
                  return part;
                })}
              </p>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
