"use client";

import { useState } from "react";
import { useChat } from "@ai-sdk/react";
import type { UIMessage } from "ai";
import { AlertCircle, MessageSquare, Send, Sparkles } from "lucide-react";

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
import { Spinner } from "~/components/ui/spinner";
import { TooltipProvider } from "~/components/ui/tooltip";
import type { AiRecommendedProductInput } from "~/lib/ai-product-recommendations";

const suggestions = [
  "מתנה לאמא עד 700 ש״ח בסגנון עדין",
  "טבעת זהב צהוב שמתאימה לענידה יומיומית",
  "עגילים עדינים לכלה, בלי תחושה כבדה",
];

export function StylistChat() {
  const [input, setInput] = useState("");
  const { clearError, error, messages, sendMessage, status, stop } = useChat();

  function handleSubmit(message: PromptInputMessage) {
    if (!message.text.trim()) return;

    void sendMessage({ text: message.text });
    setInput("");
  }

  return (
    <TooltipProvider>
      <div className="glass-panel grid min-h-[640px] overflow-hidden rounded-md border">
        <div className="border-b border-[var(--glass-border)] p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="grid gap-2">
              <Badge className="w-fit" variant="secondary">
                Aphrodite AI
              </Badge>
              <div className="grid gap-1">
                <h2 className="text-2xl font-semibold">
                  סטייליסט תכשיטים אישי
                </h2>
                <p className="text-muted-foreground max-w-2xl text-sm leading-6">
                  מאתרים התאמות בקטלוג לפי תקציב, אירוע, חומר וסגנון, ומציגים
                  את הפריטים עצמם אחרי ההמלצה.
                </p>
              </div>
            </div>
            <div className="glass-inset flex size-12 items-center justify-center rounded-md border">
              <Sparkles className="text-foreground size-5" />
            </div>
          </div>
        </div>

        <div className="flex min-h-0 flex-col">
          <Conversation className="min-h-[440px]">
            <ConversationContent className="gap-6 p-4 sm:p-6">
              {messages.length === 0 ? (
                <ConversationEmptyState className="py-10">
                  <div className="grid max-w-2xl gap-5 text-center">
                    <div className="glass-inset mx-auto flex size-14 items-center justify-center rounded-md border">
                      <MessageSquare className="text-muted-foreground size-7" />
                    </div>
                    <div className="grid gap-2">
                      <h3 className="text-lg font-semibold">
                        איך אפשר להתאים לך תכשיט?
                      </h3>
                      <p className="text-muted-foreground text-sm leading-6">
                        כתבו תקציב, אירוע, סגנון או פריט שמעניין אתכם.
                      </p>
                    </div>
                    <div className="flex flex-wrap justify-center gap-2">
                      {suggestions.map((suggestion) => (
                        <Button
                          key={suggestion}
                          className="glass-control interactive-lift min-h-11 max-w-full px-4 py-2 text-right leading-5 whitespace-normal"
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
              <div className="glass-inset mb-4 rounded-md border p-4 text-sm">
                <div className="flex items-start gap-3">
                  <AlertCircle className="mt-0.5 size-5 shrink-0" />
                  <div className="grid gap-2">
                    <p className="font-medium">הסטייליסט לא זמין כרגע.</p>
                    <p className="text-muted-foreground leading-6">
                      מכסת ה־AI הזמנית של הספק נוצלה או שהמפתח אינו פעיל. נסו
                      שוב בעוד דקה.
                    </p>
                    <Button
                      className="w-fit"
                      onClick={clearError}
                      size="sm"
                      type="button"
                      variant="outline"
                    >
                      נקה הודעה
                    </Button>
                  </div>
                </div>
              </div>
            ) : null}

            <PromptInput
              className="relative"
              dir="rtl"
              onSubmit={handleSubmit}
            >
              <PromptInputTextarea
                className="min-h-14 max-h-32 py-3 pr-4 pl-14 leading-6"
                onChange={(event) => setInput(event.currentTarget.value)}
                placeholder="לדוגמה: מתנה עד 900 ש״ח למישהי שאוהבת זהב לבן"
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
                  <Send className="size-4" />
                ) : undefined}
              </PromptInputSubmit>
            </PromptInput>
            <p className="text-muted-foreground mt-3 text-xs leading-5">
              ההמלצות הן כלי עזר. זמינות, מידה והתאמה סופית יאושרו בקופה או
              בסניף.
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
  output?: unknown;
  errorText?: string;
};

type TextPart = {
  type: "text";
  text: string;
};

function renderMessageParts(message: UIMessage, queryText?: string) {
  const textParts = message.parts.filter(isTextPart);
  const toolParts = (message.parts as unknown[]).filter(
    isSearchCatalogToolPart,
  );

  return (
    <>
      {textParts.map((part, index) => (
        <MessageResponse key={`${message.id}-text-${index}`}>
          {part.text}
        </MessageResponse>
      ))}

      {toolParts.map((part, index) => (
        <SearchCatalogToolResult
          key={`${message.id}-tool-${index}`}
          part={part}
          queryText={queryText}
        />
      ))}
    </>
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
    return (
      <div className="glass-inset rounded-md border p-3 text-sm">
        לא ניתן היה לטעון מוצרים מהקטלוג כרגע.
      </div>
    );
  }

  if (part.state !== "output-available") {
    return (
      <div className="glass-inset flex w-fit items-center gap-2 rounded-md border px-3 py-2 text-sm">
        <Spinner />
        מאתרים התאמות בקטלוג
      </div>
    );
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
      title="פריטים שמתאימים לבקשה"
    />
  );
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
