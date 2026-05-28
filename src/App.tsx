import { useState, useEffect } from "react";
import SecureCreator from "./components/SecureCreator";
import SecureGate from "./components/SecureGate";
import NotFound from "./components/NotFound";
import { Shield, KeyRound, Lock } from "lucide-react";

export default function App() {
  const [currentPath, setCurrentPath] = useState(() => {
    return window.location.pathname.replace(/^\/|\/$/g, "");
  });
  const [isNotFound, setIsNotFound] = useState(false);

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname.replace(/^\/|\/$/g, ""));
      setIsNotFound(false);
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const navigateToHome = () => {
    window.history.pushState({}, "", "/");
    setCurrentPath("");
    setIsNotFound(false);
  };

  return (
    <div className="min-h-screen bg-[#fafaf9] text-zinc-900 flex flex-col selection:bg-zinc-900 selection:text-white antialiased font-sans relative overflow-x-hidden">
      
      {/* Dynamic light subtle layout lines */}
      <div className="absolute inset-0 bg-[radial-gradient(#e5e5e5_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none" />
      
      {/* Global Minimal Header */}
      <header className="border-b border-zinc-200/80 bg-white/70 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <button 
            type="button"
            id="brand-home-link"
            onClick={navigateToHome}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity bg-transparent border-0 cursor-pointer text-left py-1"
          >
            <div className="w-8 h-8 rounded-lg bg-zinc-900 text-white flex items-center justify-center font-bold text-sm tracking-tighter">
              F
            </div>
            <div>
              <span className="font-sans font-bold text-sm tracking-tight text-zinc-900 block">
                Fortress
              </span>
              <span className="text-[9px] text-zinc-500 font-mono block tracking-wider uppercase font-semibold">
                SCrypt Layer
              </span>
            </div>
          </button>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-100 border border-zinc-200 text-[10px] font-mono text-zinc-600">
              <KeyRound className="w-3 h-3 text-zinc-700" />
              <span>Zero-Disclosure</span>
            </span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex flex-col items-center justify-center py-8 sm:py-12 relative z-10 w-full max-w-4xl mx-auto">
        {isNotFound ? (
          <NotFound onBackToHome={navigateToHome} />
        ) : currentPath === "" ? (
          <SecureCreator />
        ) : (
          <SecureGate 
            shortId={currentPath} 
            onNotFound={() => setIsNotFound(true)} 
          />
        )}
      </main>

      {/* Elegant Editorial Footer */}
      <footer className="border-t border-zinc-200 bg-white/80 py-6 text-center text-[11px] text-zinc-400 font-sans mt-auto">
        <div className="max-w-4xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-zinc-500 font-bold" />
            <span>Cryptographically <span className="font-serif italic font-semibold text-zinc-800">fortified</span> routing</span>
          </p>
          <div className="flex items-center gap-3 font-mono text-[9px]">
            <span>Verified Protocol</span>
            <span>•</span>
            <span>v1.2-light</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
