import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Upload, X } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface ClothingConfig {
  productFile: File;
  topsFile: File | null;
  trousersFile: File | null;
  shoesFile: File | null;
}

interface ClothingConfigModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productFiles: File[];
  onComplete: (configs: ClothingConfig[]) => void;
  mode: 'same' | 'separate';
}

export const ClothingConfigModal = ({
  open,
  onOpenChange,
  productFiles,
  onComplete,
  mode,
}: ClothingConfigModalProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [configs, setConfigs] = useState<ClothingConfig[]>([]);
  const [sharedClothing, setSharedClothing] = useState<{
    topsFile: File | null;
    trousersFile: File | null;
    shoesFile: File | null;
  }>({
    topsFile: null,
    trousersFile: null,
    shoesFile: null,
  });

  // Initialize configs when modal opens or productFiles change
  useEffect(() => {
    if (open && productFiles.length > 0) {
      if (mode === 'same') {
        // For "same" mode, create a single config
        setConfigs([{
          productFile: productFiles[0],
          topsFile: null,
          trousersFile: null,
          shoesFile: null,
        }]);
      } else {
        // For "separate" mode, create config for each product
        setConfigs(
          productFiles.map(file => ({
            productFile: file,
            topsFile: null,
            trousersFile: null,
            shoesFile: null,
          }))
        );
      }
      setCurrentIndex(0);
    }
  }, [open, productFiles, mode]);

  const currentConfig = configs[currentIndex];
  const progress = configs.length > 0 ? ((currentIndex + 1) / configs.length) * 100 : 0;

  // Don't render modal content until configs are ready
  if (!currentConfig || configs.length === 0) {
    return null;
  }

  const handleFileChange = (type: 'tops' | 'trousers' | 'shoes', file: File | null) => {
    const newConfigs = [...configs];
    newConfigs[currentIndex] = {
      ...newConfigs[currentIndex],
      [`${type}File`]: file,
    };
    setConfigs(newConfigs);
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < configs.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      // If "same" mode, apply the single config to all products
      if (mode === 'same') {
        const singleConfig = configs[0];
        const allConfigs = productFiles.map(file => ({
          productFile: file,
          topsFile: singleConfig.topsFile,
          trousersFile: singleConfig.trousersFile,
          shoesFile: singleConfig.shoesFile,
        }));
        onComplete(allConfigs);
      } else {
        onComplete(configs);
      }
      onOpenChange(false);
      // Reset state when closing
      setCurrentIndex(0);
      setConfigs([]);
    }
  };

  const handleSkip = () => {
    if (currentIndex < configs.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      // If "same" mode, apply the single config to all products
      if (mode === 'same') {
        const singleConfig = configs[0];
        const allConfigs = productFiles.map(file => ({
          productFile: file,
          topsFile: singleConfig.topsFile,
          trousersFile: singleConfig.trousersFile,
          shoesFile: singleConfig.shoesFile,
        }));
        onComplete(allConfigs);
      } else {
        onComplete(configs);
      }
      onOpenChange(false);
      // Reset state when closing
      setCurrentIndex(0);
      setConfigs([]);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'same' 
              ? `Configure Clothing (Applied to All ${productFiles.length} Products)`
              : `Configure Product ${currentIndex + 1} of ${configs.length}`
            }
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {mode === 'separate' && <Progress value={progress} className="h-2" />}

          {mode === 'separate' && (
            <div className="bg-muted rounded-lg p-4">
              <p className="text-sm font-medium mb-2">Product Image:</p>
              <div className="w-full h-48 rounded-lg overflow-hidden bg-background">
                <img
                  src={URL.createObjectURL(currentConfig.productFile)}
                  alt="Product"
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
          )}

          {mode === 'same' && (
            <div className="bg-muted rounded-lg p-4">
              <p className="text-sm font-medium mb-2">
                Upload clothing items that will be used for all {productFiles.length} products:
              </p>
            </div>
          )}

          {/* Clothing Options */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Tops Upload */}
            <div className="space-y-2" key={`tops-section-${currentIndex}`}>
              <label className="text-sm font-medium">Tops (Optional)</label>
              <div className="border-2 border-dashed border-border rounded-lg p-4 text-center hover:border-primary/50 transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange('tops', e.target.files?.[0] || null)}
                  className="hidden"
                  id={`tops-${currentIndex}`}
                  key={`tops-input-${currentIndex}`}
                />
                <label htmlFor={`tops-${currentIndex}`} className="cursor-pointer block">
                  {currentConfig.topsFile ? (
                    <div className="space-y-2">
                      <img
                        src={URL.createObjectURL(currentConfig.topsFile)}
                        alt="Tops"
                        className="w-full h-24 object-cover rounded"
                      />
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.preventDefault();
                          handleFileChange('tops', null);
                        }}
                      >
                        <X className="w-4 h-4 mr-1" />
                        Remove
                      </Button>
                    </div>
                  ) : (
                    <>
                      <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm font-medium">Upload Tops</p>
                      <p className="text-xs text-muted-foreground">PNG, JPG, WEBP</p>
                    </>
                  )}
                </label>
              </div>
            </div>

            {/* Trousers Upload */}
            <div className="space-y-2" key={`trousers-section-${currentIndex}`}>
              <label className="text-sm font-medium">Trousers (Optional)</label>
              <div className="border-2 border-dashed border-border rounded-lg p-4 text-center hover:border-primary/50 transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange('trousers', e.target.files?.[0] || null)}
                  className="hidden"
                  id={`trousers-${currentIndex}`}
                  key={`trousers-input-${currentIndex}`}
                />
                <label htmlFor={`trousers-${currentIndex}`} className="cursor-pointer block">
                  {currentConfig.trousersFile ? (
                    <div className="space-y-2">
                      <img
                        src={URL.createObjectURL(currentConfig.trousersFile)}
                        alt="Trousers"
                        className="w-full h-24 object-cover rounded"
                      />
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.preventDefault();
                          handleFileChange('trousers', null);
                        }}
                      >
                        <X className="w-4 h-4 mr-1" />
                        Remove
                      </Button>
                    </div>
                  ) : (
                    <>
                      <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm font-medium">Upload Trousers</p>
                      <p className="text-xs text-muted-foreground">PNG, JPG, WEBP</p>
                    </>
                  )}
                </label>
              </div>
            </div>

            {/* Shoes Upload */}
            <div className="space-y-2" key={`shoes-section-${currentIndex}`}>
              <label className="text-sm font-medium">Shoes (Optional)</label>
              <div className="border-2 border-dashed border-border rounded-lg p-4 text-center hover:border-primary/50 transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange('shoes', e.target.files?.[0] || null)}
                  className="hidden"
                  id={`shoes-${currentIndex}`}
                  key={`shoes-input-${currentIndex}`}
                />
                <label htmlFor={`shoes-${currentIndex}`} className="cursor-pointer block">
                  {currentConfig.shoesFile ? (
                    <div className="space-y-2">
                      <img
                        src={URL.createObjectURL(currentConfig.shoesFile)}
                        alt="Shoes"
                        className="w-full h-24 object-cover rounded"
                      />
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.preventDefault();
                          handleFileChange('shoes', null);
                        }}
                      >
                        <X className="w-4 h-4 mr-1" />
                        Remove
                      </Button>
                    </div>
                  ) : (
                    <>
                      <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm font-medium">Upload Shoes</p>
                      <p className="text-xs text-muted-foreground">PNG, JPG, WEBP</p>
                    </>
                  )}
                </label>
              </div>
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="flex gap-3 justify-between">
            {mode === 'separate' && (
              <Button 
                variant="outline" 
                onClick={handlePrevious}
                disabled={currentIndex === 0}
              >
                Previous
              </Button>
            )}
            {mode === 'same' && <div />}
            <div className="flex gap-3">
              <Button variant="outline" onClick={handleSkip}>
                {mode === 'same' ? 'Skip All' : (currentIndex < configs.length - 1 ? 'Skip' : 'Skip All Remaining')}
              </Button>
              <Button onClick={handleNext}>
                {mode === 'same' ? 'Apply To All & Generate' : (currentIndex < configs.length - 1 ? 'Next Product' : 'Finish & Generate')}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
