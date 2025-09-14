import { MessageCircleIcon } from "lucide-react";

const NoConversationPlaceholder = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-4 sm:p-6">
      <div className="size-16 sm:size-20 bg-cyan-500/20 rounded-full flex items-center justify-center mb-4 sm:mb-6">
        <MessageCircleIcon className="size-8 sm:size-10 text-cyan-400" />
      </div>
      <h3 className="text-lg sm:text-xl font-semibold text-slate-200 mb-2">Select a conversation</h3>
      <p className="text-slate-400 max-w-md text-sm sm:text-base px-4">
        Choose a contact from the sidebar to start chatting or continue a previous conversation.
      </p>
    </div>
  );
};

export default NoConversationPlaceholder;
