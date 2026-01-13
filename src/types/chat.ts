import { CommitMetadata, PRMetadata } from "@/lib/api.ts";

export interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    prMetadata?: PRMetadata;
    commitMetadata?: CommitMetadata;
}

export interface Chat {
    id: string;
    title: string;
    messages: Message[];
    createdAt: Date;
    updatedAt: Date;
}

export interface ParsedPRAnalysis {
    summary?: string;
    risk_level?: 'low' | 'medium' | 'high' | 'critical';
    risk_details?: string[];
    key_changes?: string[];
    suggestions?: string[];
    breaking_changes?: string[];
    code_quality_notes?: string[];
    response?: string;
}

// Helper to try parsing JSON from AI response
export const tryParsePRAnalysis = (content: string): ParsedPRAnalysis | null => {
    try {
        // Try to find JSON in the response
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }
    } catch {
        // Not valid JSON
    }
    return null;
};

export interface UserProfile {
  avatar: string;
  firstName: string;
  lastName: string;
}
