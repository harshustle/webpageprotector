import React from "react";
import { 
  HelpCircle, 
  ShieldAlert, 
  ArrowLeft 
} from "lucide-react";

interface NotFoundProps {
  onBackToHome?: () => void;
}

export default function NotFound({ onBackToHome }: NotFoundProps) {
  const handleHomeClick = () => {
    if (onBackToHome) {
      onBackToHome();
    } else {
      window.location.href = "/";
    }
  };

  return (
    <div className="w-full max-w-md mx-auto px-4" id="not-found-screen">
      <div className="p-6 rounded-2xl bg-white border border-zinc-250 shadow-sm text-center relative overflow-hidden">
        
        <div className="w-12 h-12 bg-zinc-100 border border-zinc-200 text-zinc-900 flex items-center justify-center rounded-xl mx-auto mb-4">
          <ShieldAlert className="w-5 h-5" />
        </div>

        <h2 className="text-lg font-bold text-zinc-900">
          This address is <span className="font-serif italic font-semibold text-zinc-900">broken</span>.
        </h2>
        
        <p className="text-xs text-zinc-500 mt-2 leading-relaxed">
          The link you followed could not be located on the server. Make sure the spelling is precise and try again.
        </p>

        <div className="mt-6 pt-5 border-t border-zinc-150 space-y-3">
          <button
            type="button"
            onClick={handleHomeClick}
            className="w-full py-3 px-4 bg-zinc-950 hover:bg-zinc-900 text-white font-bold text-xs rounded-xl uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer h-[46px]"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Go to home</span>
          </button>

          <a
            href="mailto:hsrivastav099@gmail.com"
            className="inline-flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-900 transition-colors py-1.5 font-medium"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Contact administrator</span>
          </a>
        </div>
      </div>
    </div>
  );
}
