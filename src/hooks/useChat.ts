import { useState, useCallback, useEffect, useRef } from 'react';
import { Chat, Message } from '@/types/chat';
import { chatApi, PRMetadata, StreamEvent, detectPRUrl } from '@/lib/api';

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
    const [streamingContent, setStreamingContent] = useState<string>('');
    const [currentPRMetadata, setCurrentPRMetadata] = useState<PRMetadata | null>(null);
    const abortControllerRef = useRef<AbortController | null>(null);

    const activeChat = chats.find(chat => chat.id === activeChatId) || chats[0];

    // Load chats from API on mount
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
                }
                setIsConnected(true);
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
                    prMetadata: m.pr_metadata,
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

    // Cleanup streaming on unmount
    useEffect(() => {
        return () => {
            abortControllerRef.current?.abort();
        };
    }, []);

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

    const stopStreaming = useCallback(() => {
        abortControllerRef.current?.abort();
        abortControllerRef.current = null;
        setLoading(false);
    }, []);

    const sendMessage = useCallback(async (content: string, useStreaming = true) => {
        if (!content.trim() || loading) return;

        setError(null);
        setStreamingContent('');
        setCurrentPRMetadata(null);

        const hasPRUrl = detectPRUrl(content);
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
                        updatedAt: new Date(),
                    }
                    : chat
            )
        );

        setLoading(true);

        try {
            if (isConnected && useStreaming) {
                // Use streaming for PR analysis (better UX for longer responses)
                let fullContent = '';
                let prMetadata: PRMetadata | null = null;
                let messageId = generateId();
                let newTitle: string | null = null;

                const handleEvent = (event: StreamEvent) => {
                    if (event.pr_metadata) {
                        prMetadata = event.pr_metadata;
                        setCurrentPRMetadata(prMetadata);
                    }

                    if (event.content) {
                        fullContent += event.content;
                        setStreamingContent(fullContent);
                    }

                    if (event.done) {
                        messageId = event.id || messageId;
                        newTitle = event.new_title || null;

                        const assistantMessage: Message = {
                            id: messageId,
                            role: 'assistant',
                            content: fullContent,
                            timestamp: new Date(),
                            prMetadata: prMetadata || undefined,  // Save PR metadata to message
                        };

                        setChats(prev =>
                            prev.map(chat =>
                                chat.id === activeChatId
                                    ? {
                                        ...chat,
                                        messages: [...chat.messages, assistantMessage],
                                        title: newTitle || chat.title,
                                        updatedAt: new Date(),
                                    }
                                    : chat
                            )
                        );

                        setStreamingContent('');
                        setCurrentPRMetadata(null);
                        setLoading(false);
                    }

                    if (event.error) {
                        setError(event.error);
                        setStreamingContent('');
                        setCurrentPRMetadata(null);
                        setLoading(false);
                    }
                };

                const handleError = (err: Error) => {
                    setError(err.message);
                    setLoading(false);
                };

                abortControllerRef.current = chatApi.sendMessageStream(
                    activeChatId,
                    content,
                    handleEvent,
                    handleError
                );
            } else if (isConnected) {
                // Non-streaming fallback
                const response = await chatApi.sendMessage(activeChatId, content);

                const assistantMessage: Message = {
                    id: response.id,
                    role: 'assistant',
                    content: response.content,
                    timestamp: new Date(),
                    prMetadata: response.pr_metadata,
                };

                setChats(prev =>
                    prev.map(chat =>
                        chat.id === activeChatId
                            ? {
                                ...chat,
                                messages: [...chat.messages, assistantMessage],
                                title: response.new_title || chat.title,
                                updatedAt: new Date(),
                            }
                            : chat
                    )
                );
                setLoading(false);
            } else {
                // Demo mode
                await new Promise(resolve => setTimeout(resolve, 1500));
                const demoContent = hasPRUrl
                    ? `## PR Analysis Demo\n\nConnect your FastAPI backend to analyze PRs.\n\nDetected PR URL: ${hasPRUrl}`
                    : `Demo response for: "${content}"`;

                const assistantMessage: Message = {
                    id: generateId(),
                    role: 'assistant',
                    content: demoContent,
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
                setLoading(false);
            }
        } catch (err) {
            setError('An error occurred. Please try again.');
            console.error('Chat error:', err);
            setLoading(false);
        }
    }, [activeChatId, loading, isConnected]);

    const clearError = useCallback(() => setError(null), []);

    return {
        chats,
        activeChat,
        activeChatId,
        loading,
        error,
        isConnected,
        streamingContent,
        currentPRMetadata,
        setActiveChatId,
        createChat,
        deleteChat,
        updateChatTitle,
        sendMessage,
        stopStreaming,
        clearError,
    };
};