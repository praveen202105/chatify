import { X } from "lucide-react";

const ReplyPreview = ({ replyToMessage, onCancelReply }) => {
  if (!replyToMessage) return null;

  return (
    <div className="px-4 py-2 bg-slate-800/30 border-l-4 border-cyan-500">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-xs text-cyan-400 font-medium mb-1">
            Replying to {replyToMessage.senderName || "Unknown"}
          </p>
          <div className="text-sm text-slate-400 truncate">
            {replyToMessage.image && (
              <span className="italic">📷 Image</span>
            )}
            {replyToMessage.text && (
              <span>{replyToMessage.text}</span>
            )}
          </div>
        </div>
        <button
          onClick={onCancelReply}
          className="text-slate-500 hover:text-slate-300 p-1"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default ReplyPreview;