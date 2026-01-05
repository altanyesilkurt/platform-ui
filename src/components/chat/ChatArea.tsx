import { useEffect, useRef } from 'react';
import { Chat } from '@/types/chat';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { TypingIndicator } from './TypingIndicator';
import { ErrorMessage } from './ErrorMessage';
import { EmptyState } from './EmptyState';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ChatAreaProps {
  chat: Chat;
  loading: boolean;
  error: string | null;
  onSendMessage: (message: string) => void;
  onClearError: () => void;
}

export const ChatArea = ({
  chat,
  loading,
  error,
  onSendMessage,
  onClearError,
}: ChatAreaProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chat.messages, loading]);

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card px-6 py-4">
        <h1 className="text-lg font-semibold text-foreground truncate">
          {chat.title}
        </h1>
        <p className="text-xs text-muted-foreground">
          {chat.messages.length} {chat.messages.length === 1 ? 'message' : 'messages'}
        </p>
      </div>

      {/* Messages Area */}
      {chat.messages.length === 0 && !loading ? (
        <EmptyState />
      ) : (
        <ScrollArea className="flex-1" ref={scrollRef}>
          <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
            {chat.messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}
            {loading && <TypingIndicator />}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
      )}

      {/* Error Message */}
      {error && (
        <div className="py-3">
          <ErrorMessage message={error} onDismiss={onClearError} />
        </div>
      )}

      {/* Input Area */}
      <ChatInput onSend={onSendMessage} disabled={loading} />
    </div>
  );
};
