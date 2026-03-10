"use client";

interface LikelihoodBarProps {
  likelihood: number; // 0-100
}

export function LikelihoodBar({ likelihood }: LikelihoodBarProps) {
  return (
    <>
      <div className="flex justify-between text-sm text-text-secondary">
        <span>Unlikely</span>
        <span>Likely</span>
      </div>
      <div className="weight-bar-container">
        <div
          className="weight-bar-fill"
          style={{
            width: `${likelihood}%`,
          }}
        />
      </div>
      <div className="text-center">
        <span className="text-4xl font-bold text-accent">{likelihood}%</span>
        <p className="text-sm text-text-secondary mt-1">
          {likelihood >= 50 ? "Likely" : "Unlikely"} Biased
        </p>
      </div>
    </>
  );
}
