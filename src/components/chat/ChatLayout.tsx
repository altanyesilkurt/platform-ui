import { Chat, UserProfile } from '@/types/chat';
import { ChatSidebar } from './ChatSidebar';
import { ChatArea } from './ChatArea';

interface ChatLayoutProps {
  chats: Chat[];
  activeChat: Chat;
  activeChatId: string;
  user: UserProfile;
  loading: boolean;
  error: string | null;
  onSelectChat: (chatId: string) => void;
  onDeleteChat: (chatId: string) => void;
  onUpdateChatTitle: (chatId: string, newTitle: string) => void;
  onNewChat: () => void;
  onSendMessage: (message: string) => void;
  onClearError: () => void;
}

export const ChatLayout = ({
  chats,
  activeChat,
  activeChatId,
  user,
  loading,
  error,
  onSelectChat,
  onDeleteChat,
  onUpdateChatTitle,
  onNewChat,
  onSendMessage,
  onClearError,
}: ChatLayoutProps) => {
  return (
    <div className="flex h-screen w-full overflow-hidden">
      <ChatSidebar
        chats={chats}
        activeChatId={activeChatId}
        user={user}
        onSelectChat={onSelectChat}
        onDeleteChat={onDeleteChat}
        onUpdateChatTitle={onUpdateChatTitle}
        onNewChat={onNewChat}
      />
      <ChatArea
        chat={activeChat}
        loading={loading}
        error={error}
        onSendMessage={onSendMessage}
        onClearError={onClearError}
      />
    </div>
  );
};
