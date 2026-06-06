"use client";

import { useState } from "react";
import { useChat } from "@ai-sdk/react";
import type { ChatAddToolApproveResponseFunction, UIMessage } from "ai";
import { Check, MessageSquare, Send, Sparkles, X } from "lucide-react";

import { AiFallbackRecovery } from "~/app/ai/_components/ai-fallback-recovery";
import { AiProductRecommendations } from "~/components/ai-product-recommendations";
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "~/components/ai-elements/conversation";
import {
  Message,
  MessageContent,
  MessageResponse,
} from "~/components/ai-elements/message";
import {
  PromptInput,
  type PromptInputMessage,
  PromptInputSubmit,
  PromptInputTextarea,
} from "~/components/ai-elements/prompt-input";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { LoadingState } from "~/components/ui/loading-state";
import { StatusMessage } from "~/components/ui/status-message";
import { TooltipProvider } from "~/components/ui/tooltip";
import type { AiRecommendedProductInput } from "~/lib/ai-product-recommendations";
import { cn } from "~/lib/utils";

const suggestions = [
  "מתנה עד 700 ₪",
  "טבעת זהב צהוב ליום־יום",
  "עגילים עדינים לכלה",
];

type StylistChatProps = {
  compact?: boolean;
};

export function StylistChat({ compact = false }: StylistChatProps) {
  const [input, setInput] = useState("");
  const {
    addToolApprovalResponse,
    clearError,
    error,
    messages,
    sendMessage,
    status,
    stop,
  } = useChat();

  function handleSubmit(message: PromptInputMessage) {
    if (!message.text.trim()) return;

    void sendMessage({ text: message.text });
    setInput("");
  }

  return (
    <TooltipProvider>
      <div
        className={cn(
          "brand-surface grid overflow-hidden",
          compact ? "min-h-[520px]" : "min-h-[640px]",
        )}
      >
        <div
          className={cn(
            "border-b border-[var(--glass-border)]",
            compact ? "p-4 sm:p-5" : "p-5 sm:p-6",
          )}
        >
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="grid gap-2">
              <Badge className="w-fit" variant="secondary">
                ייעוץ Elysia
              </Badge>
              <div className="grid gap-1">
                <h2
                  className={cn(
                    "font-semibold",
                    compact ? "text-xl" : "text-2xl",
                  )}
                >עזרה בבחירה</h2>
                <p className="text-muted-foreground max-w-2xl text-sm leading-6">מאתרים התאמות לפי מחיר, אירוע, חומר וסגנון, מתוך המלאי הפעיל.</p>
              </div>
            </div>
            <div
              className={cn(
                "glass-inset flex items-center justify-center rounded-md border",
                compact ? "size-10" : "size-12",
              )}
            >
              <Sparkles aria-hidden="true" className="text-foreground size-5" />
            </div>
          </div>
        </div>

        <div className="flex min-h-0 flex-col">
          <Conversation className={compact ? "min-h-[280px]" : "min-h-[440px]"}>
            <ConversationContent
              className={cn("gap-6 p-4", compact ? "sm:p-5" : "sm:p-6")}
            >
              {messages.length === 0 ? (
                <ConversationEmptyState className={compact ? "py-6" : "py-10"}>
                  <div
                    className={cn(
                      "grid max-w-2xl text-center",
                      compact ? "gap-4" : "gap-5",
                    )}
                  >
                    <div
                      className={cn(
                        "glass-inset mx-auto flex items-center justify-center rounded-md border",
                        compact ? "size-12" : "size-14",
                      )}
                    >
                      <MessageSquare
                        aria-hidden="true"
                        className="text-muted-foreground size-7"
                      />
                    </div>
                    <div className="grid gap-2">
                      <h3 className="text-lg font-semibold">מה תרצו למצוא?</h3>
                      <p className="text-muted-foreground text-sm leading-6">
                        כתבו מחיר, אירוע, סגנון או תכשיט שמעניין אתכם.
                      </p>
                    </div>
                    <div className="flex flex-wrap justify-center gap-2">
                      {suggestions.map((suggestion) => (
                        <Button
                          key={suggestion}
                          className="glass-control min-h-11 max-w-full px-4 py-2 text-right leading-5 whitespace-normal"
                          onClick={() => {
                            setInput("");
                            void sendMessage({ text: suggestion });
                          }}
                          type="button"
                          variant="outline"
                        >
                          {suggestion}
                        </Button>
                      ))}
                    </div>
                  </div>
                </ConversationEmptyState>
              ) : (
                messages.map((message, messageIndex) => (
                  <Message from={message.role} key={message.id}>
                    <MessageContent
                      className={
                        message.role === "assistant"
                          ? "w-full gap-4 overflow-visible"
                          : undefined
                      }
                    >
                      {renderMessageParts(
                        message,
                        getNearestUserText(messages, messageIndex),
                        addToolApprovalResponse,
                      )}
                    </MessageContent>
                  </Message>
                ))
              )}
            </ConversationContent>
            <ConversationScrollButton />
          </Conversation>

          <div className="border-t border-[var(--glass-border)] p-4 sm:p-5">
            {error ? (
              <AiFallbackRecovery
                actions={
                  <Button
                    className="w-fit"
                    onClick={clearError}
                    size="sm"
                    type="button"
                    variant="outline"
                  >
                    נקה הודעה
                  </Button>
                }
                className="mb-4 text-sm"
                reason={error.message}
                source="stylist"
              />
            ) : null}

            <PromptInput className="relative" dir="rtl" onSubmit={handleSubmit}>
              <PromptInputTextarea
                aria-label="תיאור הבקשה ליועץ"
                className="max-h-32 min-h-14 py-3 pr-4 pl-14 leading-6"
                id="stylist-message"
                onChange={(event) => setInput(event.currentTarget.value)}
                placeholder="לדוגמה: מתנה סביב 900 ש״ח למישהי שאוהבת זהב לבן"
                value={input}
              />
              <PromptInputSubmit
                className="absolute bottom-2 left-2 size-10 rounded-md"
                disabled={
                  !input.trim() &&
                  status !== "submitted" &&
                  status !== "streaming"
                }
                onStop={stop}
                status={status}
              >
                {status === "ready" || status === "error" ? (
                  <Send aria-hidden="true" className="size-4" />
                ) : undefined}
              </PromptInputSubmit>
            </PromptInput>
            <p className="text-muted-foreground mt-3 text-xs leading-5">
              ההמלצות אינן מחליפות בדיקת מידה, זמינות ופרטי הזמנה.
            </p>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}

type SearchCatalogToolPart = {
  type: "tool-searchCatalog";
  state: string;
  input?: unknown;
  output?: unknown;
  errorText?: string;
};

type SafeActionToolPart = {
  type: `tool-${string}`;
  state: string;
  input?: unknown;
  output?: unknown;
  errorText?: string;
  approval?: {
    id: string;
    approved?: boolean;
    reason?: string;
  };
};

type TextPart = {
  type: "text";
  text: string;
};

function renderMessageParts(
  message: UIMessage,
  queryText: string | undefined,
  addToolApprovalResponse: ChatAddToolApproveResponseFunction,
) {
  const textParts = message.parts.filter(isTextPart);
  const toolParts = (message.parts as unknown[]).filter(isSafeActionToolPart);

  return (
    <>
      {textParts.map((part, index) => (
        <MessageResponse key={`${message.id}-text-${index}`}>
          {part.text}
        </MessageResponse>
      ))}

      {toolParts.map((part, index) => (
        <ToolResult
          addToolApprovalResponse={addToolApprovalResponse}
          key={`${message.id}-tool-${index}`}
          part={part}
          queryText={queryText}
        />
      ))}
    </>
  );
}

function ToolResult({
  addToolApprovalResponse,
  part,
  queryText,
}: {
  addToolApprovalResponse: ChatAddToolApproveResponseFunction;
  part: SafeActionToolPart;
  queryText?: string;
}) {
  if (isSearchCatalogToolPart(part)) {
    return <SearchCatalogToolResult part={part} queryText={queryText} />;
  }

  return (
    <SafeActionToolResult
      addToolApprovalResponse={addToolApprovalResponse}
      part={part}
    />
  );
}

function SearchCatalogToolResult({
  part,
  queryText,
}: {
  part: SearchCatalogToolPart;
  queryText?: string;
}) {
  if (part.state === "output-error") {
    return <StatusMessage tone="error">המבחר אינו פתוח כרגע.</StatusMessage>;
  }

  if (part.state !== "output-available") {
    return <LoadingState label="מאתרים התאמות במבחר" variant="inline" />;
  }

  const products = Array.isArray(part.output)
    ? part.output.filter(isAiRecommendedProductInput)
    : [];

  return (
    <AiProductRecommendations
      className="mt-1"
      layout="inline"
      products={products}
      queryText={queryText}
      source="stylist"
      title="בחירות שמתאימות לבקשה"
    />
  );
}

function SafeActionToolResult({
  addToolApprovalResponse,
  part,
}: {
  addToolApprovalResponse: ChatAddToolApproveResponseFunction;
  part: SafeActionToolPart;
}) {
  if (part.state === "approval-requested" && part.approval?.id) {
    return (
      <div className="glass-inset mt-1 grid gap-3 rounded-md border p-4 text-sm">
        <div className="grid gap-1">
          <p className="font-medium">{getToolLabel(part.type)}</p>
          <p className="text-muted-foreground leading-6">
            הבחירה הזו דורשת אישור לפני המשך.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            className="gap-2"
            onClick={() => {
              void addToolApprovalResponse({
                id: part.approval?.id ?? "",
                approved: true,
              });
            }}
            size="sm"
            type="button"
          >
            <Check aria-hidden="true" className="size-4" />
            אשר
          </Button>
          <Button
            className="gap-2"
            onClick={() => {
              void addToolApprovalResponse({
                id: part.approval?.id ?? "",
                approved: false,
                reason: "User denied the action.",
              });
            }}
            size="sm"
            type="button"
            variant="outline"
          >
            <X aria-hidden="true" className="size-4" />
            בטל
          </Button>
        </div>
      </div>
    );
  }

  if (part.state === "output-denied") {
    return (
      <StatusMessage tone="neutral">הבחירה לא בוצעה לאחר דחייה.</StatusMessage>
    );
  }

  if (part.state === "output-error") {
    return (
      <StatusMessage tone="error">לא ניתן היה להשלים את הבחירה.</StatusMessage>
    );
  }

  if (part.state !== "output-available") {
    return <LoadingState label="מאשרים בחירה מאובטחת" variant="inline" />;
  }

  return (
    <StatusMessage tone="success" variant="plain">
      {getToolOutputText(part.output)}
    </StatusMessage>
  );
}

function getToolLabel(type: string) {
  if (type === "tool-saveStyleProfile") return "שמירת פרופיל סגנון";
  if (type === "tool-createTryOnSession") return "פתיחת מידה";
  if (type === "tool-orderSupport") return "בדיקת הזמנה";

  return "פעולת התאמה";
}

function getToolOutputText(output: unknown) {
  if (typeof output !== "object" || output === null) {
    return "הבחירה הושלמה.";
  }

  const record = output as Record<string, unknown>;
  const parts = [record.summary, record.nextStep, record.message].filter(
    (value): value is string => typeof value === "string" && value.length > 0,
  );

  return parts.length > 0 ? parts.join(" ") : "הבחירה הושלמה.";
}

function getNearestUserText(messages: UIMessage[], messageIndex: number) {
  for (let index = messageIndex - 1; index >= 0; index -= 1) {
    const message = messages[index];
    if (message?.role !== "user") continue;

    const text = getMessageText(message);
    if (text) return text;
  }

  return undefined;
}

function getMessageText(message: UIMessage) {
  return message.parts
    .filter(isTextPart)
    .map((part) => part.text)
    .join(" ")
    .trim();
}

function isTextPart(part: unknown): part is TextPart {
  return (
    typeof part === "object" &&
    part !== null &&
    "type" in part &&
    part.type === "text" &&
    "text" in part &&
    typeof part.text === "string"
  );
}

function isSearchCatalogToolPart(part: unknown): part is SearchCatalogToolPart {
  return (
    typeof part === "object" &&
    part !== null &&
    "type" in part &&
    part.type === "tool-searchCatalog"
  );
}

function isSafeActionToolPart(part: unknown): part is SafeActionToolPart {
  return (
    typeof part === "object" &&
    part !== null &&
    "type" in part &&
    typeof part.type === "string" &&
    part.type.startsWith("tool-")
  );
}

function isAiRecommendedProductInput(
  value: unknown,
): value is AiRecommendedProductInput {
  return (
    typeof value === "object" &&
    value !== null &&
    "slug" in value &&
    typeof value.slug === "string" &&
    "name" in value &&
    typeof value.name === "string"
  );
}
