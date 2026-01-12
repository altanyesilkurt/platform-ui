import { useState, useRef, useEffect } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { API_BASE_URL, ApiMessage, PRMetadata } from '@/lib/api';

interface ChatInputProps {
    chatId: string | null;
    onMessageSent?: (message: ApiMessage) => void;
    onStreamingResponse?: (content: string, done: boolean, messageId?: string, prMetadata?: PRMetadata) => void;
    onPRMetadataReceived?: (metadata: PRMetadata) => void;
    onTitleGenerated?: (newTitle: string) => void;
    onError?: (error: string) => void;
    useStreaming?: boolean;
    disabled?: boolean;
}

export const ChatInput = ({
                              chatId,
                              onMessageSent,
                              onStreamingResponse,
                              onPRMetadataReceived,
                              onTitleGenerated,
                              onError,
                              useStreaming = true,
                              disabled
                          }: ChatInputProps) => {
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const abortControllerRef = useRef<AbortController | null>(null);
    const isSubmittingRef = useRef(false);

    const sendMessageNonStreaming = async (content: string) => {
        const response = await fetch(`${API_BASE_URL}/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: chatId, message: content }),
        });

        if (!response.ok) {
            throw new Error('Failed to send message');
        }

        const data = await response.json();

        onMessageSent?.({
            id: data.id,
            chat_id: chatId!,
            role: 'assistant',
            content: data.content,
            created_at: new Date().toISOString(),
            pr_metadata: data.pr_metadata,
        });

        if (data.new_title) {
            onTitleGenerated?.(data.new_title);
        }
    };

    const sendMessageStreaming = async (content: string) => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        abortControllerRef.current = new AbortController();
        const signal = abortControllerRef.current.signal;

        const response = await fetch(`${API_BASE_URL}/chat/stream`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'text/event-stream',
            },
            body: JSON.stringify({ chat_id: chatId, message: content }),
            signal,
        });

        if (!response.ok) {
            throw new Error('Failed to send message');
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        if (!reader) {
            throw new Error('No response body');
        }

        let fullContent = '';
        let buffer = '';
        let prMetadata: PRMetadata | undefined = undefined;

        try {
            while (true) {
                const { done, value } = await reader.read();

                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';

                for (const line of lines) {
                    const trimmedLine = line.trim();
                    if (trimmedLine.startsWith('data: ')) {
                        try {
                            const jsonStr = trimmedLine.slice(6);
                            if (!jsonStr) continue;

                            const data = JSON.parse(jsonStr);

                            if (data.error) {
                                throw new Error(data.error);
                            }

                            // Capture PR metadata when received
                            if (data.pr_metadata) {
                                console.log('PR Metadata received:', data.pr_metadata);
                                prMetadata = data.pr_metadata;
                                onPRMetadataReceived?.(prMetadata);
                            }

                            if (data.content) {
                                fullContent += data.content;
                                onStreamingResponse?.(fullContent, false, undefined, prMetadata);
                            }

                            if (data.done) {
                                onStreamingResponse?.(fullContent, true, data.id, prMetadata);

                                if (data.new_title) {
                                    onTitleGenerated?.(data.new_title);
                                }
                                return;
                            }
                        } catch (e) {
                            if (e instanceof SyntaxError) {
                                console.warn('Failed to parse SSE data:', trimmedLine);
                                continue;
                            }
                            throw e;
                        }
                    }
                }
            }

            if (fullContent && !signal.aborted) {
                onStreamingResponse?.(fullContent, true, undefined, prMetadata);
            }
        } finally {
            reader.releaseLock();
        }
    };

    const handleSubmit = async () => {
        if (isSubmittingRef.current) return;
        if (!message.trim() || !chatId || disabled || isLoading) return;

        isSubmittingRef.current = true;
        const content = message.trim();
        setMessage('');
        setIsLoading(true);

        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
        }

        onMessageSent?.({
            id: crypto.randomUUID(),
            chat_id: chatId,
            role: 'user',
            content,
            created_at: new Date().toISOString(),
        });

        try {
            if (useStreaming) {
                await sendMessageStreaming(content);
            } else {
                await sendMessageNonStreaming(content);
            }
        } catch (error) {
            if (error instanceof Error && error.name === 'AbortError') {
                console.log('Request was aborted');
                return;
            }
            console.error('Error sending message:', error);
            onError?.(error instanceof Error ? error.message : 'An error occurred');
        } finally {
            setIsLoading(false);
            isSubmittingRef.current = false;
            abortControllerRef.current = null;
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    };

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
        }
    }, [message]);

    useEffect(() => {
        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, []);

    const isDisabled = disabled || isLoading || !chatId;

    return (
        <div className="border-t border-border bg-card p-4">
            <div className="max-w-3xl mx-auto">
                <div
                    className={cn(
                        'flex items-end gap-3 bg-background border border-input rounded-2xl p-2 transition-all duration-200',
                        'focus-within:ring-2 focus-within:ring-ring focus-within:border-transparent',
                        isDisabled && 'opacity-60'
                    )}
                >
                    <textarea
                        ref={textareaRef}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={chatId ? "Type a message..." : "Select or create a chat to start"}
                        disabled={isDisabled}
                        rows={1}
                        className={cn(
                            'flex-1 resize-none bg-transparent text-sm outline-none px-2 py-1.5',
                            'placeholder:text-muted-foreground',
                            'disabled:cursor-not-allowed'
                        )}
                    />
                    <Button
                        onClick={handleSubmit}
                        disabled={isDisabled || !message.trim()}
                        size="icon"
                        className={cn(
                            'h-9 w-9 rounded-xl transition-all duration-200',
                            'bg-primary hover:bg-primary/90',
                            'disabled:opacity-50 disabled:cursor-not-allowed'
                        )}
                    >
                        {isLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Send className="h-4 w-4" />
                        )}
                    </Button>
                </div>
                <p className="text-xs text-muted-foreground text-center mt-2">
                    {isLoading ? 'AI is thinking...' : 'Press Enter to send, Shift+Enter for new line'}
                </p>
            </div>
        </div>
    );
};