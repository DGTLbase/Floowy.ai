import UploadArea from "@/components/UploadArea";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

/**
 * Fabric close-up + material description + Don'ts.
 *
 * One component shared by Fashion Studio and Fashion Studio Pro so the two
 * flows stay identical, and built on the existing UploadArea rather than a new
 * one-off uploader.
 *
 * Every field is optional and independent: leaving them all empty must produce
 * exactly the generation the user would have got before these fields existed.
 */
export interface FabricAndDontsValues {
  fabricFile: File | null;
  fabricDescription: string;
  donts: string;
}

interface Props extends FabricAndDontsValues {
  onFabricFileChange: (file: File | null) => void;
  onFabricDescriptionChange: (value: string) => void;
  onDontsChange: (value: string) => void;
  /** Suffix for input ids so two instances on one page stay unique. */
  idPrefix?: string;
}

const FabricAndDontsFields = ({
  fabricFile,
  fabricDescription,
  donts,
  onFabricFileChange,
  onFabricDescriptionChange,
  onDontsChange,
  idPrefix = "fs",
}: Props) => (
  <>
    <div className="bg-card rounded-xl border border-border p-6" data-walkthrough-target="fs-fabric">
      <h3 className="text-lg font-semibold mb-1">Fabric (Optional)</h3>
      <p className="text-sm text-muted-foreground mb-4">
        Add a close-up of the real fabric and/or describe the material, so the texture, weave and
        sheen match the actual product instead of being invented. Use either, or both.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <UploadArea
          label="Fabric close-up (Optional)"
          onFileSelect={onFabricFileChange}
          selectedFile={fabricFile}
          compact
        />
        <div className="space-y-1.5">
          <label className="text-sm font-medium" htmlFor={`${idPrefix}-fabric-description`}>
            Describe the material (Optional)
          </label>
          <Input
            id={`${idPrefix}-fabric-description`}
            value={fabricDescription}
            onChange={(e) => onFabricDescriptionChange(e.target.value)}
            placeholder="e.g. wool, ribbed knit, recycled cotton"
          />
          <p className="text-xs text-muted-foreground">
            Left empty, the fabric is taken from the product images as before.
          </p>
        </div>
      </div>
    </div>

    <div className="bg-card rounded-xl border border-border p-6" data-walkthrough-target="fs-donts">
      <h3 className="text-lg font-semibold mb-1">Don&apos;ts (Optional)</h3>
      <p className="text-sm text-muted-foreground mb-4">
        List what should <strong>not</strong> appear in the generation. These are exclusions, not
        extra requests — they are sent to the model separately from the rest of the prompt.
      </p>
      <Textarea
        id={`${idPrefix}-donts`}
        value={donts}
        onChange={(e) => onDontsChange(e.target.value)}
        placeholder="e.g. no buttons, no zipper, no logo, no pockets"
        rows={3}
      />
    </div>
  </>
);

export default FabricAndDontsFields;
