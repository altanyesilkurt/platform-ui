import { useState, useEffect } from 'react';
import { UserProfile } from '@/types/chat';
import { ChatSidebar } from './ChatSidebar';
import { ChatArea } from './ChatArea';
import { ApiChat, ApiMessage, chatApi } from '@/lib/api';

interface ChatLayoutProps {
    user: UserProfile;
}

export const ChatLayout = ({ user }: ChatLayoutProps) => {
    const [chats, setChats] = useState<ApiChat[]>([]);
    const [activeChat, setActiveChat] = useState<ApiChat | null>(null);
    const [messages, setMessages] = useState<ApiMessage[]>([]);
    const [isLoadingChats, setIsLoadingChats] = useState(true);
    const [isLoadingMessages, setIsLoadingMessages] = useState(false);

    // Load all chats on mount
    useEffect(() => {
        const loadChats = async () => {
            try {
                const data = await chatApi.getChats();
                setChats(data);
                // Auto-select first chat if available
                if (data.length > 0) {
                    setActiveChat(data[0]);
                }
            } catch (error) {
                console.error('Failed to load chats:', error);
            } finally {
                setIsLoadingChats(false);
            }
        };
        loadChats();
    }, []);

    // Load messages when active chat changes
    useEffect(() => {
        if (activeChat) {
            const loadMessages = async () => {
                setIsLoadingMessages(true);
                try {
                    const data = await chatApi.getMessages(activeChat.id);
                    setMessages(data);
                } catch (error) {
                    console.error('Failed to load messages:', error);
                    setMessages([]);
                } finally {
                    setIsLoadingMessages(false);
                }
            };
            loadMessages();
        } else {
            setMessages([]);
        }
    }, [activeChat?.id]);

    const handleSelectChat = (chatId: string) => {
        const chat = chats.find(c => c.id === chatId);
        if (chat) {
            setActiveChat(chat);
        }
    };

    const handleNewChat = async () => {
        try {
            const newChat = await chatApi.createChat('New Chat');
            setChats(prev => [newChat, ...prev]);
            setActiveChat(newChat);
            setMessages([]);
        } catch (error) {
            console.error('Failed to create chat:', error);
        }
    };

    const handleDeleteChat = async (chatId: string) => {
        try {
            await chatApi.deleteChat(chatId);
            setChats(prev => prev.filter(c => c.id !== chatId));
            if (activeChat?.id === chatId) {
                const remaining = chats.filter(c => c.id !== chatId);
                setActiveChat(remaining.length > 0 ? remaining[0] : null);
            }
        } catch (error) {
            console.error('Failed to delete chat:', error);
        }
    };

    const handleUpdateChatTitle = async (chatId: string, newTitle: string) => {
        try {
            const updated = await chatApi.updateChatTitle(chatId, newTitle);
            setChats(prev => prev.map(c => c.id === chatId ? updated : c));
            if (activeChat?.id === chatId) {
                setActiveChat(updated);
            }
        } catch (error) {
            console.error('Failed to update chat title:', error);
        }
    };

    // Convert ApiChat to the format ChatSidebar expects
    const sidebarChats = chats.map(chat => ({
        id: chat.id,
        title: chat.title,
        messages: [],
        createdAt: new Date(chat.created_at),
        updatedAt: new Date(chat.updated_at),
    }));

    return (
        <div className="flex h-screen w-full overflow-hidden">
            <ChatSidebar
                chats={sidebarChats}
                activeChatId={activeChat?.id || ''}
                user={user}
                onSelectChat={handleSelectChat}
                onDeleteChat={handleDeleteChat}
                onUpdateChatTitle={handleUpdateChatTitle}
                onNewChat={handleNewChat}
            />

            {activeChat ? (
                <ChatArea
                    chatId={activeChat.id}
                    chatTitle={activeChat.title}
                    messages={messages}
                    onMessagesChange={setMessages}
                />
            ) : (
                <div className="flex-1 flex items-center justify-center bg-background">
                    <div className="text-center text-muted-foreground">
                        {isLoadingChats ? (
                            <p>Loading chats...</p>
                        ) : (
                            <>
                                <p className="text-lg mb-4">No chat selected</p>
                                <button
                                    onClick={handleNewChat}
                                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                                >
                                    Start a new chat
                                </button>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};