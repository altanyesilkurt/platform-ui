import { useState, useRef, useEffect } from 'react';
import { MessageSquare, Pencil, Trash2, Check, X, Loader2 } from 'lucide-react';
import { Chat } from '@/types/chat';
import { cn } from '@/lib/utils';

interface ChatHistoryItemProps {
    chat: Chat;
    isActive: boolean;
    isGeneratingTitle?: boolean;
    onSelect: () => void;
    onDelete: () => void;
    onUpdateTitle: (newTitle: string) => void;
}

export const ChatHistoryItem = ({
                                    chat,
                                    isActive,
                                    isGeneratingTitle = false,
                                    onSelect,
                                    onDelete,
                                    onUpdateTitle,
                                }: ChatHistoryItemProps) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editedTitle, setEditedTitle] = useState(chat.title);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [isEditing]);

    useEffect(() => {
        setEditedTitle(chat.title);
    }, [chat.title]);

    const handleSave = () => {
        if (editedTitle.trim()) {
            onUpdateTitle(editedTitle.trim());
        } else {
            setEditedTitle(chat.title);
        }
        setIsEditing(false);
    };

    const handleCancel = () => {
        setEditedTitle(chat.title);
        setIsEditing(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSave();
        } else if (e.key === 'Escape') {
            handleCancel();
        }
    };

    const showActions = !isGeneratingTitle && !isEditing;

    return (
        <div
            className={cn(
                'group flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-150 w-full max-w-full overflow-hidden',
                isActive
                    ? 'bg-sidebar-active border border-primary/20'
                    : 'hover:bg-sidebar-hover'
            )}
            onClick={() => !isEditing && onSelect()}
        >
            <MessageSquare className="h-4 w-4 text-muted-foreground flex-shrink-0" />

            {isEditing ? (
                <div className="flex-1 flex items-center gap-1 min-w-0">
                    <input
                        ref={inputRef}
                        type="text"
                        value={editedTitle}
                        onChange={(e) => setEditedTitle(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="flex-1 text-sm bg-background border border-input rounded px-2 py-1 outline-none focus:ring-2 focus:ring-ring min-w-0"
                        onClick={(e) => e.stopPropagation()}
                    />
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            handleSave();
                        }}
                        className="p-1.5 rounded-md bg-primary/10 hover:bg-primary/20 text-primary transition-colors flex-shrink-0"
                        title="Save"
                    >
                        <Check className="h-3 w-3" />
                    </button>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            handleCancel();
                        }}
                        className="p-1.5 rounded-md hover:bg-muted text-muted-foreground transition-colors flex-shrink-0"
                        title="Cancel"
                    >
                        <X className="h-3 w-3" />
                    </button>
                </div>
            ) : (
                <>
                    <span className="flex-1 min-w-0 text-sm text-sidebar-foreground truncate">
                        {isGeneratingTitle ? (
                            <span className="flex items-center gap-2 text-muted-foreground italic">
                                Generating title
                                <Loader2 className="h-3 w-3 animate-spin" />
                            </span>
                        ) : (
                            chat.title
                        )}
                    </span>

                    {showActions && (
                        <div
                            className={cn(
                                'flex items-center gap-0.5 flex-shrink-0',
                                'opacity-0 group-hover:opacity-100 transition-opacity',
                                isActive && 'opacity-100'
                            )}
                        >
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setIsEditing(true);
                                }}
                                className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                                title="Rename"
                            >
                                <Pencil className="h-3 w-3" />
                            </button>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDelete();
                                }}
                                className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                                title="Delete"
                            >
                                <Trash2 className="h-3 w-3" />
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};