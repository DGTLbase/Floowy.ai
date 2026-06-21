import { useEffect, useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { RefreshCw } from "lucide-react";

export function NewVersionDialog() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener("app:new-version", handler);
    return () => window.removeEventListener("app:new-version", handler);
  }, []);

  const reload = () => {
    const fn = (window as any).__floowyReload;
    if (typeof fn === "function") fn();
    else window.location.reload();
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-primary" />
            A new version is available
          </AlertDialogTitle>
          <AlertDialogDescription>
            We've just published an update to Floowy. Reload the page now to get
            the latest features and fixes.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction onClick={reload}>Reload now</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}