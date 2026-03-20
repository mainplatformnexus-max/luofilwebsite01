import { useState } from "react";
import { Phone, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

const PhoneGateModal = () => {
  const { user, savePhone, isAdmin } = useAuth();
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);

  if (!user || isAdmin || user.phone) return null;

  const handleSave = async () => {
    const clean = phone.trim().replace(/\s+/g, "");
    if (!clean || clean.length < 9) {
      toast({ title: "Enter a valid phone number", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      await savePhone(clean);
      toast({ title: "Phone number saved!" });
    } catch {
      toast({ title: "Failed to save phone number", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm px-4">
      <div className="w-full max-w-sm bg-[#12121a] border border-white/10 rounded-2xl p-6 shadow-2xl">
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-14 h-14 rounded-full bg-amber-500/20 flex items-center justify-center mb-3">
            <Phone className="w-7 h-7 text-amber-400" />
          </div>
          <h2 className="text-lg font-bold text-white">Phone Number Required</h2>
          <p className="text-sm text-white/50 mt-1">
            Add your phone number to continue using LUO FILM. This helps secure your account.
          </p>
        </div>

        <div className="space-y-3">
          <div className="flex rounded-xl overflow-hidden border border-white/10 focus-within:border-amber-500/50 transition-colors">
            <span className="flex items-center px-3 bg-white/5 text-white/50 text-sm border-r border-white/10 select-none">+256</span>
            <input
              type="tel"
              placeholder="756 123 456"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/[^0-9\s]/g, ""))}
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
              maxLength={15}
              className="flex-1 bg-transparent px-3 py-3 text-sm text-white placeholder-white/30 focus:outline-none"
              autoFocus
            />
          </div>

          <button
            onClick={handleSave}
            disabled={saving || phone.trim().length < 7}
            className="w-full py-3 rounded-xl bg-amber-500 text-black font-bold text-sm hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save & Continue"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PhoneGateModal;
