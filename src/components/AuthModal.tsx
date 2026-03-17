import { useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { Eye, EyeOff, X, Phone } from "lucide-react";
import logo from "@/assets/logo.png";

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type AuthTab = "login" | "signup";

const Field = ({
  icon, placeholder, type = "text", value, onChange, right,
}: {
  icon: string; placeholder: string; type?: string; value: string;
  onChange: (v: string) => void; right?: React.ReactNode;
}) => (
  <div className="relative">
    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25 text-sm select-none">{icon}</span>
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full h-9 pl-8 pr-8 bg-white/[0.07] border border-white/[0.1] rounded-lg text-white text-xs placeholder:text-white/25 outline-none focus:border-fuchsia-500/40 focus:bg-white/[0.09] transition-all"
    />
    {right && <span className="absolute right-3 top-1/2 -translate-y-1/2">{right}</span>}
  </div>
);

const AuthModal = ({ open, onOpenChange }: AuthModalProps) => {
  const { login, signup, googleLogin, savePhone } = useAuth();
  const [tab, setTab] = useState<AuthTab>("login");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [googlePhoneStep, setGooglePhoneStep] = useState(false);
  const [googlePhone, setGooglePhone] = useState("");

  const reset = () => {
    setName(""); setPhone(""); setEmail(""); setPassword("");
    setError(""); setShowPassword(false); setLoading(false);
    setGooglePhoneStep(false); setGooglePhone("");
  };

  const handleLogin = async () => {
    if (!email || !password) { setError("Email and password required"); return; }
    setLoading(true);
    const ok = await login(email, password);
    setLoading(false);
    if (!ok) { setError("Invalid email or password"); return; }
    reset(); onOpenChange(false);
  };

  const handleSignup = async () => {
    if (!name || !email || !password) { setError("Name, email and password required"); return; }
    if (!phone) { setError("Phone number is required"); return; }
    if (password.length < 6) { setError("Password must be 6+ characters"); return; }
    setLoading(true);
    const ok = await signup(name, phone, email, password);
    setLoading(false);
    if (!ok) { setError("Signup failed. Email may already be in use."); return; }
    reset(); onOpenChange(false);
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    const result = await googleLogin();
    setLoading(false);
    if (!result.ok) { setError("Google sign-in failed"); return; }
    if (result.needsPhone) {
      setGooglePhoneStep(true);
      return;
    }
    reset(); onOpenChange(false);
  };

  const handleGooglePhoneSave = async () => {
    if (!googlePhone) { setError("Phone number is required"); return; }
    setLoading(true);
    await savePhone(googlePhone);
    setLoading(false);
    reset(); onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}>
      <DialogContent className="p-0 w-[88vw] max-w-[340px] bg-[#1c1c1e]/95 backdrop-blur-xl border border-white/[0.12] rounded-2xl overflow-hidden gap-0 shadow-2xl [&>button]:hidden">
        <DialogTitle className="sr-only">Authentication</DialogTitle>

        {/* Close */}
        <button
          onClick={() => { reset(); onOpenChange(false); }}
          className="absolute right-3 top-3 z-10 w-6 h-6 rounded-full bg-white/[0.08] flex items-center justify-center text-white/40 hover:text-white hover:bg-white/[0.14] transition-all"
        >
          <X className="w-3 h-3" />
        </button>

        {/* Header */}
        <div className="pt-6 pb-3 px-5 text-center">
          <img src={logo} alt="LUO FILM" className="w-9 h-9 mx-auto mb-1.5 rounded-xl" />
          <h2 className="text-sm font-bold bg-gradient-to-r from-fuchsia-400 to-purple-400 bg-clip-text text-transparent tracking-wide uppercase">
            LUO FILM
          </h2>
          <p className="text-white/35 text-[11px] mt-0.5">
            {googlePhoneStep ? "One more step" : tab === "login" ? "Sign in to continue" : "Create your account"}
          </p>
        </div>

        {/* Google Phone Step */}
        {googlePhoneStep ? (
          <div className="px-5 pb-6 space-y-3">
            <div className="bg-fuchsia-500/10 border border-fuchsia-500/20 rounded-xl p-3 text-center mb-2">
              <Phone className="w-5 h-5 text-fuchsia-400 mx-auto mb-1.5" />
              <p className="text-white/80 text-xs font-medium">Phone number required</p>
              <p className="text-white/40 text-[10px] mt-0.5">We need your phone number to complete registration</p>
            </div>
            <Field
              icon="📱"
              placeholder="Phone Number (e.g. 0760734679)"
              value={googlePhone}
              onChange={(v) => { setGooglePhone(v); setError(""); }}
            />
            {error && (
              <p className="text-red-400 text-[10px] text-center bg-red-500/10 rounded-lg py-1.5 px-2">{error}</p>
            )}
            <button
              onClick={handleGooglePhoneSave}
              disabled={loading}
              className="w-full h-9 rounded-lg bg-gradient-to-r from-fuchsia-500 to-purple-500 text-white font-semibold text-xs hover:brightness-110 transition-all shadow-lg shadow-fuchsia-500/20 disabled:opacity-50"
            >
              {loading ? "Saving…" : "Continue"}
            </button>
          </div>
        ) : (
          <>
            {/* Segmented control (Apple style) */}
            <div className="mx-5 mb-4 flex bg-white/[0.06] rounded-lg p-0.5">
              {(["login", "signup"] as AuthTab[]).map((t) => (
                <button
                  key={t}
                  onClick={() => { setTab(t); setError(""); }}
                  className={`flex-1 py-1.5 text-[11px] font-semibold rounded-md transition-all duration-200 ${
                    tab === t
                      ? "bg-white/[0.14] text-white shadow-sm"
                      : "text-white/35 hover:text-white/55"
                  }`}
                >
                  {t === "login" ? "Log In" : "Sign Up"}
                </button>
              ))}
            </div>

            {/* Form */}
            <div className="px-5 pb-4 space-y-2">
              {tab === "signup" && (
                <Field icon="👤" placeholder="Full Name" value={name} onChange={(v) => { setName(v); setError(""); }} />
              )}
              <Field icon="✉" placeholder="Email" type="email" value={email} onChange={(v) => { setEmail(v); setError(""); }} />
              {tab === "signup" && (
                <Field icon="📱" placeholder="Phone Number *" value={phone} onChange={(v) => { setPhone(v); setError(""); }} />
              )}
              <Field
                icon="🔒"
                placeholder="Password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(v) => { setPassword(v); setError(""); }}
                right={
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-white/25 hover:text-white/50 transition-colors">
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                }
              />

              {error && (
                <p className="text-red-400 text-[10px] text-center bg-red-500/10 rounded-lg py-1.5 px-2">{error}</p>
              )}

              <button
                onClick={tab === "login" ? handleLogin : handleSignup}
                disabled={loading}
                className="w-full h-9 rounded-lg bg-gradient-to-r from-fuchsia-500 to-purple-500 text-white font-semibold text-xs hover:brightness-110 transition-all shadow-lg shadow-fuchsia-500/20 disabled:opacity-50 mt-1"
              >
                {loading ? "Please wait…" : tab === "login" ? "Log In" : "Create Account"}
              </button>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-2 px-5 mb-3">
              <div className="flex-1 h-px bg-white/[0.08]" />
              <span className="text-white/20 text-[10px] tracking-widest">OR</span>
              <div className="flex-1 h-px bg-white/[0.08]" />
            </div>

            {/* Google */}
            <div className="px-5 pb-5">
              <button
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full h-9 rounded-lg border border-white/[0.1] bg-white/[0.05] hover:bg-white/[0.1] text-white text-xs font-medium flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                <svg width="14" height="14" viewBox="0 0 18 18">
                  <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
                  <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
                  <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.997 8.997 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                  <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
                </svg>
                Continue with Google
              </button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AuthModal;
