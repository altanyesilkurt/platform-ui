import { ChatLayout } from '../components/chat/ChatLayout';
import { useChat } from '../hooks/useChat';
import type { UserProfile } from '../types/chat';

// Demo user - Replace with actual user data from your auth system
const demoUser: UserProfile = {
  avatar: '',
  firstName: 'Altan',
  lastName: 'Yesilkurt',
};

const Index = () => {
  const {
    chats,
    activeChat,
    activeChatId,
    loading,
    error,
    setActiveChatId,
    createChat,
    deleteChat,
    updateChatTitle,
    sendMessage,
    clearError,
  } = useChat();

  return (
    <ChatLayout
      chats={chats}
      activeChat={activeChat}
      activeChatId={activeChatId}
      user={demoUser}
      loading={loading}
      error={error}
      onSelectChat={setActiveChatId}
      onDeleteChat={deleteChat}
      onUpdateChatTitle={updateChatTitle}
      onNewChat={createChat}
      onSendMessage={sendMessage}
      onClearError={clearError}
    />
  );
};

export default Index;
