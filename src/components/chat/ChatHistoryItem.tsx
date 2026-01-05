import { useState, useRef, useEffect } from 'react';
import { MessageSquare, Pencil, Trash2, Check, X } from 'lucide-react';
import { Chat } from '@/types/chat';
import { cn } from '@/lib/utils';

interface ChatHistoryItemProps {
  chat: Chat;
  isActive: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onUpdateTitle: (newTitle: string) => void;
}

export const ChatHistoryItem = ({
  chat,
  isActive,
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

  return (
    <div
      className={cn(
        'group flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-150',
        isActive
          ? 'bg-sidebar-active border border-primary/20'
          : 'hover:bg-sidebar-hover'
      )}
      onClick={() => !isEditing && onSelect()}
    >
      <MessageSquare className="h-4 w-4 text-muted-foreground flex-shrink-0" />
      
      {isEditing ? (
        <div className="flex-1 flex items-center gap-1">
          <input
            ref={inputRef}
            type="text"
            value={editedTitle}
            onChange={(e) => setEditedTitle(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 text-sm bg-background border border-input rounded px-2 py-1 outline-none focus:ring-2 focus:ring-ring"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleSave();
            }}
            className="p-1 hover:bg-accent rounded transition-colors"
          >
            <Check className="h-3.5 w-3.5 text-primary" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleCancel();
            }}
            className="p-1 hover:bg-accent rounded transition-colors"
          >
            <X className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        </div>
      ) : (
        <>
          <span className="flex-1 text-sm truncate text-sidebar-foreground">
            {chat.title}
          </span>
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsEditing(true);
              }}
              className="p-1.5 hover:bg-accent rounded transition-colors"
              title="Edit"
            >
              <Pencil className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="p-1.5 hover:bg-destructive/10 rounded transition-colors"
              title="Delete"
            >
              <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
            </button>
          </div>
        </>
      )}
    </div>
  );
};
