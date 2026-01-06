import { cn } from '@/lib/utils';
import { User, Bot } from 'lucide-react';

interface Message {
    id: string;
    chat_id: string;
    role: 'user' | 'assistant';
    content: string;
    created_at?: string;
    timestamp?: Date;
}

interface ChatMessageProps {
    message: Message;
}

export const ChatMessage = ({ message }: ChatMessageProps) => {
    const isUser = message.role === 'user';

    // Handle both timestamp (Date) and created_at (string) formats
    const formatTime = (): string => {
        try {
            let date: Date | null = null;

            if (message.timestamp instanceof Date) {
                date = message.timestamp;
            } else if (message.created_at) {
                date = new Date(message.created_at);
            }

            if (!date || isNaN(date.getTime())) {
                return '';
            }

            return date.toLocaleTimeString('tr-TR', {
                hour: '2-digit',
                minute: '2-digit',
            });
        } catch {
            return '';
        }
    };

    const timeString = formatTime();

    return (
        <div
            className={cn(
                'flex gap-3 animate-fade-in',
                isUser ? 'flex-row-reverse' : 'flex-row'
            )}
        >
            {/* Avatar */}
            <div
                className={cn(
                    'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center',
                    isUser ? 'bg-primary' : 'bg-muted border border-border'
                )}
            >
                {isUser ? (
                    <User className="h-4 w-4 text-primary-foreground" />
                ) : (
                    <Bot className="h-4 w-4 text-muted-foreground" />
                )}
            </div>

            {/* Message Bubble */}
            <div
                className={cn(
                    'max-w-[75%] rounded-2xl px-4 py-3 shadow-soft',
                    isUser
                        ? 'bg-chat-user text-chat-user-foreground rounded-br-md'
                        : 'bg-chat-assistant text-chat-assistant-foreground border border-chat-assistant-border rounded-bl-md'
                )}
            >
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                    {message.content}
                </p>
                {timeString && (
                    <span
                        className={cn(
                            'text-[10px] mt-1.5 block',
                            isUser ? 'text-primary-foreground/70' : 'text-muted-foreground'
                        )}
                    >
            {timeString}
          </span>
                )}
            </div>
        </div>
    );
};