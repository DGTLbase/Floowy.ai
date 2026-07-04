import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Key, Copy, Trash2, Loader2, Lock } from "lucide-react";

const ENDPOINT = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/api-v1`;

interface UserKey {
  id: string;
  key_prefix: string;
  price_per_credit: number;
  credits_balance: number;
  allowed_tools: string[];
  status: string;
  last_used_at: string | null;
}

/** Per-user API key management, embedded in the admin user profile (Membership tab). */
export function AdminUserApiKeys({ user }: { user: { id: string; email?: string; plan?: string } }) {
  const eligible = user.plan === "professional" || user.plan === "enterprise";
  const [keys, setKeys] = useState<UserKey[]>([]);
  const [loading, setLoading] = useState(false);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [price, setPrice] = useState("0.20");
  const [credits, setCredits] = useState("");
  const { toast } = useToast();

  const call = useCallback(async (action: string, extra: Record<string, unknown> = {}) => {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        "admin-token": localStorage.getItem("admin_token") || "",
      },
      body: JSON.stringify({ admin: true, action, ...extra }),
    });
    const data = await res.json();
    if (!res.ok || data?.error) throw new Error(data?.error || "Request failed");
    return data;
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    try { setKeys((await call("user_keys", { user_id: user.id })).keys ?? []); }
    catch { /* silent */ }
    finally { setLoading(false); }
  }, [call, user.id]);

  useEffect(() => { refresh(); }, [refresh]);

  const create = async () => {
    try {
      const d = await call("create_key", {
        partner_name: user.email || "user",
        user_id: user.id,
        price_per_credit: Number(price) || 0.20,
      });
      setNewKey(d.api_key);
      const c = parseInt(credits, 10);
      if (c > 0) await call("topup", { key_id: d.id, credits: c, amount_eur: c * (Number(price) || 0.20), note: "initial" });
      setCredits("");
      await refresh();
    } catch (e) { toast({ title: "Create failed", description: String(e), variant: "destructive" }); }
  };

  const topup = async (k: UserKey) => {
    const c = parseInt(prompt(`Add how many credits? (€${k.price_per_credit}/credit)`) || "", 10);
    if (!c || c <= 0) return;
    try { await call("topup", { key_id: k.id, credits: c, amount_eur: c * Number(k.price_per_credit), note: "top-up" }); await refresh(); }
    catch (e) { toast({ title: "Top-up failed", description: String(e), variant: "destructive" }); }
  };

  const revoke = async (k: UserKey) => {
    if (!confirm("Revoke this key? Permanent.")) return;
    try { await call("revoke", { key_id: k.id }); await refresh(); }
    catch (e) { toast({ title: "Revoke failed", description: String(e), variant: "destructive" }); }
  };

  return (
    <div className="p-4 rounded-xl border border-border">
      <p className="text-xs font-medium mb-3 flex items-center gap-1.5"><Key className="w-3.5 h-3.5" /> API Access</p>

      {!eligible ? (
        <div className="flex items-start gap-2 text-xs text-muted-foreground">
          <Lock className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          <span>API access requires a <b>Professional</b> or <b>Enterprise</b> plan. Change the plan above to enable.</span>
        </div>
      ) : (
        <>
          {loading ? (
            <div className="flex items-center gap-2 text-xs text-muted-foreground"><Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading…</div>
          ) : keys.length > 0 ? (
            <div className="space-y-1.5 mb-3">
              {keys.map((k) => (
                <div key={k.id} className="flex items-center justify-between gap-2 py-2 px-3 rounded-lg bg-muted/30 border border-border/30 text-xs">
                  <div className="min-w-0">
                    <code>{k.key_prefix}</code>
                    <span className="ml-2 text-muted-foreground">
                      {k.status === "active" ? `${k.credits_balance} cr · €${Number(k.price_per_credit).toFixed(2)}/cr` : <span className="text-destructive">revoked</span>}
                    </span>
                  </div>
                  {k.status === "active" && (
                    <div className="flex gap-1">
                      <Button size="sm" variant="outline" className="h-7 text-xs px-2" onClick={() => topup(k)}>Top up</Button>
                      <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => revoke(k)}><Trash2 className="w-3.5 h-3.5" /></Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground mb-3">No API keys yet.</p>
          )}

          {newKey && (
            <div className="rounded-lg border border-primary/40 bg-primary/5 p-2.5 mb-3">
              <p className="text-[10px] font-semibold text-primary mb-1">New key — copy now, shown once:</p>
              <div className="flex items-center gap-2">
                <code className="min-w-0 flex-1 truncate rounded bg-background px-2 py-1 text-[11px]">{newKey}</code>
                <Button size="sm" variant="outline" className="h-7 px-2" onClick={() => { navigator.clipboard.writeText(newKey); toast({ title: "Copied" }); }}>
                  <Copy className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          )}

          <div className="flex items-end gap-2">
            <div className="flex-1">
              <label className="text-[10px] text-muted-foreground">€ / credit</label>
              <Input type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} className="h-9" />
            </div>
            <div className="flex-1">
              <label className="text-[10px] text-muted-foreground">Initial credits</label>
              <Input type="number" value={credits} onChange={(e) => setCredits(e.target.value)} placeholder="0" className="h-9" />
            </div>
            <Button onClick={create} className="h-9"><Key className="w-3.5 h-3.5 mr-1.5" />Create key</Button>
          </div>
        </>
      )}
    </div>
  );
}
