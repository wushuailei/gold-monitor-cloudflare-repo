import { Calendar } from "lucide-react";

interface DateRangeSelectorProps {
  value: number; // 天数
  onChange: (days: number) => void;
  options?: { label: string; value: number }[];
}

const defaultOptions = [
  { label: "1天", value: 1 },
  { label: "3天", value: 3 },
  { label: "7天", value: 7 },
  { label: "15天", value: 15 },
  { label: "30天", value: 30 },
  { label: "90天", value: 90 },
  { label: "180天", value: 180 },
  { label: "360天", value: 360 },
];

export function DateRangeSelector({ value, onChange, options = defaultOptions }: DateRangeSelectorProps) {
  return (
    <div className="flex items-center gap-2">
      <Calendar size={16} className="text-gray-500" />
      <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
        {options.map((option) => (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
              value === option.value
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
