import { useState, useEffect, useRef } from "react";
import { Wallet, ArrowDownRight, ArrowUpRight, Download, TrendingUp, Loader2, Trash2, RefreshCw, Phone, CheckCircle2, AlertCircle, Smartphone } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useTransactions } from "@/hooks/useFirestore";
import { transactionsService } from "@/lib/firestore";
import { toast } from "@/hooks/use-toast";

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
  return /^\+256[37]\d{8}$/.test(formatPhone(input));
}

type WithdrawStep = "idle" | "processing" | "polling" | "success" | "error";

function useApiWalletBalance() {
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const fetch_ = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${MOBILE_API}/wallet/balance`);
      const data = await res.json();
      const bal = data.balance ?? data.available_balance ?? data.data?.balance ?? null;
      setBalance(typeof bal === "number" ? bal : null);
    } catch { setBalance(null); }
    setLoading(false);
  };
  useEffect(() => { fetch_(); }, []);
  return { balance, loading, refresh: fetch_ };
}

function useApiTransactions() {
  const [apiTxns, setApiTxns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const fetch_ = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${MOBILE_API}/transactions`);
      const data = await res.json();
      const txns = Array.isArray(data) ? data : data.transactions ?? data.data ?? [];
      setApiTxns(txns);
    } catch { setApiTxns([]); }
    setLoading(false);
  };
  useEffect(() => { fetch_(); }, []);
  return { apiTxns, loading, refresh: fetch_ };
}

export default function AdminWallet() {
  const { transactions, loading: txLoading } = useTransactions();
  const { balance: apiBalance, loading: balLoading, refresh: refreshBalance } = useApiWalletBalance();
  const { apiTxns, loading: apiTxLoading, refresh: refreshApiTxns } = useApiTransactions();

  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [withdrawPhone, setWithdrawPhone] = useState("+256");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawStep, setWithdrawStep] = useState<WithdrawStep>("idle");
  const [withdrawMsg, setWithdrawMsg] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"internal" | "api">("api");
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = () => { if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; } };
  useEffect(() => () => stopPolling(), []);

  const handleDelete = async (id: string) => {
    setDeleting(id);
    try {
      await transactionsService.delete(id);
      toast({ title: "Transaction deleted" });
    } catch { toast({ title: "Failed to delete", variant: "destructive" }); }
    setDeleting(null);
  };

  const totalIncome = transactions.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const totalWithdrawals = transactions.filter((t) => t.type === "withdrawal").reduce((s, t) => s + t.amount, 0);
  const localBalance = totalIncome - totalWithdrawals;

  const grouped: Record<string, { income: number; withdrawals: number }> = {};
  transactions.forEach((t) => {
    const month = (t.date || "").slice(0, 7);
    if (!month) return;
    if (!grouped[month]) grouped[month] = { income: 0, withdrawals: 0 };
    if (t.type === "income") grouped[month].income += t.amount;
    else grouped[month].withdrawals += t.amount;
  });
  const chartData = Object.entries(grouped)
    .sort(([a], [b]) => a.localeCompare(b)).slice(-12)
    .map(([month, vals]) => ({
      month: new Date(month + "-01").toLocaleDateString("en", { month: "short" }),
      income: vals.income, withdrawals: vals.withdrawals,
    }));

  const exportTxt = () => {
    const content = transactions.map((t) =>
      `${t.date} | ${t.type.toUpperCase()} | UGX ${t.amount.toLocaleString()} | ${t.description} | ${t.method} | ${t.status}`
    ).join("\n");
    const blob = new Blob([`WALLET TRANSACTIONS REPORT\n${"=".repeat(80)}\n\n${content}\n\nTotal Income: UGX ${totalIncome.toLocaleString()}\nTotal Withdrawals: UGX ${totalWithdrawals.toLocaleString()}\nBalance: UGX ${localBalance.toLocaleString()}`], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "wallet-transactions.txt"; a.click();
  };

  const openWithdraw = () => {
    setWithdrawPhone("+256");
    setWithdrawAmount("");
    setWithdrawStep("idle");
    setWithdrawMsg("");
    setWithdrawOpen(true);
  };

  const confirmWithdraw = async () => {
    const amount = parseInt(withdrawAmount.replace(/,/g, ""));
    if (!amount || amount <= 0) { toast({ title: "Enter a valid amount" }); return; }
    if (!isValidPhone(withdrawPhone)) {
      toast({ title: "Enter a valid Uganda number (07..., 7... or +256...)" });
      return;
    }
    const formattedPhone = formatPhone(withdrawPhone);

    setWithdrawStep("processing");
    setWithdrawMsg(`Initiating withdrawal of UGX ${amount.toLocaleString()} to ${formattedPhone}...`);

    let internalRef = "";
    try {
      const res = await fetch(`${MOBILE_API}/withdraw`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ msisdn: formattedPhone, amount, description: "LUO FILM admin withdrawal" }),
      });
      let data: any = {};
      try { data = await res.json(); } catch { /* non-JSON */ }
      if (!res.ok || data?.success === false) {
        setWithdrawStep("error");
        setWithdrawMsg(data?.message || data?.error || `Server error (${res.status}). Please try again.`);
        return;
      }
      internalRef = data?.internal_reference || data?.data?.internal_reference || data?.reference || "";
    } catch {
      setWithdrawStep("error");
      setWithdrawMsg("Could not reach payment server. Check your internet and try again.");
      return;
    }

    if (!internalRef) {
      setWithdrawStep("error");
      setWithdrawMsg("Withdrawal started but no reference returned. Contact support if issues arise.");
      return;
    }

    setWithdrawStep("polling");
    setWithdrawMsg("Processing withdrawal, checking status...");

    let attempts = 0;
    pollRef.current = setInterval(async () => {
      attempts++;
      if (attempts > 60) {
        stopPolling();
        setWithdrawStep("error");
        setWithdrawMsg(`Timed out. Check your mobile money for status. Ref: ${internalRef}`);
        return;
      }
      try {
        const res = await fetch(`${MOBILE_API}/request-status?internal_reference=${internalRef}`);
        if (!res.ok) return;
        const data = await res.json();
        const isSuccess =
          (data?.success === true && data?.status === "success") ||
          data?.request_status === "success";
        const isFailed =
          data?.request_status === "failed" ||
          data?.status === "failed" ||
          (data?.success === false && data?.request_status !== "pending");
        if (isSuccess) {
          stopPolling();
          await transactionsService.create({
            type: "withdrawal", amount,
            description: `Admin withdrawal to ${formattedPhone}`,
            method: "Mobile Money", status: "completed",
            date: new Date().toISOString().split("T")[0],
            msisdn: formattedPhone,
          } as any);
          setWithdrawStep("success");
          setWithdrawMsg(`UGX ${amount.toLocaleString()} successfully sent to ${formattedPhone}`);
          refreshBalance();
          toast({ title: "Withdrawal successful" });
        } else if (isFailed) {
          stopPolling();
          setWithdrawStep("error");
          setWithdrawMsg(data?.message || "Withdrawal was declined or failed. Please try again.");
        }
      } catch { /* keep polling on network errors */ }
    }, 3000);
  };

  const closeWithdraw = () => { stopPolling(); setWithdrawOpen(false); setWithdrawStep("idle"); };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2"><Wallet className="w-6 h-6 text-amber-400" /> Wallet</h1>
        <button onClick={() => { refreshBalance(); refreshApiTxns(); }} className="flex items-center gap-2 px-3 py-1.5 bg-white/10 rounded-lg text-xs hover:bg-white/20">
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      {/* Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/20 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-1">
            <Smartphone className="w-3.5 h-3.5 text-amber-400/70" />
            <p className="text-xs text-amber-400/70">Mobile Money Balance</p>
          </div>
          {balLoading ? (
            <div className="flex items-center gap-2 mt-2"><Loader2 className="w-4 h-4 animate-spin text-amber-400" /><span className="text-amber-400/60 text-sm">Loading...</span></div>
          ) : apiBalance !== null ? (
            <p className="text-3xl font-bold text-amber-400 mt-1">UGX {apiBalance.toLocaleString()}</p>
          ) : (
            <p className="text-lg font-bold text-amber-400/50 mt-1">UGX {localBalance.toLocaleString()} <span className="text-xs">(local)</span></p>
          )}
          <button onClick={openWithdraw} className="mt-3 px-4 py-2 bg-amber-500 text-black text-sm font-semibold rounded-lg hover:bg-amber-400">Withdraw</button>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-5">
          <p className="text-xs text-white/50 flex items-center gap-1"><ArrowDownRight className="w-3 h-3 text-green-400" /> Total Income</p>
          <p className="text-2xl font-bold text-green-400 mt-1">UGX {totalIncome.toLocaleString()}</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-5">
          <p className="text-xs text-white/50 flex items-center gap-1"><ArrowUpRight className="w-3 h-3 text-red-400" /> Total Withdrawals</p>
          <p className="text-2xl font-bold text-red-400 mt-1">UGX {totalWithdrawals.toLocaleString()}</p>
        </div>
      </div>

      {chartData.length > 0 && (
        <div className="bg-white/5 border border-white/10 rounded-xl p-5">
          <h3 className="text-sm font-semibold flex items-center gap-2 mb-4"><TrendingUp className="w-4 h-4 text-amber-400" /> Revenue vs Withdrawals</h3>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
              <XAxis dataKey="month" stroke="#ffffff40" fontSize={11} />
              <YAxis stroke="#ffffff40" fontSize={11} tickFormatter={(v) => v >= 1000000 ? `${(v / 1000000).toFixed(1)}M` : v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v} />
              <Tooltip contentStyle={{ background: "#1a1a2e", border: "1px solid #ffffff20", borderRadius: 8 }} formatter={(value: number) => [`UGX ${value.toLocaleString()}`, ""]} />
              <Area type="monotone" dataKey="income" stroke="#10b981" fill="#10b98120" strokeWidth={2} />
              <Area type="monotone" dataKey="withdrawals" stroke="#ef4444" fill="#ef444420" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Transactions Tabs */}
      <div className="bg-white/5 border border-white/10 rounded-xl">
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex gap-2">
            <button onClick={() => setActiveTab("api")} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${activeTab === "api" ? "bg-amber-500 text-black" : "bg-white/10 text-white/60 hover:bg-white/20"}`}>
              <Smartphone className="w-3 h-3 inline mr-1" /> Mobile Money
            </button>
            <button onClick={() => setActiveTab("internal")} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${activeTab === "internal" ? "bg-amber-500 text-black" : "bg-white/10 text-white/60 hover:bg-white/20"}`}>
              Internal ({transactions.length})
            </button>
          </div>
          <button onClick={exportTxt} className="flex items-center gap-2 px-3 py-1.5 bg-white/10 rounded-lg text-xs hover:bg-white/20"><Download className="w-3.5 h-3.5" /> Export</button>
        </div>

        {activeTab === "api" ? (
          apiTxLoading ? (
            <div className="flex items-center justify-center py-10 gap-2 text-white/40"><Loader2 className="w-4 h-4 animate-spin" /> Loading mobile money transactions...</div>
          ) : apiTxns.length === 0 ? (
            <div className="py-10 text-center text-white/30 text-sm">No mobile money transactions found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-white/10 text-white/50"><th className="text-left p-3">Date</th><th className="text-left p-3">Description</th><th className="p-3">Phone</th><th className="p-3">Amount</th><th className="p-3">Provider</th><th className="p-3">Status</th></tr></thead>
                <tbody>
                  {apiTxns.map((t, i) => (
                    <tr key={i} className="border-b border-white/5 hover:bg-white/5">
                      <td className="p-3 text-white/60 text-xs">{t.completed_at ? new Date(t.completed_at).toLocaleDateString() : t.created_at ? new Date(t.created_at).toLocaleDateString() : "—"}</td>
                      <td className="p-3 text-xs">{t.description || t.message || "Payment"}</td>
                      <td className="p-3 text-center text-white/50 text-xs">{t.msisdn || "—"}</td>
                      <td className={`p-3 text-center font-semibold text-green-400`}>UGX {(t.amount || 0).toLocaleString()}</td>
                      <td className="p-3 text-center text-white/50 text-xs">{t.provider || "—"}</td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-xs ${(t.status === "success" || t.request_status === "success") ? "bg-green-500/20 text-green-400" : (t.status === "pending" || t.request_status === "pending") ? "bg-yellow-500/20 text-yellow-400" : "bg-red-500/20 text-red-400"}`}>
                          {t.request_status || t.status || "unknown"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : (
          txLoading ? (
            <div className="flex items-center justify-center py-10 gap-2 text-white/40"><Loader2 className="w-4 h-4 animate-spin" /> Loading...</div>
          ) : transactions.length === 0 ? (
            <div className="py-10 text-center text-white/30 text-sm">No internal transactions yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-white/10 text-white/50"><th className="text-left p-3">Date</th><th className="text-left p-3">Description</th><th className="p-3">Method</th><th className="p-3">Amount</th><th className="p-3">Status</th><th className="p-3">Action</th></tr></thead>
                <tbody>
                  {transactions.map((t) => (
                    <tr key={t.id} className="border-b border-white/5 hover:bg-white/5">
                      <td className="p-3 text-white/60">{t.date}</td>
                      <td className="p-3">{t.description}</td>
                      <td className="p-3 text-center text-white/50 text-xs">{t.method}</td>
                      <td className={`p-3 text-center font-semibold ${t.type === "income" ? "text-green-400" : "text-red-400"}`}>{t.type === "income" ? "+" : "-"}UGX {t.amount.toLocaleString()}</td>
                      <td className="p-3 text-center"><span className={`px-2 py-0.5 rounded-full text-xs ${t.status === "completed" ? "bg-green-500/20 text-green-400" : t.status === "pending" ? "bg-yellow-500/20 text-yellow-400" : "bg-red-500/20 text-red-400"}`}>{t.status}</span></td>
                      <td className="p-3 text-center">
                        <button onClick={() => handleDelete(t.id!)} disabled={deleting === t.id} className="p-1.5 rounded bg-red-500/20 text-red-400 hover:bg-red-500/30">
                          {deleting === t.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>

      {/* Withdraw Dialog */}
      {withdrawOpen && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center" onClick={closeWithdraw}>
          <div className="bg-[#12121a] border border-white/10 rounded-xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><ArrowUpRight className="w-5 h-5 text-red-400" /> Withdraw Funds</h3>

            {withdrawStep === "success" ? (
              <div className="text-center py-6 space-y-4">
                <div className="w-14 h-14 mx-auto rounded-full bg-green-500/20 flex items-center justify-center">
                  <CheckCircle2 className="w-7 h-7 text-green-400" />
                </div>
                <p className="text-green-400 font-semibold">Withdrawal Successful!</p>
                <p className="text-sm text-white/60">{withdrawMsg}</p>
                <button onClick={closeWithdraw} className="w-full py-2.5 bg-white/10 rounded-lg text-sm hover:bg-white/20">Close</button>
              </div>
            ) : withdrawStep === "error" ? (
              <div className="text-center py-4 space-y-4">
                <div className="w-14 h-14 mx-auto rounded-full bg-red-500/20 flex items-center justify-center">
                  <AlertCircle className="w-7 h-7 text-red-400" />
                </div>
                <p className="text-sm text-red-400">{withdrawMsg}</p>
                <button onClick={() => setWithdrawStep("idle")} className="w-full py-2.5 bg-white/10 rounded-lg text-sm hover:bg-white/20">Try Again</button>
              </div>
            ) : withdrawStep === "processing" || withdrawStep === "polling" ? (
              <div className="text-center py-8 space-y-4">
                <Loader2 className="w-10 h-10 mx-auto text-amber-400 animate-spin" />
                <p className="text-sm text-white/70">{withdrawMsg}</p>
                {withdrawStep === "polling" && <p className="text-xs text-amber-400/70">Checking payment status...</p>}
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-white/50 mb-1 block">Phone Number (Recipient)</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                    <input value={withdrawPhone} onChange={(e) => setWithdrawPhone(e.target.value)} className="w-full pl-9 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm focus:outline-none focus:border-amber-500/50" placeholder="07..." />
                  </div>
                  {withdrawPhone.length >= 7 && (
                    <p className={`text-[10px] mt-1 ${isValidPhone(withdrawPhone) ? "text-green-400" : "text-amber-400/70"}`}>
                      {isValidPhone(withdrawPhone) ? `✓ Sending to ${formatPhone(withdrawPhone)}` : `Formatted: ${formatPhone(withdrawPhone)}`}
                    </p>
                  )}
                </div>
                <div>
                  <label className="text-xs text-white/50 mb-1 block">Amount (UGX)</label>
                  <input value={withdrawAmount} onChange={(e) => setWithdrawAmount(e.target.value)} className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm focus:outline-none focus:border-amber-500/50" placeholder="500000" />
                </div>
                <button onClick={confirmWithdraw} className="w-full py-2.5 bg-amber-500 text-black font-semibold rounded-lg flex items-center justify-center gap-2 hover:bg-amber-400">
                  Confirm Withdrawal
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
