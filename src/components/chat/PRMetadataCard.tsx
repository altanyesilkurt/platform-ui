// components/PRMetadataCard.tsx

import React, { useState } from 'react';
import { PRMetadata } from '@/lib/api';
import {
    GitPullRequest, GitMerge, GitCommit, FileCode,
    Plus, Minus, XCircle, ChevronDown, ChevronUp, User
} from 'lucide-react';

interface PRMetadataCardProps {
    metadata: PRMetadata;
    isLoading?: boolean;
}

export const PRMetadataCard: React.FC<PRMetadataCardProps> = ({
                                                                  metadata,
                                                                  isLoading
                                                              }) => {
    const [showCommits, setShowCommits] = useState(false);
    const [showFiles, setShowFiles] = useState(false);

    const isClosed = metadata.pr_state === 'closed' || metadata.pr_merged;

    // Closed/Merged PR - Simple status card
    if (isClosed) {
        return (
            <div className={`border rounded-lg p-4 mb-3 ${metadata.pr_merged ? 'bg-purple-50 border-purple-200' : 'bg-red-50 border-red-200'}`}>
                <div className="flex items-start gap-3">
                    {metadata.pr_merged ? (
                        <GitMerge className="w-5 h-5 text-purple-600 mt-0.5" />
                    ) : (
                        <XCircle className="w-5 h-5 text-red-600 mt-0.5" />
                    )}
                    <div className="flex-1 min-w-0">
                        <a
                            href={metadata.pr_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm font-medium text-gray-800 hover:underline truncate block"
                        >
                            {metadata.pr_title}
                        </a>
                        {metadata.pr_author && (
                            <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                                <User className="w-3 h-3" />
                                {metadata.pr_author}
                            </p>
                        )}
                        <p className="text-xs text-gray-500 mt-1">
                            {metadata.files_changed} files changed • +{metadata.additions} -{metadata.deletions}
                        </p>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${metadata.pr_merged ? 'bg-purple-100 text-purple-700' : 'bg-red-100 text-red-700'}`}>
                        {metadata.pr_merged ? 'Merged' : 'Closed'}
                    </span>
                </div>
            </div>
        );
    }

    // Open PR - Full card with details
    return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm mb-3 overflow-hidden">
            {/* Header */}
            <div className="bg-green-50 border-b border-green-100 p-4">
                <div className="flex items-start gap-3">
                    <GitPullRequest className="w-5 h-5 text-green-600 mt-0.5" />
                    <div className="flex-1 min-w-0">
                        <a
                            href={metadata.pr_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm font-semibold text-gray-800 hover:text-green-700 hover:underline block"
                        >
                            {metadata.pr_title}
                        </a>
                        {metadata.pr_author && (
                            <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                                <User className="w-3 h-3" />
                                {metadata.pr_author}
                            </p>
                        )}
                    </div>
                    <span className="px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-700">
                        Open
                    </span>
                </div>
            </div>

            {/* PR Description */}
            {metadata.pr_body && metadata.pr_body !== "No description provided" && (
                <div className="px-4 py-3 border-b border-gray-100">
                    <p className="text-xs font-medium text-gray-500 mb-1">Description</p>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap line-clamp-3">
                        {metadata.pr_body}
                    </p>
                </div>
            )}

            {/* Stats Row */}
            <div className="px-4 py-3 bg-gray-50 flex items-center gap-4 text-xs">
                <span className="flex items-center gap-1.5 text-gray-600 font-medium">
                    <FileCode className="w-4 h-4" />
                    {metadata.files_changed} files
                </span>
                <span className="flex items-center gap-1 text-green-600 font-medium">
                    <Plus className="w-3.5 h-3.5" />
                    {metadata.additions}
                </span>
                <span className="flex items-center gap-1 text-red-600 font-medium">
                    <Minus className="w-3.5 h-3.5" />
                    {metadata.deletions}
                </span>
                {metadata.commits && metadata.commits.length > 0 && (
                    <span className="flex items-center gap-1.5 text-gray-600 font-medium">
                        <GitCommit className="w-4 h-4" />
                        {metadata.commits.length} commits
                    </span>
                )}
                {isLoading && (
                    <span className="ml-auto text-blue-500 animate-pulse font-medium">
                        Analyzing...
                    </span>
                )}
            </div>

            {/* Commits Section */}
            {metadata.commits && metadata.commits.length > 0 && (
                <div className="border-t border-gray-100">
                    <button
                        onClick={() => setShowCommits(!showCommits)}
                        className="w-full px-4 py-2 flex items-center justify-between text-xs font-medium text-gray-600 hover:bg-gray-50"
                    >
                        <span className="flex items-center gap-2">
                            <GitCommit className="w-3.5 h-3.5" />
                            Commits ({metadata.commits.length})
                        </span>
                        {showCommits ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                    {showCommits && (
                        <div className="px-4 pb-3 space-y-2">
                            {metadata.commits.map((commit, i) => (
                                <div key={i} className="flex items-start gap-2 text-xs">
                                    <code className="text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded font-mono">
                                        {commit.sha}
                                    </code>
                                    <span className="text-gray-700 flex-1">{commit.message}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Files Section */}
            {metadata.files && metadata.files.length > 0 && (
                <div className="border-t border-gray-100">
                    <button
                        onClick={() => setShowFiles(!showFiles)}
                        className="w-full px-4 py-2 flex items-center justify-between text-xs font-medium text-gray-600 hover:bg-gray-50"
                    >
                        <span className="flex items-center gap-2">
                            <FileCode className="w-3.5 h-3.5" />
                            Files Changed ({metadata.files.length})
                        </span>
                        {showFiles ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                    {showFiles && (
                        <div className="px-4 pb-3 space-y-1.5">
                            {metadata.files.map((file, i) => (
                                <div key={i} className="flex items-center gap-2 text-xs">
                                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                                        file.status === 'added' ? 'bg-green-100 text-green-700' :
                                            file.status === 'removed' ? 'bg-red-100 text-red-700' :
                                                file.status === 'renamed' ? 'bg-blue-100 text-blue-700' :
                                                    'bg-yellow-100 text-yellow-700'
                                    }`}>
                                        {file.status}
                                    </span>
                                    <span className="text-gray-700 font-mono text-[11px] truncate flex-1">
                                        {file.filename}
                                    </span>
                                    <span className="text-green-600">+{file.additions}</span>
                                    <span className="text-red-600">-{file.deletions}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default PRMetadataCard;