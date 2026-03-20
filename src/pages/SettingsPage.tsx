import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import MobileNav from "@/components/MobileNav";
import { useAuth } from "@/contexts/AuthContext";
import {
  ChevronLeft,
  User,
  Phone,
  Lock,
  Bell,
  Play,
  Info,
  ChevronRight,
  Check,
  X,
  Eye,
  EyeOff,
  Trash2,
  Globe,
  Shield,
  FileText,
} from "lucide-react";
import { doc, updateDoc } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import {
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from "firebase/auth";
import { toast } from "@/hooks/use-toast";

const SectionHeader = ({ label }: { label: string }) => (
  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest px-1 mt-6 mb-2">{label}</p>
);

const SettingRow = ({
  icon: Icon,
  label,
  value,
  onClick,
  danger,
  right,
}: {
  icon: any;
  label: string;
  value?: string;
  onClick?: () => void;
  danger?: boolean;
  right?: React.ReactNode;
}) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3.5 text-sm transition-colors hover:bg-white/5 ${danger ? "text-red-400" : "text-foreground"}`}
  >
    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${danger ? "bg-red-500/15" : "bg-white/8"}`}>
      <Icon className={`w-4 h-4 ${danger ? "text-red-400" : "text-muted-foreground"}`} />
    </div>
    <span className="flex-1 text-left">{label}</span>
    {value && <span className="text-xs text-muted-foreground max-w-[140px] truncate">{value}</span>}
    {right ?? <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />}
  </button>
);

const Toggle = ({ on, onToggle }: { on: boolean; onToggle: () => void }) => (
  <button
    onClick={onToggle}
    className={`w-11 h-6 rounded-full transition-colors shrink-0 relative ${on ? "bg-primary" : "bg-white/20"}`}
  >
    <span
      className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${on ? "translate-x-5" : "translate-x-0.5"}`}
    />
  </button>
);

const InlineEdit = ({
  label,
  value,
  type = "text",
  placeholder,
  onSave,
  onCancel,
}: {
  label: string;
  value: string;
  type?: string;
  placeholder?: string;
  onSave: (val: string) => void;
  onCancel: () => void;
}) => {
  const [val, setVal] = useState(value);
  return (
    <div className="px-4 pb-4 pt-2 bg-white/5 border-b border-border">
      <label className="text-xs text-muted-foreground mb-1.5 block">{label}</label>
      <input
        type={type}
        value={val}
        onChange={(e) => setVal(e.target.value)}
        placeholder={placeholder}
        autoFocus
        className="w-full h-10 px-3 rounded-lg bg-background border border-border text-sm text-foreground focus:outline-none focus:border-primary"
      />
      <div className="flex gap-2 mt-2">
        <button
          onClick={() => onSave(val)}
          className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold"
        >
          <Check className="w-3.5 h-3.5" /> Save
        </button>
        <button
          onClick={onCancel}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary text-muted-foreground text-xs"
        >
          <X className="w-3.5 h-3.5" /> Cancel
        </button>
      </div>
    </div>
  );
};

const SettingsPage = () => {
  const navigate = useNavigate();
  const { user, firebaseUser, isAdmin } = useAuth();

  const [editField, setEditField] = useState<"name" | "phone" | "password" | null>(null);
  const [showOldPw, setShowOldPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [oldPw, setOldPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [saving, setSaving] = useState(false);

  const getLocalBool = (key: string, def = false) => {
    try { return JSON.parse(localStorage.getItem(key) ?? String(def)); } catch { return def; }
  };
  const [autoPlay, setAutoPlay] = useState(() => getLocalBool("pref_autoplay", true));
  const [notifNews, setNotifNews] = useState(() => getLocalBool("pref_notif_news", true));
  const [notifUpdates, setNotifUpdates] = useState(() => getLocalBool("pref_notif_updates", true));

  const toggle = (key: string, val: boolean, setter: (v: boolean) => void) => {
    const next = !val;
    localStorage.setItem(key, JSON.stringify(next));
    setter(next);
    toast({ title: `${next ? "Enabled" : "Disabled"}` });
  };

  const saveName = async (name: string) => {
    if (!name.trim() || !user) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, "users", user.id), { name: name.trim() });
      toast({ title: "Display name updated", description: "Changes will take effect on next login." });
      setEditField(null);
    } catch {
      toast({ title: "Failed to update name", variant: "destructive" });
    }
    setSaving(false);
  };

  const savePhone = async (phone: string) => {
    if (!phone.trim() || !user) return;
    const cleaned = phone.trim().replace(/\s+/g, "");
    const formatted = cleaned.startsWith("+") ? cleaned : `+256${cleaned.replace(/^0/, "")}`;
    setSaving(true);
    try {
      await updateDoc(doc(db, "users", user.id), { phone: formatted });
      toast({ title: "Phone number updated" });
      setEditField(null);
    } catch {
      toast({ title: "Failed to update phone", variant: "destructive" });
    }
    setSaving(false);
  };

  const savePassword = async () => {
    if (!oldPw || !newPw) {
      toast({ title: "Fill in both fields", variant: "destructive" }); return;
    }
    if (newPw.length < 6) {
      toast({ title: "New password must be at least 6 characters", variant: "destructive" }); return;
    }
    if (!firebaseUser?.email) return;
    setSaving(true);
    try {
      const credential = EmailAuthProvider.credential(firebaseUser.email, oldPw);
      await reauthenticateWithCredential(firebaseUser, credential);
      await updatePassword(firebaseUser, newPw);
      toast({ title: "Password changed successfully" });
      setOldPw(""); setNewPw(""); setEditField(null);
    } catch (e: any) {
      const msg = e.code === "auth/wrong-password" ? "Current password is incorrect"
        : e.code === "auth/too-many-requests" ? "Too many attempts. Try again later."
        : "Failed to change password";
      toast({ title: msg, variant: "destructive" });
    }
    setSaving(false);
  };

  const clearCache = () => {
    const preserve = ["watchLater", "pref_autoplay", "pref_notif_news", "pref_notif_updates"];
    Object.keys(localStorage)
      .filter((k) => !preserve.includes(k) && !k.startsWith("pref_"))
      .forEach((k) => localStorage.removeItem(k));
    toast({ title: "Cache cleared", description: "Liked and local data reset." });
  };

  const isEmailUser = firebaseUser?.providerData?.some((p) => p.providerId === "password") ?? false;

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center min-h-screen pt-[56px]">
          <p className="text-muted-foreground text-sm">Please log in to access settings.</p>
        </div>
        <MobileNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-[56px] pb-24 max-w-xl mx-auto">

        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-4 sticky top-[56px] bg-background z-10 border-b border-border">
          <button onClick={() => navigate(-1)} className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center hover:bg-secondary/80">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <h1 className="text-lg font-bold">Settings</h1>
        </div>

        {/* Account */}
        <SectionHeader label="Account" />
        <div className="bg-secondary rounded-xl overflow-hidden mx-4">
          <SettingRow
            icon={User}
            label="Display Name"
            value={user.name}
            onClick={() => setEditField(editField === "name" ? null : "name")}
          />
          {editField === "name" && (
            <InlineEdit
              label="New display name"
              value={user.name}
              placeholder="Enter your name"
              onSave={saveName}
              onCancel={() => setEditField(null)}
            />
          )}
          <div className="h-px bg-border mx-4" />
          <SettingRow
            icon={Phone}
            label="Phone Number"
            value={user.phone || "Not set"}
            onClick={() => setEditField(editField === "phone" ? null : "phone")}
          />
          {editField === "phone" && (
            <InlineEdit
              label="Phone number (Uganda +256)"
              value={user.phone?.replace("+256", "") || ""}
              type="tel"
              placeholder="e.g. 772123456"
              onSave={savePhone}
              onCancel={() => setEditField(null)}
            />
          )}
          {isEmailUser && (
            <>
              <div className="h-px bg-border mx-4" />
              <SettingRow
                icon={Lock}
                label="Change Password"
                onClick={() => setEditField(editField === "password" ? null : "password")}
              />
              {editField === "password" && (
                <div className="px-4 pb-4 pt-2 bg-white/5 border-b border-border space-y-3">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Current Password</label>
                    <div className="relative">
                      <input
                        type={showOldPw ? "text" : "password"}
                        value={oldPw}
                        onChange={(e) => setOldPw(e.target.value)}
                        placeholder="Current password"
                        className="w-full h-10 px-3 pr-10 rounded-lg bg-background border border-border text-sm focus:outline-none focus:border-primary"
                      />
                      <button onClick={() => setShowOldPw(!showOldPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                        {showOldPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">New Password</label>
                    <div className="relative">
                      <input
                        type={showNewPw ? "text" : "password"}
                        value={newPw}
                        onChange={(e) => setNewPw(e.target.value)}
                        placeholder="Min. 6 characters"
                        className="w-full h-10 px-3 pr-10 rounded-lg bg-background border border-border text-sm focus:outline-none focus:border-primary"
                      />
                      <button onClick={() => setShowNewPw(!showNewPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                        {showNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={savePassword}
                      disabled={saving}
                      className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold disabled:opacity-60"
                    >
                      <Check className="w-3.5 h-3.5" /> {saving ? "Saving..." : "Update Password"}
                    </button>
                    <button
                      onClick={() => { setEditField(null); setOldPw(""); setNewPw(""); }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary text-muted-foreground text-xs"
                    >
                      <X className="w-3.5 h-3.5" /> Cancel
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Playback */}
        <SectionHeader label="Playback" />
        <div className="bg-secondary rounded-xl overflow-hidden mx-4">
          <div className="flex items-center gap-3 px-4 py-3.5">
            <div className="w-8 h-8 rounded-full bg-white/8 flex items-center justify-center shrink-0">
              <Play className="w-4 h-4 text-muted-foreground" />
            </div>
            <span className="flex-1 text-sm text-foreground">Auto-play Next Episode</span>
            <Toggle on={autoPlay} onToggle={() => toggle("pref_autoplay", autoPlay, setAutoPlay)} />
          </div>
        </div>

        {/* Notifications */}
        <SectionHeader label="Notifications" />
        <div className="bg-secondary rounded-xl overflow-hidden mx-4">
          <div className="flex items-center gap-3 px-4 py-3.5">
            <div className="w-8 h-8 rounded-full bg-white/8 flex items-center justify-center shrink-0">
              <Bell className="w-4 h-4 text-muted-foreground" />
            </div>
            <span className="flex-1 text-sm text-foreground">New Content Alerts</span>
            <Toggle on={notifNews} onToggle={() => toggle("pref_notif_news", notifNews, setNotifNews)} />
          </div>
          <div className="h-px bg-border mx-4" />
          <div className="flex items-center gap-3 px-4 py-3.5">
            <div className="w-8 h-8 rounded-full bg-white/8 flex items-center justify-center shrink-0">
              <Bell className="w-4 h-4 text-muted-foreground" />
            </div>
            <span className="flex-1 text-sm text-foreground">Subscription Updates</span>
            <Toggle on={notifUpdates} onToggle={() => toggle("pref_notif_updates", notifUpdates, setNotifUpdates)} />
          </div>
        </div>

        {/* About */}
        <SectionHeader label="About" />
        <div className="bg-secondary rounded-xl overflow-hidden mx-4">
          <SettingRow
            icon={Globe}
            label="Website"
            value="luofilm.site"
            onClick={() => window.open("https://luofilm.site", "_blank")}
          />
          <div className="h-px bg-border mx-4" />
          <SettingRow
            icon={Shield}
            label="Privacy Policy"
            onClick={() => window.open("https://luofilm.site", "_blank")}
          />
          <div className="h-px bg-border mx-4" />
          <SettingRow
            icon={FileText}
            label="Terms of Service"
            onClick={() => window.open("https://luofilm.site", "_blank")}
          />
          <div className="h-px bg-border mx-4" />
          <div className="flex items-center gap-3 px-4 py-3.5">
            <div className="w-8 h-8 rounded-full bg-white/8 flex items-center justify-center shrink-0">
              <Info className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-foreground">App Version</p>
              <p className="text-xs text-muted-foreground">LUO FILM v1.0.0</p>
            </div>
          </div>
        </div>

        {/* Data */}
        <SectionHeader label="Data & Storage" />
        <div className="bg-secondary rounded-xl overflow-hidden mx-4">
          <SettingRow
            icon={Trash2}
            label="Clear Local Cache"
            right={<span className="text-xs text-muted-foreground">Clears likes &amp; history</span>}
            onClick={clearCache}
            danger
          />
        </div>

        {isAdmin && (
          <>
            <SectionHeader label="Admin" />
            <div className="bg-secondary rounded-xl overflow-hidden mx-4">
              <SettingRow
                icon={Shield}
                label="Admin Panel"
                onClick={() => navigate("/admin")}
              />
            </div>
          </>
        )}

        <p className="text-center text-xs text-muted-foreground mt-8 mb-4">
          LUO FILM · {user.email}
        </p>
      </div>
      <MobileNav />
    </div>
  );
};

export default SettingsPage;
