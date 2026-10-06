"use client";

import { OTPField as OTPFieldPrimitive } from "@base-ui/react/otp-field";
import type * as React from "react";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

export function OTPField({
  className,
  size = "default",
  ...props
}: React.ComponentProps<typeof OTPFieldPrimitive.Root> & {
  size?: "default" | "lg";
}): React.ReactElement {
  return (
    <OTPFieldPrimitive.Root
      className={cn("flex items-center gap-2", className)}
      data-size={size}
      data-slot="otp-field"
      {...props}
    />
  );
}

export function OTPFieldInput({
  className,
  ...props
}: React.ComponentProps<typeof OTPFieldPrimitive.Input>): React.ReactElement {
  return (
    <OTPFieldPrimitive.Input
      className={cn(
        "relative size-9 min-w-0 rounded-md border border-solid border-stone-200/80 bg-white text-center text-base leading-9 text-stone-800 outline-none transition-colors focus-visible:z-10 focus-visible:border-stone-300 focus-visible:ring-[3px] focus-visible:ring-stone-200 aria-invalid:border-red-300 sm:size-8 sm:text-sm sm:leading-8",
        className,
      )}
      data-slot="otp-field-input"
      spellCheck={false}
      {...props}
    />
  );
}

export function OTPFieldSeparator({
  className,
  ...props
}: React.ComponentProps<typeof Separator>): React.ReactElement {
  return (
    <OTPFieldPrimitive.Separator
      render={
        <Separator
          className={cn(
            "rounded-full bg-stone-200 data-[orientation=horizontal]:h-0.5 data-[orientation=horizontal]:w-3",
            className,
          )}
          orientation="horizontal"
          {...props}
        />
      }
    />
  );
}

export { OTPFieldPrimitive };
