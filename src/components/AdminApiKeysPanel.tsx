import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Key, Copy, Trash2, Plus, Loader2 } from "lucide-react";

interface ApiKey {
  id: string;
  key_prefix: string;
  partner_name: string;
  partner_email: string | null;
  price_per_credit: number;
  credits_balance: number;
  allowed_tools: string[];
  status: string;
  created_at: string;
  last_used_at: string | null;
}

const ENDPOINT = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/api-v1`;

/** Admin panel: provision partner/user API keys, top up prepaid credits, view usage, revoke. */
export function AdminApiKeysPanel() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(false);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [form, setForm] = useState({ partner_name: "", user_email: "", price_per_credit: "0.20", credits: "" });
  const { toast } = useToast();

  const call = useCallback(async (action: string, extra: Record<string, unknown> = {}) => {
    const adminToken = localStorage.getItem("admin_token") || "";
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        "admin-token": adminToken,
      },
      body: JSON.stringify({ admin: true, action, ...extra }),
    });
    const data = await res.json();
    if (!res.ok || data?.error) throw new Error(data?.error || "Request failed");
    return data;
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    try { setKeys((await call("list_keys")).keys ?? []); }
    catch (e) { toast({ title: "Couldn't load keys", description: String(e), variant: "destructive" }); }
    finally { setLoading(false); }
  }, [call, toast]);

  useEffect(() => { refresh(); }, [refresh]);

  const createKey = async () => {
    if (!form.partner_name.trim()) return toast({ title: "Partner/label name required", variant: "destructive" });
    try {
      const d = await call("create_key", {
        partner_name: form.partner_name.trim(),
        user_email: form.user_email.trim() || undefined,
        price_per_credit: Number(form.price_per_credit) || 0.20,
      });
      setNewKey(d.api_key);
      // optional immediate top-up
      const credits = parseInt(form.credits, 10);
      if (credits > 0) {
        await call("topup", { key_id: d.id, credits, amount_eur: credits * (Number(form.price_per_credit) || 0.20), note: "initial" });
      }
      setForm({ partner_name: "", user_email: "", price_per_credit: "0.20", credits: "" });
      await refresh();
    } catch (e) { toast({ title: "Create failed", description: String(e), variant: "destructive" }); }
  };

  const topup = async (k: ApiKey) => {
    const input = prompt(`Add how many credits to ${k.partner_name}? (€${k.price_per_credit}/credit)`);
    const credits = parseInt(input || "", 10);
    if (!credits || credits <= 0) return;
    try {
      await call("topup", { key_id: k.id, credits, amount_eur: credits * Number(k.price_per_credit), note: "manual top-up" });
      toast({ title: `Added ${credits} credits` });
      await refresh();
    } catch (e) { toast({ title: "Top-up failed", description: String(e), variant: "destructive" }); }
  };

  const revoke = async (k: ApiKey) => {
    if (!confirm(`Revoke ${k.partner_name}'s key? This is permanent.`)) return;
    try { await call("revoke", { key_id: k.id }); await refresh(); }
    catch (e) { toast({ title: "Revoke failed", description: String(e), variant: "destructive" }); }
  };

  const copy = (t: string) => { navigator.clipboard.writeText(t); toast({ title: "Copied" }); };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Key className="h-5 w-5" />
        <h2 className="text-xl font-semibold">API Keys</h2>
      </div>

      {/* Create */}
      <div className="rounded-lg border border-border p-4 space-y-4">
        <h3 className="text-sm font-semibold">Create a key</h3>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <div><Label className="text-xs">Partner / label</Label>
            <Input value={form.partner_name} onChange={(e) => setForm({ ...form, partner_name: e.target.value })} placeholder="Acme Corp" /></div>
          <div><Label className="text-xs">User email (optional)</Label>
            <Input value={form.user_email} onChange={(e) => setForm({ ...form, user_email: e.target.value })} placeholder="user@brand.com" /></div>
          <div><Label className="text-xs">€ / credit</Label>
            <Input type="number" step="0.01" value={form.price_per_credit} onChange={(e) => setForm({ ...form, price_per_credit: e.target.value })} /></div>
          <div><Label className="text-xs">Initial credits</Label>
            <Input type="number" value={form.credits} onChange={(e) => setForm({ ...form, credits: e.target.value })} placeholder="0" /></div>
        </div>
        <Button onClick={createKey}><Plus className="mr-2 h-4 w-4" />Create key</Button>

        {newKey && (
          <div className="rounded-lg border border-primary/40 bg-primary/5 p-3">
            <p className="mb-1 text-xs font-semibold text-primary">New key — copy now, shown once:</p>
            <div className="flex items-center gap-2">
              <code className="min-w-0 flex-1 truncate rounded bg-background px-2 py-1 text-xs">{newKey}</code>
              <Button size="sm" variant="outline" onClick={() => copy(newKey)}><Copy className="h-3.5 w-3.5" /></Button>
            </div>
          </div>
        )}
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Loading…</div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs text-muted-foreground">
              <tr>
                <th className="p-3">Partner</th><th className="p-3">Key</th><th className="p-3">€/cr</th>
                <th className="p-3">Balance</th><th className="p-3">Status</th><th className="p-3">Last used</th><th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {keys.map((k) => (
                <tr key={k.id} className="border-t border-border">
                  <td className="p-3">
                    <div className="font-medium">{k.partner_name}</div>
                    {k.partner_email && <div className="text-xs text-muted-foreground">{k.partner_email}</div>}
                  </td>
                  <td className="p-3"><code className="text-xs">{k.key_prefix}</code></td>
                  <td className="p-3">€{Number(k.price_per_credit).toFixed(2)}</td>
                  <td className="p-3 font-semibold">{k.credits_balance}</td>
                  <td className="p-3">
                    <span className={k.status === "active" ? "text-green-600" : "text-destructive"}>{k.status}</span>
                  </td>
                  <td className="p-3 text-xs text-muted-foreground">{k.last_used_at ? new Date(k.last_used_at).toLocaleDateString() : "—"}</td>
                  <td className="p-3">
                    {k.status === "active" && (
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => topup(k)}>Top up</Button>
                        <Button size="sm" variant="ghost" onClick={() => revoke(k)}><Trash2 className="h-3.5 w-3.5" /></Button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {keys.length === 0 && (
                <tr><td colSpan={7} className="p-6 text-center text-sm text-muted-foreground">No API keys yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
