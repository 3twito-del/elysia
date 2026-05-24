"use client";

import { DropdownMenuItem } from "~/components/ui/dropdown-menu";
import { captureScreenshot } from "~/components/ai-elements/prompt-input-media";
import { usePromptInputAttachments } from "~/components/ai-elements/prompt-input-context";
import { ImageIcon, Monitor } from "lucide-react";
import type { ComponentProps } from "react";
import { useCallback } from "react";

export type PromptInputActionAddAttachmentsProps = ComponentProps<
  typeof DropdownMenuItem
> & {
  label?: string;
};

export const PromptInputActionAddAttachments = ({
  label = "הוספת תמונות או קבצים",
  ...props
}: PromptInputActionAddAttachmentsProps) => {
  const attachments = usePromptInputAttachments();

  const handleSelect = useCallback(
    (e: Event) => {
      e.preventDefault();
      attachments.openFileDialog();
    },
    [attachments],
  );

  return (
    <DropdownMenuItem {...props} onSelect={handleSelect}>
      <ImageIcon aria-hidden="true" className="mr-2 size-4" /> {label}
    </DropdownMenuItem>
  );
};

export type PromptInputActionAddScreenshotProps = ComponentProps<
  typeof DropdownMenuItem
> & {
  label?: string;
};

export const PromptInputActionAddScreenshot = ({
  label = "צילום מסך",
  onSelect,
  ...props
}: PromptInputActionAddScreenshotProps) => {
  const attachments = usePromptInputAttachments();

  const handleSelect = useCallback(
    async (event: Event) => {
      onSelect?.(event);
      if (event.defaultPrevented) {
        return;
      }

      try {
        const screenshot = await captureScreenshot();
        if (screenshot) {
          attachments.add([screenshot]);
        }
      } catch (error) {
        if (
          error instanceof DOMException &&
          (error.name === "NotAllowedError" || error.name === "AbortError")
        ) {
          return;
        }
        throw error;
      }
    },
    [onSelect, attachments],
  );

  return (
    <DropdownMenuItem {...props} onSelect={handleSelect}>
      <Monitor aria-hidden="true" className="mr-2 size-4" />
      {label}
    </DropdownMenuItem>
  );
};
