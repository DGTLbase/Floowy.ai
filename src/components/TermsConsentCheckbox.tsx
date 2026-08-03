import { forwardRef } from "react";

/**
 * Required T&C + Privacy consent checkbox.
 *
 * A native <input type="checkbox"> rather than the Radix Checkbox (which
 * renders a <button role="checkbox">) so it is a real form control with a real
 * label association for assistive tech.
 *
 * Never accepts a "defaultChecked" — consent must always start unticked. A
 * pre-ticked box is not valid consent under GDPR.
 */
export interface TermsConsentCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  /** Show the inline error state (message + aria wiring). */
  error?: boolean;
  /** Unique per rendered instance — several can be on the page at once. */
  id?: string;
  className?: string;
}

const TermsConsentCheckbox = forwardRef<HTMLInputElement, TermsConsentCheckboxProps>(
  ({ checked, onChange, error = false, id = "terms-consent", className = "" }, ref) => {
    const errorId = `${id}-error`;

    return (
      <div className={className}>
        <div className="flex items-start gap-3">
          <input
            ref={ref}
            id={id}
            type="checkbox"
            checked={checked}
            onChange={(e) => onChange(e.target.checked)}
            aria-invalid={error}
            aria-describedby={error ? errorId : undefined}
            className="mt-0.5 h-5 w-5 shrink-0 cursor-pointer rounded border-border accent-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          />
          <label
            htmlFor={id}
            className="cursor-pointer text-sm leading-relaxed text-muted-foreground"
          >
            I agree to the{" "}
            {/* stopPropagation keeps the surrounding label from toggling the box
                when the user actually means to open the document. */}
            <a
              href="/terms-conditions"
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="font-medium text-primary hover:underline"
            >
              Terms &amp; Conditions
            </a>{" "}
            and the{" "}
            <a
              href="/privacy-policy"
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="font-medium text-primary hover:underline"
            >
              Privacy Policy
            </a>
            .
          </label>
        </div>
        {error && (
          <p id={errorId} role="alert" className="mt-2 text-sm text-destructive">
            Please accept the Terms &amp; Conditions to continue.
          </p>
        )}
      </div>
    );
  },
);

TermsConsentCheckbox.displayName = "TermsConsentCheckbox";

export default TermsConsentCheckbox;
