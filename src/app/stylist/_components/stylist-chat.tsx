"use client";

import { Fragment, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { AlertCircle, MessageSquare, Sparkles } from "lucide-react";

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
import { TooltipProvider } from "~/components/ui/tooltip";

const suggestions = [
  "מתנה לאמא עד 700 ש״ח בסגנון עדין",
  "טבעת זהב צהוב שאפשר לענוד כל יום",
  "עגילים לכלה שלא נראים כבדים",
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
      <div className="glass-panel grid min-h-[640px] rounded-md border">
        <div className="border-b border-[var(--glass-border)] p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <Badge className="mb-2" variant="secondary">
                AI Stylist
              </Badge>
              <h2 className="text-2xl font-semibold">סטייליסט תכשיטים אישי</h2>
            </div>
            <Sparkles className="text-foreground size-6" />
          </div>
        </div>

        <div className="flex min-h-0 flex-col">
          <Conversation className="min-h-[440px]">
            <ConversationContent>
              {messages.length === 0 ? (
                <ConversationEmptyState
                  description="כתבי תקציב, אירוע, סגנון או מוצר שמעניין אותך."
                  icon={<MessageSquare className="size-10" />}
                  title="איך אפשר להתאים לך תכשיט?"
                >
                  <div className="grid gap-3 text-center">
                    <MessageSquare className="text-muted-foreground mx-auto size-10" />
                    <div>
                      <h3 className="font-medium">איך אפשר להתאים לך תכשיט?</h3>
                      <p className="text-muted-foreground mt-1 text-sm">
                        כתבי תקציב, אירוע, סגנון או מוצר שמעניין אותך.
                      </p>
                    </div>
                    <div className="flex flex-wrap justify-center gap-2">
                      {suggestions.map((suggestion) => (
                        <Button
                          key={suggestion}
                          onClick={() => {
                            setInput("");
                            void sendMessage({ text: suggestion });
                          }}
                          className="min-h-11 px-4 py-2 text-right leading-5 whitespace-normal"
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
                messages.map((message) => (
                  <Message from={message.role} key={message.id}>
                    <MessageContent>
                      {message.parts.map((part, index) => {
                        if (part.type !== "text") return null;

                        return (
                          <Fragment key={`${message.id}-${index}`}>
                            <MessageResponse>{part.text}</MessageResponse>
                          </Fragment>
                        );
                      })}
                    </MessageContent>
                  </Message>
                ))
              )}
            </ConversationContent>
            <ConversationScrollButton />
          </Conversation>

          <div className="border-t border-[var(--glass-border)] p-4">
            {error ? (
              <div className="glass-inset mb-4 rounded-md border p-4 text-sm">
                <div className="flex items-start gap-3">
                  <AlertCircle className="mt-0.5 size-5 shrink-0" />
                  <div className="grid gap-2">
                    <p className="font-medium">הסטייליסט לא זמין כרגע.</p>
                    <p className="text-muted-foreground leading-6">
                      מכסת ה-AI הזמנית של הספק נוצלה או שהמפתח אינו פעיל. נסו
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
            <PromptInput onSubmit={handleSubmit}>
              <PromptInputTextarea
                className="min-h-24 pl-16"
                onChange={(event) => setInput(event.currentTarget.value)}
                placeholder="לדוגמה: מחפשת מתנה עד 900 ש״ח למישהי שאוהבת זהב לבן"
                value={input}
              />
              <PromptInputSubmit
                className="absolute bottom-2 left-2 size-11"
                disabled={!input.trim() && status === "ready"}
                onStop={stop}
                status={status}
              />
            </PromptInput>
            <p className="text-muted-foreground mt-3 text-xs">
              ההמלצות הן כלי עזר. זמינות, מידה והתאמה סופית יאושרו בקופה או
              בסניף.
            </p>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
