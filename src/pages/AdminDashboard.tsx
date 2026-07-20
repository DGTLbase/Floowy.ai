import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { AdminLayout } from "@/components/AdminLayout";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, TrendingUp, TrendingDown, Users, DollarSign, ArrowUpRight } from "lucide-react";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie,
} from "recharts";

const PLAN_COLORS: Record<string, string> = {
  starter: '#C5E26B',
  professional: '#A8D44A',
  enterprise: '#1B3D2F',
  credits: '#2D5E3F',
};

const formatCurrency = (num: number | undefined | null): string => {
  if (num == null || isNaN(num)) return '€0';
  if (num >= 1000000) return `€${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `€${(num / 1000).toFixed(1)}k`;
  return `€${num.toFixed(0)}`;
};

const formatNumber = (num: number | undefined | null): string => {
  if (num == null || isNaN(num)) return '0';
  return num.toLocaleString();
};

const AdminDashboard = () => {
  const [timeframe, setTimeframe] = useState<"monthly" | "yearly">("monthly");
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => { checkAdminAuth(); }, []);
  useEffect(() => { fetchAnalytics(); }, [timeframe]);

  const checkAdminAuth = async () => {
    const adminToken = localStorage.getItem('admin_token');
    if (!adminToken) { navigate("/admin/login"); return; }
    try {
      const { data, error } = await supabase.functions.invoke('admin-auth', {
        body: { action: 'verify', token: adminToken },
      });
      if (error || !data || data.error) { localStorage.removeItem('admin_token'); navigate("/admin/login"); return; }
      fetchAnalytics();
    } catch { localStorage.removeItem('admin_token'); navigate("/admin/login"); }
  };

  const fetchAnalytics = async () => {
    setLoading(true);
    const adminToken = localStorage.getItem('admin_token');
    if (!adminToken) { navigate("/admin/login"); return; }
    // Never let the dashboard hang forever if the endpoint is slow.
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25000);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-get-analytics`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            'admin-token': adminToken,
          },
          body: JSON.stringify({ timeframe }),
          signal: controller.signal,
        }
      );
      // Expired/invalid admin session → send to login instead of a stuck/empty page.
      if (response.status === 401) {
        localStorage.removeItem('admin_token');
        navigate("/admin/login");
        return;
      }
      if (!response.ok) throw new Error('Failed to fetch analytics');
      const data = await response.json();
      if (data.analytics) setAnalytics(data.analytics);
    } catch {
      toast({ title: "Error", description: "Failed to load analytics data", variant: "destructive" });
    } finally {
      clearTimeout(timeout);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="px-6 py-8 space-y-6 max-w-[1400px] mx-auto">
          <div className="flex justify-between items-center">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-9 w-44" />
          </div>
          <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="border-border/40">
                <CardContent className="p-5">
                  <Skeleton className="h-4 w-20 mb-3" />
                  <Skeleton className="h-8 w-24" />
                </CardContent>
              </Card>
            ))}
          </div>
          <Card className="border-border/40">
            <CardContent className="p-6">
              <div className="flex items-center justify-center h-[320px]">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    );
  }

  if (!analytics) {
    return (
      <AdminLayout>
        <div className="px-6 py-8 max-w-[1400px] mx-auto">
          <div className="flex items-center justify-center min-h-[400px] text-muted-foreground">No analytics data available</div>
        </div>
      </AdminLayout>
    );
  }

  const currentYear = new Date().getFullYear();
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const chartData = monthNames.map((name, index) => {
    const monthKey = `${currentYear}-${String(index + 1).padStart(2, '0')}`;
    const dataPoint = analytics.salesData?.find((d: any) => d.period === monthKey);
    return {
      name,
      starter: dataPoint?.starter || 0,
      professional: dataPoint?.professional || 0,
      enterprise: dataPoint?.enterprise || 0,
      credits: dataPoint?.credits || 0,
      total: dataPoint?.amount || 0,
    };
  });

  const revenueByPlan = analytics.revenueByPlan || [];
  const totalRevenue = revenueByPlan.reduce((sum: number, p: any) => sum + p.revenue, 0);

  const pieData = revenueByPlan.map((p: any) => ({
    name: p.plan,
    value: Math.round(p.revenue * 100) / 100,
    color: PLAN_COLORS[p.plan] || '#888',
  }));

  const stats = [
    { label: 'Total Revenue', value: formatCurrency(analytics.totalSales), icon: DollarSign, cardBg: 'bg-[#040404]', textColor: 'text-white', iconColor: 'text-white/70' },
    { label: 'New Subscriptions', value: formatNumber(analytics.newSubscriptions), icon: TrendingUp, cardBg: 'bg-[#c8f46a]', textColor: 'text-[#040404]', iconColor: 'text-[#040404]/60' },
    { label: 'Active Subscriptions', value: formatNumber(analytics.activeSubscriptions), icon: Users, cardBg: 'bg-[#1d3934]', textColor: 'text-white', iconColor: 'text-white/70' },
    { label: 'Cancelled', value: formatNumber(analytics.cancelledSubscriptions), icon: TrendingDown, cardBg: 'bg-[#f5f5f5]', textColor: 'text-[#040404]', iconColor: 'text-[#040404]/60' },
  ];

  const tooltipStyle = {
    contentStyle: {
      backgroundColor: 'hsl(var(--card))',
      border: '1px solid hsl(var(--border))',
      borderRadius: '8px',
      fontSize: '12px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    },
    labelStyle: { color: 'hsl(var(--foreground))', fontWeight: 600, marginBottom: 4 },
  };

  return (
    <AdminLayout>
      <div className="px-6 py-8 space-y-6 max-w-[1400px] mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Analytics</h1>
            <p className="text-sm text-muted-foreground mt-1">Overview of your business metrics</p>
          </div>
          <Tabs value={timeframe} onValueChange={(v) => setTimeframe(v as any)}>
            <TabsList className="h-9">
              <TabsTrigger value="monthly" className="text-xs px-3">Monthly</TabsTrigger>
              <TabsTrigger value="yearly" className="text-xs px-3">Yearly</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <Card key={stat.label} className={`${stat.cardBg} border-0 shadow-lg hover:shadow-xl transition-all`}>
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className={`text-xs font-medium uppercase tracking-wider ${stat.iconColor}`}>{stat.label}</span>
                  <div className={`p-1.5 rounded-md ${stat.iconColor} bg-white/10`}>
                    <stat.icon className={`h-3.5 w-3.5 ${stat.iconColor}`} />
                  </div>
                </div>
                <div className={`text-2xl font-bold tracking-tight ${stat.textColor}`}>{stat.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Revenue Chart - Stacked Bar */}
        <Card className="border-border/40 bg-card/60 backdrop-blur-xl shadow-lg">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold">Sales Overview</CardTitle>
                <p className="text-xs text-muted-foreground mt-1">Monthly sales by plan type</p>
              </div>
              <div className="flex items-center gap-4">
                {Object.entries(PLAN_COLORS).map(([plan, color]) => (
                  <div key={plan} className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: color }} />
                    <span className="text-[11px] text-muted-foreground capitalize">{plan}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            <ResponsiveContainer width="100%" height={360}>
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }} barCategoryGap="15%" barGap={4}>
                <defs>
                  <pattern id="stripe-light" patternUnits="userSpaceOnUse" width="6" height="6" patternTransform="rotate(45)">
                    <rect width="6" height="6" fill={PLAN_COLORS.starter} />
                    <line x1="0" y1="0" x2="0" y2="6" stroke="rgba(255,255,255,0.35)" strokeWidth="2.5" />
                  </pattern>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.2} vertical={false} />
                <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={(v: number) => `€${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`} width={50} />
                <Tooltip
                  cursor={{ fill: 'hsl(var(--muted))', opacity: 0.15 }}
                  {...tooltipStyle}
                  formatter={(value: number, name: string) => [`€${value.toFixed(0)}`, name.charAt(0).toUpperCase() + name.slice(1)]}
                />
                <Bar dataKey="starter" stackId="light" fill="url(#stripe-light)" radius={[0, 0, 0, 0]} />
                <Bar dataKey="professional" stackId="light" fill="url(#stripe-light)" radius={[10, 10, 0, 0]} />
                <Bar dataKey="enterprise" stackId="dark" fill={PLAN_COLORS.enterprise} radius={[0, 0, 0, 0]} />
                <Bar dataKey="credits" stackId="dark" fill={PLAN_COLORS.credits} radius={[10, 10, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Bottom Grid */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Revenue by Plan - Donut Chart */}
          <Card className="border-border/40 bg-card/60 backdrop-blur-xl shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Revenue by Plan</CardTitle>
              <p className="text-xs text-muted-foreground">Distribution across tiers</p>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center">
                <div className="w-full relative">
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={70}
                        outerRadius={110}
                        paddingAngle={3}
                        dataKey="value"
                        stroke="none"
                      >
                        {pieData.map((entry: any, index: number) => (
                          <Cell key={index} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        {...tooltipStyle}
                        formatter={(value: number, name: string) => [`€${value.toFixed(0)}`, name.charAt(0).toUpperCase() + name.slice(1)]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Total</span>
                    <span className="text-xl font-bold">{formatCurrency(totalRevenue)}</span>
                  </div>
                </div>
                <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 mt-4">
                  {pieData.map((entry: any) => {
                    const percentage = totalRevenue > 0 ? (entry.value / totalRevenue) * 100 : 0;
                    return (
                      <div key={entry.name} className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: entry.color }} />
                        <span className="text-sm font-medium capitalize">{entry.name}</span>
                        <span className="text-sm font-semibold tabular-nums">{formatCurrency(entry.value)}</span>
                        <span className="text-[10px] text-muted-foreground">{percentage.toFixed(0)}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Top Customers */}
          <Card className="border-border/40 bg-card/60 backdrop-blur-xl shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Top Customers</CardTitle>
              <p className="text-xs text-muted-foreground">All-time highest revenue contributors</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {analytics.topCustomers?.map((customer: any, index: number) => (
                  <div
                    key={customer.email}
                    className={`flex items-center justify-between py-3 px-4 rounded-xl transition-all group ${
                      index === 0 ? 'bg-[#040404] text-white' :
                      index === 1 ? 'bg-[#c8f46a] text-[#040404]' :
                      index === 2 ? 'bg-[#1d3934] text-white' :
                      index === 3 ? 'bg-[#f5f5f5] text-[#040404]' :
                      'bg-muted/30 text-foreground'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`
                        w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0
                        ${index === 0 ? 'bg-white/20 text-white' :
                          index === 1 ? 'bg-[#040404]/15 text-[#040404]' :
                          index === 2 ? 'bg-white/20 text-white' :
                          index === 3 ? 'bg-[#040404]/10 text-[#040404]' :
                          'bg-muted text-muted-foreground'}
                      `}>
                        {index + 1}
                      </div>
                      <span className="text-sm truncate">{customer.email}</span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-sm font-semibold tabular-nums">
                        €{customer.totalSpent?.toLocaleString() || '0'}
                      </span>
                      <ArrowUpRight className={`h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity ${
                        index === 0 || index === 2 ? 'text-white/60' : 'text-[#040404]/40'
                      }`} />
                    </div>
                  </div>
                ))}
                {(!analytics.topCustomers || analytics.topCustomers.length === 0) && (
                  <div className="text-sm text-muted-foreground text-center py-8">No customer data available</div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
