// FastAPI Backend Configuration
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
    pr_metadata?: PRMetadata;  // PR metadata for GitHub assistant
}

export interface PRCommit {
    sha: string;
    message: string;
    author: string;
}

export interface PRFile {
    filename: string;
    status: string;
    additions: number;
    deletions: number;
}

export interface PRMetadata {
    pr_url: string;
    pr_title: string;
    pr_body?: string;
    pr_state?: string;
    pr_merged?: boolean;
    pr_author?: string;
    status_message?: string;
    files_changed: number;
    additions: number;
    deletions: number;
    commits?: PRCommit[];
    files?: PRFile[];
}

export interface PRAnalysis {
    summary?: string;
    response?: string;
}

export interface ChatResponse {
    id: string;
    role: string;
    content: string;
    new_title?: string;
    pr_metadata?: PRMetadata;
}

export interface PRAnalysisResponse {
    pr_url: string;
    pr_title: string;
    author: string;
    stats: {
        files_changed: number;
        additions: number;
        deletions: number;
    };
    analysis: PRAnalysis;
}

export interface StreamEvent {
    content?: string;
    done?: boolean;
    id?: string;
    new_title?: string;
    pr_metadata?: PRMetadata;
    error?: string;
}

// API Functions
export const chatApi = {
    async getChats(): Promise<ApiChat[]> {
        const response = await fetch(`${API_BASE_URL}/chats`);
        if (!response.ok) throw new Error('Failed to fetch chats');
        return response.json();
    },

    async createChat(title: string = 'New Chat'): Promise<ApiChat> {
        const response = await fetch(`${API_BASE_URL}/chats`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title }),
        });
        if (!response.ok) throw new Error('Failed to create chat');
        return response.json();
    },

    async updateChatTitle(chatId: string, title: string): Promise<ApiChat> {
        const response = await fetch(`${API_BASE_URL}/chats/${chatId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title }),
        });
        if (!response.ok) throw new Error('Failed to update chat title');
        return response.json();
    },

    async deleteChat(chatId: string): Promise<void> {
        const response = await fetch(`${API_BASE_URL}/chats/${chatId}`, {
            method: 'DELETE',
        });
        if (!response.ok) throw new Error('Failed to delete chat');
    },

    async getMessages(chatId: string): Promise<ApiMessage[]> {
        const response = await fetch(`${API_BASE_URL}/chats/${chatId}/messages`);
        if (!response.ok) throw new Error('Failed to fetch messages');
        return response.json();
    },

    async sendMessage(chatId: string, content: string): Promise<ChatResponse> {
        const response = await fetch(`${API_BASE_URL}/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: chatId, message: content }),
        });
        if (!response.ok) throw new Error('Failed to send message');
        return response.json();
    },

    // Streaming message endpoint - FIXED VERSION
    sendMessageStream(
        chatId: string,
        content: string,
        onEvent: (event: StreamEvent) => void,
        onError: (error: Error) => void
    ): AbortController {
        const controller = new AbortController();

        fetch(`${API_BASE_URL}/chat/stream`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: chatId, message: content }),
            signal: controller.signal,
        })
            .then(async (response) => {
                if (!response.ok) throw new Error('Stream request failed');

                const reader = response.body?.getReader();
                if (!reader) throw new Error('No response body');

                const decoder = new TextDecoder();
                let buffer = '';

                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    buffer += decoder.decode(value, { stream: true });

                    // Process complete lines
                    const lines = buffer.split('\n');
                    buffer = lines.pop() || ''; // Keep incomplete line in buffer

                    for (const line of lines) {
                        const trimmedLine = line.trim();
                        if (trimmedLine.startsWith('data: ')) {
                            const jsonStr = trimmedLine.slice(6); // Remove 'data: ' prefix
                            if (jsonStr) {
                                try {
                                    const data = JSON.parse(jsonStr) as StreamEvent;
                                    console.log('Parsed stream event:', data); // Debug
                                    onEvent(data);
                                } catch (e) {
                                    console.warn('Failed to parse SSE data:', jsonStr, e);
                                }
                            }
                        }
                    }
                }

                // Process any remaining data in buffer
                if (buffer.trim().startsWith('data: ')) {
                    const jsonStr = buffer.trim().slice(6);
                    if (jsonStr) {
                        try {
                            const data = JSON.parse(jsonStr) as StreamEvent;
                            onEvent(data);
                        } catch (e) {
                            console.warn('Failed to parse final SSE data:', jsonStr);
                        }
                    }
                }
            })
            .catch((err) => {
                if (err.name !== 'AbortError') {
                    onError(err);
                }
            });

        return controller;
    },

    // Direct PR analysis endpoint
    async analyzePR(
        prUrl: string,
        analysisType: 'full' | 'summary' | 'risks' | 'review' = 'full'
    ): Promise<PRAnalysisResponse> {
        const response = await fetch(
            `${API_BASE_URL}/analyze-pr?pr_url=${encodeURIComponent(prUrl)}&analysis_type=${analysisType}`,
            { method: 'POST' }
        );
        if (!response.ok) {
            const error = await response.json().catch(() => ({ detail: 'Analysis failed' }));
            throw new Error(error.detail || 'Failed to analyze PR');
        }
        return response.json();
    },

    // Health check
    async checkHealth(): Promise<{ status: string; github: string }> {
        const response = await fetch(`${API_BASE_URL}/health`);
        if (!response.ok) throw new Error('Health check failed');
        return response.json();
    },
};

// Helper to detect if message contains a PR URL
export const detectPRUrl = (message: string): string | null => {
    const match = message.match(/https:\/\/github\.com\/[^/]+\/[^/]+\/pull\/\d+/);
    return match ? match[0] : null;
};