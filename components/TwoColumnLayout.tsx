"use client";

import { ReactNode } from "react";

interface TwoColumnLayoutProps {
  left: ReactNode;
  right: ReactNode;
}

export function TwoColumnLayout({ left, right }: TwoColumnLayoutProps) {
  return (
    <div className="two-column-layout">
      {/* Left Column: Annotated Article */}
      <div className="space-y-6">{left}</div>

      {/* Right Column: BiasAnalysisPanel */}
      {right}
    </div>
  );
}
