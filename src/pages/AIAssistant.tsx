import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Send, Bot, User, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";

interface Message {
  id: string;
  type: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const AIAssistant = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      type: "assistant",
      content: "Hi! I'm your travel assistant. Ask me anything about your journey:\n\n• When should I leave for the airport?\n• What's the cheapest way to reach somewhere?\n• Should I use Hopper or take the train?\n• How much can I save with Hopper?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const generateAssistantResponse = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase();

    // Airport timing
    if (
      lowerMessage.includes("airport") ||
      lowerMessage.includes("leave") ||
      lowerMessage.includes("when")
    ) {
      return `📍 Smart Recommendation:\n\nFor flights:\n• Check-in: 2 hours before\n• From SRM to airport: ~30 mins via Hopper\n• Plus 10 mins buffer\n\n✅ Leave at: 4:00 PM (for 6:00 PM flight)\n\n💡 Pro tip: Share a Hopper with others going to the same flight. Save ₹400-500!`;
    }

    // Cost comparison
    if (
      lowerMessage.includes("cheap") ||
      lowerMessage.includes("cost") ||
      lowerMessage.includes("price") ||
      lowerMessage.includes("save")
    ) {
      return `💰 Cost Breakdown (SRM → Airport):\n\nSolo Cab: ₹1200\nHopper (1 person): ₹1200\nHopper (2 people): ₹600 each\nHopper (4 people): ₹300 each ✨\nShuttle: Free!\n\n🎯 Best choice: Find co-passengers on Hopper!\nAvg savings: ₹400-700 per trip`;
    }

    // Hopper vs train
    if (
      lowerMessage.includes("hopper") ||
      lowerMessage.includes("train") ||
      lowerMessage.includes("which")
    ) {
      return `🚂 vs 🚕 Quick Comparison:\n\nTrain:\n✅ Cheapest (₹200)\n✅ No traffic\n❌ Schedules rigid\n❌ Time varies\n\nHopper:\n✅ Door-to-door\n✅ Flexible timing (±3 hrs)\n❌ Costs more\n✅ Find co-passengers\n\n💡 Decision: Use train for fixed times, Hopper for flexibility!`;
    }

    // Events
    if (lowerMessage.includes("event") || lowerMessage.includes("concert")) {
      return `🎪 Event Travel Tips:\n\nSunburn Arena (12 km away):\n• 5 students already interested\n• Create a Hopper → auto room created\n• 4 co-passengers → ₹250 each!\n\n🔥 Demo: Create a Hopper now & watch cost drop as people join!`;
    }

    // Safety
    if (lowerMessage.includes("safe") || lowerMessage.includes("emergency")) {
      return `🛡️ Safety First:\n\n✅ RydIN Safety Features:\n• Request → Accept only (no auto-chat)\n• Verified SRM students only\n• Emergency mode (1-click)\n• Block/report users\n• Girls-only rides available\n\n📞 Emergency numbers always available in app.`;
    }

    // Default helpful response
    return `🤔 I can help with:\n\n1️⃣ Travel timing ("When should I leave?")\n2️⃣ Cost estimates ("How much to save?")\n3️⃣ Hopper vs alternatives\n4️⃣ Event-based trips\n5️⃣ Safety features\n\nTry asking! 😊`;
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    // Add user message
    const userMsg: Message = {
      id: Date.now().toString(),
      type: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    // Simulate AI thinking (100-500ms for natural feel)
    await new Promise((resolve) => setTimeout(resolve, Math.random() * 400 + 100));

    // Generate response
    const response = generateAssistantResponse(input);
    const assistantMsg: Message = {
      id: (Date.now() + 1).toString(),
      type: "assistant",
      content: response,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, assistantMsg]);
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold">Travel Assistant AI</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Smart recommendations for your journey
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 max-w-2xl mx-auto w-full px-4 py-6 space-y-4">
        {messages.map((message) => (
          <motion.div
            key={message.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`flex gap-3 max-w-xs ${
                message.type === "user" ? "flex-row-reverse" : "flex-row"
              }`}
            >
              {message.type === "assistant" && (
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-white" />
                </div>
              )}

              <div
                className={`rounded-lg p-3 ${
                  message.type === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-foreground"
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              </div>

              {message.type === "user" && (
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4 text-primary-foreground" />
                </div>
              )}
            </div>
          </motion.div>
        ))}

        {isLoading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center flex-shrink-0">
              <Bot className="w-4 h-4 text-white animate-pulse" />
            </div>
            <div className="bg-muted rounded-lg p-3">
              <div className="flex gap-1">
                <div className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" />
                <div className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce delay-100" />
                <div className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce delay-200" />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick suggestions */}
      {messages.length <= 1 && (
        <div className="max-w-2xl mx-auto w-full px-4 mb-4">
          <div className="grid grid-cols-2 gap-2">
            {[
              "When should I leave for airport?",
              "What's the cheapest way?",
              "Hopper vs Train?",
              "How to stay safe?",
            ].map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => setInput(suggestion)}
                className="text-left text-xs p-2 rounded-lg bg-muted hover:bg-muted-foreground/20 transition-colors"
              >
                <Lightbulb className="w-3 h-3 inline mr-1" />
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask me anything..."
              className="flex-1 h-12 bg-card"
              disabled={isLoading}
            />
            <Button
              type="submit"
              size="icon"
              className="h-12 w-12"
              disabled={!input.trim() || isLoading}
            >
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AIAssistant;
