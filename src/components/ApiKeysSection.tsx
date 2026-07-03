import { useCallback, useEffect, useState } from "react";
import { Key, Copy, Trash2, Loader2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ApiKey {
  id: string;
  key_prefix: string;
  credits_balance: number;
  allowed_tools: string[];
  status: string;
  created_at: string;
  last_used_at: string | null;
}

/**
 * Self-serve API key management for Professional/Enterprise users.
 * Talks to the api-v1 edge function with { self: true }. The full key is only
 * ever shown once, right after creation.
 */
const ApiKeysSection = ({ plan }: { plan: string }) => {
  const eligible = plan === "professional" || plan === "enterprise";
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newKey, setNewKey] = useState<string | null>(null);
  const { toast } = useToast();

  const call = useCallback(async (action: string, extra: Record<string, unknown> = {}) => {
    const { data, error } = await supabase.functions.invoke("api-v1", {
      body: { self: true, action, ...extra },
    });
    if (error) throw new Error(error.message);
    if (data?.error) throw new Error(data.error);
    return data;
  }, []);

  const refresh = useCallback(async () => {
    if (!eligible) return;
    setLoading(true);
    try {
      const d = await call("my_keys");
      setKeys(d.keys ?? []);
    } catch (e) {
      /* silent — surfaced on action */
    } finally {
      setLoading(false);
    }
  }, [eligible, call]);

  useEffect(() => { refresh(); }, [refresh]);

  const createKey = async () => {
    setCreating(true);
    try {
      const d = await call("create_my_key");
      setNewKey(d.api_key);
      await refresh();
    } catch (e) {
      toast({ title: "Couldn't create key", description: e instanceof Error ? e.message : "", variant: "destructive" });
    } finally {
      setCreating(false);
    }
  };

  const revoke = async (id: string) => {
    try {
      await call("revoke_my_key", { key_id: id });
      await refresh();
      toast({ title: "Key revoked" });
    } catch (e) {
      toast({ title: "Couldn't revoke key", description: e instanceof Error ? e.message : "", variant: "destructive" });
    }
  };

  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied to clipboard" });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Key className="w-4 h-4 text-muted-foreground" />
        <h2 className="text-sm font-semibold text-foreground">API Access</h2>
      </div>

      {!eligible ? (
        <div className="flex items-start gap-3 rounded-lg border border-border bg-muted/40 p-4">
          <Lock className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            API access is available on <span className="font-medium text-foreground">Professional</span> and{" "}
            <span className="font-medium text-foreground">Enterprise</span> plans. Upgrade to integrate Floowy tools
            into your own app.
          </p>
        </div>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">
            Create an API key to call Floowy tools from your own app. Each generation uses prepaid credits — contact us
            to top up. Your key is shown only once, so store it securely.
          </p>

          {newKey && (
            <div className="rounded-lg border border-primary/40 bg-primary/5 p-3">
              <p className="mb-1 text-xs font-semibold text-primary">Your new API key (copy it now — shown once):</p>
              <div className="flex items-center gap-2">
                <code className="min-w-0 flex-1 truncate rounded bg-background px-2 py-1 text-xs">{newKey}</code>
                <Button size="sm" variant="outline" onClick={() => copy(newKey)}>
                  <Copy className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}

          {loading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading keys…
            </div>
          ) : keys.length > 0 ? (
            <div className="divide-y divide-border rounded-lg border border-border">
              {keys.map((k) => (
                <div key={k.id} className="flex items-center justify-between gap-3 p-3">
                  <div className="min-w-0">
                    <code className="text-xs text-foreground">{k.key_prefix}</code>
                    <p className="text-xs text-muted-foreground">
                      {k.status === "active" ? (
                        <>{k.credits_balance} credits · {k.allowed_tools.join(", ")}</>
                      ) : (
                        <span className="text-destructive">revoked</span>
                      )}
                    </p>
                  </div>
                  {k.status === "active" && (
                    <Button size="sm" variant="ghost" onClick={() => revoke(k.id)}>
                      <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No API keys yet.</p>
          )}

          <div className="flex items-center gap-3">
            <Button onClick={createKey} disabled={creating}>
              {creating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Key className="mr-2 h-4 w-4" />}
              Create API key
            </Button>
            <a href="/api-docs" className="text-sm text-primary hover:underline">View API docs →</a>
          </div>
        </>
      )}
    </div>
  );
};

export default ApiKeysSection;
