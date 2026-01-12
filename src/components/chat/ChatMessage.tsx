import React, { useMemo } from 'react';
import { ApiMessage, PRMetadata, detectPRUrl } from '@/lib/api';
import { PRMetadataCard } from './PRMetadataCard';
import ReactMarkdown from 'react-markdown';
import { User, Bot, Github } from 'lucide-react';

interface ChatMessageProps {
    message: ApiMessage;
    isStreaming?: boolean;
    triggerMessage?: string;
}

// Detect if message is GitHub/PR related
const isGitHubRelated = (content: string): boolean => {
    if (!content) return false;
    if (content.includes('github.com')) return true;
    if (content.includes('/pull/')) return true;
    if (detectPRUrl(content)) return true;

    const lowerContent = content.toLowerCase();
    const keywords = ['pull request', 'code review', 'pr review', 'review this pr', 'analyze pr'];
    return keywords.some(keyword => lowerContent.includes(keyword));
};

export const ChatMessage: React.FC<ChatMessageProps> = ({
                                                            message,
                                                            isStreaming,
                                                            triggerMessage,
                                                        }) => {
    const isUser = message.role === 'user';
    const prMetadata: PRMetadata | undefined = message.pr_metadata;

    // Determine if this is GitHub-related
    const isGitHub = useMemo(() => {
        if (prMetadata) return true;
        if (isUser) return isGitHubRelated(message.content || '');
        if (triggerMessage) return isGitHubRelated(triggerMessage);
        return false;
    }, [isUser, message.content, prMetadata, triggerMessage]);

    // User message - Right aligned
    if (isUser) {
        return (
            <div className="flex justify-end">
                <div className="flex gap-3 max-w-[80%]">
                    <div className="bg-primary text-primary-foreground rounded-2xl rounded-tr-sm px-4 py-3">
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    </div>
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                        <User className="w-4 h-4 text-primary-foreground" />
                    </div>
                </div>
            </div>
        );
    }

    // Assistant message - Left aligned
    return (
        <div className="flex">
            <div className="flex gap-3 max-w-[85%]">
                {/* Avatar */}
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                    isGitHub ? 'bg-gray-900' : 'bg-purple-600'
                }`}>
                    {isGitHub ? (
                        <Github className="w-4 h-4 text-white" />
                    ) : (
                        <Bot className="w-4 h-4 text-white" />
                    )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-muted-foreground mb-2">
                        {isGitHub ? 'GitHub AI Assistant' : 'AI Assistant'}
                    </p>

                    {/* PR Metadata Card */}
                    {prMetadata && (
                        <PRMetadataCard
                            metadata={prMetadata}
                            isLoading={isStreaming}
                        />
                    )}

                    {/* Message Content */}
                    <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-3">
                        <div className="prose prose-sm max-w-none text-foreground dark:prose-invert">
                            <ReactMarkdown>{message.content || ''}</ReactMarkdown>
                        </div>

                        {/* Streaming cursor */}
                        {isStreaming && message.content && (
                            <span className="inline-block w-2 h-4 bg-primary animate-pulse ml-0.5" />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ChatMessage;