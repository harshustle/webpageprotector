import React, { useState, useEffect } from "react";
import { 
  motion, 
  AnimatePresence 
} from "motion/react";
import { 
  Lock, 
  Unlock, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  Compass,
  Loader2,
  LockKeyhole
} from "lucide-react";
import { ShortenedUrlPublicInfo } from "../types";

interface SecureGateProps {
  shortId: string;
  onNotFound: () => void;
}

export default function SecureGate({ shortId, onNotFound }: SecureGateProps) {
  const [loadingInfo, setLoadingInfo] = useState(true);
  const [linkInfo, setLinkInfo] = useState<ShortenedUrlPublicInfo | null>(null);
  
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [successRedirect, setSuccessRedirect] = useState<string | null>(null);
  const [shake, setShake] = useState(false);

  // Load link info on mount
  useEffect(() => {
    const fetchLinkInfo = async () => {
      try {
        const res = await fetch(`/api/info/${shortId}`);
        if (res.status === 404) {
          onNotFound();
          return;
        }
        if (!res.ok) {
          throw new Error("Unable to fetch link details.");
        }
        const data = await res.json() as ShortenedUrlPublicInfo;
        setLinkInfo(data);

        // If the URL has NO password protection, auto-bypass and verify instantly
        if (!data.hasPassword) {
          handleAutoBypass();
        } else {
          setLoadingInfo(false);
        }
      } catch (err) {
        setErrorText("Server connectivity issue. Please try refreshing.");
        setLoadingInfo(false);
      }
    };

    fetchLinkInfo();
  }, [shortId]);

  // Handle immediate verification for unprotected links
  const handleAutoBypass = async () => {
    try {
      const res = await fetch("/api/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: shortId }),
      });
      const data = await res.json();
      if (res.ok && data.success && data.originalUrl) {
        setSuccessRedirect(data.originalUrl);
        // Instant redirect
        window.location.href = data.originalUrl;
      } else {
        throw new Error();
      }
    } catch {
      setErrorText("Failed to redirect to destination.");
      setLoadingInfo(false);
    }
  };

  const handleSubmitPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isVerifying) return;
    
    setErrorText(null);
    setIsVerifying(true);

    if (!password.trim()) {
      setErrorText("Password is required for access.");
      setIsVerifying(false);
      triggerShake();
      return;
    }

    try {
      const res = await fetch("/api/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: shortId, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        triggerShake();
        throw new Error(data.error || "Authentication failed. Incorrect password.");
      }

      if (data.success && data.originalUrl) {
        setSuccessRedirect(data.originalUrl);
        // Secure brief delay for responsive visual unlock handoff
        setTimeout(() => {
          window.location.href = data.originalUrl;
        }, 1200);
      } else {
        throw new Error("Missing redirection link.");
      }
    } catch (err: any) {
      setErrorText(err.message || "Invalid passkey.");
      setIsVerifying(false);
    }
  };

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  // 1. Initial Loading Spinner
  if (loadingInfo) {
    return (
      <div className="flex flex-col items-center justify-center py-20 min-h-[300px]" id="secure-gate-loader">
        <Loader2 className="w-8 h-8 text-zinc-800 animate-spin" />
        <h3 className="text-xs font-mono uppercase tracking-widest text-zinc-500 mt-4">Handshaking Server...</h3>
        <p className="text-[10px] text-zinc-400 mt-1">Acquiring cryptographic corridor key</p>
      </div>
    );
  }

  // 2. Visitor Input Container
  return (
    <div className="w-full max-w-md mx-auto px-4" id="visitor-gate-overlay">
      <AnimatePresence mode="wait">
        
        {successRedirect ? (
          // ================= SUCCESS STATE =================
          <motion.div
            key="success-redirecting"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-6 rounded-2xl bg-white border border-zinc-250 text-center space-y-4 shadow-sm"
          >
            <div className="w-12 h-12 bg-zinc-950 text-white flex items-center justify-center rounded-xl mx-auto">
              <Unlock className="w-5 h-5 animate-pulse" />
            </div>
            
            <div>
              <h3 className="text-base font-bold text-zinc-900 font-sans uppercase tracking-tight">Decrypted</h3>
              <p className="text-xs text-zinc-500 mt-1.5 max-w-[240px] mx-auto leading-relaxed">
                Passphrase accepted. Forwarding you safely to the destination link...
              </p>
            </div>

            <div className="pt-2 text-[10px] font-mono text-zinc-500 flex items-center justify-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-900 animate-ping" />
              <span>Redirect active</span>
            </div>
          </motion.div>
        ) : (
          // ================= LOCKED INPUT GATE =================
          <motion.div
            key="password-gate"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-5 sm:p-6 rounded-2xl bg-white border border-zinc-250 shadow-sm relative overflow-hidden transition-all duration-300 text-left ${
              shake ? "animate-shake border-red-300 shadow-[0_0_15px_rgba(239,68,68,0.05)]" : ""
            }`}
          >
            <div className="text-center mb-5">
              <div className="w-12 h-12 bg-zinc-100 border border-zinc-200 text-zinc-900 flex items-center justify-center rounded-xl mx-auto mb-3">
                <LockKeyhole className="w-5 h-5" />
              </div>
              
              <h2 className="text-lg font-bold text-zinc-900">
                This link is <span className="font-serif italic font-semibold text-zinc-900">protected</span>.
              </h2>
              <p className="text-xs text-zinc-500 mt-1">
                Enter the decryption password to proceed
              </p>
              
              <div className="mt-3 py-1 px-3 rounded-lg bg-zinc-50 border border-zinc-200 text-zinc-800 text-[11px] font-mono inline-block truncate max-w-[240px]">
                {linkInfo?.title || `secure_address_${shortId}`}
              </div>
            </div>

            {errorText && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="flex items-start gap-2.5 p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs mb-4"
              >
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
                <div>{errorText}</div>
              </motion.div>
            )}

            <form onSubmit={handleSubmitPassword} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-[10px] font-mono uppercase tracking-wider text-zinc-400 mb-1">
                  Decryption Password / Code
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="decrypt-password-input"
                    placeholder="Enter passkey..."
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3.5 py-3 bg-white border border-zinc-350 focus:border-zinc-900 focus:ring-1 focus:ring-zinc-950/10 text-zinc-900 text-sm rounded-xl font-mono h-[46px] outline-none"
                    disabled={isVerifying}
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-zinc-400 hover:text-zinc-900"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                id="decrypt-submit-btn"
                disabled={isVerifying}
                className="w-full py-3 px-4 bg-zinc-950 hover:bg-zinc-900 disabled:bg-zinc-350 text-white font-bold text-xs rounded-xl tracking-wider uppercase transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer h-[48px]"
              >
                {isVerifying ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <span>Unlock Destination</span>
                )}
              </button>
            </form>

            <div className="mt-5 border-t border-zinc-150 pt-4 text-center">
              <a
                href="/"
                className="inline-flex items-center gap-1 text-[11px] text-zinc-500 hover:text-zinc-900 transition-colors font-medium"
              >
                <Compass className="w-3.5 h-3.5" />
                <span>Go to shortener home</span>
              </a>
            </div>

          </motion.div>
        )}
        
      </AnimatePresence>
    </div>
  );
}
