import React, { useState, useEffect } from "react";
import { 
  motion, 
  AnimatePresence 
} from "motion/react";
import { 
  Link2, 
  Lock, 
  Unlock, 
  Copy, 
  Check, 
  ExternalLink, 
  ShieldCheck, 
  AlertCircle, 
  Eye, 
  EyeOff, 
  History, 
  Trash2, 
  Activity,
  Plus
} from "lucide-react";
import { ShortenedUrlPublicInfo } from "../types";

export default function SecureCreator() {
  const [originalUrl, setOriginalUrl] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [usePassword, setUsePassword] = useState(false);
  const [customId, setCustomId] = useState("");
  const [title, setTitle] = useState("");
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [newCreatedLink, setNewCreatedLink] = useState<ShortenedUrlPublicInfo | null>(null);
  
  // Local history management
  const [localLinks, setLocalLinks] = useState<ShortenedUrlPublicInfo[]>([]);
  
  // Segment control for mobile view optimization: "create" or "vault"
  const [activeTab, setActiveTab] = useState<"create" | "vault">("create");

  // Load local links history on mount
  useEffect(() => {
    const saved = localStorage.getItem("secure_shortener_history");
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as ShortenedUrlPublicInfo[];
        setLocalLinks(parsed);
        // Refresh counts of these links from the server
        refreshCounts(parsed);
      } catch (e) {
        console.error("Failed to parse history from localStorage", e);
      }
    }
  }, []);

  // Fetch updated info for saved links from server
  const refreshCounts = async (linksList: ShortenedUrlPublicInfo[]) => {
    const updatedLinks = [...linksList];
    let changed = false;

    await Promise.all(
      linksList.map(async (link, index) => {
        try {
          const res = await fetch(`/api/info/${link.id}`);
          if (res.ok) {
            const contentType = res.headers.get("content-type");
            if (contentType && contentType.includes("application/json")) {
              const freshData = await res.json() as ShortenedUrlPublicInfo;
              if (freshData.visitCount !== link.visitCount) {
                updatedLinks[index] = { ...link, visitCount: freshData.visitCount };
                changed = true;
              }
            }
          }
        } catch {
          // Ignore failed link refetching
        }
      })
    );

    if (changed) {
      setLocalLinks(updatedLinks);
      localStorage.setItem("secure_shortener_history", JSON.stringify(updatedLinks));
    }
  };

  const cleanForm = () => {
    setOriginalUrl("");
    setPassword("");
    setUsePassword(false);
    setCustomId("");
    setTitle("");
    setFormError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setIsSubmitting(true);

    if (!originalUrl.trim()) {
      setFormError("Destination URL is required.");
      setIsSubmitting(false);
      return;
    }

    if (usePassword && !password.trim()) {
      setFormError("Please enter a password for protection.");
      setIsSubmitting(false);
      return;
    }

    try {
      const payload = {
        originalUrl: originalUrl.trim(),
        title: title.trim() || undefined,
        customId: customId.trim() || undefined,
        password: usePassword ? password : "",
      };

      const res = await fetch("/api/shorten", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      let body: any;
      const contentType = res.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        body = await res.json();
      } else {
        const textResponse = await res.text();
        throw new Error(textResponse.slice(0, 50) || `Core protocol error (Status: ${res.status})`);
      }

      if (!res.ok) {
        throw new Error(body.error || "Failed to create short link.");
      }

      const createdItem = body.data as ShortenedUrlPublicInfo;
      setNewCreatedLink(createdItem);

      // Save to local listing
      const updatedList = [createdItem, ...localLinks.filter(item => item.id !== createdItem.id)];
      setLocalLinks(updatedList);
      localStorage.setItem("secure_shortener_history", JSON.stringify(updatedList));

      cleanForm();
      
      // Auto switch back to show success
      setActiveTab("create");
    } catch (err: any) {
      setFormError(err.message || "Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getFullShortUrl = (id: string) => {
    return `${window.location.protocol}//${window.location.host}/${id}`;
  };

  const deleteLink = (id: string) => {
    const filter = localLinks.filter(l => l.id !== id);
    setLocalLinks(filter);
    localStorage.setItem("secure_shortener_history", JSON.stringify(filter));
  };

  // Clipboard Copier Helper
  function ClipboardButton({ text }: { text: string }) {
    const [copied, setCopied] = useState(false);
    
    const handleCopy = async () => {
      try {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        const textarea = document.createElement("textarea");
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    };

    return (
      <button
        type="button"
        id={`copy-btn-${text}`}
        onClick={handleCopy}
        className={`flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg font-mono text-xs font-semibold uppercase tracking-wider border transition-all duration-200 cursor-pointer text-center w-full sm:w-auto h-[44px] ${
          copied
            ? "bg-stone-900 border-zinc-900 text-white"
            : "bg-white border-zinc-300 hover:border-zinc-900 text-zinc-800"
        }`}
      >
        {copied ? (
          <>
            <Check className="w-3.5 h-3.5" />
            <span>Copied</span>
          </>
        ) : (
          <>
            <Copy className="w-3.5 h-3.5" />
            <span>Copy short address</span>
          </>
        )}
      </button>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto px-4" id="creator-dashboard-view">
      
      {/* High-end Minimal Editorial Header */}
      <div className="text-center mb-8 animate-fade-in max-w-sm mx-auto">
        <h1 className="text-3xl font-sans font-bold text-zinc-900 tracking-tight leading-none mt-2 select-none">
          Fortress Links
        </h1>
        <p className="mt-2 text-zinc-500 text-xs leading-relaxed">
          Create <span className="font-serif italic font-bold text-zinc-900">secure</span> and <span className="font-serif italic font-bold text-zinc-900">instant</span> routing corridors with robust passcode lock layers.
        </p>
      </div>

      {/* Segmented Tab controls: Ideal for streamlined mobile performance */}
      <div className="flex bg-zinc-200/60 p-1 rounded-xl mb-6 text-xs h-[40px]">
        <button
          type="button"
          onClick={() => setActiveTab("create")}
          className={`flex-1 rounded-lg py-1.5 font-medium transition-colors text-center cursor-pointer ${
            activeTab === "create" ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-800"
          }`}
        >
          Create Link
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("vault")}
          className={`flex-1 rounded-lg py-1.5 font-medium transition-colors text-center relative cursor-pointer ${
            activeTab === "vault" ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-800"
          }`}
        >
          <span className="inline-flex items-center gap-1.5">
            <span>Vault</span>
            <span className="font-mono text-[10px] bg-zinc-300/60 px-1.5 py-0.2 rounded-full font-bold text-zinc-700">
              {localLinks.length}
            </span>
          </span>
        </button>
      </div>

      {/* View switching panel */}
      <AnimatePresence mode="wait">
        {activeTab === "create" ? (
          <motion.div
            key="tab-create"
            initial={{ opacity: 0, scale: 0.98, y: 5 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: -5 }}
            transition={{ duration: 0.15 }}
            className="space-y-4"
          >
            {newCreatedLink ? (
              // LINK SUBMISSIONS SUCCESS DRAWER
              <div
                key="success-card"
                className="p-5 rounded-2xl bg-white border border-zinc-250 shadow-sm space-y-4 text-left"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 sm:p-2.5 bg-zinc-100 rounded-lg text-zinc-900">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div className="truncate">
                    <span className="text-[10px] uppercase tracking-wider text-zinc-400 font-mono font-bold block">Protected Link Generated</span>
                    <h3 className="text-sm font-bold text-zinc-900 mt-0.5 truncate">
                      {newCreatedLink.title || "Untitled Destination"}
                    </h3>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200 space-y-2.5">
                  <div className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest">Shortened Address</div>
                  <div className="text-sm font-mono font-bold text-zinc-900 select-all break-all leading-normal">
                    {getFullShortUrl(newCreatedLink.id)}
                  </div>
                  
                  {newCreatedLink.hasPassword && (
                    <div className="flex items-center gap-1 text-[10px] font-mono text-zinc-500 bg-zinc-100/60 py-1 px-2 rounded-md inline-block mt-1">
                      <Lock className="w-3 h-3 text-zinc-800" />
                      <span>scrypt locking active</span>
                    </div>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-2 pt-2">
                  <ClipboardButton text={getFullShortUrl(newCreatedLink.id)} />
                  <a
                    href={getFullShortUrl(newCreatedLink.id)}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 border border-transparent transition-all h-[44px] w-full sm:w-auto"
                  >
                    <span>Test routing</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>

                <div className="pt-2 text-center border-t border-zinc-100">
                  <button
                    type="button"
                    onClick={() => setNewCreatedLink(null)}
                    className="text-xs text-zinc-800 hover:underline font-bold"
                  >
                    Create another fast link
                  </button>
                </div>
              </div>
            ) : (
              // COMPACT FORM CREATOR
              <form
                onSubmit={handleSubmit}
                className="p-5 rounded-2xl bg-white border border-zinc-250 shadow-sm space-y-4 text-left"
              >
                {formError && (
                  <div className="flex items-start gap-2.5 p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-xs">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
                    <div>{formError}</div>
                  </div>
                )}

                {/* Field 1: Long original link */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-zinc-800">
                    Destination URL <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400">
                      <Link2 className="w-4 h-4" />
                    </span>
                    <input
                      type="text"
                      id="destination-url-input"
                      placeholder="Paste link to protect..."
                      value={originalUrl}
                      onChange={(e) => setOriginalUrl(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-3 bg-white border border-zinc-350 focus:border-zinc-900 focus:ring-1 focus:ring-zinc-950/10 text-zinc-900 text-sm rounded-xl placeholder-zinc-400 outline-none transition-all duration-200 h-[46px]"
                    />
                  </div>
                </div>

                {/* Optional Title Label */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-zinc-800 flex justify-between">
                    <span>Link Label</span>
                    <span className="text-[10px] text-zinc-400 font-mono">Optional</span>
                  </label>
                  <input
                    type="text"
                    id="link-title-input"
                    placeholder="e.g. Secret Financial Sheets"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-zinc-350 focus:border-zinc-900 focus:ring-1 focus:ring-zinc-950/10 text-zinc-900 text-sm rounded-xl placeholder-zinc-400 outline-none transition-all duration-200 h-[46px]"
                  />
                </div>

                {/* Custom Alias ID */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-zinc-800 flex justify-between">
                    <span>Custom Phrase / Alias</span>
                    <span className="text-[10px] text-zinc-400 font-mono">Optional</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-mono text-zinc-400 select-none">
                      /
                    </span>
                    <input
                      type="text"
                      id="custom-alias-input"
                      placeholder="e.g. confidential-01"
                      value={customId}
                      onChange={(e) => setCustomId(e.target.value.replace(/[^a-zA-Z0-9\-_]/g, ""))}
                      className="w-full pl-6 pr-3.5 py-2.5 bg-white border border-zinc-350 focus:border-zinc-900 focus:ring-1 focus:ring-zinc-950/10 text-zinc-900 font-mono text-sm rounded-xl placeholder-zinc-300 outline-none transition-all h-[46px]"
                    />
                  </div>
                </div>

                {/* Static light monocolor toggle bar */}
                <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Lock className="w-4 h-4 text-zinc-800 font-bold" />
                      <div>
                        <h4 className="text-xs font-bold text-zinc-900">Passcode Protection</h4>
                        <p className="text-[10px] text-zinc-500">Require visitor password check</p>
                      </div>
                    </div>

                    <button
                      type="button"
                      id="password-protection-check"
                      onClick={() => {
                        setUsePassword(!usePassword);
                        if (!usePassword) setPassword("");
                      }}
                      className={`relative inline-flex h-5.5 w-11 shrink-0 cursor-pointer rounded-full border border-zinc-350 transition-colors duration-200 ease-in-out outline-none h-[24px] ${
                        usePassword ? "bg-zinc-950" : "bg-zinc-200"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-[20px] w-[20px] transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out border border-zinc-200 ${
                          usePassword ? "translate-x-[20px]" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>

                  {/* Cursive subline for secure choice */}
                  <AnimatePresence>
                    {usePassword && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-1.5 overflow-hidden"
                      >
                        <div className="relative">
                          <input
                            type={showPassword ? "text" : "password"}
                            id="lock-password-input"
                            placeholder="Enter a secure password..."
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-3 py-2.5 pr-10 bg-white border border-zinc-300 text-zinc-900 text-xs rounded-lg placeholder-zinc-400 font-mono outline-none focus:border-zinc-900 h-[44px]"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-400 hover:text-zinc-900"
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Primary Button: Solid Black Monocolor */}
                <button
                  type="submit"
                  id="lock-generate-btn"
                  disabled={isSubmitting}
                  className="w-full py-3 px-4 bg-zinc-950 hover:bg-zinc-900 disabled:bg-zinc-300 text-white font-bold text-xs uppercase tracking-widest rounded-xl transition-all h-[48px] cursor-pointer text-center flex items-center justify-center shadow-sm"
                >
                  {isSubmitting ? (
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  ) : (
                    "Secure Link"
                  )}
                </button>
              </form>
            )}
          </motion.div>
        ) : (
          // VISUAL VAULT/HISTORY DRAWER
          <motion.div
            key="tab-vault"
            initial={{ opacity: 0, scale: 0.98, y: 5 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: -5 }}
            transition={{ duration: 0.15 }}
            className="p-5 rounded-2xl bg-white border border-zinc-250 shadow-sm text-left space-y-4"
          >
            <div className="flex items-center justify-between border-b border-zinc-150 pb-2">
              <span className="text-xs font-bold text-zinc-900 uppercase tracking-wider block">Recorded Corridors</span>
              <span className="text-[10px] text-zinc-400 font-mono uppercase font-bold">Local keychain Only</span>
            </div>

            {localLinks.length === 0 ? (
              <div className="text-center py-10 px-4 placeholder-empty-history">
                <div className="w-10 h-10 bg-zinc-100 text-zinc-400 flex items-center justify-center rounded-xl mx-auto mb-3">
                  <Unlock className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold text-zinc-800">Your secure vault is empty</h4>
                <p className="text-[10px] text-zinc-400 mt-1 max-w-[200px] mx-auto">
                  Protect some destination links to view visitor telemetry logs here.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab("create")}
                  className="mt-4 px-3 py-1.5 bg-zinc-950 text-white text-[10px] font-bold uppercase tracking-wider rounded-lg"
                >
                  Encrypt new URL
                </button>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
                {localLinks.map((link) => (
                  <div
                    key={link.id}
                    className="p-3 rounded-xl bg-zinc-50 border border-zinc-200 flex flex-col justify-between"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="truncate flex-1">
                        <h4 className="text-xs font-bold text-zinc-900 truncate max-w-[180px]">
                          {link.title || "Untitled Link"}
                        </h4>
                        <span className="text-[10px] font-mono text-zinc-500 select-all block mt-0.5">
                          /{link.id}
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        {link.hasPassword ? (
                          <div className="p-1 px-1.5 bg-zinc-900 text-white text-[9px] font-mono uppercase rounded-md flex items-center gap-1 font-bold">
                            <Lock className="w-2.5 h-2.5" />
                            <span>Lock</span>
                          </div>
                        ) : (
                          <div className="p-1 px-1.5 bg-zinc-200 text-zinc-650 text-[9px] font-mono uppercase rounded-md flex items-center gap-1">
                            <Unlock className="w-2.5 h-2.5" />
                            <span>Open</span>
                          </div>
                        )}
                        <button
                          type="button"
                          id={`delete-link-${link.id}`}
                          onClick={() => deleteLink(link.id)}
                          className="p-1 text-zinc-400 hover:text-red-650 hover:bg-zinc-100 rounded transition-all cursor-pointer h-7 w-7 flex items-center justify-center"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between border-t border-zinc-200/60 mt-2.5 pt-2">
                      <div className="flex items-center gap-1 text-[10px] text-zinc-500">
                        <Activity className="w-3 h-3 text-zinc-800" />
                        <span className="font-mono font-bold text-zinc-900">{link.visitCount}</span>
                        <span>redirects</span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => navigator.clipboard.writeText(getFullShortUrl(link.id))}
                          className="text-[10px] font-bold text-zinc-600 hover:text-zinc-950 px-2 py-1 bg-white hover:bg-zinc-100 border border-zinc-200 rounded-md transition-all cursor-pointer"
                        >
                          Clone
                        </button>
                        <a
                          href={getFullShortUrl(link.id)}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 bg-white hover:bg-zinc-100 text-zinc-650 hover:text-zinc-900 border border-zinc-200 rounded-md transition-all cursor-pointer"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
