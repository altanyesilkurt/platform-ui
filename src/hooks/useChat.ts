import { useState, useCallback, useEffect } from 'react';
import { Chat, Message } from '@/types/chat';
import { chatApi } from '@/lib/api';

const generateId = () => Math.random().toString(36).substring(2, 15);

const createNewChat = (): Chat => ({
    id: generateId(),
    title: 'New Chat',
    messages: [],
    createdAt: new Date(),
    updatedAt: new Date(),
});

export const useChat = () => {
    const [chats, setChats] = useState<Chat[]>([createNewChat()]);
    const [activeChatId, setActiveChatId] = useState<string>(chats[0].id);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isConnected, setIsConnected] = useState(false);

    const activeChat = chats.find(chat => chat.id === activeChatId) || chats[0];

    // Try to load chats from API on mount
    useEffect(() => {
        const loadChats = async () => {
            try {
                const apiChats = await chatApi.getChats();
                if (apiChats.length > 0) {
                    const loadedChats: Chat[] = apiChats.map(c => ({
                        id: c.id,
                        title: c.title,
                        messages: [],
                        createdAt: new Date(c.created_at),
                        updatedAt: new Date(c.updated_at),
                    }));
                    setChats(loadedChats);
                    setActiveChatId(loadedChats[0].id);
                    setIsConnected(true);
                }
            } catch (err) {
                console.log('FastAPI not connected, using local state');
                setIsConnected(false);
            }
        };
        loadChats();
    }, []);

    // Load messages when active chat changes
    useEffect(() => {
        if (!isConnected) return;

        const loadMessages = async () => {
            try {
                const apiMessages = await chatApi.getMessages(activeChatId);
                const messages: Message[] = apiMessages.map(m => ({
                    id: m.id,
                    role: m.role,
                    content: m.content,
                    timestamp: new Date(m.created_at),
                }));

                setChats(prev => prev.map(chat =>
                    chat.id === activeChatId ? { ...chat, messages } : chat
                ));
            } catch (err) {
                console.log('Failed to load messages');
            }
        };
        loadMessages();
    }, [activeChatId, isConnected]);

    const createChat = useCallback(async () => {
        try {
            if (isConnected) {
                const apiChat = await chatApi.createChat('New Chat');
                const newChat: Chat = {
                    id: apiChat.id,
                    title: apiChat.title,
                    messages: [],
                    createdAt: new Date(apiChat.created_at),
                    updatedAt: new Date(apiChat.updated_at),
                };
                setChats(prev => [newChat, ...prev]);
                setActiveChatId(newChat.id);
            } else {
                const newChat = createNewChat();
                setChats(prev => [newChat, ...prev]);
                setActiveChatId(newChat.id);
            }
        } catch (err) {
            const newChat = createNewChat();
            setChats(prev => [newChat, ...prev]);
            setActiveChatId(newChat.id);
        }
    }, [isConnected]);

    const deleteChat = useCallback(async (chatId: string) => {
        try {
            if (isConnected) {
                await chatApi.deleteChat(chatId);
            }
        } catch (err) {
            console.log('Failed to delete chat from API');
        }

        setChats(prev => {
            const filtered = prev.filter(chat => chat.id !== chatId);
            if (filtered.length === 0) {
                const newChat = createNewChat();
                setActiveChatId(newChat.id);
                return [newChat];
            }
            if (chatId === activeChatId) {
                setActiveChatId(filtered[0].id);
            }
            return filtered;
        });
    }, [activeChatId, isConnected]);

    const updateChatTitle = useCallback(async (chatId: string, newTitle: string) => {
        try {
            if (isConnected) {
                await chatApi.updateChatTitle(chatId, newTitle);
            }
        } catch (err) {
            console.log('Failed to update chat title in API');
        }

        setChats(prev =>
            prev.map(chat =>
                chat.id === chatId
                    ? { ...chat, title: newTitle, updatedAt: new Date() }
                    : chat
            )
        );
    }, [isConnected]);

    const sendMessage = useCallback(async (content: string) => {
        if (!content.trim() || loading) return;

        setError(null);

        const userMessage: Message = {
            id: generateId(),
            role: 'user',
            content: content.trim(),
            timestamp: new Date(),
        };

        // Add user message immediately
        setChats(prev =>
            prev.map(chat =>
                chat.id === activeChatId
                    ? {
                        ...chat,
                        messages: [...chat.messages, userMessage],
                        title: chat.messages.length === 0 ? content.trim().slice(0, 30) + (content.length > 30 ? '...' : '') : chat.title,
                        updatedAt: new Date(),
                    }
                    : chat
            )
        );

        // Update title in API if first message
        const currentChat = chats.find(c => c.id === activeChatId);
        if (isConnected && currentChat && currentChat.messages.length === 0) {
            const newTitle = content.trim().slice(0, 30) + (content.length > 30 ? '...' : '');
            chatApi.updateChatTitle(activeChatId, newTitle).catch(() => {});
        }

        setLoading(true);

        try {
            let responseContent: string;

            if (isConnected) {
                const response = await chatApi.sendMessage(activeChatId, content);
                responseContent = response.content;
            } else {
                // Simulated response when not connected
                await new Promise(resolve => setTimeout(resolve, 1500));
                responseContent = `This is a demo response. Connect your FastAPI backend for real responses.\n\nYou asked: "${content}"`;
            }

            const assistantMessage: Message = {
                id: generateId(),
                role: 'assistant',
                content: responseContent,
                timestamp: new Date(),
            };

            setChats(prev =>
                prev.map(chat =>
                    chat.id === activeChatId
                        ? {
                            ...chat,
                            messages: [...chat.messages, assistantMessage],
                            updatedAt: new Date(),
                        }
                        : chat
                )
            );
        } catch (err) {
            setError('An error occurred. Please try again.');
            console.error('Chat error:', err);
        } finally {
            setLoading(false);
        }
    }, [activeChatId, loading, chats, isConnected]);

    const clearError = useCallback(() => {
        setError(null);
    }, []);

    return {
        chats,
        activeChat,
        activeChatId,
        loading,
        error,
        isConnected,
        setActiveChatId,
        createChat,
        deleteChat,
        updateChatTitle,
        sendMessage,
        clearError,
    };
};
