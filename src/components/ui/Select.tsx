import React from "react";

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  wrapperClassName?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, wrapperClassName, className, id, children, ...props }, ref) => {
    const selectId = id || (label ? `select-${label.replace(/\s+/g, "-").toLowerCase()}` : undefined);

    return (
      <div className={`form-control w-full ${wrapperClassName || ""}`}>
        {label && (
          <label htmlFor={selectId} className="label">
            <span className="label-text font-medium text-base-content/80">{label}</span>
          </label>
        )}
        <select
          id={selectId}
          ref={ref}
          className={`select select-bordered w-full focus:select-primary transition-all text-base ${error ? "select-error" : ""
            } ${className || ""}`}
          {...props}
        >
          {children}
        </select>
        {error && (
          <label className="label">
            <span className="label-text-alt text-error">{error}</span>
          </label>
        )}
      </div>
    );
  }
);

Select.displayName = "Select";
