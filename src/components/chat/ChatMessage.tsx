import React, { useMemo } from 'react';
import { PRMetadataCard } from './PRMetadataCard';
import { ApiMessage, detectPRUrl, PRMetadata } from '@/lib/api';
import { User, Bot, Github } from 'lucide-react';
import MarkdownRenderer from "@/components/chat/MarkdownRenderer";

interface ChatMessageProps {
    message: ApiMessage;
    isLoading?: boolean;
    triggerMessage?: string;
}

const isGitHubRelated = (content: string): boolean => {
    if (!content) return false;
    if (content.includes('github.com')) return true;
    if (content.includes('/pull/')) return true;
    if (detectPRUrl(content)) return true;

    const lowerContent = content.toLowerCase();
    const keywords = ['pull request', 'code review', 'pr review', 'review this pr', 'analyze pr'];
    return keywords.some(keyword => lowerContent.includes(keyword));
};

export const ChatMessage: React.FC<ChatMessageProps> = ({ message, isLoading, triggerMessage }) => {
    const isUser = message.role === 'user';
    const prMetadata: PRMetadata | undefined = message.pr_metadata;

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
        <div className="flex gap-3">
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

            {/* Message Content */}
            <div className="flex-1 min-w-0 max-w-[85%]">
                <p className="text-xs font-medium text-muted-foreground mb-2">
                    {isGitHub ? 'GitHub AI Assistant' : 'AI Assistant'}
                </p>

                {/* PR Metadata Card */}
                {prMetadata && (
                    <PRMetadataCard
                        metadata={prMetadata}
                        isLoading={isLoading}
                    />
                )}

                {/* Message Bubble */}
                <div className="bg-gray-100 rounded-2xl rounded-tl-sm px-4 py-3">
                    <MarkdownRenderer content={message.content} />
                </div>

                {/* Timestamp */}
                <p className="text-xs text-gray-400 mt-1">
                    {new Date(message.created_at).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                    })}
                </p>
            </div>
        </div>
    );
};

export default ChatMessage;