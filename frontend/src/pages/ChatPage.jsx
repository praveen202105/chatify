import { useEffect } from "react";
import { useChatStore } from "../store/useChatStore";

import BorderAnimatedContainer from "../components/BorderAnimatedContainer";
import ProfileHeader from "../components/ProfileHeader";
import ActiveTabSwitch from "../components/ActiveTabSwitch";
import ChatsList from "../components/ChatsList";
import ContactList from "../components/ContactList";
import ChatContainer from "../components/ChatContainer";
import NoConversationPlaceholder from "../components/NoConversationPlaceholder";

function ChatPage() {
  const {
    activeTab,
    selectedUser,
    subscribeToTypingEvents,
    unsubscribeFromTypingEvents,
    subscribeToMessageUpdates,
    unsubscribeFromMessageUpdates
  } = useChatStore();

  useEffect(() => {
    // Subscribe to typing events and message updates when chat page loads
    subscribeToTypingEvents();
    subscribeToMessageUpdates();

    // Cleanup when component unmounts
    return () => {
      unsubscribeFromTypingEvents();
      unsubscribeFromMessageUpdates();
    };
  }, [subscribeToTypingEvents, unsubscribeFromTypingEvents, subscribeToMessageUpdates, unsubscribeFromMessageUpdates]);

  return (
    <div className="relative w-full max-w-7xl mx-auto h-screen md:h-[800px] md:my-8 p-2 md:p-0">
      <BorderAnimatedContainer>
        {/* LEFT SIDE - Mobile: Full screen when no chat, Hidden when chat open */}
        <div className={`
          ${selectedUser ? 'hidden md:flex' : 'flex'}
          w-full md:w-80 lg:w-96 bg-slate-800/50 backdrop-blur-sm flex-col transition-all duration-300 ease-in-out
        `}>
          <ProfileHeader />
          <ActiveTabSwitch />

          <div className="flex-1 overflow-y-auto p-3 md:p-4 space-y-2 scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-transparent">
            {activeTab === "chats" ? <ChatsList /> : <ContactList />}
          </div>
        </div>

        {/* RIGHT SIDE - Mobile: Full screen when chat open, Hidden when no chat */}
        <div className={`
          ${selectedUser ? 'flex' : 'hidden md:flex'}
          flex-1 flex-col bg-slate-900/50 backdrop-blur-sm min-h-0 transition-all duration-300 ease-in-out
        `}>
          {selectedUser ? <ChatContainer /> : <NoConversationPlaceholder />}
        </div>
      </BorderAnimatedContainer>
    </div>
  );
}
export default ChatPage;
