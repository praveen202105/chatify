import { useEffect } from "react";
import { useChatStore } from "../store/useChatStore";
import UsersLoadingSkeleton from "./UsersLoadingSkeleton";
import NoChatsFound from "./NoChatsFound";
import { useAuthStore } from "../store/useAuthStore";
import LastSeen from "./LastSeen";

function ChatsList() {
  const { getMyChatPartners, chats, isUsersLoading, setSelectedUser, typingUsers } = useChatStore();
  const { onlineUsers } = useAuthStore();

  useEffect(() => {
    getMyChatPartners();
  }, [getMyChatPartners]);

  if (isUsersLoading) return <UsersLoadingSkeleton />;
  if (chats.length === 0) return <NoChatsFound />;

  return (
    <>
      {chats.map((chat) => {
        const isUserTyping = typingUsers[chat._id];
        console.log(`Chat ${chat.fullName}:`, { isUserTyping, allTypingUsers: typingUsers });

        return (
          <div
            key={chat._id}
            className="bg-cyan-500/10 p-4 rounded-lg cursor-pointer hover:bg-cyan-500/20 transition-colors"
            onClick={() => setSelectedUser(chat)}
          >
            <div className="flex items-center gap-3">
              <div className={`avatar ${onlineUsers.includes(chat._id) ? "online" : "offline"}`}>
                <div className="size-12 rounded-full">
                  <img src={chat.profilePic || "/avatar.png"} alt={chat.fullName} />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-slate-200 font-medium truncate">{chat.fullName}</h4>
                {isUserTyping ? (
                  <div className="flex items-center gap-1 mt-1">
                    <div className="flex space-x-1">
                      <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse"></div>
                      <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse delay-75"></div>
                      <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse delay-150"></div>
                    </div>
                    <span className="text-xs text-cyan-400 italic">typing...</span>
                  </div>
                ) : (
                  <LastSeen
                    lastSeen={chat.lastSeen}
                    isOnline={onlineUsers.includes(chat._id)}
                    className="mt-1"
                  />
                )}
              </div>
            </div>
          </div>
        );
      })}
    </>
  );
}
export default ChatsList;
