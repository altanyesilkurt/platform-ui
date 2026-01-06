import { useEffect, useRef, useState } from 'react';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { TypingIndicator } from './TypingIndicator';
import { ErrorMessage } from './ErrorMessage';
import { EmptyState } from './EmptyState';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ApiMessage } from '@/lib/api';

interface ChatAreaProps {
    chatId: string;
    chatTitle: string;
    messages: ApiMessage[];
    onMessagesChange: (messages: ApiMessage[]) => void;
    onTitleChange?: (newTitle: string) => void;
    onStartGeneratingTitle?: () => void;
}

export const ChatArea = ({
                             chatId,
                             chatTitle,
                             messages = [],
                             onMessagesChange,
                             onTitleChange,
                             onStartGeneratingTitle,
                         }: ChatAreaProps) => {
    const scrollRef = useRef<HTMLDivElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [streamingContent, setStreamingContent] = useState('');
    const [isStreaming, setIsStreaming] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const messagesRef = useRef<ApiMessage[]>(messages);

    useEffect(() => {
        messagesRef.current = messages;
    }, [messages]);

    const safeMessages = messages ?? [];

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [safeMessages, streamingContent, isStreaming]);

    const handleMessageSent = (message: ApiMessage) => {
        if (message.role === 'user') {
            const newMessages = [...messagesRef.current, message];
            messagesRef.current = newMessages;
            onMessagesChange(newMessages);
            setStreamingContent('');
            setIsStreaming(true);
            setError(null);

            // If this is the first message, notify parent that title will be generated
            if (messagesRef.current.length === 1) {
                onStartGeneratingTitle?.();
            }
        }
    };

    const handleStreamingResponse = (content: string, done: boolean, messageId?: string) => {
        if (done && messageId) {
            const assistantMessage: ApiMessage = {
                id: messageId,
                chat_id: chatId,
                role: 'assistant',
                content,
                created_at: new Date().toISOString(),
            };
            const newMessages = [...messagesRef.current, assistantMessage];
            messagesRef.current = newMessages;
            onMessagesChange(newMessages);
            setStreamingContent('');
            setIsStreaming(false);
        } else {
            setStreamingContent(content);
        }
    };

    const handleTitleGenerated = (newTitle: string) => {
        onTitleChange?.(newTitle);
    };

    const handleError = (errorMessage: string) => {
        setError(errorMessage);
        setIsStreaming(false);
        setStreamingContent('');
    };

    const clearError = () => setError(null);

    return (
        <div className="flex-1 flex flex-col min-h-0 bg-background">
            {/* Header */}
            <div className="border-b border-border bg-card px-6 py-4">
                <h1 className="text-lg font-semibold text-foreground truncate">
                    {chatTitle}
                </h1>
                <p className="text-xs text-muted-foreground">
                    {safeMessages.length} {safeMessages.length === 1 ? 'message' : 'messages'}
                </p>
            </div>

            {/* Messages Area */}
            {safeMessages.length === 0 && !isStreaming ? (
                <EmptyState />
            ) : (
                <ScrollArea className="flex-1" ref={scrollRef}>
                    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
                        {safeMessages.map((message) => (
                            <ChatMessage key={message.id} message={message} />
                        ))}

                        {isStreaming && streamingContent && (
                            <ChatMessage
                                message={{
                                    id: 'streaming',
                                    chat_id: chatId,
                                    role: 'assistant',
                                    content: streamingContent,
                                    created_at: new Date().toISOString(),
                                }}
                            />
                        )}

                        {isStreaming && !streamingContent && <TypingIndicator />}

                        <div ref={messagesEndRef} />
                    </div>
                </ScrollArea>
            )}

            {/* Error Message */}
            {error && (
                <div className="py-3">
                    <ErrorMessage message={error} onDismiss={clearError} />
                </div>
            )}

            {/* Input Area */}
            <ChatInput
                chatId={chatId}
                onMessageSent={handleMessageSent}
                onStreamingResponse={handleStreamingResponse}
                onTitleGenerated={handleTitleGenerated}
                onError={handleError}
                useStreaming={true}
                disabled={isStreaming}
            />
        </div>
    );
};