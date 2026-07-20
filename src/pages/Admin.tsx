import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, Search, UserPlus, Trash2, User, Edit, Users, Wand2, Shield, Settings, X, Shirt, Video, Lightbulb, Package, Loader2, LayoutGrid, UserCircle, Film, History, ArrowUp, ArrowDown, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import logoImage from "@/assets/floowy-logo.png";
import { AdminLayout } from "@/components/AdminLayout";
import { AdminEmailPanel } from "@/components/AdminEmailPanel";
import { AdminKBVideosPanel } from "@/components/AdminKBVideosPanel";
import { AdminCommunityPanel } from "@/components/AdminCommunityPanel";
import { AdminGalleryPanel } from "@/components/AdminGalleryPanel";
import { AdminModelsPanel } from "@/components/AdminModelsPanel";
import { AdminFlatlayStylesPanel } from "@/components/AdminFlatlayStylesPanel";
import { AdminUserApiKeys } from "@/components/AdminUserApiKeys";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

const Admin = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [tools, setTools] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [userSubTab, setUserSubTab] = useState<"all" | "active" | "cancelled">("all");
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [creditAmount, setCreditAmount] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [admin, setAdmin] = useState<any>(null);
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserName, setNewUserName] = useState("");
  const [editFullName, setEditFullName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [activeTab, setActiveTab] = useState<"users" | "tools" | "team" | "email" | "kb-videos" | "community" | "gallery" | "models" | "flatlay-styles">("users");
  const [adminAccounts, setAdminAccounts] = useState<any[]>([]);
  const [userModalTab, setUserModalTab] = useState("account");
  const [userGenerations, setUserGenerations] = useState<any[]>([]);
  const [selectedGeneration, setSelectedGeneration] = useState<any>(null);
  const [generationPreviewOpen, setGenerationPreviewOpen] = useState(false);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [showAddAdmin, setShowAddAdmin] = useState(false);
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [newAdminName, setNewAdminName] = useState("");
  const [deleteAdminId, setDeleteAdminId] = useState<string | null>(null);
  const [isCreatingAdmin, setIsCreatingAdmin] = useState(false);
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [isDeletingAdmin, setIsDeletingAdmin] = useState(false);
  const [isUpdatingSettings, setIsUpdatingSettings] = useState(false);
  const [isUpdatingToolAccess, setIsUpdatingToolAccess] = useState<string | null>(null);
  const [isUpdatingUserDetails, setIsUpdatingUserDetails] = useState(false);
  const [isAddingCredits, setIsAddingCredits] = useState(false);
  const [isDeductingCredits, setIsDeductingCredits] = useState(false);
  const [deductAmount, setDeductAmount] = useState("");
  const [isChangingPlan, setIsChangingPlan] = useState(false);
  const [isLoadingGenerations, setIsLoadingGenerations] = useState(false);
  const [isLoadingTools, setIsLoadingTools] = useState(false);
  const [creditHistory, setCreditHistory] = useState<any[]>([]);
  const [isLoadingCreditHistory, setIsLoadingCreditHistory] = useState(false);
  const [userInvoices, setUserInvoices] = useState<any[]>([]);
  const [isLoadingInvoices, setIsLoadingInvoices] = useState(false);
  const usersPerPage = 20;
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkAdminAuth();
  }, []);

  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (tab === 'users' || tab === 'tools' || tab === 'team' || tab === 'email' || tab === 'kb-videos' || tab === 'community' || tab === 'gallery' || tab === 'models' || tab === 'flatlay-styles') {
      setActiveTab(tab as any);
    } else if (!tab) {
      // Redirect to dashboard if no tab is specified
      navigate("/admin/dashboard", { replace: true });
    }
  }, [location.search, navigate]);

  const checkAdminAuth = async () => {
    const adminToken = localStorage.getItem('admin_token');
    
    if (!adminToken) {
      navigate("/admin/login");
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('admin-auth', {
        body: { action: 'verify', token: adminToken },
      });

      if (error || !data || data.error) {
        // Session expired - silently redirect to login
        localStorage.removeItem('admin_token');
        navigate("/admin/login");
        return;
      }

      setAdmin(data.admin);
      setAdminEmail(data.admin.email);
      setIsAuthenticated(true);
      fetchUsers();
      fetchTools();
      fetchAdminAccounts();
    } catch (error) {
      // Session expired or network error - silently redirect
      localStorage.removeItem('admin_token');
      navigate("/admin/login");
    }
  };

  const handleLogout = async () => {
    const adminToken = localStorage.getItem('admin_token');
    
    if (adminToken) {
      try {
        await supabase.functions.invoke('admin-auth', {
          body: { action: 'logout', token: adminToken },
        });
      } catch (error) {
        // Silently handle logout errors
        console.error('Logout error:', error);
      }
    }

    localStorage.removeItem('admin_token');
    navigate("/admin/login");
  };

  const handleUpdateAdminSettings = async () => {
    if (!adminEmail.trim()) {
      toast({
        title: "Validation Error",
        description: "Email is required",
        variant: "destructive",
      });
      return;
    }

    const adminToken = localStorage.getItem('admin_token');
    
    if (!adminToken) {
      toast({
        title: "Error",
        description: "Admin session not found",
        variant: "destructive",
      });
      return;
    }

    setIsUpdatingSettings(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-update-settings`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            'admin-token': adminToken,
          },
          body: JSON.stringify({
            email: adminEmail.trim(),
            password: adminPassword.trim() || undefined,
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error('Failed to update settings');
      }

      toast({
        title: "Success",
        description: "Settings updated successfully",
      });
      
      setAdminPassword("");
      setSettingsOpen(false);
      
      // Update admin state
      setAdmin({ ...admin, email: adminEmail.trim() });
    } catch (error) {
      console.error('Error updating settings:', error);
      toast({
        title: "Error",
        description: "Failed to update settings",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingSettings(false);
    }
  };

  const fetchTools = async () => {
    setIsLoadingTools(true);
    try {
      const { data, error } = await supabase
        .from("tools")
        .select("*")
        .eq("is_active", true)
        .order("name", { ascending: true });
      
      if (data) {
        setTools(data);
      }
    } finally {
      setIsLoadingTools(false);
    }
  };

  const fetchUsers = async () => {
    console.log('fetchUsers called');
    setIsLoadingUsers(true);
    const adminToken = localStorage.getItem('admin_token');
    
    if (!adminToken) {
      console.error('No admin token found');
      toast({
        title: "Error",
        description: "Admin session not found",
        variant: "destructive",
      });
      setIsLoadingUsers(false);
      return;
    }
    
    try {
      console.log('Calling admin-get-users function...');
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-get-users`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            'admin-token': adminToken,
          },
        }
      );

      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error(`Failed to fetch users: ${response.status}`);
      }

      const data = await response.json();
      console.log('Users data:', data);

      if (data && data.users) {
        console.log('Setting users:', data.users.length);
        setUsers(data.users);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Error",
        description: "Failed to load users",
        variant: "destructive",
      });
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const fetchAdminAccounts = async () => {
    const adminToken = localStorage.getItem('admin_token');
    
    if (!adminToken) {
      console.error('No admin token found');
      return;
    }

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-get-accounts`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            'admin-token': adminToken,
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error(`Failed to fetch admin accounts: ${response.status}`);
      }

      const data = await response.json();
      console.log('Admin accounts data:', data);

      if (data && data.accounts) {
        setAdminAccounts(data.accounts);
      }
    } catch (error) {
      console.error('Error fetching admin accounts:', error);
      toast({
        title: "Error",
        description: "Failed to load admin accounts",
        variant: "destructive",
      });
    }
  };

  const handleAddAdmin = async () => {
    if (!newAdminEmail || !newAdminEmail.trim()) {
      toast({
        title: "Missing information",
        description: "Email is required",
        variant: "destructive",
      });
      return;
    }

    const adminToken = localStorage.getItem('admin_token');
    
    if (!adminToken) {
      toast({
        title: "Error",
        description: "Admin session not found",
        variant: "destructive",
      });
      return;
    }

    setIsCreatingAdmin(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-create-account`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            'admin-token': adminToken,
          },
          body: JSON.stringify({
            email: newAdminEmail.trim(),
            fullName: newAdminName.trim() || null,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create admin account');
      }

      const data = await response.json();
      
      toast({
        title: "Success",
        description: `Admin account created for ${newAdminEmail}. Temporary password sent via email.`,
      });
      
      setNewAdminEmail("");
      setNewAdminName("");
      setShowAddAdmin(false);
      fetchAdminAccounts();
    } catch (error) {
      console.error('Error creating admin:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create admin account",
        variant: "destructive",
      });
    } finally {
      setIsCreatingAdmin(false);
    }
  };

  const handleDeleteAdmin = async (adminId: string) => {
    const adminToken = localStorage.getItem('admin_token');
    
    if (!adminToken) {
      toast({
        title: "Error",
        description: "Admin session not found",
        variant: "destructive",
      });
      return;
    }

    setIsDeletingAdmin(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-delete-account`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            'admin-token': adminToken,
          },
          body: JSON.stringify({
            adminId: adminId,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete admin account');
      }

      toast({
        title: "Success",
        description: "Admin account deleted successfully",
      });
      
      setDeleteAdminId(null);
      fetchAdminAccounts();
    } catch (error) {
      console.error('Error deleting admin:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete admin account",
        variant: "destructive",
      });
    } finally {
      setIsDeletingAdmin(false);
    }
  };

  const handleOpenEditDialog = async (user: any) => {
    setSelectedUser(user);
    setEditFullName(user.full_name || "");
    setEditEmail(user.email || "");
    setCreditAmount("");
    setUserModalTab("account");
    setEditDialogOpen(true);
    setUserGenerations([]);
    setIsLoadingGenerations(false);
  };

  const fetchUserGenerations = async (userId: string) => {
    const adminToken = localStorage.getItem('admin_token');
    
    if (!adminToken) {
      console.error('No admin token found');
      return;
    }

    setIsLoadingGenerations(true);
    console.log('Fetching generations for user:', userId);
    
    try {
      const { data, error } = await supabase.functions.invoke('admin-get-user-generations', {
        body: { userId, limit: 100 },
        headers: {
          'admin-token': adminToken,
        },
      });

      console.log('Generations response:', { data, error });

      if (error) {
        console.error('Error invoking function:', error);
        setUserGenerations([]);
        return;
      }

      if (data?.error) {
        console.error('Function returned error:', data.error);
        setUserGenerations([]);
        return;
      }

      if (data?.generations) {
        console.log('Setting generations:', data.generations);
        setUserGenerations(data.generations);
      } else {
        console.log('No generations in response');
        setUserGenerations([]);
      }
    } catch (error) {
      console.error('Exception fetching user generations:', error);
      setUserGenerations([]);
    } finally {
      setIsLoadingGenerations(false);
    }
  };

  const fetchCreditHistory = async (userId: string) => {
    const adminToken = localStorage.getItem('admin_token');
    if (!adminToken) return;

    setIsLoadingCreditHistory(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-get-credit-history`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            'admin-token': adminToken,
          },
          body: JSON.stringify({ userId, limit: 50 }),
        }
      );
      if (response.ok) {
        const data = await response.json();
        setCreditHistory(data.history || []);
      }
    } catch (error) {
      console.error('Error fetching credit history:', error);
    } finally {
      setIsLoadingCreditHistory(false);
    }
  };

  const fetchUserInvoices = async (email: string) => {
    const adminToken = localStorage.getItem('admin_token');
    if (!adminToken || !email) return;

    setIsLoadingInvoices(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-get-invoices`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            'admin-token': adminToken,
          },
          body: JSON.stringify({ email }),
        }
      );
      if (response.ok) {
        const data = await response.json();
        setUserInvoices(data.invoices || []);
      }
    } catch (error) {
      console.error('Error fetching invoices:', error);
    } finally {
      setIsLoadingInvoices(false);
    }
  };

  const handleGenerationClick = (generation: any) => {
    setSelectedGeneration(generation);
    setGenerationPreviewOpen(true);
  };

  const isVideoUrl = (url: string) => {
    return url?.includes('.mp4') || url?.includes('.webm') || url?.includes('.mov');
  };

  const handleUpdateUserDetails = async () => {
    if (!selectedUser) return;

    const adminToken = localStorage.getItem('admin_token');
    
    if (!adminToken) {
      toast({
        title: "Error",
        description: "Admin session not found",
        variant: "destructive",
      });
      return;
    }

    setIsUpdatingUserDetails(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-update-user`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            'admin-token': adminToken,
          },
          body: JSON.stringify({
            userId: selectedUser.id,
            updates: {
              full_name: editFullName.trim(),
              email: editEmail.trim(),
            },
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error('Failed to update user');
      }

      toast({
        title: "Success",
        description: "User details updated successfully",
      });
      
      // Refresh the user list
      await fetchUsers();
      
      // Update selected user state
      setSelectedUser({
        ...selectedUser,
        full_name: editFullName.trim(),
        email: editEmail.trim(),
      });
    } catch (error) {
      console.error('Error updating user:', error);
      toast({
        title: "Error",
        description: "Failed to update user details",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingUserDetails(false);
    }
  };

  const handleAddCredits = async () => {
    if (!selectedUser || !creditAmount) return;

    const amount = parseInt(creditAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid credit amount",
        variant: "destructive",
      });
      return;
    }

    const adminToken = localStorage.getItem('admin_token');
    
    if (!adminToken) {
      toast({
        title: "Error",
        description: "Admin session not found",
        variant: "destructive",
      });
      return;
    }

    setIsAddingCredits(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-add-credits`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            'admin-token': adminToken,
          },
          body: JSON.stringify({
            userId: selectedUser.id,
            amount,
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error('Failed to add credits');
      }

      const data = await response.json();
      
      toast({
        title: "Success",
        description: `Added ${amount} credits to ${selectedUser.email}`,
      });
      
      setCreditAmount("");
      
      // Refresh the user list
      await fetchUsers();
      
      // Update selected user state with new balance
      setSelectedUser({ ...selectedUser, credits: data.newBalance });
    } catch (error) {
      console.error('Error adding credits:', error);
      toast({
        title: "Error",
        description: "Failed to add credits",
        variant: "destructive",
      });
    } finally {
      setIsAddingCredits(false);
    }
  };

  const handleDeductCredits = async () => {
    if (!selectedUser || !deductAmount) return;

    const amount = parseInt(deductAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid credit amount",
        variant: "destructive",
      });
      return;
    }

    const adminToken = localStorage.getItem('admin_token');
    if (!adminToken) {
      toast({ title: "Error", description: "Admin session not found", variant: "destructive" });
      return;
    }

    setIsDeductingCredits(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-add-credits`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            'admin-token': adminToken,
          },
          body: JSON.stringify({ userId: selectedUser.id, amount, mode: 'deduct' }),
        }
      );

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to deduct credits');
      }

      const data = await response.json();
      toast({ title: "Success", description: `Deducted ${amount} credits from ${selectedUser.email}` });
      setDeductAmount("");
      await fetchUsers();
      setSelectedUser({ ...selectedUser, credits: data.newBalance });
    } catch (error: any) {
      console.error('Error deducting credits:', error);
      toast({ title: "Error", description: error.message || "Failed to deduct credits", variant: "destructive" });
    } finally {
      setIsDeductingCredits(false);
    }
  };

  const handleAddUser = async () => {
    if (!newUserEmail || !newUserPassword) {
      toast({
        title: "Missing information",
        description: "Email and password are required",
        variant: "destructive",
      });
      return;
    }

    const adminToken = localStorage.getItem('admin_token');
    
    if (!adminToken) {
      toast({
        title: "Error",
        description: "Admin session not found",
        variant: "destructive",
      });
      return;
    }

    setIsCreatingUser(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-create-user`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            'admin-token': adminToken,
          },
          body: JSON.stringify({
            email: newUserEmail,
            password: newUserPassword,
            fullName: newUserName,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create user');
      }

      toast({
        title: "Success",
        description: `User ${newUserEmail} created successfully`,
      });
      
      setNewUserEmail("");
      setNewUserPassword("");
      setNewUserName("");
      setShowAddUser(false);
      setTimeout(fetchUsers, 1000);
    } catch (error) {
      console.error('Error creating user:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create user",
        variant: "destructive",
      });
    } finally {
      setIsCreatingUser(false);
    }
  };

  const handleToolAccessToggle = async (userId: string, toolName: string, currentAccess: boolean) => {
    const adminToken = localStorage.getItem('admin_token');
    
    if (!adminToken) {
      toast({
        title: "Error",
        description: "Admin session not found",
        variant: "destructive",
      });
      return;
    }

    setIsUpdatingToolAccess(toolName);

    try {
      const { data, error } = await supabase.functions.invoke('admin-update-tool-access', {
        headers: {
          'admin-token': adminToken,
        },
        body: {
          userId,
          toolName,
          hasAccess: !currentAccess,
        },
      });

      if (error) {
        console.error('Error response:', error);
        throw new Error(`Failed to update tool access`);
      }

      console.log('Tool access updated:', data);

      toast({
        title: "Success",
        description: `${toolName} access updated`,
      });
      
      fetchUsers();
      
      // Update selected user state
      if (selectedUser && selectedUser.id === userId) {
        const updatedToolAccess = { ...selectedUser.toolAccess, [toolName]: !currentAccess };
        setSelectedUser({ ...selectedUser, toolAccess: updatedToolAccess });
      }
    } catch (error) {
      console.error('Error setting tool access:', error);
      toast({
        title: "Error",
        description: `Failed to update ${toolName} access`,
        variant: "destructive",
      });
    } finally {
      setIsUpdatingToolAccess(null);
    }
  };

  const handlePlanChange = async (newPlan: string) => {
    if (!selectedUser) return;

    const adminToken = localStorage.getItem('admin_token');
    
    if (!adminToken) {
      toast({
        title: "Error",
        description: "Admin session not found",
        variant: "destructive",
      });
      return;
    }

    setIsChangingPlan(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-update-plan`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            'admin-token': adminToken,
          },
          body: JSON.stringify({
            userId: selectedUser.id,
            plan: newPlan,
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to update plan');
      }

      toast({
        title: "Success",
        description: `Plan updated to ${newPlan}`,
      });
      
      // Refresh the user list
      await fetchUsers();
      
      // Update selected user state
      setSelectedUser({
        ...selectedUser,
        plan: newPlan,
      });
    } catch (error) {
      console.error('Error updating plan:', error);
      toast({
        title: "Error",
        description: "Failed to update user plan",
        variant: "destructive",
      });
    } finally {
      setIsChangingPlan(false);
    }
  };

  const handleDeleteUser = async (userId: string, userEmail: string) => {
    try {
      // Call edge function to delete user from auth system
      // This will cascade delete all related data due to foreign key constraints
      const { error } = await supabase.functions.invoke('delete-ineligible-user', {
        body: { userId }
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Success",
        description: `User ${userEmail} has been deleted`,
      });
      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({
        title: "Error",
        description: "Failed to delete user",
        variant: "destructive",
      });
    }
  };


  // Subscription status: paid plan = active sub; a cancellation_feedback row = cancelled.
  const isPaidPlan = (u: any) => ["lite", "starter", "professional", "enterprise"].includes(String(u?.plan || "").toLowerCase());
  const isCancelled = (u: any) => !!u?.cancellationFeedback;
  const activeCount = users.filter((u) => isPaidPlan(u) && !isCancelled(u)).length;
  const cancelledCount = users.filter(isCancelled).length;

  const subTabUsers = userSubTab === "active"
    ? users.filter((u) => isPaidPlan(u) && !isCancelled(u))
    : userSubTab === "cancelled"
      ? users.filter(isCancelled)
      : users;

  const filteredUsers = searchTerm
    ? subTabUsers.filter(
        (user) =>
          user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : subTabUsers;

  // Pagination logic - only apply if not searching
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = searchTerm ? filteredUsers : filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (!isAuthenticated) return null;

  const getToolRoute = (toolName: string) => {
    const routes: Record<string, string> = {
      'atmospheric': '/tool/atmospheric',
      'fashion': '/tool/fashion',
      'fashion_v2': '/tool/fashion-v2',
      'creator': '/tool/creator-studio',
      'idea': '/tool/idea-studio',
      'ads_listing': '/tool/ads-listing-studio',
      'ads-listing': '/tool/ads-listing-studio',
      'flatlay_studio': '/tool/flatlay-studio',
      'flatlay-studio': '/tool/flatlay-studio',
      'simple_pose_maker': '/tool/simple-pose-maker',
      'ultimate-outfit-maker-v2': '/tool/ultimate-outfit-maker-v2',
      'virtual-tour': '/tool/property-studio',
      'fashion-video': '/tool/fashion-video-studio',
      'social-scraper': '/tool/social-scraper',
      'video-recreation': '/tool/video-recreation-studio',
    };
    return routes[toolName] || '/';
  };

  const handleToolClick = (tool: any) => {
    const route = getToolRoute(tool.name);
    navigate(route + (route.includes('?') ? '&' : '?') + 'from=admin');
  };

  return (
    <AdminLayout>
      <div className="flex-1">
        {/* Main Content */}
        <div className="p-8">
        {/* Settings Dialog - Moved to layout but keeping logic here */}
        <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Admin Settings</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="admin-email">Email</Label>
                <Input
                  id="admin-email"
                  type="email"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  placeholder="admin@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="admin-password">New Password (leave blank to keep current)</Label>
                <Input
                  id="admin-password"
                  type="password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="Enter new password"
                />
              </div>
              <Button 
                onClick={handleUpdateAdminSettings} 
                disabled={isUpdatingSettings}
                className="w-full"
              >
                {isUpdatingSettings ? "Updating..." : "Update Settings"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {activeTab === "users" && (
          <div className="container mx-auto px-4 py-8">
            <div className="mb-8">
              <div className="flex items-center justify-between mb-2">
                <h1 className="text-4xl font-bold text-foreground">User Management</h1>
                <Button onClick={() => setShowAddUser(!showAddUser)} className="bg-primary text-primary-foreground hover:bg-primary/90">
                  <UserPlus className="w-4 h-4 mr-2" />
                  Add User
                </Button>
              </div>
              <p className="text-muted-foreground">Manage users, admins, credits, and tool access</p>
            </div>

        {showAddUser && (
          <div className="bg-card rounded-xl border border-border/50 shadow-elegant p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4 text-foreground">Create New User</h2>
            <div className="grid gap-4">
              <div>
                <Label htmlFor="newEmail">Email</Label>
                <Input
                  id="newEmail"
                  type="email"
                  placeholder="user@example.com"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="newPassword">Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  placeholder="Enter password"
                  value={newUserPassword}
                  onChange={(e) => setNewUserPassword(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="newName">Full Name (Optional)</Label>
                <Input
                  id="newName"
                  type="text"
                  placeholder="John Doe"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleAddUser} disabled={isCreatingUser} className="bg-primary text-primary-foreground hover:bg-primary/90">
                  {isCreatingUser ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create User"
                  )}
                </Button>
                <Button onClick={() => setShowAddUser(false)} variant="outline">
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search users by email or name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Subscription filter tabs */}
          <div className="flex flex-wrap gap-2">
            {(([["all", "All", users.length], ["active", "Active subscriptions", activeCount], ["cancelled", "Cancelled subscriptions", cancelledCount]]) as const).map(([id, label, count]) => (
              <button key={id} onClick={() => { setUserSubTab(id); setCurrentPage(1); }}
                className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm font-medium transition ${userSubTab === id ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground hover:bg-muted/50"}`}>
                {label}
                <span className={`rounded-full px-1.5 text-xs ${userSubTab === id ? "bg-primary-foreground/20" : "bg-muted text-muted-foreground"}`}>{count}</span>
              </button>
            ))}
          </div>

          <div className="bg-card rounded-xl border border-border/50 shadow-elegant overflow-hidden">
            {isLoadingUsers ? (
              <div className="flex items-center justify-center py-32">
                <div className="text-center space-y-4">
                  <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-muted-foreground">Loading users...</p>
                </div>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Credits</TableHead>
                    <TableHead>Generations</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentUsers.map((user) => (
                    <TableRow
                      key={user.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleOpenEditDialog(user)}
                    >
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {user.email}
                          {new Date(user.created_at) > new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) && (
                            <Badge variant="default" className="bg-emerald-500 text-white text-[10px] px-1.5 py-0">New</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{user.full_name || "—"}</TableCell>
                      <TableCell>{user.credits}</TableCell>
                      <TableCell>{user.generations}</TableCell>
                      <TableCell>
                        {new Date(user.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenEditDialog(user);
                          }}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete User</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete {user.email}? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteUser(user.id, user.email)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
            </div>

            {/* Pagination - only show if not searching */}
            {!searchTerm && totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                
                <div className="flex gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                    // Show first page, last page, current page, and pages around current
                    if (
                      page === 1 ||
                      page === totalPages ||
                      (page >= currentPage - 1 && page <= currentPage + 1)
                    ) {
                      return (
                        <Button
                          key={page}
                          variant={currentPage === page ? "default" : "outline"}
                          size="sm"
                          onClick={() => handlePageChange(page)}
                          className="w-10"
                        >
                          {page}
                        </Button>
                      );
                    } else if (page === currentPage - 2 || page === currentPage + 2) {
                      return <span key={page} className="px-2 py-1">...</span>;
                    }
                    return null;
                  })}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            )}

            {/* Show search results count */}
            {searchTerm && (
              <div className="text-center text-sm text-muted-foreground mt-4">
                Found {filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''} matching "{searchTerm}"
              </div>
            )}
          </div>

        {/* Edit User Dialog - Clean Modern Design */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[85vh] p-0 flex flex-col overflow-hidden bg-background border-border">
            {/* Header with User Info */}
            <div className="px-6 pt-6 pb-4 border-b border-border bg-muted/20">
              <DialogHeader>
                <DialogTitle className="sr-only">User Details</DialogTitle>
              </DialogHeader>
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center shrink-0">
                  <User className="w-7 h-7 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg font-semibold text-foreground truncate">
                    {selectedUser?.full_name || 'Unnamed User'}
                  </h2>
                  <p className="text-sm text-muted-foreground truncate">{selectedUser?.email}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                      selectedUser?.plan === 'enterprise' ? 'bg-amber-500/20 text-amber-600 border border-amber-500/30' :
                      selectedUser?.plan === 'professional' ? 'bg-purple-500/20 text-purple-600 border border-purple-500/30' :
                      selectedUser?.plan === 'starter' ? 'bg-blue-500/20 text-blue-600 border border-blue-500/30' :
                      'bg-gray-500/20 text-gray-600 border border-gray-500/30'
                    }`}>
                      {selectedUser?.plan?.charAt(0).toUpperCase() + selectedUser?.plan?.slice(1) || 'Free'}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {selectedUser?.credits || 0} credits
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Joined {selectedUser?.created_at ? new Date(selectedUser.created_at).toLocaleDateString() : '—'}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Horizontal Tabs */}
              <div className="flex gap-1 mt-5 -mb-4 overflow-x-auto">
                {[
                  { id: 'account', label: 'Profile', icon: User },
                  { id: 'generations', label: 'Generations', icon: Sparkles },
                  { id: 'membership', label: 'Membership', icon: Shield },
                  { id: 'tools', label: 'Tools', icon: Wand2 },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setUserModalTab(tab.id as any);
                      if (tab.id === 'generations' && selectedUser) {
                        fetchUserGenerations(selectedUser.id);
                      }
                      if (tab.id === 'membership' && selectedUser) {
                        fetchCreditHistory(selectedUser.id);
                        fetchUserInvoices(selectedUser.email);
                      }
                    }}
                    className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap ${
                      userModalTab === tab.id
                        ? 'bg-background text-foreground border-t-2 border-t-primary border-x border-x-border'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                    }`}
                  >
                    <tab.icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Profile Tab */}
              {userModalTab === "account" && (
                <div className="space-y-6">
                  {/* Editable Fields */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-muted-foreground">Full Name</Label>
                      <Input
                        value={editFullName}
                        onChange={(e) => setEditFullName(e.target.value)}
                        className="h-10"
                        placeholder="Enter name"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-muted-foreground">Email</Label>
                      <Input
                        value={editEmail}
                        onChange={(e) => setEditEmail(e.target.value)}
                        className="h-10"
                        placeholder="Enter email"
                      />
                    </div>
                  </div>

                  {/* Read-only Info Grid */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
                      <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">Phone</p>
                      <p className="text-sm font-medium truncate">{selectedUser?.phone || '—'}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
                      <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">Website</p>
                      <p className="text-sm font-medium truncate">{selectedUser?.website || '—'}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
                      <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">Role</p>
                      <p className="text-sm font-medium">{selectedUser?.role || '—'}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/30 border border-border/50 col-span-3">
                      <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">How did they find us</p>
                      <p className="text-sm font-medium">{selectedUser?.onboardingData?.referral_source || selectedUser?.referral_source || '—'}</p>
                    </div>
                  </div>

                  {/* Onboarding Data */}
                  {selectedUser?.onboardingData && (
                    <div className="p-4 rounded-lg border border-border bg-card">
                      <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Company Information</h4>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-[10px] text-muted-foreground mb-0.5">Company</p>
                          <p className="text-sm">{selectedUser.onboardingData.company_name || '—'}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-muted-foreground mb-0.5">Website</p>
                          <p className="text-sm truncate">{selectedUser.onboardingData.company_website || '—'}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-muted-foreground mb-0.5">Size</p>
                          <p className="text-sm">{selectedUser.onboardingData.company_size || '—'}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-muted-foreground mb-0.5">Monthly Ad Spend</p>
                          <p className="text-sm">{selectedUser.onboardingData.monthly_ad_spend || '—'}</p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-[10px] text-muted-foreground mb-0.5">Creatives Tested</p>
                          <p className="text-sm">{selectedUser.onboardingData.creatives_tested || '—'}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* System Info */}
                  <div className="flex items-center gap-3 text-xs text-muted-foreground pt-2 border-t border-border/50">
                    <span>ID: <code className="bg-muted px-1 rounded text-[10px]">{selectedUser?.id?.slice(0, 8)}...</code></span>
                    <span>•</span>
                    <span>Onboarding: {selectedUser?.onboarding_completed ? 
                      <span className="text-green-600">Complete</span> : 
                      <span className="text-yellow-600">Pending</span>
                    }</span>
                  </div>

                  <Button 
                    onClick={handleUpdateUserDetails} 
                    disabled={isUpdatingUserDetails}
                    className="w-full h-10"
                  >
                    {isUpdatingUserDetails ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    {isUpdatingUserDetails ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              )}

              {/* Generations Tab */}
              {userModalTab === "generations" && (
                <div className="h-full">
                  {isLoadingGenerations ? (
                    <div className="flex flex-col items-center justify-center py-20">
                      <Loader2 className="w-8 h-8 text-primary animate-spin mb-3" />
                      <p className="text-sm text-muted-foreground">Loading generations...</p>
                    </div>
                  ) : userGenerations.length > 0 ? (
                    <>
                      <div className="flex items-center justify-between mb-4">
                        <p className="text-sm text-muted-foreground">{userGenerations.length} generations</p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => selectedUser && fetchUserGenerations(selectedUser.id)}
                          className="h-8 text-xs"
                        >
                          <Loader2 className={`w-3 h-3 mr-1.5 ${isLoadingGenerations ? 'animate-spin' : 'hidden'}`} />
                          Refresh
                        </Button>
                      </div>
                      <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                        {userGenerations.map((gen) => (
                          <div 
                            key={gen.id} 
                            className="group cursor-pointer"
                            onClick={() => handleGenerationClick(gen)}
                          >
                            <div className="aspect-square relative bg-muted rounded-lg overflow-hidden border border-border/50 hover:border-primary/50 hover:shadow-md transition-all">
                              {gen.generated_image_url ? (
                                isVideoUrl(gen.generated_image_url) ? (
                                  <video 
                                    src={gen.generated_image_url}
                                    className="w-full h-full object-cover"
                                    autoPlay muted loop playsInline
                                    crossOrigin="anonymous"
                                  />
                                ) : (
                                  <img 
                                    src={gen.generated_image_url} 
                                    alt="" 
                                    className="w-full h-full object-cover"
                                    crossOrigin="anonymous"
                                    referrerPolicy="no-referrer"
                                  />
                                )
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />
                                </div>
                              )}
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                                <span className="text-white text-xs font-medium">View</span>
                              </div>
                              <div className="absolute bottom-0 inset-x-0 p-1.5 bg-gradient-to-t from-black/70 to-transparent">
                                <p className="text-[10px] text-white/80">{new Date(gen.created_at).toLocaleDateString()}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-20">
                      <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mb-3">
                        <Sparkles className="w-6 h-6 text-muted-foreground" />
                      </div>
                      <p className="text-sm text-muted-foreground">No generations yet</p>
                    </div>
                  )}
                </div>
              )}

              {/* Membership Tab */}
              {userModalTab === "membership" && (
                <div className="space-y-5">
                  {/* Plan & Credits Cards */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl border border-border bg-gradient-to-br from-primary/5 to-transparent">
                      <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-2">Current Plan</p>
                      <Select 
                        value={selectedUser?.plan || 'free'} 
                        onValueChange={handlePlanChange}
                        disabled={isChangingPlan}
                      >
                        <SelectTrigger className="h-10 bg-background">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-popover border-border">
                          <SelectItem value="free">Free</SelectItem>
                          <SelectItem value="starter">Starter</SelectItem>
                          <SelectItem value="professional">Professional</SelectItem>
                          <SelectItem value="enterprise">Enterprise</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="p-4 rounded-xl border border-border bg-gradient-to-br from-green-500/5 to-transparent">
                      <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-2">Credits</p>
                      <p className="text-3xl font-bold text-foreground">{selectedUser?.credits || 0}</p>
                    </div>
                  </div>

                  {/* Add Credits */}
                  <div className="p-4 rounded-xl border border-border">
                    <p className="text-xs font-medium mb-3">Add Credits</p>
                    <div className="flex gap-2 mb-3">
                      {[10, 25, 50, 100].map((amount) => (
                        <Button
                          key={amount}
                          variant="outline"
                          size="sm"
                          onClick={() => setCreditAmount(String(amount))}
                          className={`flex-1 h-9 ${creditAmount === String(amount) ? 'border-primary bg-primary/5' : ''}`}
                        >
                          +{amount}
                        </Button>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        placeholder="Custom amount"
                        value={creditAmount}
                        onChange={(e) => setCreditAmount(e.target.value)}
                        className="h-9 flex-1"
                      />
                      <Button 
                        onClick={handleAddCredits} 
                        disabled={isAddingCredits || !creditAmount}
                        className="h-9 px-6"
                      >
                        {isAddingCredits ? <Loader2 className="w-4 h-4 animate-spin" /> : "Add"}
                      </Button>
                    </div>
                  </div>

                  {/* Cancellation reason */}
                  {selectedUser?.cancellationFeedback && (
                    <div className="p-4 rounded-xl border border-amber-500/40 bg-amber-500/5">
                      <p className="mb-1 inline-flex items-center gap-1.5 text-xs font-medium text-amber-600">
                        <X className="w-3.5 h-3.5" /> Subscription cancelled
                      </p>
                      <p className="text-sm text-foreground">
                        <span className="text-muted-foreground">Reason:</span> {selectedUser.cancellationFeedback.reason}
                      </p>
                      {selectedUser.cancellationFeedback.details && (
                        <p className="mt-1 text-sm italic text-muted-foreground">"{selectedUser.cancellationFeedback.details}"</p>
                      )}
                      {selectedUser.cancellationFeedback.created_at && (
                        <p className="mt-2 text-[11px] text-muted-foreground">
                          Cancelled {new Date(selectedUser.cancellationFeedback.created_at).toLocaleString()}
                        </p>
                      )}
                    </div>
                  )}

                  {/* API Access */}
                  {selectedUser && (
                    <AdminUserApiKeys user={{ id: selectedUser.id, email: selectedUser.email, plan: selectedUser.plan }} />
                  )}

                  {/* Deduct Credits */}
                  <div className="p-4 rounded-xl border border-destructive/30 bg-destructive/5">
                    <p className="text-xs font-medium mb-3 text-destructive">Deduct Credits</p>
                    <div className="flex gap-2 mb-3">
                      {[10, 25, 50, 100].map((amount) => (
                        <Button
                          key={amount}
                          variant="outline"
                          size="sm"
                          onClick={() => setDeductAmount(String(amount))}
                          className={`flex-1 h-9 border-destructive/30 hover:bg-destructive/10 ${deductAmount === String(amount) ? 'border-destructive bg-destructive/10' : ''}`}
                        >
                          -{amount}
                        </Button>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        placeholder="Custom amount"
                        value={deductAmount}
                        onChange={(e) => setDeductAmount(e.target.value)}
                        className="h-9 flex-1"
                      />
                      <Button 
                        variant="destructive"
                        onClick={handleDeductCredits} 
                        disabled={isDeductingCredits || !deductAmount}
                        className="h-9 px-6"
                      >
                        {isDeductingCredits ? <Loader2 className="w-4 h-4 animate-spin" /> : "Deduct"}
                      </Button>
                    </div>
                  </div>

                  {/* Credit History */}
                  <div className="p-4 rounded-xl border border-border">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-xs font-medium flex items-center gap-1.5">
                        <History className="w-3.5 h-3.5" />
                        Credit History
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => selectedUser && fetchCreditHistory(selectedUser.id)}
                        className="h-7 text-xs px-2"
                      >
                        <RefreshCw className={`w-3 h-3 ${isLoadingCreditHistory ? 'animate-spin' : ''}`} />
                      </Button>
                    </div>
                    {isLoadingCreditHistory ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-5 h-5 text-primary animate-spin" />
                      </div>
                    ) : creditHistory.length > 0 ? (
                      <div className="space-y-1.5 max-h-64 overflow-y-auto">
                        {creditHistory.map((entry: any) => (
                          <div key={entry.id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/30 border border-border/30 text-xs">
                            <div className="flex items-center gap-2 min-w-0">
                              {entry.amount > 0 ? (
                                <ArrowUp className="w-3.5 h-3.5 text-green-500 shrink-0" />
                              ) : (
                                <ArrowDown className="w-3.5 h-3.5 text-red-500 shrink-0" />
                              )}
                              <span className="truncate text-muted-foreground">{entry.description || entry.action_type}</span>
                            </div>
                            <div className="flex items-center gap-3 shrink-0 ml-2">
                              <span className={`font-semibold ${entry.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {entry.amount > 0 ? '+' : ''}{entry.amount}
                              </span>
                              <span className="text-muted-foreground w-16 text-right">
                                {new Date(entry.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground text-center py-6">No credit history recorded yet</p>
                    )}
                  </div>

                  {/* Invoices */}
                  <div className="p-4 rounded-xl border border-border">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-xs font-medium flex items-center gap-1.5">
                        <History className="w-3.5 h-3.5" />
                        Stripe Invoices & Payments
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => selectedUser && fetchUserInvoices(selectedUser.email)}
                        className="h-7 text-xs px-2"
                      >
                        <RefreshCw className={`w-3 h-3 ${isLoadingInvoices ? 'animate-spin' : ''}`} />
                      </Button>
                    </div>
                    {isLoadingInvoices ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-5 h-5 text-primary animate-spin" />
                      </div>
                    ) : userInvoices.length > 0 ? (
                      <div className="space-y-1.5 max-h-64 overflow-y-auto">
                        {userInvoices.map((inv: any) => (
                          <div key={inv.id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/30 border border-border/30 text-xs">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${
                                inv.status === 'paid' ? 'bg-green-500/20 text-green-600' :
                                inv.status === 'open' ? 'bg-yellow-500/20 text-yellow-600' :
                                'bg-muted text-muted-foreground'
                              }`}>
                                {inv.status || 'unknown'}
                              </span>
                              <span className="truncate text-muted-foreground">{inv.description}</span>
                            </div>
                            <div className="flex items-center gap-3 shrink-0 ml-2">
                              <span className="font-semibold">
                                €{((inv.amount || 0) / 100).toFixed(2)}
                              </span>
                              <span className="text-muted-foreground w-16 text-right">
                                {new Date(inv.created * 1000).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                              </span>
                              {inv.invoicePdf && (
                                <a
                                  href={inv.invoicePdf}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-primary hover:underline"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  PDF
                                </a>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground text-center py-6">No invoices found</p>
                    )}
                  </div>
                </div>
              )}

              {/* Tools Tab */}
              {userModalTab === "tools" && (
                <div className="space-y-3">
                  <p className="text-xs text-muted-foreground mb-4">Control which tools this user can access.</p>
                  {[
                    { key: 'fashion', name: 'Fashion Studio', desc: 'AI fashion photography' },
                    { key: 'atmospheric', name: 'Ambience Studio', desc: 'Atmospheric product visuals' },
                    { key: 'creator-studio', name: 'Creator Studio', desc: 'Video content creation' },
                    { key: 'idea-studio', name: 'Idea Studio', desc: 'Creative ideation tools' },
                    { key: 'ads-listing', name: 'Ads Studio', desc: 'Social media ad generation' },
                    { key: 'flatlay-studio', name: 'Flatlay Studio', desc: 'Reference-based product flatlay', special: true },
                    { key: 'fashion-2.0', name: 'Fashion Studio Pro', desc: 'Advanced bulk processing', special: true },
                    { key: 'ultimate-outfit-maker-v2', name: 'Ultimate Outfit Maker 2.0', desc: 'Bulk mockup with hairstyles & poses', special: true },
                    { key: 'virtual-tour', name: 'Virtual Video Studio', desc: 'Cinematic virtual video creation', special: true },
                  ].map((tool) => (
                    <div 
                      key={tool.key}
                      className={`flex items-center justify-between p-4 rounded-lg border transition-colors ${
                        tool.special 
                          ? 'border-primary/30 bg-primary/5' 
                          : 'border-border/50 hover:bg-muted/30'
                      }`}
                    >
                      <div>
                        <p className="text-sm font-medium flex items-center gap-2">
                          {tool.name}
                          {tool.special && (
                            <span className="text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded-full">SPECIAL</span>
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground">{tool.desc}</p>
                      </div>
                      <Switch
                        checked={selectedUser?.toolAccess?.[tool.key] === true}
                        disabled={isUpdatingToolAccess === tool.key}
                        onCheckedChange={() =>
                          handleToolAccessToggle(
                            selectedUser?.id,
                            tool.key,
                            selectedUser?.toolAccess?.[tool.key] === true
                          )
                        }
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
          </div>
        )}

        {activeTab === "tools" && (
          <div className="container mx-auto px-4 py-8">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-foreground mb-2">AI Studio Tools</h1>
              <p className="text-muted-foreground">
                Access all creative tools. Click to open and test.
              </p>
            </div>

            {isLoadingTools ? (
              <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="w-8 h-8 text-primary animate-spin mb-4" />
                <p className="text-muted-foreground">Loading tools...</p>
              </div>
            ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {tools.map((tool) => {
                const iconMap: Record<string, any> = {
                  'atmospheric': Wand2,
                  'fashion': Shirt,
                  'fashion_v2': Shirt,
                  'creator': Video,
                  'idea': Lightbulb,
                  'bulk-mockup': Package,
                  'ads_listing': LayoutGrid,
                  'flatlay_studio': LayoutGrid,
                  'simple_pose_maker': UserCircle,
                  'virtual-tour': Film,
                  'fashion-video': Video,
                  'social-scraper': Search,
                  'video-recreation': Film,
                };
                
                const colorMap: Record<string, { bg: string; icon: string; glow: string }> = {
                  'atmospheric': { 
                    bg: 'from-purple-500/20 to-purple-600/10', 
                    icon: 'text-purple-500',
                    glow: 'shadow-purple-500/20'
                  },
                  'fashion': { 
                    bg: 'from-pink-500/20 to-pink-600/10', 
                    icon: 'text-pink-500',
                    glow: 'shadow-pink-500/20'
                  },
                  'fashion_v2': { 
                    bg: 'from-rose-500/20 to-rose-600/10', 
                    icon: 'text-rose-500',
                    glow: 'shadow-rose-500/20'
                  },
                  'creator': { 
                    bg: 'from-blue-500/20 to-blue-600/10', 
                    icon: 'text-blue-500',
                    glow: 'shadow-blue-500/20'
                  },
                  'idea': { 
                    bg: 'from-amber-500/20 to-amber-600/10', 
                    icon: 'text-amber-500',
                    glow: 'shadow-amber-500/20'
                  },
                  'bulk-mockup': { 
                    bg: 'from-emerald-500/20 to-emerald-600/10', 
                    icon: 'text-emerald-500',
                    glow: 'shadow-emerald-500/20'
                  },
                  'ads_listing': { 
                    bg: 'from-cyan-500/20 to-cyan-600/10', 
                    icon: 'text-cyan-500',
                    glow: 'shadow-cyan-500/20'
                  },
                  'flatlay_studio': { 
                    bg: 'from-teal-500/20 to-teal-600/10', 
                    icon: 'text-teal-500',
                    glow: 'shadow-teal-500/20'
                  },
                  'simple_pose_maker': { 
                    bg: 'from-orange-500/20 to-orange-600/10', 
                    icon: 'text-orange-500',
                    glow: 'shadow-orange-500/20'
                  },
                  'virtual-tour': {
                    bg: 'from-indigo-500/20 to-indigo-600/10',
                    icon: 'text-indigo-500',
                    glow: 'shadow-indigo-500/20'
                  },
                  'fashion-video': {
                    bg: 'from-fuchsia-500/20 to-fuchsia-600/10',
                    icon: 'text-fuchsia-500',
                    glow: 'shadow-fuchsia-500/20'
                  },
                  'social-scraper': {
                    bg: 'from-sky-500/20 to-sky-600/10',
                    icon: 'text-sky-500',
                    glow: 'shadow-sky-500/20'
                  },
                  'video-recreation': {
                    bg: 'from-violet-500/20 to-violet-600/10',
                    icon: 'text-violet-500',
                    glow: 'shadow-violet-500/20'
                  },
                };
                
                const ToolIcon = iconMap[tool.name] || Wand2;
                const colors = colorMap[tool.name] || colorMap['atmospheric'];

                return (
                  <div
                    key={tool.id}
                    className="bg-gradient-to-br from-card to-card/50 border border-border/50 rounded-xl p-4 
                             shadow-[0_8px_16px_-4px_rgba(0,0,0,0.1)] 
                             hover:shadow-[0_12px_24px_-4px_rgba(0,0,0,0.15)] 
                             hover:-translate-y-1 
                             transition-all duration-300 cursor-pointer group
                             backdrop-blur-sm
                             relative overflow-hidden"
                    onClick={() => handleToolClick(tool)}
                  >
                    {/* 3D shine effect */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    
                    <div className="relative z-10">
                      <div className="flex items-center justify-center mb-3">
                        <div className={`w-12 h-12 bg-gradient-to-br ${colors.bg} rounded-xl flex items-center justify-center 
                                      group-hover:scale-110 transition-transform duration-300
                                      shadow-lg ${colors.glow} group-hover:shadow-xl`}>
                          <ToolIcon className={`w-6 h-6 ${colors.icon} drop-shadow-sm`} />
                        </div>
                      </div>
                      <h3 className="text-sm font-semibold text-foreground mb-1 text-center group-hover:text-primary transition-colors line-clamp-2">
                        {tool.display_name}
                      </h3>
                      <p className="text-muted-foreground text-xs mb-3 text-center line-clamp-2 min-h-[2rem]">
                        {tool.description}
                      </p>
                      <Button
                        size="sm"
                        className="w-full bg-gradient-to-r from-primary to-primary/90 text-primary-foreground 
                                 hover:from-primary/90 hover:to-primary/80 
                                 shadow-md hover:shadow-lg
                                 h-8 text-xs font-medium
                                 transition-all duration-300"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToolClick(tool);
                        }}
                      >
                        Open
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
            )}
          </div>
        )}

        {activeTab === "team" && (
          <div className="container mx-auto px-4 py-8">
            <div className="mb-8">
              <div className="flex items-center justify-between mb-2">
                <h1 className="text-3xl font-bold text-foreground">Admin Team</h1>
                <Button onClick={() => setShowAddAdmin(!showAddAdmin)} className="bg-primary text-primary-foreground hover:bg-primary/90">
                  <UserPlus className="w-4 h-4 mr-2" />
                  Add Admin
                </Button>
              </div>
              <p className="text-muted-foreground">
                Manage administrator accounts and permissions
              </p>
            </div>

            {showAddAdmin && (
              <div className="bg-card rounded-xl border border-border/50 shadow-elegant p-6 mb-6">
                <h2 className="text-xl font-semibold mb-4 text-foreground">Create New Admin Account</h2>
                <div className="grid gap-4">
                  <div>
                    <Label htmlFor="newAdminEmail">Email</Label>
                    <Input
                      id="newAdminEmail"
                      type="email"
                      placeholder="admin@example.com"
                      value={newAdminEmail}
                      onChange={(e) => setNewAdminEmail(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="newAdminName">Full Name (Optional)</Label>
                    <Input
                      id="newAdminName"
                      type="text"
                      placeholder="John Doe"
                      value={newAdminName}
                      onChange={(e) => setNewAdminName(e.target.value)}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    A temporary password will be generated and sent to the admin's email address.
                  </p>
                  <div className="flex gap-2">
                    <Button 
                      onClick={handleAddAdmin} 
                      disabled={isCreatingAdmin}
                      className="bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                      {isCreatingAdmin ? "Creating..." : "Create Admin Account"}
                    </Button>
                    <Button 
                      onClick={() => setShowAddAdmin(false)} 
                      variant="outline"
                      disabled={isCreatingAdmin}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-card rounded-xl border border-border/50 shadow-elegant overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Last Login</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {adminAccounts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        No admin accounts found
                      </TableCell>
                    </TableRow>
                  ) : (
                    adminAccounts.map((account) => (
                      <TableRow key={account.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <Shield className="w-4 h-4 text-primary" />
                            {account.full_name || "—"}
                          </div>
                        </TableCell>
                        <TableCell>{account.email}</TableCell>
                        <TableCell>
                          {new Date(account.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          {account.last_login
                            ? new Date(account.last_login).toLocaleString()
                            : "Never"}
                        </TableCell>
                        <TableCell className="text-right">
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                onClick={() => setDeleteAdminId(account.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Admin Account</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete the admin account for <span className="font-semibold">{account.email}</span>?
                                  This action cannot be undone and will immediately revoke all access.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel onClick={() => setDeleteAdminId(null)}>
                                  Cancel
                                </AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteAdmin(account.id)}
                                  disabled={isDeletingAdmin}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  {isDeletingAdmin ? "Deleting..." : "Delete Account"}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {/* Email Tab */}
        {activeTab === "email" && (
          <AdminEmailPanel users={users} tools={tools} />
        )}

        {activeTab === "kb-videos" && (
          <AdminKBVideosPanel />
        )}

        {activeTab === "community" && (
          <AdminCommunityPanel />
        )}

        {activeTab === "gallery" && (
          <AdminGalleryPanel />
        )}

        {activeTab === "models" && (
          <AdminModelsPanel />
        )}

        {activeTab === "flatlay-styles" && (
          <AdminFlatlayStylesPanel />
        )}

      </div>

      {/* Generation Preview Dialog */}
      <Dialog open={generationPreviewOpen} onOpenChange={setGenerationPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0">
          <DialogHeader className="absolute top-4 right-4 z-10">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setGenerationPreviewOpen(false)}
              className="bg-black/50 hover:bg-black/70 text-white rounded-full"
            >
              <X className="w-5 h-5" />
            </Button>
          </DialogHeader>
          <div className="w-full h-full flex items-center justify-center bg-black/95 rounded-lg overflow-hidden">
            {selectedGeneration?.generated_image_url && (
              isVideoUrl(selectedGeneration.generated_image_url) ? (
                <video 
                  src={selectedGeneration.generated_image_url}
                  className="max-w-full max-h-[85vh] object-contain"
                  controls
                  autoPlay
                  loop
                  crossOrigin="anonymous"
                />
              ) : (
                <img 
                  src={selectedGeneration.generated_image_url} 
                  alt="Full generation" 
                  className="max-w-full max-h-[85vh] object-contain"
                  crossOrigin="anonymous"
                  referrerPolicy="no-referrer"
                />
              )
            )}
          </div>
          {selectedGeneration?.prompt && (
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4">
              <p className="text-white text-sm">{selectedGeneration.prompt}</p>
              <p className="text-white/70 text-xs mt-1">
                {new Date(selectedGeneration.created_at).toLocaleString()}
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
    </AdminLayout>
  );
};

export default Admin;