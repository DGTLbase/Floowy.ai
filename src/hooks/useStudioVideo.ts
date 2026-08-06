import { useCallback, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useGenerationProgress } from "@/hooks/useGenerationProgress";
import { checkAndSendOutOfCreditsEmail, deductCredits } from "@/hooks/useCreditDeduction";

/**
 * "Make a video" from a finished photo, for any studio.
 *
 * Fashion Studio and Ambience Studio each grew their own copy of this flow
 * (credit gate → invoke → poll → deduct → save → toast, ~110 lines). Rather
 * than add a third and fourth copy for Idea Studio and Fashion Studio Pro, the
 * flow lives here once and the studio supplies only what differs: which tool
 * name to record, what to say, and how long/what shape the clip should be.
 */

export interface UseStudioVideoOptions {
  /** Recorded as generations.tool_name, e.g. "idea-studio-video". */
  toolName: string;
  /** Used when the modal is bypassed and no style prompt was built. */
  defaultPrompt: string;
  /** Shown in the success toast and the saved generation row. */
  label: string;
  user: { id: string; email?: string | null } | null;
  credits: number;
  setCredits: (n: number) => void;
  isAdmin: boolean;
  /** Called when the user cannot afford the clip, to open the purchase dialog. */
  onNeedCredits?: () => void;
  userName?: string;
  creditCost?: number;
  aspectRatio?: "9:16" | "16:9";
  /** Omni reference-to-video accepts 3–10 seconds. */
  durationSeconds?: number;
}

export const useStudioVideo = ({
  toolName,
  defaultPrompt,
  label,
  user,
  credits,
  setCredits,
  isAdmin,
  onNeedCredits,
  userName,
  creditCost = 5,
  aspectRatio = "9:16",
  durationSeconds = 6,
}: UseStudioVideoOptions) => {
  const { toast } = useToast();
  const videoGenProgress = useGenerationProgress();

  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [videoModalImageUrl, setVideoModalImageUrl] = useState("");
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
  const [videoResultModalOpen, setVideoResultModalOpen] = useState(false);

  const openVideoModal = useCallback((imageUrl: string) => {
    setVideoModalImageUrl(imageUrl);
    setVideoModalOpen(true);
  }, []);

  const handleMakeVideo = useCallback(
    async (imageUrl: string, prompt?: string) => {
      if (!isAdmin && credits < creditCost) {
        toast({
          title: "Not enough credits",
          description: `You need ${creditCost} credits to generate a video. You have ${credits}.`,
          variant: "destructive",
        });
        onNeedCredits?.();
        return;
      }

      setVideoModalOpen(false);
      setIsGeneratingVideo(true);
      setGeneratedVideoUrl(null);
      videoGenProgress.start();

      try {
        const { data: queueData, error: queueError } = await supabase.functions.invoke(
          "generate-fashion-video",
          {
            body: {
              action: "generate",
              imageUrl,
              prompt: prompt || defaultPrompt,
              aspect_ratio: aspectRatio,
              duration_seconds: durationSeconds,
            },
          },
        );

        if (queueError) throw queueError;
        if (queueData?.error) {
          throw new Error(
            typeof queueData.error === "string" ? queueData.error : JSON.stringify(queueData.error),
          );
        }

        const requestId = queueData.request_id;
        const statusUrl = queueData.status_url;
        const responseUrl = queueData.response_url;

        videoGenProgress.setGenerating(`AI is creating your ${label.toLowerCase()}...`);

        let completed = false;
        let attempts = 0;
        const maxAttempts = 120;

        while (!completed && attempts < maxAttempts) {
          const waitTime = Math.min(4000 + attempts * 300, 10000);
          await new Promise((resolve) => setTimeout(resolve, waitTime));
          attempts++;

          const { data: statusData, error: statusError } = await supabase.functions.invoke(
            "generate-fashion-video",
            { body: { action: "status", requestId, statusUrl, responseUrl } },
          );

          if (statusError) throw statusError;

          if (statusData?.status === "COMPLETED" && statusData?.video_url) {
            completed = true;
            videoGenProgress.setFinalizing("Preparing your video...");
            await new Promise((resolve) => setTimeout(resolve, 1000));
            setGeneratedVideoUrl(statusData.video_url);
            setVideoResultModalOpen(true);

            if (!isAdmin && user?.id) {
              try {
                const newBalance = await deductCredits(user.id, creditCost);
                setCredits(newBalance);
                await checkAndSendOutOfCreditsEmail(newBalance, user.email ?? "", userName);
              } catch (creditError) {
                console.error("Credit deduction error:", creditError);
              }
            }

            if (user?.id) {
              try {
                await supabase.from("generations").insert({
                  user_id: user.id,
                  original_image_url: imageUrl,
                  generated_image_url: statusData.video_url,
                  prompt: prompt || defaultPrompt,
                  status: "completed",
                  tool_name: toolName,
                });
              } catch (saveError) {
                console.error("Error saving video to generations:", saveError);
              }
            }

            videoGenProgress.complete();
            toast({ title: "Video Ready!", description: `Your ${label.toLowerCase()} has been generated.` });
          } else if (statusData?.status === "FAILED") {
            throw new Error(
              typeof statusData?.error === "string" ? statusData.error : "Video generation failed",
            );
          }
        }

        if (!completed) throw new Error("Video generation timed out");
      } catch (error: any) {
        console.error("Video generation error:", error);
        const message =
          typeof error?.message === "string" ? error.message : "Something went wrong. Please try again.";
        videoGenProgress.fail(message);
        toast({ title: "Video Generation Failed", description: message, variant: "destructive" });
      } finally {
        setIsGeneratingVideo(false);
      }
    },
    [
      aspectRatio,
      credits,
      creditCost,
      defaultPrompt,
      durationSeconds,
      isAdmin,
      label,
      onNeedCredits,
      setCredits,
      toast,
      toolName,
      user,
      userName,
      videoGenProgress,
    ],
  );

  const handleDownloadVideo = useCallback(async () => {
    if (!generatedVideoUrl) return;
    try {
      const response = await fetch(generatedVideoUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `floowy-${toolName}-${Date.now()}.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      // Cross-origin download blocked — open it so the user can save manually.
      window.open(generatedVideoUrl, "_blank", "noopener,noreferrer");
    }
  }, [generatedVideoUrl, toolName]);

  return {
    videoModalOpen,
    setVideoModalOpen,
    videoModalImageUrl,
    openVideoModal,
    isGeneratingVideo,
    generatedVideoUrl,
    setGeneratedVideoUrl,
    videoResultModalOpen,
    setVideoResultModalOpen,
    handleMakeVideo,
    handleDownloadVideo,
    videoGenProgress,
  };
};
