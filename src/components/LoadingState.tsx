interface LoadingStateProps {
  context?: LoadingContext;
  message?: string;
  fullScreen?: boolean;
}

export type LoadingContext = 
  | "auth" 
  | "data" 
  | "upload" 
  | "generation" 
  | "processing"
  | "default";

const contextMessages: Record<LoadingContext, string> = {
  auth: "Authenticating...",
  data: "Fetching data...",
  upload: "Uploading files...",
  generation: "Generating content...",
  processing: "Processing...",
  default: "Loading...",
};

export const LoadingState = ({ 
  context = "default", 
  message,
  fullScreen = false 
}: LoadingStateProps) => {
  const displayMessage = message || contextMessages[context];

  const content = (
    <div className="flex flex-col items-center justify-center gap-4">
      {/* Spinner with logo */}
      <div className="relative flex items-center justify-center">
        {/* Center logo */}
        <div className="absolute z-10 flex items-center justify-center w-12 h-12 rounded-full bg-primary">
          <img
            src="/favicon.png"
            alt="Floowy AI"
            className="w-8 h-8 brightness-0 invert"
          />
        </div>
        {/* Rotating ring */}
        <svg className="w-20 h-20 animate-spin" viewBox="0 0 80 80">
          <circle
            cx="40"
            cy="40"
            r="32"
            fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth="4"
            strokeDasharray="150 50"
            strokeLinecap="round"
            opacity="0.7"
          />
        </svg>
      </div>

      {/* Loading message */}
      <p className="text-sm font-medium text-muted-foreground">{displayMessage}</p>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
        {content}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center w-full min-h-[400px]">
      {content}
    </div>
  );
};
