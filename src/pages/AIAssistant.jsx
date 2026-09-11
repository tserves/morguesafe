import React, { useState, useEffect, useRef } from "react";
import { Brain, Send, Sparkles, User, Bot, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const SUGGESTED_QUESTIONS = [
  "Which cases are not ready for release?",
  "What is delaying this case?",
  "Show overdue tasks at Milton",
  "Which cases require coroner authorization?",
  "Summarize activity from the previous shift",
  "Show available storage across all three hospitals",
  "What needs attention today?",
];

export default function AIAssistant() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendQuery = async (query) => {
    if (!query.trim() || loading) return;
    const userMsg = { role: "user", text: query };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    try {
      const res = await base44.functions.invoke("aiAssistant", { query });
      setMessages((prev) => [...prev, { role: "assistant", text: res.data.answer, query: res.data.query }]);
    } catch (err) {
      setMessages((prev) => [...prev, { role: "assistant", text: `Error: ${err.message}` }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-[900px] mx-auto h-full flex flex-col">
      <div className="flex items-center gap-2 mb-4">
        <Brain className="w-5 h-5 text-purple-500" />
        <h1 className="text-2xl font-bold">Custiviant AI Assistant</h1>
      </div>

      <Card className="flex-1 flex flex-col overflow-hidden">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="text-center py-8">
              <Sparkles className="w-12 h-12 text-purple-300 mx-auto mb-4" />
              <p className="text-sm text-muted-foreground mb-4">Ask me anything about your cases, tasks, alerts, or operations.</p>
              <div className="flex flex-wrap gap-2 justify-center max-w-lg">
                {SUGGESTED_QUESTIONS.map((q) => (
                  <Button key={q} variant="outline" size="sm" onClick={() => sendQuery(q)} className="text-xs">
                    {q}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, idx) => (
            <div key={idx} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              {msg.role === "assistant" && (
                <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4 text-purple-600" />
                </div>
              )}
              <div className={`max-w-[70%] rounded-lg p-3 text-sm ${
                msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
              }`}>
                {msg.role === "assistant" && (
                  <div className="flex items-center gap-1 mb-1">
                    <Sparkles className="w-3 h-3 text-purple-500" />
                    <span className="text-[10px] font-medium text-purple-600">AI-Generated</span>
                  </div>
                )}
                <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
              </div>
              {msg.role === "user" && (
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0">
                  <User className="w-4 h-4 text-primary-foreground" />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 text-purple-600" />
              </div>
              <div className="bg-muted rounded-lg p-3 flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-purple-500" />
                <span className="text-sm text-muted-foreground">Analyzing...</span>
              </div>
            </div>
          )}
          <div ref={scrollRef} />
        </div>

        {/* Input */}
        <div className="border-t p-3 flex items-center gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendQuery(input)}
            placeholder="Ask about cases, tasks, alerts..."
            disabled={loading}
          />
          <Button onClick={() => sendQuery(input)} disabled={loading || !input.trim()} size="icon">
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </Card>
    </div>
  );
}