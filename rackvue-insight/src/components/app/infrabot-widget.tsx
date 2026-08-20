import { useState, useRef, useEffect } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Bot, X, Send, Sparkles, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { chatInfraBot } from "@/lib/infrabot.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type Msg = { role: "user" | "assistant"; content: string };

const SUGGESTED = [
  "How much storage is needed for 1 million users?",
  "Which cloud provider is cheapest?",
  "How many racks for 200 servers?",
  "How can I reduce infrastructure costs?",
  "Design an HA setup for 99.99% uptime",
  "Triage: CPU is at 95% across the fleet",
];

export function InfraBotWidget() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "assistant",
      content:
        "👋 Hi, I'm **InfraBot** — your AI infrastructure assistant. Ask me about storage sizing, rack planning, cloud costs, or scaling.",
    },
  ]);
  const chat = useServerFn(chatInfraBot);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  async function send(text: string) {
    const content = text.trim();
    if (!content || loading) return;
    const next: Msg[] = [...messages, { role: "user", content }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const res = await chat({ data: { messages: next } });
      setMessages((m) => [...m, { role: "assistant", content: res.reply }]);
    } catch {
      setMessages((m) => [
        ...m,
        { role: "assistant", content: "Sorry, I couldn't reach the AI service. Please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "fixed bottom-6 right-6 z-50 grid h-14 w-14 place-items-center rounded-full",
          "bg-gradient-to-br from-primary to-chart-4 text-primary-foreground shadow-[var(--shadow-glow,0_10px_40px_-10px_rgba(0,0,0,0.5))]",
          "transition-transform hover:scale-105 active:scale-95",
        )}
        aria-label="Open InfraBot"
      >
        {open ? <X className="h-5 w-5" /> : <Bot className="h-6 w-6" />}
      </button>

      {open && (
        <div className="fixed bottom-24 right-6 z-50 flex h-[560px] w-[380px] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border border-border/60 bg-card/95 shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-bottom-4">
          <div className="flex items-center gap-3 border-b border-border/60 bg-gradient-to-r from-primary/10 to-chart-4/10 px-4 py-3">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br from-primary to-chart-4">
              <Sparkles className="h-4 w-4 text-primary-foreground" />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-semibold">InfraBot</span>
              <span className="text-[10px] text-muted-foreground">AI Infrastructure Assistant</span>
            </div>
            <span className="ml-auto flex items-center gap-1.5 rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-medium text-success">
              <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />Online
            </span>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto">
            <div className="flex flex-col gap-3 p-4">
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={cn(
                    "max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed",
                    m.role === "user"
                      ? "ml-auto bg-primary text-primary-foreground"
                      : "mr-auto bg-muted/60 text-foreground",
                  )}
                >
                  {m.role === "assistant" ? (
                    <div className="prose prose-xs max-w-none prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0 prose-headings:my-1 prose-code:text-[10px] dark:prose-invert">
                      <ReactMarkdown>{m.content}</ReactMarkdown>
                    </div>
                  ) : (
                    m.content
                  )}
                </div>
              ))}
              {loading && (
                <div className="mr-auto flex items-center gap-2 rounded-2xl bg-muted/60 px-3.5 py-2.5 text-xs text-muted-foreground">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  <span className="flex gap-1">
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:0ms]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:120ms]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:240ms]" />
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="border-t border-border/60 p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                {messages.length <= 1 ? "Suggested" : "Quick prompts"}
              </span>
              {messages.length > 1 && (
                <button
                  onClick={() =>
                    setMessages([
                      {
                        role: "assistant",
                        content:
                          "👋 New conversation started. Ask me anything about storage, racks, cloud costs, HA or incidents.",
                      },
                    ])
                  }
                  className="text-[10px] text-muted-foreground hover:text-foreground"
                >
                  Clear chat
                </button>
              )}
            </div>
            <div className="flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {SUGGESTED.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  disabled={loading}
                  className="shrink-0 rounded-full border border-border/60 bg-muted/30 px-2.5 py-1 text-[10px] text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:opacity-50"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="flex items-center gap-2 border-t border-border/60 bg-background/40 p-3"
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask InfraBot..."
              className="h-9 flex-1 bg-card/60"
              disabled={loading}
            />
            <Button type="submit" size="icon" className="h-9 w-9 shrink-0" disabled={loading || !input.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      )}
    </>
  );
}