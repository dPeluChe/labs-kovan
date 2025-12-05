import React from "react";
import { v4 as uuidv4 } from 'uuid';

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  wrapperClassName?: string;
}

export const TextArea = React.forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ label, error, wrapperClassName, className, id, ...props }, ref) => {
    const textareaId = id || (label ? `textarea-${label.replace(/\s+/g, "-").toLowerCase()}-${uuidv4()}` : `textarea-${uuidv4()}`);

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
          className={`textarea textarea-bordered w-full focus:textarea-primary transition-all ${
            error ? "textarea-error" : ""
          } ${className || ""}`}
          {...props}
        />
        {error && (
          <label className="label">
            <span className="label-text-alt text-error">{error}</span>
          </label>
        )}
      </div>
    );
  }
);

TextArea.displayName = "TextArea";
