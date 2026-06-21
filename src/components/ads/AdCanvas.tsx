interface AdCanvasProps {
  imageUrl: string | null;
  aspectRatio?: string;
}

const AdCanvas = ({ 
  imageUrl, 
  aspectRatio = "1/1"
}: AdCanvasProps) => {
  return (
    <div
      className="relative w-full bg-muted rounded-lg overflow-hidden"
      style={{ aspectRatio }}
    >
      {imageUrl ? (
        <img
          src={imageUrl}
          alt="Generated ad"
          className="w-full h-full object-cover"
          draggable={false}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
          <p className="text-center">
            Upload a product and generate<br />to see your ad here
          </p>
        </div>
      )}
    </div>
  );
};

export default AdCanvas;