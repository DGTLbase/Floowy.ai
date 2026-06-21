import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Upload, Pencil, ImagePlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import BackendLayout from "@/components/BackendLayout";
import PageMeta from "@/components/PageMeta";
import ImageEditModal from "@/components/ImageEditModal";
import { useAdminCheck } from "@/hooks/useAdminCheck";

const Editor = () => {
  const [user, setUser] = useState<any>(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAdmin } = useAdminCheck();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) navigate("/auth");
      else setUser(session.user);
    });
  }, [navigate]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({ title: "Invalid file", description: "Please upload an image file", variant: "destructive" });
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      toast({ title: "File too large", description: "Max 50MB", variant: "destructive" });
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setUploadedImageUrl(objectUrl);
    setIsEditModalOpen(true);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      const objectUrl = URL.createObjectURL(file);
      setUploadedImageUrl(objectUrl);
      setIsEditModalOpen(true);
    }
  };

  return (
    <BackendLayout>
      <PageMeta title="Image Editor | Floowy.ai" description="Edit your images with AI-powered tools" canonicalUrl="https://floowy.ai/editor" />
      <div className="p-6 md:p-8 max-w-4xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
              <Pencil className="w-5 h-5 text-primary" />
            </div>
            <h1 className="text-3xl font-bold">
              <span className="text-foreground">Image</span> <span className="text-primary">Editor</span>
            </h1>
          </div>
          <p className="text-muted-foreground">
            Upload any image and edit it with AI-powered tools — brush, magic wand, inpainting, and more.
          </p>
        </div>

        {/* Upload Area */}
        <Card
          className="p-16 border-2 border-dashed border-border dark:border-muted-foreground/40 bg-card hover:border-primary/50 transition-colors cursor-pointer group"
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
        >
          <div className="text-center">
            <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:bg-primary/20 transition-colors">
              <ImagePlus className="w-10 h-10 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Upload an image to edit</h3>
            <p className="text-muted-foreground text-sm mb-6">
              Drag and drop or click to browse. Supports JPG, PNG, WebP (max 50MB)
            </p>
            <Button className="gap-2">
              <Upload className="w-4 h-4" />
              Choose Image
            </Button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileUpload}
          />
        </Card>

        {/* Recent edits hint */}
        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground">
            Looking for your previous edits? Check{" "}
            <button onClick={() => navigate("/my-generations")} className="text-primary hover:underline font-medium">
              My Generations
            </button>
          </p>
        </div>
      </div>

      {uploadedImageUrl && (
        <ImageEditModal
          open={isEditModalOpen}
          onOpenChange={(open) => {
            setIsEditModalOpen(open);
            if (!open) setUploadedImageUrl(null);
          }}
          imageUrl={uploadedImageUrl}
          onEditComplete={async (newUrl) => {
            if (!user) return;
            await supabase.from("generations").insert({
              user_id: user.id,
              prompt: "Custom edit",
              original_image_url: uploadedImageUrl,
              generated_image_url: newUrl,
              status: "completed",
              tool_name: "editor",
            });
            toast({ title: "Edit saved!", description: "Your edited image has been saved to My Generations" });
            setUploadedImageUrl(newUrl);
          }}
          isAdmin={isAdmin}
        />
      )}
    </BackendLayout>
  );
};

export default Editor;
