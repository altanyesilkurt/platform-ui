import React from 'react';
import { PRMetadataCard } from './PRMetadataCard';
import { ApiMessage } from '@/lib/api';
import { User, Bot } from 'lucide-react';
import MarkdownRenderer from "@/components/chat/MarkdownRenderer.tsx";

interface ChatMessageProps {
    message: ApiMessage;
    isLoading?: boolean;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message, isLoading }) => {
    const isUser = message.role === 'user';

    return (
        <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
            {/* Avatar */}
            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                isUser ? 'bg-blue-600' : 'bg-gray-700'
            }`}>
                {isUser ? (
                    <User className="w-4 h-4 text-white" />
                ) : (
                    <Bot className="w-4 h-4 text-white" />
                )}
            </div>

            {/* Message Content */}
            <div className={`flex-1 max-w-[80%] ${isUser ? 'text-right' : ''}`}>
                {/* PR Metadata Card (if available, show before AI response) */}
                {!isUser && message.pr_metadata && (
                    <PRMetadataCard
                        metadata={message.pr_metadata}
                        isLoading={isLoading}
                    />
                )}

                {/* Message Bubble */}
                <div className={`inline-block rounded-2xl px-4 py-3 ${
                    isUser
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-800'
                }`}>
                    {isUser ? (
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    ) : (
                        <MarkdownRenderer content={message.content} />
                    )}
                </div>

                <p className={`text-xs text-gray-400 mt-1 ${isUser ? 'text-right' : ''}`}>
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