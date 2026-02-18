import { useState, useRef, useEffect, useCallback } from "react";
import { Bot, X, Send, RotateCcw, Loader2, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/dealer-ai-chat`;

type Message = {
  role: "user" | "assistant";
  content: string;
};

const SUGGESTED_PROMPTS = [
  "Give me a daily briefing",
  "How many open leads do I have?",
  "What are my overdue tasks?",
  "Explain the Consumer Rights Act for vehicle sales",
];

function renderMarkdown(text: string): string {
  return text
    // Bold
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    // Italic
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    // Inline code
    .replace(/`([^`]+)`/g, '<code class="bg-muted px-1 rounded text-xs font-mono">$1</code>')
    // Headers
    .replace(/^### (.+)$/gm, '<h3 class="font-semibold text-sm mt-2 mb-1">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="font-semibold text-sm mt-2 mb-1">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="font-semibold text-sm mt-2 mb-1">$1</h1>')
    // Bullet lists
    .replace(/^[-•] (.+)$/gm, '<li class="ml-3 list-disc list-inside">$1</li>')
    // Numbered lists
    .replace(/^\d+\. (.+)$/gm, '<li class="ml-3 list-decimal list-inside">$1</li>')
    // Line breaks
    .replace(/\n\n/g, '</p><p class="mt-2">')
    .replace(/\n/g, "<br/>");
}

function AssistantMessage({ content }: { content: string }) {
  return (
    <div
      className="text-sm leading-relaxed prose-sm max-w-none"
      dangerouslySetInnerHTML={{ __html: `<p>${renderMarkdown(content)}</p>` }}
    />
  );
}

function ThinkingDots() {
  return (
    <div className="flex items-center gap-1 py-1">
      <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:0ms]" />
      <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:150ms]" />
      <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:300ms]" />
    </div>
  );
}

export function DealerAIChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const { toast } = useToast();

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isStreaming]);

  // Focus textarea when opened
  useEffect(() => {
    if (isOpen && textareaRef.current) {
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isStreaming) return;

      const userMsg: Message = { role: "user", content: trimmed };
      const newMessages = [...messages, userMsg];
      setMessages(newMessages);
      setInput("");
      setIsStreaming(true);

      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData.session?.access_token;
        if (!token) throw new Error("Not authenticated");

        abortRef.current = new AbortController();

        const resp = await fetch(CHAT_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ messages: newMessages }),
          signal: abortRef.current.signal,
        });

        if (!resp.ok) {
          const errData = await resp.json().catch(() => ({}));
          if (resp.status === 429 || resp.status === 402) {
            toast({
              title: "AI Unavailable",
              description: errData.error ?? "Rate limit or credit issue. Try again later.",
              variant: "destructive",
            });
            setMessages((prev) => prev.slice(0, -1)); // remove user message
            setIsStreaming(false);
            return;
          }
          throw new Error(errData.error ?? "Request failed");
        }

        if (!resp.body) throw new Error("No response body");

        const reader = resp.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let assistantContent = "";
        let done = false;

        // Add placeholder assistant message
        setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

        while (!done) {
          const { done: rdDone, value } = await reader.read();
          if (rdDone) break;
          buffer += decoder.decode(value, { stream: true });

          let newlineIdx: number;
          while ((newlineIdx = buffer.indexOf("\n")) !== -1) {
            let line = buffer.slice(0, newlineIdx);
            buffer = buffer.slice(newlineIdx + 1);

            if (line.endsWith("\r")) line = line.slice(0, -1);
            if (!line.startsWith("data: ") || line.trim() === "") continue;

            const jsonStr = line.slice(6).trim();
            if (jsonStr === "[DONE]") {
              done = true;
              break;
            }

            try {
              const parsed = JSON.parse(jsonStr);
              const chunk = parsed.choices?.[0]?.delta?.content as string | undefined;
              if (chunk) {
                assistantContent += chunk;
                setMessages((prev) => {
                  const updated = [...prev];
                  updated[updated.length - 1] = {
                    role: "assistant",
                    content: assistantContent,
                  };
                  return updated;
                });
              }
            } catch {
              buffer = line + "\n" + buffer;
              break;
            }
          }
        }

        // Flush remaining buffer
        if (buffer.trim()) {
          for (let raw of buffer.split("\n")) {
            if (!raw.startsWith("data: ")) continue;
            const jsonStr = raw.slice(6).trim();
            if (jsonStr === "[DONE]") continue;
            try {
              const parsed = JSON.parse(jsonStr);
              const chunk = parsed.choices?.[0]?.delta?.content as string | undefined;
              if (chunk) {
                assistantContent += chunk;
                setMessages((prev) => {
                  const updated = [...prev];
                  updated[updated.length - 1] = {
                    role: "assistant",
                    content: assistantContent,
                  };
                  return updated;
                });
              }
            } catch {
              /* ignore */
            }
          }
        }
      } catch (e) {
        if ((e as Error).name === "AbortError") return;
        console.error("Chat error:", e);
        toast({
          title: "Error",
          description: "Failed to reach the AI assistant. Please try again.",
          variant: "destructive",
        });
        // Remove empty assistant placeholder if no content
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last?.role === "assistant" && !last.content) {
            return prev.slice(0, -1);
          }
          return prev;
        });
      } finally {
        setIsStreaming(false);
        abortRef.current = null;
      }
    },
    [messages, isStreaming, toast]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const clearChat = () => {
    if (isStreaming) {
      abortRef.current?.abort();
    }
    setMessages([]);
    setInput("");
    setIsStreaming(false);
  };

  const isEmpty = messages.length === 0;

  return (
    <>
      {/* Floating trigger button */}
      <button
        onClick={() => setIsOpen((v) => !v)}
        className={cn(
          "fixed bottom-6 right-6 z-50 flex items-center justify-center",
          "h-13 w-13 rounded-full shadow-lg transition-all duration-200",
          "bg-primary text-primary-foreground",
          "ring-2 ring-primary/30 hover:ring-primary/50",
          "hover:scale-105 active:scale-95",
          isOpen && "ring-primary/50"
        )}
        style={{ height: 52, width: 52 }}
        aria-label="Open AI Assistant"
      >
        {isOpen ? (
          <ChevronDown className="h-5 w-5" />
        ) : (
          <>
            <Bot className="h-5 w-5" />
            {/* Pulse ring */}
            <span className="absolute inset-0 rounded-full ring-2 ring-primary/40 animate-ping opacity-60 pointer-events-none" />
          </>
        )}
      </button>

      {/* Chat panel */}
      {isOpen && (
        <div
          className={cn(
            "fixed bottom-24 right-6 z-50 flex flex-col",
            "w-[380px] max-w-[calc(100vw-2rem)]",
            "h-[520px] max-h-[calc(100vh-120px)]",
            "rounded-xl border border-border bg-card shadow-2xl",
            "animate-in slide-in-from-bottom-4 duration-200"
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border/50 flex-shrink-0">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center h-7 w-7 rounded-lg bg-primary/10">
                <Bot className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">DealerOps AI</p>
                <p className="text-[10px] text-muted-foreground leading-none">
                  {isStreaming ? "Thinking…" : "Ready to help"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {!isEmpty && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-foreground"
                  onClick={clearChat}
                  title="Clear chat"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-foreground"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-hidden">
            <ScrollArea className="h-full">
              <div ref={scrollRef} className="p-4 space-y-4">
                {isEmpty ? (
                  /* Welcome state */
                  <div className="flex flex-col items-center text-center pt-4 pb-2">
                    <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-3">
                      <Bot className="h-6 w-6 text-primary" />
                    </div>
                    <p className="text-sm font-medium text-foreground">Hello! I'm DealerOps AI</p>
                    <p className="text-xs text-muted-foreground mt-1 max-w-[260px]">
                      Ask me about your leads, compliance rules, tasks, or anything about your dealership.
                    </p>
                    {/* Suggested prompts */}
                    <div className="mt-4 w-full space-y-2">
                      {SUGGESTED_PROMPTS.map((prompt) => (
                        <button
                          key={prompt}
                          onClick={() => sendMessage(prompt)}
                          className={cn(
                            "w-full text-left text-xs px-3 py-2 rounded-lg",
                            "border border-border/60 bg-muted/40 text-muted-foreground",
                            "hover:bg-muted hover:text-foreground hover:border-border",
                            "transition-colors duration-150"
                          )}
                        >
                          {prompt}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  messages.map((msg, i) => (
                    <div
                      key={i}
                      className={cn(
                        "flex",
                        msg.role === "user" ? "justify-end" : "justify-start"
                      )}
                    >
                      <div
                        className={cn(
                          "max-w-[85%] rounded-2xl px-3 py-2 text-sm",
                          msg.role === "user"
                            ? "bg-primary text-primary-foreground rounded-br-sm"
                            : "bg-muted text-foreground rounded-bl-sm"
                        )}
                      >
                        {msg.role === "assistant" ? (
                          msg.content ? (
                            <AssistantMessage content={msg.content} />
                          ) : (
                            <ThinkingDots />
                          )
                        ) : (
                          <p className="whitespace-pre-wrap">{msg.content}</p>
                        )}
                      </div>
                    </div>
                  ))
                )}

                {/* Thinking indicator when streaming but assistant bubble already added */}
              </div>
            </ScrollArea>
          </div>

          {/* Input bar */}
          <div className="p-3 border-t border-border/50 flex-shrink-0">
            <div className="flex items-end gap-2">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask anything…"
                className="min-h-[38px] max-h-[120px] resize-none text-sm rounded-xl border-border/60 focus-visible:ring-primary/30 py-2 px-3"
                rows={1}
                disabled={isStreaming}
              />
              <Button
                size="icon"
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || isStreaming}
                className="h-[38px] w-[38px] rounded-xl flex-shrink-0 bg-primary hover:bg-primary/90"
              >
                {isStreaming ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-[10px] text-muted-foreground text-center mt-2">
              Press Enter to send · Shift+Enter for new line
            </p>
          </div>
        </div>
      )}
    </>
  );
}
