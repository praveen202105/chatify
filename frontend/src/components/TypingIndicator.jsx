import { useChatStore } from "../store/useChatStore";

const TypingIndicator = () => {
  const { typingUsers, selectedUser } = useChatStore();

  console.log("TypingIndicator render:", {
    typingUsers,
    selectedUser: selectedUser ? { id: selectedUser._id, name: selectedUser.fullName } : null
  });

  // Only show typing indicator for the currently selected user
  const isSelectedUserTyping = selectedUser && typingUsers[selectedUser._id];

  console.log("Is selected user typing:", isSelectedUserTyping);

  if (!isSelectedUserTyping) return null;

  return (
    <div className="flex items-center gap-2 px-4 py-2 text-sm text-gray-500">
      <div className="flex space-x-1">
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-75"></div>
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-150"></div>
      </div>
      <span className="italic">
        {typingUsers[selectedUser._id].userName} is typing...
      </span>
    </div>
  );
};

export default TypingIndicator;