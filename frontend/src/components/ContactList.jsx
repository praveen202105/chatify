import { useEffect } from "react";
import { useChatStore } from "../store/useChatStore";
import { useCallStore } from "../store/useCallStore";
import UsersLoadingSkeleton from "./UsersLoadingSkeleton";
import { useAuthStore } from "../store/useAuthStore";
import { Phone, Video } from "lucide-react";
import LastSeen from "./LastSeen";

function ContactList() {
  const { getAllContacts, allContacts, setSelectedUser, isUsersLoading } = useChatStore();
  const { onlineUsers } = useAuthStore();
  const { initiateCall, isInCall } = useCallStore();

  const handleVoiceCall = (e, contact) => {
    e.stopPropagation();
    if (!isInCall && onlineUsers.includes(contact._id)) {
      initiateCall(contact._id, contact.fullName, contact.profilePic, 'voice');
    }
  };

  const handleVideoCall = (e, contact) => {
    e.stopPropagation();
    if (!isInCall && onlineUsers.includes(contact._id)) {
      initiateCall(contact._id, contact.fullName, contact.profilePic, 'video');
    }
  };

  useEffect(() => {
    getAllContacts();
  }, [getAllContacts]);

  if (isUsersLoading) return <UsersLoadingSkeleton />;

  return (
    <>
      {allContacts.map((contact) => (
        <div
          key={contact._id}
          className="group bg-cyan-500/10 p-3 sm:p-4 rounded-lg cursor-pointer hover:bg-cyan-500/20 active:bg-cyan-500/30 transition-colors touch-manipulation"
          onClick={() => setSelectedUser(contact)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setSelectedUser(contact);
            }
          }}
          aria-label={`Start chat with ${contact.fullName}`}
        >
          <div className="flex items-center gap-3">
            <div className={`avatar ${onlineUsers.includes(contact._id) ? "online" : "offline"}`}>
              <div className="size-10 sm:size-12 rounded-full">
                <img src={contact.profilePic || "/avatar.png"} alt={contact.fullName} />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-slate-200 font-medium text-sm sm:text-base truncate">{contact.fullName}</h4>
              <LastSeen
                lastSeen={contact.lastSeen}
                isOnline={onlineUsers.includes(contact._id)}
                className="mt-1 text-xs"
              />
            </div>

            {/* Quick call buttons - only show when user is online and not in call */}
            {onlineUsers.includes(contact._id) && !isInCall && (
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => handleVoiceCall(e, contact)}
                  className="p-2 text-slate-400 hover:text-green-400 hover:bg-green-600/20 rounded-full transition-all duration-200"
                  aria-label="Voice call"
                  title="Voice call"
                >
                  <Phone className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => handleVideoCall(e, contact)}
                  className="p-2 text-slate-400 hover:text-blue-400 hover:bg-blue-600/20 rounded-full transition-all duration-200"
                  aria-label="Video call"
                  title="Video call"
                >
                  <Video className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      ))}
    </>
  );
}
export default ContactList;
