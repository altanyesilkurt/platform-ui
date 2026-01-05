import { Bot } from 'lucide-react';

export const TypingIndicator = () => {
  return (
    <div className="flex gap-3 animate-fade-in">
      {/* Avatar */}
      <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-muted border border-border">
        <Bot className="h-4 w-4 text-muted-foreground" />
      </div>

      {/* Typing Bubble */}
      <div className="bg-chat-assistant border border-chat-assistant-border rounded-2xl rounded-bl-md px-4 py-3 shadow-soft">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 bg-muted-foreground rounded-full typing-dot" />
          <div className="w-2 h-2 bg-muted-foreground rounded-full typing-dot" />
          <div className="w-2 h-2 bg-muted-foreground rounded-full typing-dot" />
        </div>
      </div>
    </div>
  );
};
