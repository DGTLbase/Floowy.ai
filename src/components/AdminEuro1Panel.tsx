import { useCallback, useEffect, useState } from "react";
import { RefreshCw, AlertTriangle, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/**
 * €1-trial subscriptions, read from Stripe.
 *
 * The Users tab infers subscription state from profiles.plan and from whether a
 * cancellation_feedback row exists. That drifts from Stripe: a €1 trial is
 * "trialing" rather than "active", a Stripe-side cancellation or a failed card
 * never touches profiles.plan, and feedback rows only exist for people who
 * cancelled through our own flow. This panel shows what Stripe actually holds
 * and flags every row where the two disagree.
 */

interface Row {
  subscriptionId: string; status: string; email: string | null; customerId: string;
  plan: string | null; userId: string | null; created: number; trialEnd: number | null;
  currentPeriodEnd: number | null; cancelAtPeriodEnd: boolean; canceledAt: number | null;
  amount: number | null; currency: string; interval: string | null;
  appPlan: string | null; mismatch: boolean;
}

const date = (s: number | null) =>
  s ? new Date(s * 1000).toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" }) : "—";

const STATUS_STYLE: Record<string, string> = {
  trialing: "bg-blue-500/15 text-blue-600 border-blue-500/30",
  active: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30",
  past_due: "bg-amber-500/15 text-amber-600 border-amber-500/30",
  unpaid: "bg-amber-500/15 text-amber-600 border-amber-500/30",
  canceled: "bg-muted text-muted-foreground border-border",
  incomplete: "bg-muted text-muted-foreground border-border",
  incomplete_expired: "bg-muted text-muted-foreground border-border",
};

const AdminEuro1Panel = () => {
  const [rows, setRows] = useState<Row[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [mismatches, setMismatches] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState("");
  const [onlyMismatches, setOnlyMismatches] = useState(false);

  const load = useCallback(async () => {
    const adminToken = localStorage.getItem("admin_token");
    if (!adminToken) { setError("No admin session"); return; }
    setLoading(true); setError(null);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-euro1-subscriptions`,
        { method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            "admin-token": adminToken,
          },
          body: JSON.stringify({}),
        });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || `Request failed (${res.status})`);
      setRows(data.subscriptions ?? []);
      setCounts(data.counts ?? {});
      setMismatches(data.mismatches ?? 0);
    } catch (e: any) {
      setError(e?.message ?? "Could not load subscriptions");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const visible = rows
    .filter((r) => (onlyMismatches ? r.mismatch : true))
    .filter((r) => !filter ||
      r.email?.toLowerCase().includes(filter.toLowerCase()) ||
      r.subscriptionId.toLowerCase().includes(filter.toLowerCase()));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">€1 trial subscriptions</h2>
          <p className="text-sm text-muted-foreground">Read directly from Stripe, so it matches the Stripe records.</p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          {loading ? "Loading…" : "Refresh"}
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {Object.entries(counts).map(([status, n]) => (
          <span key={status} className={`text-xs px-2.5 py-1 rounded-full border ${STATUS_STYLE[status] ?? "bg-muted text-muted-foreground border-border"}`}>
            {status.replace("_", " ")}: <strong>{n}</strong>
          </span>))}
        <span className="text-xs px-2.5 py-1 rounded-full border bg-muted text-muted-foreground border-border">
          total: <strong>{rows.length}</strong>
        </span>
      </div>

      {mismatches > 0 && (
        <button onClick={() => setOnlyMismatches((v) => !v)}
          className="flex items-start gap-2 w-full text-left rounded-lg border border-amber-500/30 bg-amber-500/10 p-3">
          <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
          <span className="text-sm">
            <strong>{mismatches}</strong> subscription{mismatches === 1 ? "" : "s"} where Stripe and the app disagree —
            live in Stripe but not on a paid plan here, or the reverse.{" "}
            <span className="underline">{onlyMismatches ? "Show all" : "Show only these"}</span>
          </span>
        </button>
      )}

      <Input placeholder="Filter by email or subscription id…" value={filter}
        onChange={(e) => setFilter(e.target.value)} className="max-w-sm" />

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              {["Customer", "Stripe status", "Plan", "App plan", "Trial ends", "Renews", "Amount", ""].map((h) => (
                <th key={h} className="text-left font-medium px-3 py-2 whitespace-nowrap">{h}</th>))}
            </tr>
          </thead>
          <tbody>
            {visible.map((r) => (
              <tr key={r.subscriptionId} className={`border-t border-border ${r.mismatch ? "bg-amber-500/5" : ""}`}>
                <td className="px-3 py-2">
                  <div className="font-medium">{r.email ?? "—"}</div>
                  <div className="text-xs text-muted-foreground font-mono">{r.subscriptionId}</div>
                </td>
                <td className="px-3 py-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${STATUS_STYLE[r.status] ?? "bg-muted text-muted-foreground border-border"}`}>
                    {r.status.replace("_", " ")}
                  </span>
                  {r.cancelAtPeriodEnd && r.status !== "canceled" && (
                    <div className="text-xs text-amber-600 mt-1">cancels at period end</div>)}
                </td>
                <td className="px-3 py-2 capitalize">{r.plan ?? "—"}</td>
                <td className={`px-3 py-2 capitalize ${r.mismatch ? "text-amber-700 font-medium" : ""}`}>{r.appPlan ?? "—"}</td>
                <td className="px-3 py-2 whitespace-nowrap">{date(r.trialEnd)}</td>
                <td className="px-3 py-2 whitespace-nowrap">{date(r.currentPeriodEnd)}</td>
                <td className="px-3 py-2 whitespace-nowrap">
                  {r.amount != null ? `${(r.amount / 100).toFixed(2)} ${r.currency}` : "—"}
                  {r.interval && <span className="text-muted-foreground">/{r.interval}</span>}
                </td>
                <td className="px-3 py-2">
                  <a href={`https://dashboard.stripe.com/subscriptions/${r.subscriptionId}`}
                     target="_blank" rel="noopener noreferrer"
                     className="text-muted-foreground hover:text-foreground inline-flex" aria-label="Open in Stripe">
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </td>
              </tr>))}
            {!loading && visible.length === 0 && (
              <tr><td colSpan={8} className="px-3 py-8 text-center text-muted-foreground">
                {rows.length === 0 ? "No €1 trial subscriptions found in Stripe." : "No rows match this filter."}
              </td></tr>)}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminEuro1Panel;
