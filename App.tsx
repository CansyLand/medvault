
import React, { useState } from 'react';
import { AppView } from './types';
import { DemoView } from './components/DemoView';
import { 
  ShieldIcon, 
  LockIcon, 
  EyeIcon, 
  CheckIcon, 
  HistoryIcon, 
  UploadIcon,
  DatabaseIcon,
  KeyIcon,
  AlertTriangleIcon
} from './components/Icons';
import { HeroDiagram } from './components/HeroDiagram';

const App: React.FC = () => {
  const [view, setView] = useState<AppView>(AppView.LANDING);

  const renderLanding = () => (
    <>
      {/* Light Hero Section with Purple Diagram */}
      <section className="relative min-h-screen flex items-center bg-background overflow-hidden">
        <div className="absolute inset-0 z-0 flex justify-end">
            <div className="w-full md:w-1/2 h-full">
                <HeroDiagram />
            </div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full py-20">
          <div className="max-w-2xl">
            <h1 className="text-5xl md:text-7xl font-black tracking-tight text-slate-900 mb-6 leading-tight font-merriweather">
              Your health data. <br />
              <span className="gradient-text">Your control. Finally.</span>
            </h1>
            <p className="text-lg md:text-xl text-slate-600 mb-10 leading-relaxed max-w-lg">
              Stop chasing medical records. Stop wondering who has your data. 
              MedVault gives you a personal vault where you own your information—and decide exactly who gets access.
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <button 
                onClick={() => setView(AppView.DEMO)}
                className="w-full sm:w-auto px-10 py-4 bg-mint text-night rounded-full font-bold text-lg hover:bg-teal-deep hover:text-white transition-all shadow-xl shadow-mint/30 flex items-center justify-center gap-2"
              >
                Try Demo <ShieldIcon className="w-5 h-5" />
              </button>
              <a 
                href="#how-it-works"
                className="w-full sm:w-auto px-10 py-4 bg-white text-slate-700 border-2 border-slate-200 rounded-full font-bold text-lg hover:border-mint transition-all flex items-center justify-center"
              >
                See How It Works
              </a>
            </div>
          </div>
        </div>

        {/* Subtle Ambient glow using lavender */}
        <div className="absolute -bottom-48 -left-48 w-96 h-96 bg-lavender/10 rounded-full blur-[100px] pointer-events-none"></div>
      </section>

      {/* Problem Section */}
      <section className="py-24 bg-mint-pale border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4 font-merriweather">You've lost track of your own health story</h2>
            <p className="text-slate-600 text-lg">The healthcare system wasn't built for patient ownership.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 hover:shadow-lg transition-all">
              <div className="w-14 h-14 bg-mint/20 rounded-2xl flex items-center justify-center text-teal-deep mb-6">
                <DatabaseIcon className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-slate-900">Records are scattered</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Every clinic, every specialist, every test—all in different systems. When you need them, it's endless phone calls and fax machines.
              </p>
            </div>
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 hover:shadow-lg transition-all">
              <div className="w-14 h-14 bg-lavender/20 rounded-2xl flex items-center justify-center text-lavender-dark mb-6">
                <KeyIcon className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-slate-900">No idea who has what</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Did that clinic from 2019 still have your data? Who's seen your MRI? You should know. You don't.
              </p>
            </div>
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 hover:shadow-lg transition-all">
              <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600 mb-6">
                <AlertTriangleIcon className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-slate-900">Sharing is risky</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Email attachments. USB sticks. Portals that expire. Every time you share medical data, you're gambling with security.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section className="py-24 bg-background" id="how-it-works">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6 font-merriweather">One vault. Total visibility. Complete control.</h2>
              <p className="text-lg text-slate-600 mb-8 leading-relaxed">
                MedVault is your personal health data vault. Upload your records once. See every request for access. Approve what you want, deny what you don't. Revoke anytime. Every single access is logged—forever.
              </p>
              <div className="space-y-6">
                {[
                  { title: "Store", desc: "Upload your records once in any format.", icon: <UploadIcon className="w-6 h-6 text-teal-deep" /> },
                  { title: "Decide", desc: "Approve requests from hospitals, insurers, specialists.", icon: <CheckIcon className="w-6 h-6 text-teal-deep" /> },
                  { title: "Monitor", desc: "See exactly who accessed what, when.", icon: <EyeIcon className="w-6 h-6 text-teal-deep" /> }
                ].map((item, idx) => (
                  <div key={idx} className="flex gap-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-mint/10 rounded-full flex items-center justify-center">
                      {item.icon}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 font-serif">{item.title}</h4>
                      <p className="text-slate-600 text-sm">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="bg-slate-900 rounded-[2rem] p-4 shadow-2xl shadow-mint/10">
                <div className="bg-white rounded-[1.5rem] overflow-hidden aspect-[4/3] flex items-center justify-center p-8">
                   <div className="w-full space-y-4">
                      <div className="h-4 bg-slate-100 rounded w-3/4"></div>
                      <div className="h-12 bg-mint/10 rounded border-l-4 border-mint-secondary"></div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="h-20 bg-slate-50 rounded"></div>
                        <div className="h-20 bg-slate-50 rounded"></div>
                      </div>
                      <div className="flex justify-between items-center py-4 border-t border-slate-100">
                        <div className="flex items-center gap-2">
                           <div className="w-8 h-8 rounded-full bg-mint/20"></div>
                           <div className="h-3 bg-slate-100 rounded w-20"></div>
                        </div>
                        <div className="h-8 bg-mint rounded-lg w-24"></div>
                      </div>
                   </div>
                </div>
              </div>
              <div className="absolute -bottom-6 -left-6 bg-white p-4 rounded-2xl shadow-xl border border-slate-100 hidden md:block">
                 <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-mint/20 rounded-full flex items-center justify-center text-teal-deep">
                      <CheckIcon className="w-5 h-5" />
                    </div>
                    <div className="text-xs">
                      <p className="font-bold">Access Revoked</p>
                      <p className="text-slate-400">Dr. Smith • Just now</p>
                    </div>
                 </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 bg-background">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center bg-mint-pale rounded-[3rem] py-20 border border-slate-200 shadow-2xl shadow-slate-100">
          <h2 className="text-4xl font-bold text-slate-900 mb-6 font-merriweather">Ready to take back control?</h2>
          <p className="text-lg text-slate-600 mb-10 leading-relaxed">
            Try the demo and see how easy it is to own your health data—and share it on your terms.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button 
              onClick={() => setView(AppView.DEMO)}
              className="w-full sm:w-auto px-10 py-5 bg-mint text-night rounded-full font-bold text-lg hover:bg-teal-deep hover:text-white transition-all shadow-xl shadow-mint/30"
            >
              Try Demo Now
            </button>
            <button className="w-full sm:w-auto px-10 py-5 bg-white text-slate-700 border-2 border-slate-200 rounded-full font-bold text-lg hover:border-mint transition-all">
              Request Entity Access
            </button>
          </div>
          <p className="mt-8 text-slate-400 text-xs">
            Built at Tech Sovereignty Hackathon. Launching in Germany, 2026.
          </p>
        </div>
      </section>
    </>
  );

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 transition-all bg-white/80 border-b border-slate-100 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div 
            onClick={() => setView(AppView.LANDING)}
            className="flex items-center gap-2 cursor-pointer group"
          >
            <div className={`w-10 h-10 bg-mint text-teal-deep rounded-xl flex items-center justify-center shadow-lg transition-transform group-hover:rotate-12`}>
              <ShieldIcon className="w-6 h-6" />
            </div>
            <span className="text-2xl font-black tracking-tighter text-slate-900 font-merriweather uppercase">MedVault</span>
          </div>
          
          <div className="hidden md:flex items-center gap-8 text-slate-600">
            <a href="#how-it-works" className="text-sm font-semibold hover:text-teal-deep transition-colors">Product</a>
            <a href="#" className="text-sm font-semibold hover:text-teal-deep transition-colors">Security</a>
            <a href="#" className="text-sm font-semibold hover:text-teal-deep transition-colors">Company</a>
          </div>

          <div className="flex items-center gap-4">
            {view === AppView.LANDING ? (
               <button 
                onClick={() => setView(AppView.DEMO)}
                className="px-6 py-3 bg-mint text-teal-deep rounded-full font-bold text-sm hover:bg-teal-deep hover:text-white transition-all shadow-lg shadow-mint/20"
              >
                Launch App
              </button>
            ) : (
              <button 
                onClick={() => setView(AppView.LANDING)}
                className="px-5 py-2.5 bg-slate-100 text-slate-700 rounded-full font-bold text-sm hover:bg-slate-200 transition-all"
              >
                Back to Home
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-grow">
        {view === AppView.LANDING ? renderLanding() : <DemoView />}
      </main>

      {/* Footer */}
      <footer className="bg-white py-20 border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12 mb-16">
            <div className="col-span-2">
              <div className="flex items-center gap-2 mb-6 text-teal-deep">
                <ShieldIcon className="w-6 h-6" />
                <span className="text-xl font-black tracking-tighter text-slate-900 uppercase font-merriweather">MedVault</span>
              </div>
              <p className="max-w-sm text-slate-500 text-sm leading-relaxed">
                Empowering individuals with full control over their health data through sovereign, decentralized technology. Built for privacy, trust, and zero-compromise security.
              </p>
            </div>
            <div>
              <h4 className="font-bold text-slate-900 mb-4 uppercase text-xs tracking-widest font-merriweather">Product</h4>
              <ul className="space-y-3 text-sm text-slate-500">
                <li><a href="#" className="hover:text-teal-deep">How It Works</a></li>
                <li><a href="#" className="hover:text-teal-deep">For Individuals</a></li>
                <li><a href="#" className="hover:text-teal-deep">For Organizations</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-slate-900 mb-4 uppercase text-xs tracking-widest font-merriweather">Legal</h4>
              <ul className="space-y-3 text-sm text-slate-500">
                <li><a href="#" className="hover:text-teal-deep">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-teal-deep">Terms of Service</a></li>
                <li><a href="#" className="hover:text-teal-deep">GDPR Compliance</a></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4 text-slate-400 text-xs">
            <p>© 2024 MedVault GmbH. Recognized at Tech Sovereignty Hackathon.</p>
            <div className="flex gap-6">
              <a href="mailto:hello@medvault.de" className="hover:text-teal-deep transition-colors">hello@medvault.de</a>
              <a href="#" className="hover:text-teal-deep transition-colors">Press Kit</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
