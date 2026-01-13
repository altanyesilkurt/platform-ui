// components/PRMetadataCard.tsx

import React, { useState } from 'react';
import { chatApi, PRMetadata } from '@/lib/api';
import {
    AlertCircle,
    CheckCircle,
    ChevronDown,
    ChevronUp,
    FileCode,
    GitCommit,
    GitMerge,
    GitPullRequest,
    Loader2,
    MessageSquare,
    Minus,
    Plus,
    Send,
    User,
    X,
    XCircle
} from 'lucide-react';

interface PRMetadataCardProps {
    metadata: PRMetadata;
    isLoading?: boolean;
}

type ReviewType = 'COMMENT' | 'APPROVE' | 'REQUEST_CHANGES';

// Diff Line Component
const DiffLine = ({line}: { line: string }) => {
    let bgColor = 'bg-gray-50';
    let textColor = 'text-gray-700';
    let prefix = ' ';

    if (line.startsWith('+') && !line.startsWith('+++')) {
        bgColor = 'bg-green-50';
        textColor = 'text-green-800';
        prefix = '+';
    } else if (line.startsWith('-') && !line.startsWith('---')) {
        bgColor = 'bg-red-50';
        textColor = 'text-red-800';
        prefix = '-';
    } else if (line.startsWith('@@')) {
        bgColor = 'bg-blue-50';
        textColor = 'text-blue-700';
        prefix = '@';
    }

    return (
        <div className={`${bgColor} ${textColor} px-2 font-mono text-[11px] leading-5 whitespace-pre overflow-x-auto`}>
            <span className="select-none text-gray-400 mr-2 inline-block w-4">{prefix}</span>
            {line.substring(1) || line}
        </div>
    );
};

// File Diff Component
const FileDiff = ({patch}: { patch: string }) => {
    const lines = patch.split('\n').slice(0, 50);
    const hasMore = patch.split('\n').length > 50;

    return (
        <div className="border border-gray-200 rounded overflow-hidden mt-2">
            <div className="max-h-64 overflow-y-auto">
                {lines.map((line, i) => (
                    <DiffLine key={i} line={line}/>
                ))}
            </div>
            {hasMore && (
                <div className="bg-gray-100 text-center py-1 text-xs text-gray-500">
                    ... more lines not shown
                </div>
            )}
        </div>
    );
};

// Review Modal Component
const ReviewModal = ({
                         isOpen,
                         onClose,
                         prUrl,
                         onSuccess
                     }: {
    isOpen: boolean;
    onClose: () => void;
    prUrl: string;
    onSuccess: (message: string) => void;
}) => {
    const [reviewType, setReviewType] = useState<ReviewType>('COMMENT');
    const [comment, setComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleSubmit = async () => {
        if (reviewType === 'REQUEST_CHANGES' && !comment.trim()) {
            setError('A comment is required when requesting changes.');
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            const result = await chatApi.submitPRReview(prUrl, reviewType, comment);
            onSuccess(result.message);
            setComment('');
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to submit review');
        } finally {
            setIsSubmitting(false);
        }
    };

    const reviewOptions = [
        {
            type: 'COMMENT' as ReviewType,
            label: 'Comment',
            description: 'Submit general feedback without explicit approval.',
            icon: MessageSquare,
            color: 'text-gray-600',
            bgColor: 'bg-gray-50 border-gray-200',
            selectedBg: 'bg-gray-100 border-gray-400'
        },
        {
            type: 'APPROVE' as ReviewType,
            label: 'Approve',
            description: 'Submit feedback and approve merging these changes.',
            icon: CheckCircle,
            color: 'text-green-600',
            bgColor: 'bg-green-50 border-green-200',
            selectedBg: 'bg-green-100 border-green-400'
        },
        {
            type: 'REQUEST_CHANGES' as ReviewType,
            label: 'Request changes',
            description: 'Submit feedback that must be addressed before merging.',
            icon: AlertCircle,
            color: 'text-red-600',
            bgColor: 'bg-red-50 border-red-200',
            selectedBg: 'bg-red-100 border-red-400'
        }
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/50" onClick={onClose}/>

            {/* Modal */}
            <div className="relative bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b">
                    <h3 className="text-lg font-semibold">Submit Review</h3>
                    <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
                        <X className="w-5 h-5"/>
                    </button>
                </div>

                {/* Content */}
                <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto">
                    {/* Comment textarea */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Leave a comment
                        </label>
                        <textarea
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder="Write your review comment here..."
                            rows={4}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                        />
                        <p className="text-xs text-gray-500 mt-1">Markdown is supported</p>
                    </div>

                    {/* Review type options */}
                    <div className="space-y-2">
                        {reviewOptions.map((option) => (
                            <label
                                key={option.type}
                                className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                                    reviewType === option.type ? option.selectedBg : option.bgColor
                                }`}
                            >
                                <input
                                    type="radio"
                                    name="reviewType"
                                    value={option.type}
                                    checked={reviewType === option.type}
                                    onChange={() => setReviewType(option.type)}
                                    className="mt-0.5"
                                />
                                <div className="flex-1">
                                    <div className={`flex items-center gap-2 font-medium ${option.color}`}>
                                        <option.icon className="w-4 h-4"/>
                                        {option.label}
                                    </div>
                                    <p className="text-xs text-gray-600 mt-0.5">{option.description}</p>
                                </div>
                            </label>
                        ))}
                    </div>

                    {/* Error message */}
                    {error && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                            {error}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-2 px-4 py-3 border-t bg-gray-50">
                    <button
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className={`px-4 py-2 text-sm font-medium text-white rounded-lg flex items-center gap-2 disabled:opacity-50 ${
                            reviewType === 'APPROVE' ? 'bg-green-600 hover:bg-green-700' :
                                reviewType === 'REQUEST_CHANGES' ? 'bg-red-600 hover:bg-red-700' :
                                    'bg-blue-600 hover:bg-blue-700'
                        }`}
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin"/>
                                Submitting...
                            </>
                        ) : (
                            <>
                                <Send className="w-4 h-4"/>
                                Submit review
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

// Success Toast Component
const SuccessToast = ({message, onClose}: { message: string; onClose: () => void }) => (
    <div
        className="fixed bottom-4 right-4 z-50 flex items-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg shadow-lg animate-slide-up">
        <CheckCircle className="w-5 h-5"/>
        <span className="text-sm font-medium">{message}</span>
        <button onClick={onClose} className="ml-2 hover:bg-green-700 p-1 rounded">
            <X className="w-4 h-4"/>
        </button>
    </div>
);

// Main Component
export const PRMetadataCard: React.FC<PRMetadataCardProps> = ({
                                                                  metadata,
                                                                  isLoading
                                                              }) => {
    const [showCommits, setShowCommits] = useState(false);
    const [showFiles, setShowFiles] = useState(false);
    const [expandedFiles, setExpandedFiles] = useState<Set<number>>(new Set());
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const toggleFileExpand = (index: number) => {
        setExpandedFiles(prev => {
            const next = new Set(prev);
            if (next.has(index)) next.delete(index);
            else next.add(index);
            return next;
        });
    };

    const handleReviewSuccess = (message: string) => {
        setSuccessMessage(message);
        setTimeout(() => setSuccessMessage(null), 5000);
    };

    const isClosed = metadata.pr_state === 'closed' || metadata.pr_merged;

    // Closed/Merged PR
    if (isClosed) {
        return (
            <div
                className={`border rounded-lg p-4 mb-3 ${metadata.pr_merged ? 'bg-purple-50 border-purple-200' : 'bg-red-50 border-red-200'}`}>
                <div className="flex items-start gap-3">
                    {metadata.pr_merged ? (
                        <GitMerge className="w-5 h-5 text-purple-600 mt-0.5"/>
                    ) : (
                        <XCircle className="w-5 h-5 text-red-600 mt-0.5"/>
                    )}
                    <div className="flex-1 min-w-0">
                        <a href={metadata.pr_url} target="_blank" rel="noopener noreferrer"
                           className="text-sm font-medium text-gray-800 hover:underline truncate block">
                            {metadata.pr_title}
                        </a>
                        {metadata.pr_author && (
                            <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                                <User className="w-3 h-3"/>{metadata.pr_author}
                            </p>
                        )}
                        <p className="text-xs text-gray-500 mt-1">
                            {metadata.files_changed} files • +{metadata.additions} -{metadata.deletions}
                        </p>
                    </div>
                    <span
                        className={`px-2 py-1 rounded text-xs font-medium ${metadata.pr_merged ? 'bg-purple-100 text-purple-700' : 'bg-red-100 text-red-700'}`}>
                        {metadata.pr_merged ? 'Merged' : 'Closed'}
                    </span>
                </div>
            </div>
        );
    }

    // Open PR
    return (
        <>
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm mb-3 overflow-hidden">
                {/* Header */}
                <div className="bg-green-50 border-b border-green-100 p-4">
                    <div className="flex items-start gap-3">
                        <GitPullRequest className="w-5 h-5 text-green-600 mt-0.5"/>
                        <div className="flex-1 min-w-0">
                            <a href={metadata.pr_url} target="_blank" rel="noopener noreferrer"
                               className="text-sm font-semibold text-gray-800 hover:text-green-700 hover:underline block">
                                {metadata.pr_title}
                            </a>
                            {metadata.pr_author && (
                                <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                                    <User className="w-3 h-3"/>{metadata.pr_author}
                                </p>
                            )}
                        </div>
                        <span className="px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-700">Open</span>
                    </div>
                </div>

                {/* Description */}
                {metadata.pr_body && metadata.pr_body !== "No description provided" && (
                    <div className="px-4 py-3 border-b border-gray-100">
                        <p className="text-xs font-medium text-gray-500 mb-1">Description</p>
                        <p className="text-sm text-gray-700 whitespace-pre-wrap line-clamp-3">{metadata.pr_body}</p>
                    </div>
                )}

                {/* Stats */}
                <div className="px-4 py-3 bg-gray-50 flex items-center gap-4 text-xs">
                    <span className="flex items-center gap-1.5 text-gray-600 font-medium">
                        <FileCode className="w-4 h-4"/>{metadata.files_changed} files
                    </span>
                    <span className="flex items-center gap-1 text-green-600 font-medium">
                        <Plus className="w-3.5 h-3.5"/>{metadata.additions}
                    </span>
                    <span className="flex items-center gap-1 text-red-600 font-medium">
                        <Minus className="w-3.5 h-3.5"/>{metadata.deletions}
                    </span>
                    {metadata.commits?.length > 0 && (
                        <span className="flex items-center gap-1.5 text-gray-600 font-medium">
                            <GitCommit className="w-4 h-4"/>{metadata.commits.length} commits
                        </span>
                    )}
                    {isLoading && <span className="ml-auto text-blue-500 animate-pulse font-medium">Analyzing...</span>}
                </div>

                {/* Commits */}
                {metadata.commits?.length > 0 && (
                    <div className="border-t border-gray-100">
                        <button onClick={() => setShowCommits(!showCommits)}
                                className="w-full px-4 py-2 flex items-center justify-between text-xs font-medium text-gray-600 hover:bg-gray-50">
                            <span className="flex items-center gap-2"><GitCommit
                                className="w-3.5 h-3.5"/>Commits ({metadata.commits.length})</span>
                            {showCommits ? <ChevronUp className="w-4 h-4"/> : <ChevronDown className="w-4 h-4"/>}
                        </button>
                        {showCommits && (
                            <div className="px-4 pb-3 space-y-2">
                                {metadata.commits.map((commit, i) => (
                                    <div key={i} className="flex items-start gap-2 text-xs">
                                        <code
                                            className="text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded font-mono">{commit.sha}</code>
                                        <span className="text-gray-700 flex-1">{commit.message}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Files */}
                {metadata.files?.length > 0 && (
                    <div className="border-t border-gray-100">
                        <button onClick={() => setShowFiles(!showFiles)}
                                className="w-full px-4 py-2 flex items-center justify-between text-xs font-medium text-gray-600 hover:bg-gray-50">
                            <span className="flex items-center gap-2"><FileCode
                                className="w-3.5 h-3.5"/>Files Changed ({metadata.files.length})</span>
                            {showFiles ? <ChevronUp className="w-4 h-4"/> : <ChevronDown className="w-4 h-4"/>}
                        </button>
                        {showFiles && (
                            <div className="px-4 pb-3 space-y-3">
                                {metadata.files.map((file, i) => (
                                    <div key={i} className="border border-gray-100 rounded-lg overflow-hidden">
                                        <button onClick={() => file.patch && toggleFileExpand(i)}
                                                className={`w-full flex items-center gap-2 text-xs p-2 bg-gray-50 ${file.patch ? 'hover:bg-gray-100 cursor-pointer' : ''}`}>
                                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                                                file.status === 'added' ? 'bg-green-100 text-green-700' :
                                                    file.status === 'removed' ? 'bg-red-100 text-red-700' :
                                                        file.status === 'renamed' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'
                                            }`}>{file.status}</span>
                                            <span
                                                className="text-gray-700 font-mono text-[11px] truncate flex-1 text-left">{file.filename}</span>
                                            <span className="text-green-600 font-medium">+{file.additions}</span>
                                            <span className="text-red-600 font-medium">-{file.deletions}</span>
                                            {file.patch && (expandedFiles.has(i) ?
                                                <ChevronUp className="w-4 h-4 text-gray-400"/> :
                                                <ChevronDown className="w-4 h-4 text-gray-400"/>)}
                                        </button>
                                        {expandedFiles.has(i) && file.patch && <FileDiff patch={file.patch}/>}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Review Actions */}
                <div className="border-t border-gray-100 px-4 py-3 bg-gray-50">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setShowReviewModal(true)}
                            className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
                        >
                            <MessageSquare className="w-3.5 h-3.5"/>
                            Review PR
                        </button>
                        <a
                            href={metadata.pr_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            <GitPullRequest className="w-3.5 h-3.5"/>
                            View on GitHub
                        </a>
                    </div>
                </div>
            </div>

            {/* Review Modal */}
            <ReviewModal
                isOpen={showReviewModal}
                onClose={() => setShowReviewModal(false)}
                prUrl={metadata.pr_url}
                onSuccess={handleReviewSuccess}
            />

            {/* Success Toast */}
            {successMessage && (
                <SuccessToast message={successMessage} onClose={() => setSuccessMessage(null)}/>
            )}
        </>
    );
};

export default PRMetadataCard;