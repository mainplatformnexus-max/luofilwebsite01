import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Check, Crown, Zap, Star, Shield, Sparkles, LogIn, Phone, Loader2, CheckCircle2, AlertCircle, ArrowLeft } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import AuthModal from "@/components/AuthModal";
import { usersService, transactionsService } from "@/lib/firestore";
import { toast } from "@/hooks/use-toast";
import { trackActivity } from "@/lib/activityTracker";

type Duration = "1day" | "3days" | "1week" | "1month";
type PayStep = "idle" | "validating" | "paying" | "polling" | "success" | "error";

interface Plan {
  name: string;
  price: number;
  features: string[];
  icon: React.ReactNode;
  highlighted?: boolean;
  badge?: string;
  accentColor: string;
}

const plansByDuration: Record<Duration, Plan[]> = {
  "1day": [
    {
      name: "Standard",
      price: 2500,
      features: ["5 Downloads", "720p Quality", "1 Device"],
      icon: <Zap className="w-4 h-4 md:w-5 md:h-5" />,
      accentColor: "hsl(var(--muted-foreground))",
    },
    {
      name: "Pro",
      price: 5000,
      features: ["Unlimited Downloads", "1080p Quality", "2 Devices", "Live TV Channels"],
      icon: <Star className="w-4 h-4 md:w-5 md:h-5" />,
      highlighted: true,
      badge: "Popular",
      accentColor: "hsl(var(--gold-accent))",
    },
  ],
  "3days": [
    {
      name: "Classic",
      price: 5000,
      features: ["10 Downloads", "720p Quality", "1 Device"],
      icon: <Zap className="w-4 h-4 md:w-5 md:h-5" />,
      accentColor: "hsl(var(--muted-foreground))",
    },
    {
      name: "Premium",
      price: 10000,
      features: ["Unlimited Downloads", "1080p Quality", "2 Devices", "Live TV Channels", "Sports Channels"],
      icon: <Crown className="w-4 h-4 md:w-5 md:h-5" />,
      highlighted: true,
      badge: "Best Value",
      accentColor: "hsl(var(--gold-accent))",
    },
  ],
  "1week": [
    {
      name: "Standard",
      price: 10000,
      features: ["10 Downloads", "720p Quality", "1 Device", "Live TV", "Sports"],
      icon: <Star className="w-4 h-4 md:w-5 md:h-5" />,
      accentColor: "hsl(var(--muted-foreground))",
    },
    {
      name: "Premium",
      price: 20000,
      features: ["Unlimited Downloads", "2K Quality", "2 Devices", "Sports", "Agent Support"],
      icon: <Crown className="w-4 h-4 md:w-5 md:h-5" />,
      highlighted: true,
      badge: "Popular",
      accentColor: "hsl(var(--gold-accent))",
    },
  ],
  "1month": [
    {
      name: "Premium",
      price: 20000,
      features: ["Unlimited Downloads", "1080p", "4 Devices"],
      icon: <Star className="w-4 h-4 md:w-5 md:h-5" />,
      accentColor: "hsl(var(--muted-foreground))",
    },
    {
      name: "Ultra",
      price: 35000,
      features: ["Unlimited Downloads", "4K Quality", "4 Devices", "Agent Support"],
      icon: <Shield className="w-4 h-4 md:w-5 md:h-5" />,
      highlighted: true,
      badge: "Best Value",
      accentColor: "hsl(var(--gold-accent))",
    },
    {
      name: "VIP",
      price: 50000,
      features: ["Everything Unlimited", "4K", "Unlimited Devices", "Priority Support"],
      icon: <Sparkles className="w-4 h-4 md:w-5 md:h-5" />,
      highlighted: true,
      badge: "Ultimate",
      accentColor: "hsl(34, 82%, 73%)",
    },
  ],
};

const durationLabels: Record<Duration, string> = {
  "1day": "1 Day",
  "3days": "3 Days",
  "1week": "1 Week",
  "1month": "1 Month",
};

const durationDays: Record<Duration, number> = {
  "1day": 1,
  "3days": 3,
  "1week": 7,
  "1month": 30,
};

function getFullPlanName(duration: Duration, planName: string): string {
  if (planName === "VIP" && duration === "1month") return "VIP Monthly";
  const display: Record<Duration, string> = {
    "1day": "1 Day", "3days": "3 Day", "1week": "1 Week", "1month": "1 Month",
  };
  return `${display[duration]} ${planName}`;
}

const MOBILE_API = "https://function-bun-production-ac72.up.railway.app/api";

function formatPhone(input: string): string {
  const trimmed = input.trim();
  const digits = trimmed.replace(/\D/g, "");
  if (digits.startsWith("256") && digits.length === 12) return `+${digits}`;
  if (digits.startsWith("0") && digits.length === 10) return `+256${digits.slice(1)}`;
  if (digits.length === 9) return `+256${digits}`;
  if (trimmed.startsWith("+256") && digits.length === 12) return trimmed;
  return trimmed;
}

function isValidPhone(input: string): boolean {
  const formatted = formatPhone(input);
  return /^\+256[37]\d{8}$/.test(formatted);
}

function extractStatusPayload(raw: any): any {
  if (!raw) return {};
  // API always wraps success result under "data"
  if (raw.data && typeof raw.data === "object") return raw.data;
  return raw;
}

function getDevice(): string {
  const ua = navigator.userAgent;
  if (/mobile/i.test(ua) && !/tablet|ipad/i.test(ua)) return "Mobile";
  if (/tablet|ipad/i.test(ua)) return "Tablet";
  return "Desktop";
}

function isPaymentSuccess(payload: any): boolean {
  if (!payload) return false;
  return (
    (payload.success === true && payload.status === "success") ||
    payload.request_status === "success" ||
    payload.status === "success"
  );
}

function isPaymentFailed(payload: any): boolean {
  if (!payload) return false;
  return (
    payload.request_status === "failed" ||
    payload.status === "failed" ||
    (payload.success === false && payload.request_status !== "pending" && payload.request_status !== undefined)
  );
}

interface VipPlansModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const VipPlansModal = ({ open, onOpenChange }: VipPlansModalProps) => {
  const { user } = useAuth();
  const [selectedDuration, setSelectedDuration] = useState<Duration>("1day");
  const [authOpen, setAuthOpen] = useState(false);
  const [payOpen, setPayOpen] = useState(false);
  const [payPlan, setPayPlan] = useState<Plan | null>(null);
  const [phone, setPhone] = useState("");
  const [step, setStep] = useState<PayStep>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [statusMsg, setStatusMsg] = useState("");
  const [pollCount, setPollCount] = useState(0);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const selectedDurationRef = useRef<Duration>("1day");
  const plans = plansByDuration[selectedDuration];

  useEffect(() => {
    selectedDurationRef.current = selectedDuration;
  }, [selectedDuration]);

  useEffect(() => {
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  const stopPolling = () => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
  };

  const handleSelectPlan = (plan: Plan) => {
    if (!user) {
      onOpenChange(false);
      setAuthOpen(true);
      return;
    }
    setPayPlan(plan);
    setPhone("");
    setStep("idle");
    setErrorMsg("");
    setStatusMsg("");
    setPollCount(0);
    setPayOpen(true);
  };

  const handleClosePayment = () => {
    stopPolling();
    setPayOpen(false);
    setPayPlan(null);
    setStep("idle");
    setPollCount(0);
  };

  const grantSubscription = async (
    fullPlanName: string,
    duration: Duration,
    price: number,
    paymentMeta: {
      msisdn?: string;
      providerTxId?: string;
      customerRef?: string;
      internalRef?: string;
      provider?: string;
      completedAt?: string;
    } = {}
  ) => {
    if (!user) return;
    const days = durationDays[duration] || 1;
    const startDate = new Date().toISOString().split("T")[0];
    const endDate = new Date(Date.now() + days * 86_400_000).toISOString().split("T")[0];

    await usersService.upsert(user.uid, {
      subscription: {
        plan: fullPlanName,
        startDate,
        endDate,
        status: "active",
        activatedAt: new Date().toISOString(),
        provider: paymentMeta.provider || "Mobile Money",
        providerTxId: paymentMeta.providerTxId || "",
        internalRef: paymentMeta.internalRef || "",
      },
    });

    await transactionsService.create({
      type: "income",
      amount: price,
      description: `${fullPlanName} - ${user.email || user.displayName || phone}`,
      method: "Mobile Money",
      status: "completed",
      date: startDate,
      userId: user.uid,
      msisdn: paymentMeta.msisdn || phone,
      providerTxId: paymentMeta.providerTxId || "",
      customerRef: paymentMeta.customerRef || "",
      internalRef: paymentMeta.internalRef || "",
      provider: paymentMeta.provider || "",
      completedAt: paymentMeta.completedAt || new Date().toISOString(),
    } as any);

    await trackActivity({
      userId: user.uid,
      user: user.displayName || user.email || "User",
      action: "Subscribed",
      target: fullPlanName,
      page: window.location.pathname,
      extra: `UGX ${price.toLocaleString()} via ${paymentMeta.provider || "Mobile Money"}`,
    });
  };

  const startPayment = async () => {
    if (!payPlan || !user) return;
    const currentDuration = selectedDurationRef.current;
    const fullPlanName = getFullPlanName(currentDuration, payPlan.name);
    const formattedPhone = formatPhone(phone);

    if (!isValidPhone(phone)) {
      setErrorMsg("Enter a valid Uganda number e.g. 0712345678, 712345678 or +256712345678");
      return;
    }

    setStep("paying");
    setStatusMsg(`Sending payment request of UGX ${payPlan.price.toLocaleString()} to ${formattedPhone}...`);
    setErrorMsg("");
    setPollCount(0);

    let internalRef = "";
    try {
      const depositRes = await fetch(`${MOBILE_API}/deposit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          msisdn: formattedPhone,
          amount: payPlan.price,
          description: `LUO FILM - ${fullPlanName} Subscription`,
        }),
      });

      let depositData: any = {};
      try { depositData = await depositRes.json(); } catch { /* non-JSON */ }

      const depositPayload = extractStatusPayload(depositData);

      if (!depositRes.ok) {
        setStep("error");
        setErrorMsg(
          depositPayload?.message ||
          depositPayload?.error ||
          `Payment server error (${depositRes.status}). Please try again.`
        );
        return;
      }
      if (depositPayload?.success === false) {
        setStep("error");
        setErrorMsg(depositPayload?.message || depositPayload?.error || "Payment request was rejected. Try a different number.");
        return;
      }

      internalRef =
        depositPayload?.internal_reference ||
        depositPayload?.internalReference ||
        depositPayload?.reference ||
        depositData?.internal_reference ||
        depositData?.reference || "";

    } catch {
      setStep("error");
      setErrorMsg("Could not reach payment server. Check your internet and try again.");
      return;
    }

    if (!internalRef) {
      setStep("error");
      setErrorMsg("Payment started but no reference was returned. Contact support if money was deducted.");
      return;
    }

    setStep("polling");
    setStatusMsg(`Approve the payment prompt on ${formattedPhone}...`);
    setPollCount(0);

    let attempts = 0;
    const MAX_ATTEMPTS = 120;

    pollRef.current = setInterval(async () => {
      attempts++;
      setPollCount(attempts);

      if (attempts > MAX_ATTEMPTS) {
        stopPolling();
        setStep("error");
        setErrorMsg(`Payment confirmation timed out after 4 minutes. If money was deducted, contact support with ref: ${internalRef}`);
        return;
      }

      let rawData: any;
      try {
        const statusRes = await fetch(
          `${MOBILE_API}/request-status?internal_reference=${encodeURIComponent(internalRef)}`
        );
        if (!statusRes.ok) return;
        rawData = await statusRes.json();
      } catch {
        // keep polling on network errors
        return;
      }

      const payload = extractStatusPayload(rawData);

      if (isPaymentSuccess(payload)) {
        stopPolling();
        try {
          await grantSubscription(fullPlanName, currentDuration, payPlan.price, {
            msisdn: payload.msisdn || formattedPhone,
            providerTxId: payload.provider_transaction_id || "",
            customerRef: payload.customer_reference || "",
            internalRef: payload.internal_reference || internalRef,
            provider: payload.provider || "",
            completedAt: payload.completed_at || new Date().toISOString(),
          });
          setStep("success");
          setStatusMsg(`Your ${fullPlanName} subscription is now active! Enjoy LUO FILM.`);
          toast({ title: "Subscription activated!", description: `Welcome to ${fullPlanName}` });
          setTimeout(() => {
            handleClosePayment();
            onOpenChange(false);
          }, 3500);
        } catch (err: any) {
          console.error("grantSubscription failed:", err?.code, err?.message, err);
          setStep("error");
          setErrorMsg(
            `Payment received but subscription activation failed (${err?.code || err?.message || "unknown error"}). Contact support with ref: ${internalRef}`
          );
        }
      } else if (isPaymentFailed(payload)) {
        stopPolling();
        setStep("error");
        setErrorMsg(
          payload?.message ||
          "Payment was declined or failed. Please ensure you have enough balance and try again."
        );
      }
    }, 1000);
  };

  return (
    <>
      <AuthModal open={authOpen} onOpenChange={setAuthOpen} />

      {/* Payment Dialog */}
      <Dialog open={payOpen} onOpenChange={(v) => { if (!v) handleClosePayment(); }}>
        <DialogContent className="w-[92vw] max-w-md border-none bg-[hsl(220,20%,6%)] p-0 gap-0 shadow-2xl">
          <DialogTitle className="sr-only">Mobile Money Payment</DialogTitle>
          <div className="p-6">
            {/* Header */}
            <div className="flex items-center gap-2 mb-5">
              {step === "idle" || step === "error" ? (
                <button onClick={handleClosePayment} className="p-1 rounded-lg hover:bg-white/10 text-white/50">
                  <ArrowLeft className="w-4 h-4" />
                </button>
              ) : null}
              <div>
                <h2 className="text-lg font-bold text-white">Mobile Money Payment</h2>
                {payPlan && (
                  <p className="text-xs text-white/50">
                    {getFullPlanName(selectedDuration, payPlan.name)} · UGX {payPlan?.price.toLocaleString()}
                  </p>
                )}
              </div>
            </div>

            {step === "success" ? (
              <div className="text-center py-8 space-y-4">
                <div className="w-16 h-16 mx-auto rounded-full bg-green-500/20 flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8 text-green-400" />
                </div>
                <p className="text-lg font-bold text-white">Payment Successful!</p>
                <p className="text-sm text-white/60">{statusMsg}</p>
              </div>
            ) : step === "error" ? (
              <div className="space-y-4">
                <div className="text-center py-4">
                  <div className="w-14 h-14 mx-auto rounded-full bg-red-500/20 flex items-center justify-center mb-3">
                    <AlertCircle className="w-7 h-7 text-red-400" />
                  </div>
                  <p className="text-sm text-red-400">{errorMsg}</p>
                </div>
                <button
                  onClick={() => { setStep("idle"); setErrorMsg(""); setPollCount(0); }}
                  className="w-full py-2.5 bg-white/10 text-white font-semibold rounded-xl text-sm hover:bg-white/20"
                >
                  Try Again
                </button>
              </div>
            ) : step === "polling" || step === "paying" || step === "validating" ? (
              <div className="text-center py-8 space-y-4">
                <div className="w-16 h-16 mx-auto rounded-full bg-amber-500/20 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
                </div>
                <p className="text-sm font-semibold text-white">
                  {step === "validating" ? "Validating number..." : step === "paying" ? "Initiating payment..." : "Waiting for approval..."}
                </p>
                <p className="text-xs text-white/50 leading-relaxed">{statusMsg}</p>
                {step === "polling" && (
                  <>
                    <p className="text-xs text-amber-400/70">Please approve the prompt on your phone</p>
                    <p className="text-[10px] text-white/25">
                      Checking status... ({pollCount}/{120})
                    </p>
                  </>
                )}
              </div>
            ) : (
              <div className="space-y-5">
                {/* Plan summary */}
                {payPlan && (
                  <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
                    <div>
                      <p className="text-sm font-semibold text-white">{getFullPlanName(selectedDuration, payPlan.name)}</p>
                      <p className="text-xs text-white/40">{durationLabels[selectedDuration]} access</p>
                    </div>
                    <p className="text-lg font-bold text-amber-400">UGX {payPlan.price.toLocaleString()}</p>
                  </div>
                )}

                {/* Phone input */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-white/60">Mobile Money Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                    <input
                      value={phone}
                      onChange={(e) => { setPhone(e.target.value); setErrorMsg(""); }}
                      placeholder="07..."
                      className="w-full pl-9 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-white/30 focus:outline-none focus:border-amber-500/50"
                    />
                  </div>
                  {phone && phone.length >= 7 && (
                    <p className={`text-[10px] flex items-center gap-1 ${isValidPhone(phone) ? "text-green-400" : "text-amber-400/70"}`}>
                      {isValidPhone(phone)
                        ? `✓ Will send to ${formatPhone(phone)}`
                        : `Format: ${formatPhone(phone)} — enter full Uganda number`}
                    </p>
                  )}
                  {(!phone || phone.length < 7) && (
                    <p className="text-[10px] text-white/30">MTN or Airtel Uganda number</p>
                  )}
                </div>

                {errorMsg && (
                  <p className="text-xs text-red-400 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> {errorMsg}
                  </p>
                )}

                <button
                  onClick={startPayment}
                  className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-black font-bold rounded-xl text-sm hover:brightness-110 transition-all"
                >
                  Pay UGX {payPlan?.price.toLocaleString()} Now
                </button>
                <p className="text-[10px] text-white/30 text-center">
                  You will receive a payment prompt on your phone. Approve it to activate your subscription.
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Plans Dialog */}
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="w-[92vw] max-w-[800px] max-h-[88vh] overflow-y-auto border-none bg-[hsl(220,20%,6%)] p-0 gap-0 shadow-2xl">
          <DialogTitle className="sr-only">VIP Subscription Plans</DialogTitle>

          <div className="relative px-4 md:px-8 pt-5 md:pt-8 pb-3 md:pb-5 text-center">
            <div className="inline-flex items-center gap-2 mb-1 md:mb-2">
              <div className="w-7 h-7 md:w-10 md:h-10 rounded-full bg-gradient-to-br from-[hsl(var(--gold-accent))] to-[hsl(34,70%,45%)] flex items-center justify-center shadow-lg shadow-[hsl(var(--gold-accent)/0.3)]">
                <Crown className="w-3.5 h-3.5 md:w-5 md:h-5 text-[hsl(225,24%,8%)]" />
              </div>
              <h2 className="text-base md:text-2xl font-bold text-white tracking-tight">Choose Your Plan</h2>
            </div>
            <p className="text-[11px] md:text-sm text-[hsl(0,0%,55%)]">Unlock premium content & features with LUO FILM VIP</p>
          </div>

          <div className="flex gap-1 mx-3 md:mx-8 mb-3 md:mb-6 p-0.5 md:p-1 bg-[hsl(220,15%,10%)] rounded-lg">
            {(Object.keys(durationLabels) as Duration[]).map((d) => (
              <button
                key={d}
                onClick={() => setSelectedDuration(d)}
                className={`flex-1 py-1.5 md:py-2.5 rounded-md text-[11px] md:text-sm font-semibold transition-all duration-200 ${
                  selectedDuration === d
                    ? "bg-[hsl(var(--gold-accent))] text-[hsl(225,24%,8%)] shadow-md shadow-[hsl(var(--gold-accent)/0.25)]"
                    : "text-[hsl(0,0%,50%)] hover:text-white hover:bg-[hsl(220,15%,14%)]"
                }`}
              >
                {durationLabels[d]}
              </button>
            ))}
          </div>

          <div className={`grid gap-2 md:gap-4 px-3 md:px-8 pb-5 md:pb-8 ${plans.length === 3 ? "grid-cols-3" : "grid-cols-2"}`}>
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`relative rounded-xl md:rounded-2xl overflow-hidden flex flex-col transition-all duration-300 ${
                  plan.highlighted
                    ? "bg-[hsl(220,15%,12%)] border-2 border-[hsl(var(--gold-accent)/0.5)] shadow-lg shadow-[hsl(var(--gold-accent)/0.08)]"
                    : "bg-[hsl(220,15%,10%)] border border-[hsl(0,0%,100%,0.06)]"
                }`}
              >
                {plan.badge && (
                  <div className="absolute top-0 right-0">
                    <div className="bg-gradient-to-r from-[hsl(var(--gold-accent))] to-[hsl(34,70%,55%)] text-[hsl(225,24%,8%)] text-[8px] md:text-[10px] font-bold px-1.5 md:px-3 py-0.5 md:py-1 rounded-bl-lg uppercase tracking-wider">
                      {plan.badge}
                    </div>
                  </div>
                )}

                <div className="p-2.5 md:p-5 flex flex-col flex-1">
                  <div className="flex items-center gap-1.5 md:gap-2.5 mb-2 md:mb-4">
                    <div
                      className={`w-6 h-6 md:w-9 md:h-9 rounded-lg md:rounded-xl flex items-center justify-center ${
                        plan.highlighted
                          ? "bg-gradient-to-br from-[hsl(var(--gold-accent))] to-[hsl(34,70%,45%)] text-[hsl(225,24%,8%)]"
                          : "bg-[hsl(220,15%,16%)] text-[hsl(0,0%,60%)]"
                      }`}
                    >
                      {plan.icon}
                    </div>
                    <span className="font-bold text-white text-xs md:text-base">{plan.name}</span>
                  </div>

                  <div className="mb-2 md:mb-5">
                    <div className="flex items-baseline gap-0.5 md:gap-1">
                      <span className="text-lg md:text-3xl font-extrabold text-white">
                        {plan.price.toLocaleString()}
                      </span>
                      <span className="text-[10px] md:text-sm font-medium text-[hsl(0,0%,45%)]">UGX</span>
                    </div>
                    <span className="text-[9px] md:text-xs text-[hsl(0,0%,40%)]">
                      /{selectedDuration === "1day" ? "day" : selectedDuration === "3days" ? "3 days" : selectedDuration === "1week" ? "week" : "month"}
                    </span>
                  </div>

                  <div className="h-px bg-[hsl(0,0%,100%,0.06)] mb-2 md:mb-4" />

                  <ul className="space-y-1 md:space-y-3 mb-2 md:mb-6 flex-1">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-center gap-1.5 md:gap-2.5">
                        <div
                          className={`w-3.5 h-3.5 md:w-5 md:h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                            plan.highlighted
                              ? "bg-[hsl(var(--gold-accent)/0.15)] text-[hsl(var(--gold-accent))]"
                              : "bg-[hsl(142,61%,45%,0.12)] text-[hsl(var(--primary))]"
                          }`}
                        >
                          <Check className="w-2 h-2 md:w-3 md:h-3" strokeWidth={3} />
                        </div>
                        <span className="text-[10px] md:text-sm text-[hsl(0,0%,75%)] leading-tight">{f}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => handleSelectPlan(plan)}
                    className={`w-full py-1.5 md:py-3 rounded-lg md:rounded-xl text-[10px] md:text-sm font-bold transition-all duration-200 flex items-center justify-center gap-1 ${
                      plan.highlighted
                        ? "bg-gradient-to-r from-[hsl(var(--gold-accent))] to-[hsl(34,70%,55%)] text-[hsl(225,24%,8%)] hover:brightness-110"
                        : "bg-[hsl(220,15%,16%)] text-white border border-[hsl(0,0%,100%,0.1)] hover:bg-[hsl(220,15%,20%)]"
                    }`}
                  >
                    {!user && <LogIn className="w-3 h-3 md:w-3.5 md:h-3.5" />}
                    {!user ? "Sign In" : `Get ${plan.name}`}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default VipPlansModal;
