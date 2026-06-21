import { useState, useMemo, useRef } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Mail, Send, Eye, Loader2, Search, X, Clock, CalendarIcon, Megaphone, Tag, Sparkles, FileText, Pencil, ImagePlus, Trash2, Inbox } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdminSentBox } from "./AdminSentBox";
import { AdminScheduledEmails } from "./AdminScheduledEmails";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AdminEmailPanelProps {
  users: any[];
  tools: any[];
}

interface ToolInfo {
  name: string;
  description: string;
}

type EmailTemplate = 'tool-announcement' | 'discount' | 'product-update' | 'custom' | 'tips';

interface UpdateItem {
  title: string;
  description: string;
}

interface EmailImage {
  url: string;
  name: string;
  width?: string;
}

const EMAIL_TEMPLATES: { id: EmailTemplate; label: string; icon: any; description: string }[] = [
  { id: 'tool-announcement', label: 'Tool Announcement', icon: Megaphone, description: 'Announce new AI tools' },
  { id: 'discount', label: 'Discount / Promo', icon: Tag, description: 'Promo codes & offers' },
  { id: 'product-update', label: 'Product Update', icon: Sparkles, description: 'Features & changelog' },
  { id: 'tips', label: 'Tips & Tricks', icon: FileText, description: 'Usage tips & best practices' },
  { id: 'custom', label: 'Custom Email', icon: Pencil, description: 'Freeform email' },
];

// ============= EMAIL HTML GENERATORS =============

const emailWrapper = (content: string, title: string, images: EmailImage[] = []) => {
  const imagesHtml = images.length > 0 ? images.map(img =>
    `<div style="text-align: center; margin: 24px 0;">
      <img src="${img.url}" alt="${img.name}" style="display: block; margin: 0 auto; width: ${img.width || '100%'}; max-width: 600px; height: auto; border-radius: 8px;" />
    </div>`
  ).join('') : '';

  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} - Floowy.ai</title>
  </head>
  <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif; background-color: #ffffff;">
    <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
      <tr>
        <td align="center" style="padding-bottom: 0;">
          <img src="https://fjzifykgvdsownlscgct.supabase.co/storage/v1/object/public/products/email-header.png" alt="Floowy.ai" width="600" style="display: block; width: 100%; max-width: 600px; height: auto;">
        </td>
      </tr>
      <tr>
        <td>
          ${content}
          ${imagesHtml}
          <p style="color: #666666; font-size: 14px; line-height: 1.6; margin: 32px 0 16px; text-align: center;">
            Questions? Reply to this email or reach out at hello@floowy.ai
          </p>
          <div style="border-top: 1px solid #e5e5e5; padding-top: 24px; margin-top: 40px;">
            <p style="color: #666666; font-size: 14px; text-align: center; margin: 0;">
              <a href="https://floowy.ai" style="color: #666666; text-decoration: underline;">Visit our website</a>
              •
              <a href="https://floowy.ai/pricing" style="color: #666666; text-decoration: underline;">Pricing</a>
              •
              <a href="https://floowy.ai/contact" style="color: #666666; text-decoration: underline;">Contact</a>
            </p>
          </div>
        </td>
      </tr>
    </table>
  </body>
</html>`;
};

const generateToolAnnouncementHtml = (toolInfos: ToolInfo[], customMessage: string, images: EmailImage[] = []) => {
  const toolCardsHtml = toolInfos.map(tool =>
    `<div style="background-color: rgba(255,255,255,0.15); border-radius: 8px; padding: 16px; margin-bottom: 12px;">
      <p style="color: #ffffff; font-size: 17px; font-weight: 700; margin: 0 0 6px;">✨ ${tool.name}</p>
      <p style="color: rgba(255,255,255,0.9); font-size: 14px; line-height: 1.5; margin: 0;">${tool.description}</p>
    </div>`
  ).join('');

  return emailWrapper(`
    <h1 style="color: #000000; font-size: 28px; font-weight: 700; line-height: 1.3; margin: 0 0 24px; text-align: center;">
      New Tools Are Here! 🚀
    </h1>
    <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 16px;">Hi there,</p>
    <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 16px;">
      We're excited to announce that we've added powerful new AI tools to Floowy.ai to help you create even more stunning marketing content!
    </p>
    <div style="background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); border-radius: 12px; padding: 24px; margin: 32px 0;">
      <p style="color: #ffffff; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 16px;">New Tools Available</p>
      ${toolCardsHtml}
    </div>
    ${customMessage ? `<p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 16px;">${customMessage.replace(/\n/g, '<br>')}</p>` : ''}
    <div style="text-align: center; margin: 32px 0;">
      <a href="https://floowy.ai/home" style="display: inline-block; background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
        Try Them Now →
      </a>
    </div>
  `, 'New Tools Available', images);
};

const generateDiscountHtml = (discountCode: string, discountValue: string, headline: string, bodyText: string, expiryDate: string, ctaText: string, ctaUrl: string, images: EmailImage[] = []) => {
  return emailWrapper(`
    <h1 style="color: #000000; font-size: 28px; font-weight: 700; line-height: 1.3; margin: 0 0 24px; text-align: center;">
      ${headline || 'Special Offer Just For You! 🎉'}
    </h1>
    <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 16px;">Hi there,</p>
    ${bodyText ? `<p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 24px;">${bodyText.replace(/\n/g, '<br>')}</p>` : ''}
    <div style="background: linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%); border-radius: 12px; padding: 32px; margin: 32px 0; text-align: center;">
      <p style="color: rgba(255,255,255,0.8); font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 8px;">Your Exclusive Discount</p>
      <p style="color: #ffffff; font-size: 42px; font-weight: 800; margin: 0 0 12px;">${discountValue || '20% OFF'}</p>
      ${discountCode ? `
        <div style="display: inline-block; background: rgba(255,255,255,0.2); border: 2px dashed rgba(255,255,255,0.5); border-radius: 8px; padding: 12px 24px; margin: 8px 0;">
          <p style="color: #ffffff; font-size: 20px; font-weight: 700; letter-spacing: 3px; margin: 0;">${discountCode}</p>
        </div>
      ` : ''}
      ${expiryDate ? `<p style="color: rgba(255,255,255,0.8); font-size: 13px; margin: 12px 0 0;">⏰ Expires: ${expiryDate}</p>` : ''}
    </div>
    <div style="text-align: center; margin: 32px 0;">
      <a href="${ctaUrl || 'https://floowy.ai/pricing'}" style="display: inline-block; background: linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%); color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
        ${ctaText || 'Claim Your Discount →'}
      </a>
    </div>
  `, 'Special Offer', images);
};

const generateProductUpdateHtml = (headline: string, introText: string, updates: UpdateItem[], ctaText: string, ctaUrl: string, images: EmailImage[] = []) => {
  const updatesHtml = updates.map((item, i) =>
    `<div style="padding: 16px 0; ${i < updates.length - 1 ? 'border-bottom: 1px solid #e5e5e5;' : ''}">
      <p style="color: #000000; font-size: 16px; font-weight: 700; margin: 0 0 6px;">🔹 ${item.title}</p>
      <p style="color: #555555; font-size: 14px; line-height: 1.6; margin: 0;">${item.description}</p>
    </div>`
  ).join('');

  return emailWrapper(`
    <h1 style="color: #000000; font-size: 28px; font-weight: 700; line-height: 1.3; margin: 0 0 24px; text-align: center;">
      ${headline || 'Product Update ⚡'}
    </h1>
    <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 16px;">Hi there,</p>
    ${introText ? `<p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 24px;">${introText.replace(/\n/g, '<br>')}</p>` : ''}
    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; margin: 24px 0;">
      <p style="color: #64748b; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 8px;">What's New</p>
      ${updatesHtml}
    </div>
    <div style="text-align: center; margin: 32px 0;">
      <a href="${ctaUrl || 'https://floowy.ai/home'}" style="display: inline-block; background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
        ${ctaText || 'Explore Updates →'}
      </a>
    </div>
  `, 'Product Update', images);
};

const generateTipsHtml = (headline: string, introText: string, tips: UpdateItem[], ctaText: string, ctaUrl: string, images: EmailImage[] = []) => {
  const tipsHtml = tips.map((tip, i) =>
    `<div style="padding: 16px; background: #f0fdf4; border-radius: 8px; margin-bottom: 12px;">
      <p style="color: #166534; font-size: 15px; font-weight: 700; margin: 0 0 6px;">💡 Tip #${i + 1}: ${tip.title}</p>
      <p style="color: #333333; font-size: 14px; line-height: 1.6; margin: 0;">${tip.description}</p>
    </div>`
  ).join('');

  return emailWrapper(`
    <h1 style="color: #000000; font-size: 28px; font-weight: 700; line-height: 1.3; margin: 0 0 24px; text-align: center;">
      ${headline || 'Tips & Tricks 💡'}
    </h1>
    <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 16px;">Hi there,</p>
    ${introText ? `<p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 24px;">${introText.replace(/\n/g, '<br>')}</p>` : ''}
    ${tipsHtml}
    <div style="text-align: center; margin: 32px 0;">
      <a href="${ctaUrl || 'https://floowy.ai/home'}" style="display: inline-block; background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
        ${ctaText || 'Try It Out →'}
      </a>
    </div>
  `, 'Tips & Tricks', images);
};

const generateCustomHtml = (headline: string, bodyHtml: string, ctaText: string, ctaUrl: string, images: EmailImage[] = []) => {
  return emailWrapper(`
    <h1 style="color: #000000; font-size: 28px; font-weight: 700; line-height: 1.3; margin: 0 0 24px; text-align: center;">
      ${headline || 'A Message From Floowy.ai'}
    </h1>
    <div style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 24px;">
      ${bodyHtml.replace(/\n/g, '<br>')}
    </div>
    ${ctaText ? `
      <div style="text-align: center; margin: 32px 0;">
        <a href="${ctaUrl || 'https://floowy.ai'}" style="display: inline-block; background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
          ${ctaText}
        </a>
      </div>
    ` : ''}
  `, 'Floowy.ai', images);
};

// ============= UTILITIES =============

const createAmsterdamDate = (date: Date, hours: number, minutes: number): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const h = String(hours).padStart(2, '0');
  const m = String(minutes).padStart(2, '0');
  const testDate = new Date(`${year}-${month}-${day}T12:00:00Z`);
  const utcStr = testDate.toLocaleString('en-US', { timeZone: 'UTC', hour: '2-digit', hour12: false });
  const amsStr = testDate.toLocaleString('en-US', { timeZone: 'Europe/Amsterdam', hour: '2-digit', hour12: false });
  const offset = parseInt(amsStr) - parseInt(utcStr);
  const utcDate = new Date(`${year}-${month}-${day}T${h}:${m}:00Z`);
  utcDate.setHours(utcDate.getHours() - offset);
  return utcDate.toISOString();
};

const generateTimeOptions = () => {
  const options: { value: string; label: string }[] = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 15) {
      const hStr = String(h).padStart(2, '0');
      const mStr = String(m).padStart(2, '0');
      options.push({ value: `${hStr}:${mStr}`, label: `${hStr}:${mStr}` });
    }
  }
  return options;
};

const TIME_OPTIONS = generateTimeOptions();

// ============= COMPONENT =============

export function AdminEmailPanel({ users, tools }: AdminEmailPanelProps) {
  const { toast } = useToast();

  // Template
  const [activeTemplate, setActiveTemplate] = useState<EmailTemplate>('tool-announcement');

  // Tool Announcement state
  const [selectedTools, setSelectedTools] = useState<ToolInfo[]>([]);
  const [customToolName, setCustomToolName] = useState("");
  const [customToolDesc, setCustomToolDesc] = useState("");
  const [toolMessage, setToolMessage] = useState("");

  // Discount state
  const [discountCode, setDiscountCode] = useState("");
  const [discountValue, setDiscountValue] = useState("");
  const [discountHeadline, setDiscountHeadline] = useState("");
  const [discountBody, setDiscountBody] = useState("");
  const [discountExpiry, setDiscountExpiry] = useState("");

  // Product Update state
  const [updateHeadline, setUpdateHeadline] = useState("");
  const [updateIntro, setUpdateIntro] = useState("");
  const [updateItems, setUpdateItems] = useState<UpdateItem[]>([{ title: '', description: '' }]);

  // Tips state
  const [tipsHeadline, setTipsHeadline] = useState("");
  const [tipsIntro, setTipsIntro] = useState("");
  const [tipItems, setTipItems] = useState<UpdateItem[]>([{ title: '', description: '' }]);

  // Custom state
  const [customHeadline, setCustomHeadline] = useState("");
  const [customBody, setCustomBody] = useState("");

  // Shared state
  const [ctaText, setCtaText] = useState("");
  const [ctaUrl, setCtaUrl] = useState("");
  const [subject, setSubject] = useState("");
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [scheduleMode, setScheduleMode] = useState<'now' | 'later'>('now');
  const [scheduleDate, setScheduleDate] = useState<Date | undefined>(undefined);
  const [scheduleTime, setScheduleTime] = useState("09:00");
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);

  // Image attachments
  const [emailImages, setEmailImages] = useState<EmailImage[]>([]);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!validTypes.includes(file.type)) {
      toast({ title: "Invalid file type", description: "Please upload JPG, PNG, WebP or GIF", variant: "destructive" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "Max 5MB per image", variant: "destructive" });
      return;
    }
    setIsUploadingImage(true);
    try {
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result.split(',')[1]);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const { data, error } = await supabase.functions.invoke('upload-to-imgbb', {
        body: { image_base64: base64 },
      });
      if (error || !data?.url) throw new Error(error?.message || data?.error || 'Upload failed');
      setEmailImages(prev => [...prev, { url: data.url, name: file.name, width: '100%' }]);
      toast({ title: "Image uploaded", description: file.name });
    } catch (err: any) {
      console.error('Image upload error:', err);
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setIsUploadingImage(false);
      if (imageInputRef.current) imageInputRef.current.value = '';
    }
  };

  const removeImage = (index: number) => {
    setEmailImages(prev => prev.filter((_, i) => i !== index));
  };

  const updateImageWidth = (index: number, width: string) => {
    setEmailImages(prev => prev.map((img, i) => i === index ? { ...img, width } : img));
  };

  // Helpers
  const filteredUsers = useMemo(() => {
    if (!searchTerm) return users;
    const term = searchTerm.toLowerCase();
    return users.filter(u =>
      (u.email || '').toLowerCase().includes(term) ||
      (u.full_name || '').toLowerCase().includes(term)
    );
  }, [users, searchTerm]);

  const recipientEmails = useMemo(
    () => users.filter(u => selectedUserIds.has(u.id) && u.email).map(u => u.email),
    [users, selectedUserIds]
  );

  const isToolSelected = (displayName: string) => selectedTools.some(t => t.name === displayName);

  const toggleTool = (tool: any) => {
    if (isToolSelected(tool.display_name)) {
      setSelectedTools(prev => prev.filter(t => t.name !== tool.display_name));
    } else {
      setSelectedTools(prev => [...prev, { name: tool.display_name, description: tool.description || '' }]);
    }
  };

  const addCustomTool = () => {
    const name = customToolName.trim();
    const desc = customToolDesc.trim();
    if (name && !isToolSelected(name)) {
      setSelectedTools(prev => [...prev, { name, description: desc || 'A powerful new AI tool.' }]);
      setCustomToolName("");
      setCustomToolDesc("");
    }
  };

  const removeTool = (toolName: string) => setSelectedTools(prev => prev.filter(t => t.name !== toolName));

  const toggleUser = (userId: string) => {
    setSelectedUserIds(prev => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  };

  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked);
    setSelectedUserIds(checked ? new Set(users.map(u => u.id)) : new Set());
  };

  const addListItem = (setter: React.Dispatch<React.SetStateAction<UpdateItem[]>>) => {
    setter(prev => [...prev, { title: '', description: '' }]);
  };

  const updateListItem = (setter: React.Dispatch<React.SetStateAction<UpdateItem[]>>, index: number, field: 'title' | 'description', value: string) => {
    setter(prev => prev.map((item, i) => i === index ? { ...item, [field]: value } : item));
  };

  const removeListItem = (setter: React.Dispatch<React.SetStateAction<UpdateItem[]>>, index: number) => {
    setter(prev => prev.filter((_, i) => i !== index));
  };

  // Build email HTML
  const emailHtml = useMemo(() => {
    switch (activeTemplate) {
      case 'tool-announcement':
        return generateToolAnnouncementHtml(selectedTools, toolMessage, emailImages);
      case 'discount':
        return generateDiscountHtml(discountCode, discountValue, discountHeadline, discountBody, discountExpiry, ctaText, ctaUrl, emailImages);
      case 'product-update':
        return generateProductUpdateHtml(updateHeadline, updateIntro, updateItems.filter(u => u.title.trim()), ctaText, ctaUrl, emailImages);
      case 'tips':
        return generateTipsHtml(tipsHeadline, tipsIntro, tipItems.filter(t => t.title.trim()), ctaText, ctaUrl, emailImages);
      case 'custom':
        return generateCustomHtml(customHeadline, customBody, ctaText, ctaUrl, emailImages);
      default:
        return '';
    }
  }, [activeTemplate, selectedTools, toolMessage, discountCode, discountValue, discountHeadline, discountBody, discountExpiry, updateHeadline, updateIntro, updateItems, tipsHeadline, tipsIntro, tipItems, customHeadline, customBody, ctaText, ctaUrl, emailImages]);

  const canSend = useMemo(() => {
    if (recipientEmails.length === 0) return false;
    if (!subject.trim()) return false;
    switch (activeTemplate) {
      case 'tool-announcement': return selectedTools.length > 0;
      case 'discount': return !!(discountValue.trim());
      case 'product-update': return updateItems.some(u => u.title.trim());
      case 'tips': return tipItems.some(t => t.title.trim());
      case 'custom': return !!(customBody.trim());
      default: return false;
    }
  }, [activeTemplate, recipientEmails, subject, selectedTools, discountValue, updateItems, tipItems, customBody]);

  // Set default subject when switching templates
  const handleTemplateChange = (template: EmailTemplate) => {
    setActiveTemplate(template);
    const defaults: Record<EmailTemplate, string> = {
      'tool-announcement': '🚀 New Tools Available on Floowy.ai!',
      'discount': '🎉 Special Offer — Limited Time!',
      'product-update': '⚡ What\'s New at Floowy.ai',
      'tips': '💡 Tips & Tricks to Level Up Your Content',
      'custom': '',
    };
    if (!subject || Object.values(defaults).includes(subject)) {
      setSubject(defaults[template]);
    }
  };

  // Send / Schedule
  const handleSend = async () => {
    if (!canSend) {
      toast({ title: "Missing fields", description: "Fill in required fields and select recipients.", variant: "destructive" });
      return;
    }
    if (scheduleMode === 'later') {
      if (!scheduleDate) {
        toast({ title: "No date selected", description: "Pick a date for the scheduled send.", variant: "destructive" });
        return;
      }
      return handleSchedule();
    }

    setIsSending(true);
    try {
      const adminToken = localStorage.getItem('admin_token');
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-admin-newsletter`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            'admin-token': adminToken || '',
          },
          body: JSON.stringify({ subject, htmlContent: emailHtml, recipientEmails }),
        }
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to send emails');
      toast({
        title: "Emails Sent!",
        description: `Successfully sent to ${data.successCount} recipients${data.failCount ? `, ${data.failCount} failed` : ''}.`,
      });
    } catch (error: any) {
      console.error('Error sending:', error);
      toast({ title: "Error", description: error.message || "Failed to send emails", variant: "destructive" });
    } finally {
      setIsSending(false);
    }
  };

  const handleSchedule = async () => {
    if (!scheduleDate) return;
    const [hours, minutes] = scheduleTime.split(':').map(Number);
    const scheduledAt = createAmsterdamDate(scheduleDate, hours, minutes);

    setIsSending(true);
    try {
      const adminToken = localStorage.getItem('admin_token');
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/schedule-newsletter`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            'admin-token': adminToken || '',
          },
          body: JSON.stringify({ subject, htmlContent: emailHtml, recipientEmails, scheduledAt }),
        }
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to schedule');
      toast({
        title: "Email Scheduled! 🕐",
        description: `Scheduled for ${format(scheduleDate, 'MMM d, yyyy')} at ${scheduleTime} (Amsterdam) to ${recipientEmails.length} recipients.`,
      });
      setScheduleDate(undefined);
      setScheduleTime("09:00");
      setScheduleMode('now');
    } catch (error: any) {
      console.error('Error scheduling:', error);
      toast({ title: "Error", description: error.message || "Failed to schedule email", variant: "destructive" });
    } finally {
      setIsSending(false);
    }
  };

  // ============= LIST ITEM EDITOR =============
  const renderListEditor = (items: UpdateItem[], setter: React.Dispatch<React.SetStateAction<UpdateItem[]>>, itemLabel: string) => (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div key={i} className="flex gap-2 items-start">
          <div className="flex-1 space-y-1.5">
            <Input
              value={item.title}
              onChange={e => updateListItem(setter, i, 'title', e.target.value)}
              placeholder={`${itemLabel} title...`}
              className="text-sm"
            />
            <Input
              value={item.description}
              onChange={e => updateListItem(setter, i, 'description', e.target.value)}
              placeholder={`${itemLabel} description...`}
              className="text-sm"
            />
          </div>
          {items.length > 1 && (
            <Button variant="ghost" size="icon" className="shrink-0 mt-1" onClick={() => removeListItem(setter, i)}>
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={() => addListItem(setter)}>
        + Add {itemLabel}
      </Button>
    </div>
  );

  // ============= RENDER =============
  return (
    <Tabs defaultValue="compose" className="space-y-4">
      <div className="flex items-center gap-3 mb-2">
        <Mail className="w-5 h-5 text-primary" />
        <h2 className="text-xl font-semibold">Email Campaign</h2>
        <TabsList className="ml-auto">
          <TabsTrigger value="compose" className="gap-1.5"><Send className="w-3.5 h-3.5" />Compose</TabsTrigger>
          <TabsTrigger value="scheduled" className="gap-1.5"><Clock className="w-3.5 h-3.5" />Scheduled</TabsTrigger>
          <TabsTrigger value="sent" className="gap-1.5"><Inbox className="w-3.5 h-3.5" />Sent Box</TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="compose">
      <div className="space-y-6">

      {/* Template Selector */}
      <div>
        <label className="text-sm font-medium text-muted-foreground mb-2 block">Email Type</label>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          {EMAIL_TEMPLATES.map(template => (
            <button
              key={template.id}
              onClick={() => handleTemplateChange(template.id)}
              className={cn(
                "flex flex-col items-center gap-1.5 p-3 rounded-lg border text-center transition-all",
                activeTemplate === template.id
                  ? "border-primary bg-primary/5 text-primary shadow-sm"
                  : "border-border hover:border-primary/30 hover:bg-muted/50 text-muted-foreground"
              )}
            >
              <template.icon className="w-5 h-5" />
              <span className="text-xs font-semibold leading-tight">{template.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Subject */}
      <div>
        <label className="text-sm font-medium text-muted-foreground mb-1 block">Email Subject</label>
        <Input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Email subject line" />
      </div>

      {/* Template-specific fields */}
      {activeTemplate === 'tool-announcement' && (
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">Select Tools to Announce</label>
            <div className="flex flex-wrap gap-2 mb-3">
              {tools.map(tool => (
                <Badge
                  key={tool.id}
                  variant={isToolSelected(tool.display_name) ? "default" : "outline"}
                  className="cursor-pointer px-3 py-1.5 text-sm transition-colors"
                  onClick={() => toggleTool(tool)}
                >
                  {tool.display_name}
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input value={customToolName} onChange={e => setCustomToolName(e.target.value)} placeholder="Custom tool name..." className="max-w-[200px]" onKeyDown={e => e.key === 'Enter' && addCustomTool()} />
              <Input value={customToolDesc} onChange={e => setCustomToolDesc(e.target.value)} placeholder="Tool description..." className="flex-1" onKeyDown={e => e.key === 'Enter' && addCustomTool()} />
              <Button variant="outline" size="sm" onClick={addCustomTool} disabled={!customToolName.trim()}>Add</Button>
            </div>
            {selectedTools.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {selectedTools.map(tool => (
                  <Badge key={tool.name} className="gap-1" title={tool.description}>
                    {tool.name}
                    <X className="w-3 h-3 cursor-pointer" onClick={() => removeTool(tool.name)} />
                  </Badge>
                ))}
              </div>
            )}
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-1 block">Additional Message (optional)</label>
            <Textarea value={toolMessage} onChange={e => setToolMessage(e.target.value)} placeholder="Add any extra message..." rows={3} />
          </div>
        </div>
      )}

      {activeTemplate === 'discount' && (
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-1 block">Headline</label>
            <Input value={discountHeadline} onChange={e => setDiscountHeadline(e.target.value)} placeholder="Special Offer Just For You! 🎉" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-1 block">Discount Value *</label>
              <Input value={discountValue} onChange={e => setDiscountValue(e.target.value)} placeholder="e.g. 20% OFF, €10 OFF" />
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-1 block">Promo Code</label>
              <Input value={discountCode} onChange={e => setDiscountCode(e.target.value)} placeholder="e.g. SAVE20" className="uppercase" />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-1 block">Expiry Date (optional)</label>
            <Input value={discountExpiry} onChange={e => setDiscountExpiry(e.target.value)} placeholder="e.g. March 31, 2026" />
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-1 block">Body Text</label>
            <Textarea value={discountBody} onChange={e => setDiscountBody(e.target.value)} placeholder="Tell them why this deal is amazing..." rows={3} />
          </div>
        </div>
      )}

      {activeTemplate === 'product-update' && (
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-1 block">Headline</label>
            <Input value={updateHeadline} onChange={e => setUpdateHeadline(e.target.value)} placeholder="Product Update ⚡" />
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-1 block">Intro Text</label>
            <Textarea value={updateIntro} onChange={e => setUpdateIntro(e.target.value)} placeholder="Here's what we've been working on..." rows={2} />
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">Updates *</label>
            {renderListEditor(updateItems, setUpdateItems, 'Update')}
          </div>
        </div>
      )}

      {activeTemplate === 'tips' && (
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-1 block">Headline</label>
            <Input value={tipsHeadline} onChange={e => setTipsHeadline(e.target.value)} placeholder="Tips & Tricks 💡" />
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-1 block">Intro Text</label>
            <Textarea value={tipsIntro} onChange={e => setTipsIntro(e.target.value)} placeholder="Get the most out of Floowy.ai with these tips..." rows={2} />
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">Tips *</label>
            {renderListEditor(tipItems, setTipItems, 'Tip')}
          </div>
        </div>
      )}

      {activeTemplate === 'custom' && (
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-1 block">Headline</label>
            <Input value={customHeadline} onChange={e => setCustomHeadline(e.target.value)} placeholder="Email heading..." />
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-1 block">Body *</label>
            <Textarea value={customBody} onChange={e => setCustomBody(e.target.value)} placeholder="Write your email content here..." rows={6} />
          </div>
        </div>
      )}

      {/* Image Attachments */}
      <div>
        <label className="text-sm font-medium text-muted-foreground mb-2 block">Images (optional)</label>
        <div className="space-y-3">
          {emailImages.map((img, i) => (
            <div key={i} className="flex items-center gap-3 p-3 border rounded-lg bg-muted/30">
              <img src={img.url} alt={img.name} className="w-16 h-16 object-cover rounded border" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{img.name}</p>
                <div className="flex items-center gap-2 mt-1">
                  <label className="text-xs text-muted-foreground">Width:</label>
                  <Select value={img.width || '100%'} onValueChange={(v) => updateImageWidth(i, v)}>
                    <SelectTrigger className="h-7 w-24 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="100%">Full width</SelectItem>
                      <SelectItem value="75%">75%</SelectItem>
                      <SelectItem value="50%">50%</SelectItem>
                      <SelectItem value="300px">300px</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button variant="ghost" size="icon" className="shrink-0 text-destructive hover:text-destructive" onClick={() => removeImage(i)}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
          <div>
            <input
              ref={imageInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={handleImageUpload}
              className="hidden"
            />
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              disabled={isUploadingImage}
              onClick={() => imageInputRef.current?.click()}
            >
              {isUploadingImage ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImagePlus className="w-4 h-4" />}
              {isUploadingImage ? 'Uploading...' : 'Add Image'}
            </Button>
            <p className="text-xs text-muted-foreground mt-1">JPG, PNG, WebP, GIF • Max 5MB • Images are hosted and embedded in the email</p>
          </div>
        </div>
      </div>

      {/* CTA (shared for non-tool-announcement) */}
      {activeTemplate !== 'tool-announcement' && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-1 block">CTA Button Text</label>
            <Input value={ctaText} onChange={e => setCtaText(e.target.value)} placeholder="e.g. Get Started →" />
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-1 block">CTA URL</label>
            <Input value={ctaUrl} onChange={e => setCtaUrl(e.target.value)} placeholder="https://floowy.ai/..." />
          </div>
        </div>
      )}

      {/* Recipient Selection */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-muted-foreground">
            Recipients ({selectedUserIds.size} selected)
          </label>
          <div className="flex items-center gap-2">
            <Button
              variant={scheduleMode === 'now' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setScheduleMode('now')}
              className="gap-1.5 h-7 text-xs"
            >
              <Send className="w-3 h-3" />
              Send Now
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => { setScheduleMode('later'); setScheduleDialogOpen(true); }}
              className="gap-1.5 h-7 text-xs"
            >
              <Clock className="w-3 h-3" />
              Schedule
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-3 mb-3">
          <div className="flex items-center gap-2">
            <Checkbox checked={selectAll} onCheckedChange={(checked) => handleSelectAll(!!checked)} />
            <span className="text-sm font-medium">Select All ({users.length})</span>
          </div>
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Search users..." className="pl-9" />
          </div>
        </div>
        <div className="border rounded-lg max-h-60 overflow-y-auto">
          {filteredUsers.length === 0 ? (
            <p className="text-sm text-muted-foreground p-4 text-center">No users found</p>
          ) : (
            filteredUsers.map(user => (
              <label
                key={user.id}
                className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted/50 cursor-pointer border-b last:border-b-0"
              >
                <Checkbox checked={selectedUserIds.has(user.id)} onCheckedChange={() => toggleUser(user.id)} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{user.full_name || 'No name'}</p>
                  <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                </div>
                <Badge variant="outline" className="text-xs shrink-0">{user.plan}</Badge>
              </label>
            ))
          )}
        </div>
      </div>

      {/* Schedule Dialog */}
      <Dialog open={scheduleDialogOpen} onOpenChange={setScheduleDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Schedule Email
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn("w-full justify-start text-left font-normal", !scheduleDate && "text-muted-foreground")}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {scheduleDate ? format(scheduleDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={scheduleDate}
                    onSelect={setScheduleDate}
                    disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Time (Amsterdam 🇳🇱)</label>
              <Select value={scheduleTime} onValueChange={setScheduleTime}>
                <SelectTrigger>
                  <SelectValue placeholder="Select time" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {TIME_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              className="w-full gap-2"
              disabled={!scheduleDate || isSending}
              onClick={() => { setScheduleDialogOpen(false); handleSend(); }}
            >
              {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Clock className="w-4 h-4" />}
              Schedule for {recipientEmails.length} {recipientEmails.length === 1 ? 'User' : 'Users'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <Button variant="outline" onClick={() => setPreviewOpen(true)} disabled={!canSend} className="gap-2">
          <Eye className="w-4 h-4" />
          Preview Email
        </Button>
        <Button onClick={() => { setScheduleMode('now'); handleSend(); }} disabled={isSending || !canSend} className="gap-2">
          {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          Send to {recipientEmails.length} {recipientEmails.length === 1 ? 'User' : 'Users'}
        </Button>
        <Button
          variant="outline"
          onClick={() => { setScheduleMode('later'); setScheduleDialogOpen(true); }}
          disabled={isSending || !canSend}
          className="gap-2"
        >
          <Clock className="w-4 h-4" />
          Schedule
        </Button>
      </div>

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5" />
              Email Preview
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="font-medium">Subject:</span> {subject}
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="font-medium">To:</span> {recipientEmails.length} recipients
            </div>
            {scheduleMode === 'later' && scheduleDate && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span className="font-medium">Scheduled:</span> {format(scheduleDate, 'MMM d, yyyy')} at {scheduleTime} (Amsterdam)
              </div>
            )}
            <div className="border rounded-lg overflow-hidden">
              <iframe srcDoc={emailHtml} className="w-full h-[500px] border-0" title="Email Preview" />
            </div>
          </div>
        </DialogContent>
      </Dialog>
      </div>
      </TabsContent>

      <TabsContent value="scheduled">
        <AdminScheduledEmails />
      </TabsContent>

      <TabsContent value="sent">
        <AdminSentBox />
      </TabsContent>
    </Tabs>
  );
}
