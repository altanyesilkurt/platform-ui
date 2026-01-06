// FastAPI Backend Configuration
// Update this URL to your FastAPI server address
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export interface ApiChat {
    id: string;
    title: string;
    created_at: string;
    updated_at: string;
}

export interface ApiMessage {
    id: string;
    chat_id: string;
    role: 'user' | 'assistant';
    content: string;
    created_at: string;
}

export interface ChatResponse {
    id: string;
    role: string;
    content: string;
}

// API Functions
export const chatApi = {
    // Get all chats
    async getChats(): Promise<ApiChat[]> {
        const response = await fetch(`${API_BASE_URL}/chats`);
        if (!response.ok) throw new Error('Failed to fetch chats');
        return response.json();
    },

    // Create a new chat
    async createChat(title: string = 'New Chat'): Promise<ApiChat> {
        const response = await fetch(`${API_BASE_URL}/chats`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title }),
        });
        if (!response.ok) throw new Error('Failed to create chat');
        return response.json();
    },

    // Update chat title
    async updateChatTitle(chatId: string, title: string): Promise<ApiChat> {
        const response = await fetch(`${API_BASE_URL}/chats/${chatId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title }),
        });
        if (!response.ok) throw new Error('Failed to update chat title');
        return response.json();
    },

    // Delete chat
    async deleteChat(chatId: string): Promise<void> {
        const response = await fetch(`${API_BASE_URL}/chats/${chatId}`, {
            method: 'DELETE',
        });
        if (!response.ok) throw new Error('Failed to delete chat');
    },

    // Get messages for a chat
    async getMessages(chatId: string): Promise<ApiMessage[]> {
        const response = await fetch(`${API_BASE_URL}/chats/${chatId}/messages`);
        if (!response.ok) throw new Error('Failed to fetch messages');
        return response.json();
    },

    // Send a message and get AI response
    async sendMessage(chatId: string, content: string): Promise<ChatResponse> {
        const response = await fetch(`${API_BASE_URL}/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: chatId, message: content }),
        });
        if (!response.ok) throw new Error('Failed to send message');
        return response.json();
    },
};
