import { useEffect } from "react";
import { useChatStore } from "../store/useChatStore";
import UsersLoadingSkeleton from "./UsersLoadingSkeleton";
import { useAuthStore } from "../store/useAuthStore";
import LastSeen from "./LastSeen";

function ContactList() {
  const { getAllContacts, allContacts, setSelectedUser, isUsersLoading } = useChatStore();
  const { onlineUsers } = useAuthStore();

  useEffect(() => {
    getAllContacts();
  }, [getAllContacts]);

  if (isUsersLoading) return <UsersLoadingSkeleton />;

  return (
    <>
      {allContacts.map((contact) => (
        <div
          key={contact._id}
          className="bg-cyan-500/10 p-3 sm:p-4 rounded-lg cursor-pointer hover:bg-cyan-500/20 active:bg-cyan-500/30 transition-colors touch-manipulation"
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
          </div>
        </div>
      ))}
    </>
  );
}
export default ContactList;
