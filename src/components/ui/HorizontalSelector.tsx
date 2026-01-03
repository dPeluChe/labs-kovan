
interface HorizontalSelectorProps<T extends string> {
    options: { id: T; label: string; }[];
    value: T;
    onChange: (value: T) => void;
    className?: string;
}

export function HorizontalSelector<T extends string>({
    options,
    value,
    onChange,
    className = "",
}: HorizontalSelectorProps<T>) {
    return (
        <div className={`overflow-x-auto no-scrollbar pb-2 ${className}`}>
            <div className="flex gap-2">
                {options.map((option) => (
                    <button
                        key={option.id}
                        onClick={() => onChange(option.id)}
                        className={`btn btn-sm rounded-full whitespace-nowrap transition-all ${value === option.id
                            ? "btn-primary"
                            : "btn-ghost bg-base-200 hover:bg-base-300"
                            }`}
                    >
                        {option.label}
                    </button>
                ))}
            </div>
        </div>
    );
}
