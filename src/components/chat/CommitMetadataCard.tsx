import React, { useState } from 'react';
import { CommitMetadata } from '@/lib/api';
import { Calendar, ChevronDown, ChevronUp, Code2, FileCode, Files, GitCommit, Minus, Plus, User } from 'lucide-react';

interface CommitMetadataCardProps {
    metadata: CommitMetadata;
    isLoading?: boolean;
}

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
        <div className="border-t border-gray-200">
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

// File Status Badge
const FileStatusBadge = ({status}: { status: string }) => {
    const styles: Record<string, string> = {
        added: 'bg-green-100 text-green-700',
        removed: 'bg-red-100 text-red-700',
        modified: 'bg-yellow-100 text-yellow-700',
        renamed: 'bg-blue-100 text-blue-700',
    };

    return (
        <span
            className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${styles[status] || 'bg-gray-100 text-gray-700'}`}>
            {status}
        </span>
    );
};

export const CommitMetadataCard: React.FC<CommitMetadataCardProps> = ({
                                                                          metadata,
                                                                          isLoading
                                                                      }) => {
    const [showFiles, setShowFiles] = useState(false);
    const [expandedFiles, setExpandedFiles] = useState<Set<number>>(new Set());

    const toggleFileExpand = (index: number) => {
        setExpandedFiles(prev => {
            const next = new Set(prev);
            if (next.has(index)) next.delete(index);
            else next.add(index);
            return next;
        });
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return 'N/A';
        try {
            return new Date(dateString).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch {
            return dateString;
        }
    };

    // Parse commit message - first line is title, rest is description
    const commitLines = (metadata.commit_message || '').split('\n');
    const commitTitle = commitLines[0] || 'No commit message';
    const commitDescription = commitLines.slice(1).join('\n').trim();

    return (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm mb-3 overflow-hidden">
            {/* Header - Similar to PR Card */}
            <div className="p-4">
                <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
                        <GitCommit className="w-4 h-4 text-amber-600"/>
                    </div>
                    <div className="flex-1 min-w-0">
                        <a
                            href={metadata.commit_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm font-semibold text-gray-900 hover:text-amber-700 hover:underline block leading-tight"
                        >
                            {commitTitle}
                        </a>
                        <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                            <User className="w-3 h-3"/>
                            <span>{metadata.commit_author || 'Unknown'}</span>
                        </div>
                    </div>
                    <code
                        className="px-2 py-1 rounded-md text-xs font-mono bg-amber-50 text-amber-700 border border-amber-200 flex-shrink-0">
                        {metadata.commit_sha}
                    </code>
                </div>

                {/* Commit Description */}
                {commitDescription && (
                    <div className="mt-3 pl-11">
                        <p className="text-xs text-gray-600 whitespace-pre-wrap line-clamp-3 bg-gray-50 rounded-lg p-2">
                            {commitDescription}
                        </p>
                    </div>
                )}
            </div>

            {/* Stats Row - Similar to PR Card */}
            <div className="px-4 py-2.5 bg-gray-50 border-t border-gray-100 flex items-center gap-4 text-xs">
                <span className="flex items-center gap-1.5 text-gray-600">
                    <Files className="w-3.5 h-3.5"/>
                    <span className="font-medium">{metadata.files_changed}</span>
                    <span className="text-gray-400">{metadata.files_changed === 1 ? 'file' : 'files'}</span>
                </span>
                <span className="flex items-center gap-1 text-green-600 font-medium">
                    <Plus className="w-3.5 h-3.5"/>
                    {metadata.additions}
                </span>
                <span className="flex items-center gap-1 text-red-600 font-medium">
                    <Minus className="w-3.5 h-3.5"/>
                    {metadata.deletions}
                </span>
                {metadata.commit_date && (
                    <span className="flex items-center gap-1 text-gray-500 ml-auto">
                        <Calendar className="w-3.5 h-3.5"/>
                        {formatDate(metadata.commit_date)}
                    </span>
                )}
                {isLoading && (
                    <span className="ml-auto text-amber-500 animate-pulse font-medium">
                        Analyzing...
                    </span>
                )}
            </div>

            {/* Files Changed - Expandable Section */}
            {metadata.files && metadata.files.length > 0 && (
                <div className="border-t border-gray-100">
                    <button
                        onClick={() => setShowFiles(!showFiles)}
                        className="w-full px-4 py-2.5 flex items-center justify-between text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                    >
                        <span className="flex items-center gap-2">
                            <FileCode className="w-3.5 h-3.5"/>
                            Files Changed ({metadata.files.length})
                        </span>
                        {showFiles ? <ChevronUp className="w-4 h-4"/> : <ChevronDown className="w-4 h-4"/>}
                    </button>

                    {showFiles && (
                        <div className="px-4 pb-3 space-y-2">
                            {metadata.files.map((file, i) => (
                                <div key={i} className="border border-gray-200 rounded-lg overflow-hidden">
                                    <button
                                        onClick={() => file.patch && toggleFileExpand(i)}
                                        className={`w-full flex items-center gap-2 text-xs p-2.5 bg-gray-50 ${file.patch ? 'hover:bg-gray-100 cursor-pointer' : ''}`}
                                    >
                                        <FileStatusBadge status={file.status}/>
                                        <span className="text-gray-700 font-mono text-[11px] truncate flex-1 text-left">
                                            {file.filename}
                                        </span>
                                        <span className="text-green-600 font-medium">+{file.additions}</span>
                                        <span className="text-red-600 font-medium">-{file.deletions}</span>
                                        {file.patch && (
                                            expandedFiles.has(i) ?
                                                <ChevronUp className="w-4 h-4 text-gray-400"/> :
                                                <ChevronDown className="w-4 h-4 text-gray-400"/>
                                        )}
                                    </button>
                                    {expandedFiles.has(i) && file.patch && <FileDiff patch={file.patch}/>}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Footer Actions - Similar to PR Card */}
            <div className="border-t border-gray-100 px-4 py-3 bg-gray-50 flex items-center gap-2">
                <a
                    href={metadata.commit_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-colors"
                >
                    <Code2 className="w-3.5 h-3.5"/>
                    View on GitHub
                </a>
            </div>
        </div>
    );
};

export default CommitMetadataCard;