"use client";

import { Toaster as Sonner, type ToasterProps } from "sonner";

const Toaster = (props: ToasterProps) => {
  return (
    <Sonner
      theme="dark"
      position="bottom-right"
      toastOptions={{
        classNames: {
          toast:
            "!bg-surface !border !border-border !text-foreground !font-mono !text-sm !rounded-[var(--radius)]",
          description: "!text-muted",
          actionButton: "!bg-accent !text-accent-foreground",
          cancelButton: "!bg-elevated !text-muted",
          error: "!border-danger/40",
          success: "!border-accent/40",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
