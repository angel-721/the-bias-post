"use client";

import { ReactNode } from "react";

interface SingleColumnLayoutProps {
  children: ReactNode;
}

export function SingleColumnLayout({ children }: SingleColumnLayoutProps) {
  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      {children}
    </div>
  );
}
