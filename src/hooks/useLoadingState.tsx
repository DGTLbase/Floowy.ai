import { useState } from "react";
import { LoadingContext } from "@/components/LoadingState";

interface LoadingStateHook {
  isLoading: boolean;
  context: LoadingContext;
  message?: string;
  startLoading: (context?: LoadingContext, message?: string) => void;
  stopLoading: () => void;
  setContext: (context: LoadingContext, message?: string) => void;
}

export const useLoadingState = (
  initialContext: LoadingContext = "default"
): LoadingStateHook => {
  const [isLoading, setIsLoading] = useState(false);
  const [context, setContextState] = useState<LoadingContext>(initialContext);
  const [message, setMessage] = useState<string | undefined>();

  const startLoading = (ctx?: LoadingContext, msg?: string) => {
    setIsLoading(true);
    if (ctx) setContextState(ctx);
    if (msg) setMessage(msg);
  };

  const stopLoading = () => {
    setIsLoading(false);
  };

  const setContext = (ctx: LoadingContext, msg?: string) => {
    setContextState(ctx);
    if (msg) setMessage(msg);
  };

  return {
    isLoading,
    context,
    message,
    startLoading,
    stopLoading,
    setContext,
  };
};
