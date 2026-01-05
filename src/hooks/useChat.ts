import { useState, useCallback } from 'react';
import type { Chat, Message } from '../types/chat.ts';

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

  const activeChat = chats.find(chat => chat.id === activeChatId) || chats[0];

  const createChat = useCallback(() => {
    const newChat = createNewChat();
    setChats(prev => [newChat, ...prev]);
    setActiveChatId(newChat.id);
  }, []);

  const deleteChat = useCallback((chatId: string) => {
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
  }, [activeChatId]);

  const updateChatTitle = useCallback((chatId: string, newTitle: string) => {
    setChats(prev =>
      prev.map(chat =>
        chat.id === chatId
          ? { ...chat, title: newTitle, updatedAt: new Date() }
          : chat
      )
    );
  }, []);

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

    setLoading(true);

    try {
      // Simulate API call - Replace with actual FastAPI endpoint
      // const response = await fetch('/api/chat', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ message: content }),
      // });
      
      // Simulated delay for demo
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Simulated response - Replace with actual API response
      const assistantMessage: Message = {
        id: generateId(),
        role: 'assistant',
        content: `This is a demo response. Connect your FastAPI backend for real responses.\n\nYou asked: "${content}"`,
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
  }, [activeChatId, loading]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
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
  };
};
