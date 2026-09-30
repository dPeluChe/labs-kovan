import React from "react";

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  wrapperClassName?: string;
}

export const TextArea = React.forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ label, error, wrapperClassName, className, id, ...props }, ref) => {
    const autoId = React.useId();
    const textareaId = id || autoId;
    const errorId = `${textareaId}-error`;

    return (
      <div className={`form-control w-full ${wrapperClassName || ""}`}>
        {label && (
          <label htmlFor={textareaId} className="label">
            <span className="label-text font-medium">{label}</span>
          </label>
        )}
        <textarea
          id={textareaId}
          ref={ref}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className={`textarea textarea-bordered w-full focus:textarea-primary transition-all ${
            error ? "textarea-error" : ""
          } ${className || ""}`}
          {...props}
        />
        {error && (
          <p id={errorId} className="label">
            <span className="label-text-alt text-error">{error}</span>
          </p>
        )}
      </div>
    );
  }
);

TextArea.displayName = "TextArea";
