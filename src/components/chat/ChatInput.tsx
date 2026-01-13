import { useEffect, useRef, useState } from 'react';
import { GitCommit, GitPullRequest, Loader2, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { API_BASE_URL, ApiMessage, CommitMetadata, detectCommitUrl, detectPRUrl, PRMetadata } from '@/lib/api';

interface ChatInputProps {
    chatId: string | null;
    onMessageSent?: (message: ApiMessage) => void;
    onStreamingResponse?: (content: string, done: boolean, messageId?: string, prMetadata?: PRMetadata, commitMetadata?: CommitMetadata) => void;
    onPRMetadataReceived?: (metadata: PRMetadata) => void;
    onCommitMetadataReceived?: (metadata: CommitMetadata) => void;
    onTitleGenerated?: (newTitle: string) => void;
    onError?: (error: string) => void;
    useStreaming?: boolean;
    disabled?: boolean;
}

type DetectedUrlType = 'pr' | 'commit' | null;

export const ChatInput = ({
                              chatId,
                              onMessageSent,
                              onStreamingResponse,
                              onPRMetadataReceived,
                              onCommitMetadataReceived,
                              onTitleGenerated,
                              onError,
                              useStreaming = true,
                              disabled
                          }: ChatInputProps) => {
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [detectedUrlType, setDetectedUrlType] = useState<DetectedUrlType>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const abortControllerRef = useRef<AbortController | null>(null);
    const isSubmittingRef = useRef(false);

    // Detect GitHub URLs as user types
    useEffect(() => {
        if (detectCommitUrl(message)) {
            setDetectedUrlType('commit');
        } else if (detectPRUrl(message)) {
            setDetectedUrlType('pr');
        } else {
            setDetectedUrlType(null);
        }
    }, [message]);

    const sendMessageNonStreaming = async (content: string) => {
        const response = await fetch(`${API_BASE_URL}/chat`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({chat_id: chatId, message: content}),
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
            commit_metadata: data.commit_metadata,
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
            body: JSON.stringify({chat_id: chatId, message: content}),
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
        let commitMetadata: CommitMetadata | undefined = undefined;

        try {
            while (true) {
                const {done, value} = await reader.read();

                if (done) break;

                buffer += decoder.decode(value, {stream: true});
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

                            // Capture Commit metadata when received
                            if (data.commit_metadata) {
                                console.log('Commit Metadata received:', data.commit_metadata);
                                commitMetadata = data.commit_metadata;
                                onCommitMetadataReceived?.(commitMetadata);
                            }

                            if (data.content) {
                                fullContent += data.content;
                                onStreamingResponse?.(fullContent, false, undefined, prMetadata, commitMetadata);
                            }

                            if (data.done) {
                                onStreamingResponse?.(fullContent, true, data.id, prMetadata, commitMetadata);

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
                onStreamingResponse?.(fullContent, true, undefined, prMetadata, commitMetadata);
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
        setDetectedUrlType(null);
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

    const getPlaceholder = () => {
        if (!chatId) return "Select or create a chat to start";
        if (detectedUrlType === 'commit') return "Commit URL detected - will analyze commit...";
        if (detectedUrlType === 'pr') return "PR URL detected - will analyze PR...";
        return "Type a message or paste a GitHub PR/Commit URL...";
    };

    const getStatusText = () => {
        if (isLoading) {
            if (detectedUrlType === 'commit') return 'Analyzing commit...';
            if (detectedUrlType === 'pr') return 'Analyzing PR...';
            return 'AI is thinking...';
        }
        return 'Press Enter to send, Shift+Enter for new line';
    };

    return (
        <div className="border-t border-border bg-card p-4">
            <div className="max-w-3xl mx-auto">
                {/* URL Detection Indicator */}
                {detectedUrlType && !isLoading && (
                    <div className={cn(
                        "flex items-center gap-2 px-3 py-1.5 mb-2 rounded-lg text-xs font-medium",
                        detectedUrlType === 'commit'
                            ? "bg-amber-50 text-amber-700 border border-amber-200"
                            : "bg-blue-50 text-blue-700 border border-blue-200"
                    )}>
                        {detectedUrlType === 'commit' ? (
                            <>
                                <GitCommit className="w-3.5 h-3.5"/>
                                <span>GitHub Commit detected - will fetch and analyze</span>
                            </>
                        ) : (
                            <>
                                <GitPullRequest className="w-3.5 h-3.5"/>
                                <span>GitHub PR detected - will fetch and analyze</span>
                            </>
                        )}
                    </div>
                )}

                <div
                    className={cn(
                        'flex items-end gap-3 bg-background border border-input rounded-2xl p-2 transition-all duration-200',
                        'focus-within:ring-2 focus-within:ring-ring focus-within:border-transparent',
                        isDisabled && 'opacity-60',
                        detectedUrlType === 'commit' && 'border-amber-300 focus-within:ring-amber-400',
                        detectedUrlType === 'pr' && 'border-blue-300 focus-within:ring-blue-400'
                    )}
                >
                    <textarea
                        ref={textareaRef}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={getPlaceholder()}
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
                            'disabled:opacity-50 disabled:cursor-not-allowed',
                            detectedUrlType === 'commit'
                                ? 'bg-amber-600 hover:bg-amber-700'
                                : detectedUrlType === 'pr'
                                    ? 'bg-blue-600 hover:bg-blue-700'
                                    : 'bg-primary hover:bg-primary/90'
                        )}
                    >
                        {isLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin"/>
                        ) : detectedUrlType === 'commit' ? (
                            <GitCommit className="h-4 w-4"/>
                        ) : detectedUrlType === 'pr' ? (
                            <GitPullRequest className="h-4 w-4"/>
                        ) : (
                            <Send className="h-4 w-4"/>
                        )}
                    </Button>
                </div>
                <p className="text-xs text-muted-foreground text-center mt-2">
                    {getStatusText()}
                </p>
            </div>
        </div>
    );
};