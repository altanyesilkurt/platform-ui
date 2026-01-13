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
    pr_metadata?: PRMetadata;
    commit_metadata?: CommitMetadata;
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
    patch?: string;
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

export interface CommitMetadata {
    type: 'commit';
    commit_url: string;
    commit_sha: string;
    commit_sha_full?: string;
    commit_message: string;  // Full message including description
    commit_author: string;
    commit_author_email?: string;
    commit_date: string;
    files_changed: number;
    additions: number;
    deletions: number;
    total_changes?: number;
    files?: PRFile[];
}

export interface StreamEvent {
    content?: string;
    done?: boolean;
    id?: string;
    new_title?: string;
    pr_metadata?: PRMetadata;
    commit_metadata?: CommitMetadata;
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

    // Streaming message endpoint
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

                    const lines = buffer.split('\n');
                    buffer = lines.pop() || '';

                    for (const line of lines) {
                        const trimmedLine = line.trim();
                        if (trimmedLine.startsWith('data: ')) {
                            const jsonStr = trimmedLine.slice(6);
                            if (jsonStr) {
                                try {
                                    const data = JSON.parse(jsonStr) as StreamEvent;
                                    onEvent(data);
                                } catch (e) {
                                    console.warn('Failed to parse SSE data:', jsonStr, e);
                                }
                            }
                        }
                    }
                }

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

    // Direct commit analysis endpoint
    async analyzeCommit(commitUrl: string): Promise<{
        commit_url: string;
        commit_sha: string;
        commit_message: string;
        author: string;
        stats: { files_changed: number; additions: number; deletions: number };
        analysis: { response: string };
    }> {
        const response = await fetch(
            `${API_BASE_URL}/analyze-commit?commit_url=${encodeURIComponent(commitUrl)}`,
            { method: 'POST' }
        );
        if (!response.ok) {
            const error = await response.json().catch(() => ({ detail: 'Analysis failed' }));
            throw new Error(error.detail || 'Failed to analyze commit');
        }
        return response.json();
    },

    // Health check
    async checkHealth(): Promise<{ status: string; github: string }> {
        const response = await fetch(`${API_BASE_URL}/health`);
        if (!response.ok) throw new Error('Health check failed');
        return response.json();
    },

    // Submit PR review
    async submitPRReview(
        prUrl: string,
        reviewType: 'COMMENT' | 'APPROVE' | 'REQUEST_CHANGES',
        body: string = ''
    ): Promise<{ success: boolean; message: string }> {
        const response = await fetch(`${API_BASE_URL}/pr/review`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pr_url: prUrl, review_type: reviewType, body }),
        });
        if (!response.ok) {
            const error = await response.json().catch(() => ({ detail: 'Failed to submit review' }));
            throw new Error(error.detail || 'Failed to submit review');
        }
        return response.json();
    },
};

// Helper to detect if message contains a PR URL
export const detectPRUrl = (message: string): string | null => {
    const match = message.match(/https:\/\/github\.com\/[^/]+\/[^/]+\/pull\/\d+/);
    return match ? match[0] : null;
};

// Helper to detect if message contains a Commit URL
export const detectCommitUrl = (message: string): string | null => {
    const match = message.match(/https:\/\/github\.com\/[^/]+\/[^/]+\/commit\/[a-fA-F0-9]+/);
    return match ? match[0] : null;
};