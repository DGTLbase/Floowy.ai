import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { FileText, Download, ExternalLink, Calendar, CreditCard, RefreshCw } from "lucide-react";

interface Invoice {
  id: string;
  number: string | null;
  status: string | null;
  amount: number;
  currency: string;
  created: number;
  dueDate: number | null;
  paidAt: number | null;
  invoicePdf: string | null;
  hostedInvoiceUrl: string | null;
  periodStart: number;
  periodEnd: number;
  description: string;
  isGenerated?: boolean;
}

// Plan pricing in cents (EUR)
const PLAN_PRICING: Record<string, { monthly: number; yearly: number; name: string }> = {
  starter: { monthly: 4900, yearly: 47000, name: "Starter Plan" },
  professional: { monthly: 11900, yearly: 109900, name: "Professional Plan" },
  enterprise: { monthly: 22900, yearly: 219400, name: "Enterprise Plan" },
};

// Generate placeholder invoices based on user's plan
const generatePlaceholderInvoices = (plan: string): Invoice[] => {
  const planConfig = PLAN_PRICING[plan.toLowerCase()];
  if (!planConfig) return [];

  const invoices: Invoice[] = [];
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  // Generate invoices for the past 6 months
  for (let i = 0; i < 6; i++) {
    const invoiceDate = new Date(currentYear, currentMonth - i, 1);
    const periodEnd = new Date(currentYear, currentMonth - i + 1, 0);
    
    invoices.push({
      id: `gen_${invoiceDate.getTime()}`,
      number: `INV-${invoiceDate.getFullYear()}${String(invoiceDate.getMonth() + 1).padStart(2, '0')}`,
      status: i === 0 ? "open" : "paid",
      amount: planConfig.monthly,
      currency: "eur",
      created: Math.floor(invoiceDate.getTime() / 1000),
      dueDate: Math.floor(new Date(invoiceDate.getFullYear(), invoiceDate.getMonth(), 15).getTime() / 1000),
      paidAt: i === 0 ? null : Math.floor(new Date(invoiceDate.getFullYear(), invoiceDate.getMonth(), 5).getTime() / 1000),
      invoicePdf: null,
      hostedInvoiceUrl: null,
      periodStart: Math.floor(invoiceDate.getTime() / 1000),
      periodEnd: Math.floor(periodEnd.getTime() / 1000),
      description: `${planConfig.name} - ${invoiceDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`,
      isGenerated: true,
    });
  }

  return invoices;
};

const BillingSection = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasCustomer, setHasCustomer] = useState(false);
  const [userPlan, setUserPlan] = useState<string>("free");
  const [selectedYear, setSelectedYear] = useState<string>("all");
  const [selectedMonth, setSelectedMonth] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const { toast } = useToast();

  const fetchUserPlan = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("plan")
          .eq("id", user.id)
          .single();
        
        if (profile?.plan) {
          setUserPlan(profile.plan);
        }
      }
    } catch (error) {
      console.error("Error fetching user plan:", error);
    }
  };

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("get-invoices");
      
      if (error) throw error;
      
      const invoiceData = data.invoices || [];
      const hasRealCustomer = data.hasCustomer;
      
      setHasCustomer(hasRealCustomer);
      
      // Only generate placeholder invoices if:
      // 1. User has a paid plan
      // 2. No Stripe customer exists OR customer exists but has no invoices/payments
      if (invoiceData.length === 0 && userPlan !== "free") {
        // Show placeholders only if there's no real billing history
        setInvoices(generatePlaceholderInvoices(userPlan));
      } else {
        // Use real invoices from Stripe
        setInvoices(invoiceData);
      }
    } catch (error: any) {
      console.error("Error fetching invoices:", error);
      
      console.error("Error fetching invoices:", error);
      toast({
        title: "Error",
        description: "Failed to load invoices. Please try again.",
        variant: "destructive",
      });
      
      // If fetch fails but user has a paid plan, show placeholder invoices as fallback
      if (userPlan !== "free") {
        setInvoices(generatePlaceholderInvoices(userPlan));
        setHasCustomer(true);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserPlan();
  }, []);

  useEffect(() => {
    if (userPlan) {
      fetchInvoices();
    }
  }, [userPlan]);

  // Get unique years from invoices
  const years = [...new Set(invoices.map(inv => 
    new Date(inv.created * 1000).getFullYear()
  ))].sort((a, b) => b - a);

  // Get unique months (only relevant when a year is selected)
  const months = selectedYear !== "all" 
    ? [...new Set(invoices
        .filter(inv => new Date(inv.created * 1000).getFullYear().toString() === selectedYear)
        .map(inv => new Date(inv.created * 1000).getMonth())
      )].sort((a, b) => b - a)
    : [];

  // Filter invoices based on selections
  const filteredInvoices = invoices.filter(inv => {
    const date = new Date(inv.created * 1000);
    const yearMatch = selectedYear === "all" || date.getFullYear().toString() === selectedYear;
    const monthMatch = selectedMonth === "all" || date.getMonth().toString() === selectedMonth;
    const statusMatch = selectedStatus === "all" || inv.status === selectedStatus;
    return yearMatch && monthMatch && statusMatch;
  });

  // Calculate totals
  const totalAmount = filteredInvoices.reduce((sum, inv) => sum + inv.amount, 0);
  const paidAmount = filteredInvoices
    .filter(inv => inv.status === "paid")
    .reduce((sum, inv) => sum + inv.amount, 0);
  const openAmount = filteredInvoices
    .filter(inv => inv.status === "open")
    .reduce((sum, inv) => sum + inv.amount, 0);

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat("en-EU", {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(amount / 100);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case "paid":
        return <Badge className="bg-primary/20 text-primary border-primary/30">Paid</Badge>;
      case "open":
        return <Badge className="bg-accent/20 text-accent-foreground border-accent/30">Open</Badge>;
      case "draft":
        return <Badge className="bg-muted text-muted-foreground border-border">Draft</Badge>;
      case "void":
        return <Badge className="bg-destructive/20 text-destructive border-destructive/30">Void</Badge>;
      case "uncollectible":
        return <Badge className="bg-destructive/20 text-destructive border-destructive/30">Uncollectible</Badge>;
      default:
        return <Badge variant="outline">{status || "Unknown"}</Badge>;
    }
  };

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const handleDownloadPdf = (pdfUrl: string | null, invoiceNumber: string | null, isGenerated?: boolean) => {
    if (isGenerated) {
      toast({
        title: "Sample Invoice",
        description: "This is a sample invoice based on your plan. Real invoices will be available from Stripe.",
      });
      return;
    }
    if (!pdfUrl) {
      toast({
        title: "PDF not available",
        description: "The PDF for this invoice is not available.",
        variant: "destructive",
      });
      return;
    }
    window.open(pdfUrl, "_blank");
  };

  if (loading) {
    return (
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <CreditCard className="w-5 h-5 text-primary" />
            Billing & Invoices
          </CardTitle>
          <CardDescription>View and download your invoices</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-10 w-full bg-muted" />
          <Skeleton className="h-32 w-full bg-muted" />
          <Skeleton className="h-32 w-full bg-muted" />
        </CardContent>
      </Card>
    );
  }

  if (!hasCustomer && userPlan === "free") {
    return (
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <CreditCard className="w-5 h-5 text-primary" />
            Billing & Invoices
          </CardTitle>
          <CardDescription>View and download your invoices</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
            <p className="text-foreground">No billing history yet.</p>
            <p className="text-sm mt-2">Invoices will appear here once you subscribe to a plan.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border bg-card">
      <CardHeader className="border-b border-border">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <CardTitle className="flex items-center gap-2 text-foreground text-base sm:text-lg">
              <CreditCard className="w-5 h-5 text-primary shrink-0" />
              <span className="truncate">Billing & Invoices</span>
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">View and download your invoices</CardDescription>
          </div>
          <Button variant="outline" size="icon" onClick={fetchInvoices} disabled={loading} className="border-border shrink-0 h-8 w-8">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        {/* Filters */}
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <Select value={selectedYear} onValueChange={(value) => {
              setSelectedYear(value);
              setSelectedMonth("all");
            }}>
              <SelectTrigger className="w-[120px] border-border bg-background">
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Years</SelectItem>
                {years.map(year => (
                  <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedYear !== "all" && months.length > 0 && (
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-[140px] border-border bg-background">
                <SelectValue placeholder="Month" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Months</SelectItem>
                {months.map(month => (
                  <SelectItem key={month} value={month.toString()}>{monthNames[month]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="w-[120px] border-border bg-background">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="void">Void</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4">
          <div className="bg-muted/50 border border-border rounded-lg p-2.5 sm:p-4">
            <p className="text-[10px] sm:text-sm text-muted-foreground">Total Invoices</p>
            <p className="text-lg sm:text-2xl font-bold text-foreground">{filteredInvoices.length}</p>
          </div>
          <div className="bg-primary/10 border border-primary/20 rounded-lg p-2.5 sm:p-4">
            <p className="text-[10px] sm:text-sm text-primary">Paid</p>
            <p className="text-sm sm:text-2xl font-bold text-primary truncate">
              {formatCurrency(paidAmount, invoices[0]?.currency || "eur")}
            </p>
          </div>
          <div className="bg-accent/10 border border-accent/20 rounded-lg p-2.5 sm:p-4">
            <p className="text-[10px] sm:text-sm text-accent-foreground">Open</p>
            <p className="text-sm sm:text-2xl font-bold text-accent-foreground truncate">
              {formatCurrency(openAmount, invoices[0]?.currency || "eur")}
            </p>
          </div>
        </div>

        {/* Generated Invoice Notice */}
        {invoices.some(inv => inv.isGenerated) && (
          <div className="bg-muted/30 border border-border rounded-lg p-3 text-sm text-muted-foreground">
            <span className="font-medium text-foreground">Note:</span> These are sample invoices based on your {userPlan.charAt(0).toUpperCase() + userPlan.slice(1)} plan. 
            Actual invoices from Stripe will replace these once available.
          </div>
        )}

        {/* Invoices Table */}
        {filteredInvoices.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
            <p>No invoices found for the selected filters.</p>
          </div>
        ) : (
          <>
            {/* Mobile card layout */}
            <div className="block sm:hidden space-y-3">
              {filteredInvoices.map((invoice) => (
                <div key={invoice.id} className="border border-border rounded-lg p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-foreground text-sm">
                      {invoice.number || invoice.id.slice(0, 8)}
                      {invoice.isGenerated && <span className="ml-1 text-xs text-muted-foreground">(Sample)</span>}
                    </span>
                    {getStatusBadge(invoice.status)}
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{formatDate(invoice.created)}</span>
                    <span className="font-medium text-foreground">{formatCurrency(invoice.amount, invoice.currency)}</span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{invoice.description}</p>
                  <div className="flex items-center gap-1 pt-1">
                    <Button variant="ghost" size="sm" onClick={() => handleDownloadPdf(invoice.invoicePdf, invoice.number, invoice.isGenerated)} className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground">
                      <Download className="w-3.5 h-3.5 mr-1" /> PDF
                    </Button>
                    {invoice.hostedInvoiceUrl && (
                      <Button variant="ghost" size="sm" onClick={() => window.open(invoice.hostedInvoiceUrl!, "_blank")} className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground">
                        <ExternalLink className="w-3.5 h-3.5 mr-1" /> View
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop table layout */}
            <div className="hidden sm:block border border-border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    <TableHead className="text-muted-foreground font-medium">Invoice</TableHead>
                    <TableHead className="text-muted-foreground font-medium">Date</TableHead>
                    <TableHead className="text-muted-foreground font-medium">Description</TableHead>
                    <TableHead className="text-muted-foreground font-medium">Status</TableHead>
                    <TableHead className="text-right text-muted-foreground font-medium">Amount</TableHead>
                    <TableHead className="text-right text-muted-foreground font-medium">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInvoices.map((invoice) => (
                    <TableRow key={invoice.id} className="border-border hover:bg-muted/30">
                      <TableCell className="font-medium text-foreground">
                        {invoice.number || invoice.id.slice(0, 8)}
                        {invoice.isGenerated && (
                          <span className="ml-2 text-xs text-muted-foreground">(Sample)</span>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{formatDate(invoice.created)}</TableCell>
                      <TableCell className="max-w-[200px] truncate text-muted-foreground">
                        {invoice.description}
                      </TableCell>
                      <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                      <TableCell className="text-right font-medium text-foreground">
                        {formatCurrency(invoice.amount, invoice.currency)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDownloadPdf(invoice.invoicePdf, invoice.number, invoice.isGenerated)}
                            title="Download PDF"
                            className="hover:bg-muted text-muted-foreground hover:text-foreground"
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                          {invoice.hostedInvoiceUrl && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => window.open(invoice.hostedInvoiceUrl!, "_blank")}
                              title="View Invoice"
                              className="hover:bg-muted text-muted-foreground hover:text-foreground"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default BillingSection;
