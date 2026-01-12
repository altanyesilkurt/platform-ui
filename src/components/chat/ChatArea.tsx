import { useEffect, useRef, useState } from 'react';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { TypingIndicator } from './TypingIndicator';
import { ErrorMessage } from './ErrorMessage';
import { EmptyState } from './EmptyState';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ApiMessage, PRMetadata } from '@/lib/api';

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
    const [streamingPRMetadata, setStreamingPRMetadata] = useState<PRMetadata | null>(null);
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

    // Get the last user message for context
    const lastUserMessage = safeMessages.filter(m => m.role === 'user').pop()?.content || '';

    const handleMessageSent = (message: ApiMessage) => {
        if (message.role === 'user') {
            const newMessages = [...messagesRef.current, message];
            messagesRef.current = newMessages;
            onMessagesChange(newMessages);
            setStreamingContent('');
            setStreamingPRMetadata(null);
            setIsStreaming(true);
            setError(null);

            if (messagesRef.current.length === 1) {
                onStartGeneratingTitle?.();
            }
        }
    };

    const handlePRMetadataReceived = (metadata: PRMetadata) => {
        console.log('ChatArea received PR metadata:', metadata);
        setStreamingPRMetadata(metadata);
    };

    const handleStreamingResponse = (content: string, done: boolean, messageId?: string, prMetadata?: PRMetadata) => {
        if (done && messageId) {
            const assistantMessage: ApiMessage = {
                id: messageId,
                chat_id: chatId,
                role: 'assistant',
                content,
                created_at: new Date().toISOString(),
                pr_metadata: prMetadata || streamingPRMetadata || undefined,
            };
            const newMessages = [...messagesRef.current, assistantMessage];
            messagesRef.current = newMessages;
            onMessagesChange(newMessages);
            setStreamingContent('');
            setStreamingPRMetadata(null);
            setIsStreaming(false);
        } else {
            setStreamingContent(content);
            if (prMetadata) {
                setStreamingPRMetadata(prMetadata);
            }
        }
    };

    const handleTitleGenerated = (newTitle: string) => {
        onTitleChange?.(newTitle);
    };

    const handleError = (errorMessage: string) => {
        setError(errorMessage);
        setIsStreaming(false);
        setStreamingContent('');
        setStreamingPRMetadata(null);
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
                        {safeMessages.map((message, index) => {
                            // Find the user message that triggered this assistant response
                            let triggerMessage = '';
                            if (message.role === 'assistant') {
                                const prevUserMsg = safeMessages
                                    .slice(0, index)
                                    .reverse()
                                    .find(m => m.role === 'user');
                                triggerMessage = prevUserMsg?.content || '';
                            }

                            return (
                                <ChatMessage
                                    key={message.id}
                                    message={message}
                                    triggerMessage={triggerMessage}
                                />
                            );
                        })}

                        {/* Streaming message with PR metadata */}
                        {isStreaming && streamingContent && (
                            <ChatMessage
                                message={{
                                    id: 'streaming',
                                    chat_id: chatId,
                                    role: 'assistant',
                                    content: streamingContent,
                                    created_at: new Date().toISOString(),
                                    pr_metadata: streamingPRMetadata || undefined,
                                }}
                                isStreaming={true}
                                triggerMessage={lastUserMessage}
                            />
                        )}

                        {isStreaming && !streamingContent && (
                            <TypingIndicator
                                isGitHub={streamingPRMetadata !== null || lastUserMessage.includes('github.com')}
                            />
                        )}

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
                onPRMetadataReceived={handlePRMetadataReceived}
                onTitleGenerated={handleTitleGenerated}
                onError={handleError}
                useStreaming={true}
                disabled={isStreaming}
            />
        </div>
    );
};