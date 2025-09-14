import { Check } from "lucide-react";

function MessageStatus({ message, isMyMessage }) {
  if (!isMyMessage) return null;

  const getStatusIcon = () => {
    if (message.readAt) {
      // Blue double tick - message read
      return (
        <div className="flex items-center text-blue-950">
          <Check className="w-3 h-3 -mr-1" />
          <Check className="w-3 h-3" />
        </div>
      );
    } else if (message.deliveredAt) {
      // Gray double tick - message delivered
      return (
        <div className="flex items-center text-blue-600">
          <Check className="w-3 h-3 -mr-1" />
          <Check className="w-3 h-3" />
        </div>
      );
    } else {
      // Single gray tick - message sent
      return (
        <div className="flex items-center text-slate-400">
          <Check className="w-3 h-3" />
        </div>
      );
    }
  };

  return (
    <div className="flex items-center ml-1">
      {getStatusIcon()}
    </div>
  );
}

export default MessageStatus;