import { MessageSquarePlus, Sparkles } from 'lucide-react';

export const EmptyState = () => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
      <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
        <Sparkles className="h-8 w-8 text-primary" />
      </div>
      <h2 className="text-xl font-semibold text-foreground mb-2">
        Start a Conversation
      </h2>
      <p className="text-muted-foreground max-w-sm mb-6">
        Begin chatting with your AI assistant by typing a message in the input box below.
      </p>
      <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 px-4 py-2 rounded-full">
        <MessageSquarePlus className="h-4 w-4" />
        <span>Ask a question or request help</span>
      </div>
    </div>
  );
};
