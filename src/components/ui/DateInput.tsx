import { useRef } from "react";
import { Calendar } from "lucide-react";

interface DateInputProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
}

export function DateInput({
  value,
  onChange,
  label,
  placeholder = "Seleccionar fecha",
  disabled = false,
  required = false,
  className = "",
}: DateInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleContainerClick = () => {
    // Force open the date picker by focusing and clicking the input
    if (inputRef.current && !disabled) {
      inputRef.current.showPicker?.();
      inputRef.current.focus();
    }
  };

  const formatDisplayDate = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString + "T00:00:00");
    return date.toLocaleDateString("es-MX", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className={`form-control ${className}`}>
      {label && (
        <label className="label">
          <span className="label-text">
            {label} {required && "*"}
          </span>
        </label>
      )}
      <div
        onClick={handleContainerClick}
        className={`relative flex items-center input input-bordered w-full cursor-pointer ${
          disabled ? "opacity-50 cursor-not-allowed" : "hover:border-primary"
        }`}
      >
        <Calendar className="w-4 h-4 text-base-content/50 mr-2 flex-shrink-0" />
        <span className={`flex-1 ${value ? "" : "text-base-content/40"}`}>
          {value ? formatDisplayDate(value) : placeholder}
        </span>
        <input
          ref={inputRef}
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
          style={{ colorScheme: "dark light" }}
        />
      </div>
    </div>
  );
}
