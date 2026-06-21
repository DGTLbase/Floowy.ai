import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Eye, RefreshCw, Loader2, Clock, Trash2, AlertCircle, CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

interface ScheduledEmail {
  id: string;
  subject: string;
  recipient_emails: string[];
  status: string;
  scheduled_at: string;
  sent_at: string | null;
  created_at: string;
  error_message: string | null;
  html_content: string;
}

export function AdminScheduledEmails() {
  const { toast } = useToast();
  const [emails, setEmails] = useState<ScheduledEmail[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [previewEmail, setPreviewEmail] = useState<ScheduledEmail | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchEmails = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("scheduled_emails")
        .select("*")
        .eq("status", "pending")
        .order("scheduled_at", { ascending: true })
        .limit(100);

      if (error) throw error;
      setEmails((data || []).map((e: any) => ({
        ...e,
        recipient_emails: Array.isArray(e.recipient_emails) ? e.recipient_emails : [],
      })));
    } catch (err) {
      console.error("Failed to fetch scheduled emails:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmails();
  }, []);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const { error } = await supabase
        .from("scheduled_emails")
        .delete()
        .eq("id", id)
        .eq("status", "pending");

      if (error) throw error;
      setEmails(prev => prev.filter(e => e.id !== id));
      toast({ title: "Scheduled email cancelled" });
    } catch (err: any) {
      toast({ title: "Failed to cancel", description: err.message, variant: "destructive" });
    } finally {
      setDeletingId(null);
    }
  };

  const filtered = searchTerm
    ? emails.filter(e =>
        e.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.recipient_emails.some(r => r.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    : emails;

  const timeUntil = (dateStr: string) => {
    const diff = new Date(dateStr).getTime() - Date.now();
    if (diff <= 0) return "Due now";
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 24) return `in ${Math.floor(hours / 24)}d ${hours % 24}h`;
    if (hours > 0) return `in ${hours}h ${mins}m`;
    return `in ${mins}m`;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold">Scheduled Emails</h3>
          <Badge variant="secondary" className="text-xs">{emails.length}</Badge>
        </div>
        <Button variant="outline" size="sm" onClick={fetchEmails} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          placeholder="Search by subject or recipient..."
          className="pl-9"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <CalendarIcon className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">{searchTerm ? "No scheduled emails match your search" : "No emails scheduled"}</p>
        </div>
      ) : (
        <ScrollArea className="h-[500px]">
          <div className="space-y-2">
            {filtered.map(email => (
              <div
                key={email.id}
                className="border rounded-lg p-4 hover:bg-muted/30 transition-colors cursor-pointer"
                onClick={() => setPreviewEmail(email)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Clock className="w-4 h-4 text-amber-500" />
                      <span className="font-medium text-sm truncate">{email.subject}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{email.recipient_emails.length} recipient{email.recipient_emails.length !== 1 ? 's' : ''}</span>
                      <span>•</span>
                      <span>Sends {timeUntil(email.scheduled_at)}</span>
                      <span>•</span>
                      <span>{format(new Date(email.scheduled_at), "MMM d, yyyy HH:mm")}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Badge className="text-xs border bg-amber-100 text-amber-700 border-amber-200">scheduled</Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={e => { e.stopPropagation(); setPreviewEmail(email); }}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      disabled={deletingId === email.id}
                      onClick={e => { e.stopPropagation(); handleDelete(email.id); }}
                    >
                      {deletingId === email.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      )}

      <Dialog open={!!previewEmail} onOpenChange={open => !open && setPreviewEmail(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500" />
              {previewEmail?.subject}
            </DialogTitle>
          </DialogHeader>
          {previewEmail && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Scheduled for:</span>{" "}
                  {format(new Date(previewEmail.scheduled_at), "MMM d, yyyy HH:mm")}
                </div>
                <div>
                  <span className="text-muted-foreground">Sends:</span> <span className="font-medium">{timeUntil(previewEmail.scheduled_at)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Created:</span>{" "}
                  {format(new Date(previewEmail.created_at), "MMM d, yyyy HH:mm")}
                </div>
              </div>

              <div>
                <span className="text-sm text-muted-foreground block mb-1">
                  Recipients ({previewEmail.recipient_emails.length})
                </span>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                  {previewEmail.recipient_emails.map((email, i) => (
                    <Badge key={i} variant="secondary" className="text-xs">{email}</Badge>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={deletingId === previewEmail.id}
                  onClick={() => { handleDelete(previewEmail.id); setPreviewEmail(null); }}
                >
                  <Trash2 className="w-4 h-4 mr-1.5" />
                  Cancel Email
                </Button>
              </div>

              <div className="border rounded-lg overflow-hidden">
                <iframe srcDoc={previewEmail.html_content} className="w-full h-[400px] border-0" title="Email Preview" />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
