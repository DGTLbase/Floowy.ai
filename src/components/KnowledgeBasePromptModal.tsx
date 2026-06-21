 import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
 import { Button } from "@/components/ui/button";
 import { BookOpen, Gift, Sparkles } from "lucide-react";
 import { useNavigate } from "react-router-dom";
import { useGalleryItems } from "@/hooks/useGalleryItems";
 
 interface KnowledgeBasePromptModalProps {
   open: boolean;
   onOpenChange: (open: boolean) => void;
 }
 
 const KnowledgeBasePromptModal = ({ open, onOpenChange }: KnowledgeBasePromptModalProps) => {
   const navigate = useNavigate();
  const galleryItems = useGalleryItems();
 
   const handleLearnClick = () => {
     onOpenChange(false);
    navigate("/knowledge-base?bonus=1");
   };
 
   return (
     <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
         <DialogHeader className="text-center">
           <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center mb-4">
             <BookOpen className="w-8 h-8 text-white" />
           </div>
           <DialogTitle className="text-2xl font-bold text-center">
             Learn How to Create Amazing Content
           </DialogTitle>
           <DialogDescription className="text-center text-base mt-2">
             Our knowledge base contains step-by-step guides to help you get the most out of Floowy.ai's powerful tools.
           </DialogDescription>
         </DialogHeader>
 
        {/* Scrolling Gallery */}
        <div className="relative overflow-hidden rounded-xl my-4">
          <div className="flex gap-3 w-max animate-scroll-left">
            {[...galleryItems, ...galleryItems].map((item, index) => (
              <div
                key={index}
                className="flex-shrink-0 w-32 h-40 rounded-lg overflow-hidden shadow-md"
              >
               {item.type === "video" ? (
                 <video
                   src={item.src}
                   className="w-full h-full object-cover"
                   autoPlay
                   loop
                   muted
                   playsInline
                 />
               ) : (
                 <img
                   src={item.src}
                   alt={item.alt}
                   className="w-full h-full object-cover"
                 />
               )}
              </div>
            ))}
          </div>
        </div>

         <div className="bg-gradient-to-r from-primary/10 to-primary-glow/10 rounded-lg p-4 my-4 border border-primary/20">
           <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
               <Gift className="w-5 h-5 text-primary" />
             </div>
             <div>
                <p className="font-semibold text-foreground flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                 Earn 2 Free Credits!
               </p>
               <p className="text-sm text-muted-foreground">
                 Visit the knowledge base to claim your bonus
               </p>
             </div>
           </div>
         </div>
 
         <DialogFooter className="flex flex-col sm:flex-row gap-2">
           <Button
             variant="outline"
             onClick={() => onOpenChange(false)}
             className="w-full sm:w-auto"
           >
             Maybe Later
           </Button>
           <Button
             onClick={handleLearnClick}
             className="w-full sm:w-auto bg-gradient-to-r from-primary to-primary-glow hover:shadow-glow"
           >
             <BookOpen className="w-4 h-4 mr-2" />
             Learn How to Use the Tools
           </Button>
         </DialogFooter>
       </DialogContent>
     </Dialog>
   );
 };
 
 export default KnowledgeBasePromptModal;