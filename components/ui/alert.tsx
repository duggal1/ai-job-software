import type React from "react";

interface AlertProps {
  variant: "success" | "error";
  children: React.ReactNode;
}

export function Alert({ variant, children }: AlertProps) {
  return (
    <div
      className={`flex items-start gap-2 rounded-lg border px-3 py-2.5 text-[13px] ${
        variant === "success"
          ? "border-green-200/50 bg-green-50/80 text-green-700"
          : "border-orange-200/50 bg-orange-50/80 text-orange-700"
      }`}
    >
      {children}
    </div>
  );
}

export function AlertTitle({ children }: { children: React.ReactNode }) {
  return <p className="font-medium">{children}</p>;
}

export function AlertDescription({ children }: { children: React.ReactNode }) {
  return <p className="text-[12px] opacity-80">{children}</p>;
}
