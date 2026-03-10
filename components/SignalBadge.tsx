"use client";

interface SignalBadgeProps {
  number: number;
  weight: number;
  onClick: () => void;
  analyzed: boolean;
}

export function SignalBadge({ number, weight, onClick, analyzed }: SignalBadgeProps) {
  return (
    <sup
      onClick={onClick}
      className={`inline-flex items-center justify-center w-5 h-5 ml-1 text-[11px] font-bold rounded-full cursor-pointer align-super transition-colors ${
        analyzed
          ? "bg-blue-500 text-white"
          : "bg-amber-500 text-black hover:bg-amber-400"
      }`}
    >
      {analyzed ? "✓" : number}
    </sup>
  );
}
