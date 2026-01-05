import { UserProfile as UserProfileType } from '@/types/chat';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface UserProfileProps {
  user: UserProfileType;
}

export const UserProfile = ({ user }: UserProfileProps) => {
  const initials = `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();

  return (
    <div className="flex items-center gap-3 p-4 border-t border-sidebar-border">
      <Avatar className="h-10 w-10 ring-2 ring-sidebar-border">
        <AvatarImage src={user.avatar} alt={`${user.firstName} ${user.lastName}`} />
        <AvatarFallback className="bg-primary text-primary-foreground text-sm font-medium">
          {initials}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-sidebar-foreground truncate">
          {user.firstName} {user.lastName}
        </p>
        <p className="text-xs text-muted-foreground truncate">Online</p>
      </div>
    </div>
  );
};
