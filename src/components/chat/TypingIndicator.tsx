import { Bot, Github } from 'lucide-react';

interface TypingIndicatorProps {
    isGitHub?: boolean;
}

export const TypingIndicator = ({ isGitHub = false }: TypingIndicatorProps) => {
    return (
        <div className="flex gap-3">
            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                isGitHub ? 'bg-gray-900' : 'bg-purple-600'
            }`}>
                {isGitHub ? (
                    <Github className="w-4 h-4 text-white" />
                ) : (
                    <Bot className="w-4 h-4 text-white" />
                )}
            </div>
            <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-3">
                <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                        <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                    <span className="text-sm text-muted-foreground">
                        {isGitHub ? 'Analyzing PR...' : 'Thinking...'}
                    </span>
                </div>
            </div>
        </div>
    );
};