import { LoadingState } from "./LoadingState";

/**
 * Example usage of LoadingState component in different contexts
 * 
 * This file demonstrates how to use the LoadingState component
 * throughout your app for different loading scenarios.
 */

export const LoadingStateExamples = () => {
  return (
    <div className="space-y-8 p-8">
      <h1 className="text-2xl font-bold">Loading State Examples</h1>
      
      {/* Authentication Loading */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Authentication</h2>
        <LoadingState context="auth" />
      </div>

      {/* Data Fetching Loading */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Data Fetching</h2>
        <LoadingState context="data" message="Loading your content..." />
      </div>

      {/* Upload Loading */}
      <div>
        <h2 className="text-lg font-semibold mb-4">File Upload</h2>
        <LoadingState context="upload" message="Uploading images..." />
      </div>

      {/* Generation Loading */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Content Generation</h2>
        <LoadingState context="generation" message="Creating your AI content..." />
      </div>

      {/* Processing Loading */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Processing</h2>
        <LoadingState context="processing" message="Processing your request..." />
      </div>

      {/* Full Screen Example */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Full Screen (toggle to see)</h2>
        <button 
          onClick={() => {
            const demo = document.getElementById('fullscreen-demo');
            if (demo) demo.style.display = demo.style.display === 'none' ? 'block' : 'none';
          }}
          className="px-4 py-2 bg-primary text-primary-foreground rounded"
        >
          Toggle Full Screen Loading
        </button>
        <div id="fullscreen-demo" style={{ display: 'none' }}>
          <LoadingState context="generation" fullScreen />
        </div>
      </div>
    </div>
  );
};

// Usage examples in real components:

// Example 1: In a data fetching component
export const DataFetchingExample = () => {
  const isLoading = true; // Replace with actual loading state
  
  if (isLoading) {
    return <LoadingState context="data" />;
  }
  
  return <div>Your data here</div>;
};

// Example 2: With custom hook
export const CustomHookExample = () => {
  // Use with useLoadingState hook:
  // const { isLoading, context, message } = useLoadingState();
  // 
  // if (isLoading) {
  //   return <LoadingState context={context} message={message} />;
  // }
  
  return <div>Your content</div>;
};

// Example 3: Full screen overlay during upload
export const UploadExample = () => {
  const isUploading = false; // Replace with actual state
  
  return (
    <>
      {isUploading && <LoadingState context="upload" fullScreen />}
      <div>Your upload form here</div>
    </>
  );
};
