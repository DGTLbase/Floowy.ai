import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Search, Eye, RefreshCw, Loader2, Mail, Clock, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";

interface SentEmail {
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

export function AdminSentBox() {
  const [emails, setEmails] = useState<SentEmail[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [previewEmail, setPreviewEmail] = useState<SentEmail | null>(null);

  const fetchEmails = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("scheduled_emails")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;
      setEmails((data || []).map((e: any) => ({
        ...e,
        recipient_emails: Array.isArray(e.recipient_emails) ? e.recipient_emails : [],
      })));
    } catch (err) {
      console.error("Failed to fetch sent emails:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmails();
  }, []);

  const filtered = searchTerm
    ? emails.filter(e =>
        e.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.recipient_emails.some(r => r.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    : emails;

  const statusIcon = (status: string) => {
    switch (status) {
      case "sent": return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case "pending": return <Clock className="w-4 h-4 text-yellow-500" />;
      case "sending": return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
      default: return <XCircle className="w-4 h-4 text-red-500" />;
    }
  };

  const statusBadge = (status: string) => {
    const variants: Record<string, string> = {
      sent: "bg-green-100 text-green-700 border-green-200",
      pending: "bg-yellow-100 text-yellow-700 border-yellow-200",
      sending: "bg-blue-100 text-blue-700 border-blue-200",
      failed: "bg-red-100 text-red-700 border-red-200",
    };
    return variants[status] || "bg-muted text-muted-foreground";
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Mail className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold">Sent Emails</h3>
          <Badge variant="secondary" className="text-xs">{emails.length}</Badge>
        </div>
        <Button variant="outline" size="sm" onClick={fetchEmails} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          placeholder="Search by subject or recipient..."
          className="pl-9"
        />
      </div>

      {/* Email List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Mail className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">{searchTerm ? "No emails match your search" : "No emails sent yet"}</p>
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
                      {statusIcon(email.status)}
                      <span className="font-medium text-sm truncate">{email.subject}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{email.recipient_emails.length} recipient{email.recipient_emails.length !== 1 ? 's' : ''}</span>
                      <span>•</span>
                      <span>{format(new Date(email.created_at), "MMM d, yyyy HH:mm")}</span>
                    </div>
                    {email.error_message && (
                      <div className="flex items-center gap-1 mt-1.5 text-xs text-red-600">
                        <AlertCircle className="w-3 h-3" />
                        <span className="truncate">{email.error_message}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge className={`text-xs border ${statusBadge(email.status)}`}>
                      {email.status}
                    </Badge>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={e => { e.stopPropagation(); setPreviewEmail(email); }}>
                      <Eye className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      )}

      {/* Preview Dialog */}
      <Dialog open={!!previewEmail} onOpenChange={open => !open && setPreviewEmail(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {previewEmail && statusIcon(previewEmail.status)}
              {previewEmail?.subject}
            </DialogTitle>
          </DialogHeader>
          {previewEmail && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Status:</span>{" "}
                  <Badge className={`text-xs border ${statusBadge(previewEmail.status)}`}>{previewEmail.status}</Badge>
                </div>
                <div>
                  <span className="text-muted-foreground">Created:</span>{" "}
                  {format(new Date(previewEmail.created_at), "MMM d, yyyy HH:mm")}
                </div>
                {previewEmail.sent_at && (
                  <div>
                    <span className="text-muted-foreground">Sent:</span>{" "}
                    {format(new Date(previewEmail.sent_at), "MMM d, yyyy HH:mm")}
                  </div>
                )}
                <div>
                  <span className="text-muted-foreground">Scheduled:</span>{" "}
                  {format(new Date(previewEmail.scheduled_at), "MMM d, yyyy HH:mm")}
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

              {previewEmail.error_message && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                  <strong>Error:</strong> {previewEmail.error_message}
                </div>
              )}

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
