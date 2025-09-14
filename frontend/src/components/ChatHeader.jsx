import { XIcon, ArrowLeft } from "lucide-react";
import { useChatStore } from "../store/useChatStore";
import { useEffect } from "react";
import { useAuthStore } from "../store/useAuthStore";
import LastSeen from "./LastSeen";

function ChatHeader() {
  const { selectedUser, setSelectedUser } = useChatStore();
  const { onlineUsers } = useAuthStore();
  const isOnline = onlineUsers.includes(selectedUser._id);

  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === "Escape") setSelectedUser(null);
    };

    window.addEventListener("keydown", handleEscKey);

    // cleanup function
    return () => window.removeEventListener("keydown", handleEscKey);
  }, [setSelectedUser]);

  return (
    <div className="flex items-center bg-slate-800/50 border-b border-slate-700/50 px-4 py-3 sm:px-6 sm:py-4">
      {/* Mobile back button - More prominent */}
      <button
        onClick={() => setSelectedUser(null)}
        className="md:hidden mr-3 p-2 -ml-1 text-slate-300 hover:text-slate-100 hover:bg-slate-700/50 rounded-lg transition-all active:scale-95"
        aria-label="Back to chats"
      >
        <ArrowLeft className="w-6 h-6" />
      </button>

      <div className="flex items-center flex-1 min-w-0">
        <div className={`avatar ${isOnline ? "online" : "offline"}`}>
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full">
            <img src={selectedUser.profilePic || "/avatar.png"} alt={selectedUser.fullName} />
          </div>
        </div>

        <div className="ml-3 min-w-0 flex-1">
          <h3 className="text-slate-200 font-medium text-base sm:text-lg truncate">{selectedUser.fullName}</h3>
          <LastSeen
            lastSeen={selectedUser.lastSeen}
            isOnline={isOnline}
            className="text-xs sm:text-sm"
          />
        </div>
      </div>

      {/* Desktop close button */}
      <button
        onClick={() => setSelectedUser(null)}
        className="hidden md:block p-2 ml-2 text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 rounded-lg transition-all"
        aria-label="Close chat"
      >
        <XIcon className="w-5 h-5" />
      </button>
    </div>
  );
}
export default ChatHeader;
