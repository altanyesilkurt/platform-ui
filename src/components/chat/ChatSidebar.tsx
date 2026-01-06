import { Plus } from 'lucide-react';
import { Chat, UserProfile as UserProfileType } from '@/types/chat';
import { ChatHistoryItem } from './ChatHistoryItem';
import { UserProfile } from './UserProfile';
import { Button } from '@/components/ui/button';

interface ChatSidebarProps {
    chats: Chat[];
    activeChatId: string;
    user: UserProfileType;
    onSelectChat: (chatId: string) => void;
    onDeleteChat: (chatId: string) => void;
    onUpdateChatTitle: (chatId: string, newTitle: string) => void;
    onNewChat: () => void;
    generatingTitleForChatId?: string | null;
}

export const ChatSidebar = ({
                                chats,
                                activeChatId,
                                user,
                                onSelectChat,
                                onDeleteChat,
                                onUpdateChatTitle,
                                onNewChat,
                                generatingTitleForChatId,
                            }: ChatSidebarProps) => {
    return (
        <div className="w-72 h-full bg-sidebar border-r border-sidebar-border flex flex-col overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-sidebar-border flex-shrink-0">
                <Button
                    onClick={onNewChat}
                    className="w-full justify-start gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-soft"
                >
                    <Plus className="h-4 w-4" />
                    New Chat
                </Button>
            </div>

            {/* Chat History */}
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                <div className="px-4 py-3 flex-shrink-0">
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Chat History
                    </h3>
                </div>
                <div className="flex-1 overflow-y-auto overflow-x-hidden px-2">
                    <div className="space-y-1 pb-4">
                        {chats.map((chat) => (
                            <ChatHistoryItem
                                key={chat.id}
                                chat={chat}
                                isActive={chat.id === activeChatId}
                                isGeneratingTitle={chat.id === generatingTitleForChatId}
                                onSelect={() => onSelectChat(chat.id)}
                                onDelete={() => onDeleteChat(chat.id)}
                                onUpdateTitle={(newTitle) => onUpdateChatTitle(chat.id, newTitle)}
                            />
                        ))}
                    </div>
                </div>
            </div>

            {/* User Profile */}
            <UserProfile user={user} />
        </div>
    );
};