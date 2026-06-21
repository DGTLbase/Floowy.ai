import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Upload, CheckCircle2 } from "lucide-react";

const UploadEmailHeader = () => {
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState(false);

  const uploadHeader = async () => {
    setUploading(true);
    try {
      // Fetch the image from public folder
      const response = await fetch('/email-header.png');
      const blob = await response.blob();
      
      // Upload to Supabase storage
      const { data, error } = await supabase.storage
        .from('products')
        .upload('email-header.png', blob, {
          contentType: 'image/png',
          upsert: true
        });

      if (error) throw error;

      toast.success("Email header uploaded successfully!");
      setUploaded(true);
      console.log("Upload successful:", data);
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error("Failed to upload: " + error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-md w-full space-y-8 text-center">
        <div>
          <h1 className="text-3xl font-bold mb-2">Upload Email Header</h1>
          <p className="text-muted-foreground">
            This will upload email-header.png to your products storage bucket
          </p>
        </div>

        <div className="border rounded-lg p-6 space-y-4">
          <img 
            src="/email-header.png" 
            alt="Email Header Preview" 
            className="w-full rounded"
          />
          
          <Button
            onClick={uploadHeader}
            disabled={uploading || uploaded}
            className="w-full"
            size="lg"
          >
            {uploading ? (
              <>
                <Upload className="w-4 h-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : uploaded ? (
              <>
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Uploaded Successfully
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Upload to Storage
              </>
            )}
          </Button>

          {uploaded && (
            <p className="text-sm text-green-600">
              Image uploaded! You can now close this page.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default UploadEmailHeader;
