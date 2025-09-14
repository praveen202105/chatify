import { useState } from "react";
import { MoreVertical, Reply, Edit3, Trash2 } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";

const MessageActions = ({ message, onReply, onEdit }) => {
  const [showActions, setShowActions] = useState(false);
  const { authUser } = useAuthStore();
  const { deleteMessage } = useChatStore();

  const isMyMessage = message.senderId === authUser._id;
  const messageAge = Date.now() - new Date(message.createdAt).getTime();
  const canEditOrDelete = isMyMessage && messageAge < 15 * 60 * 1000; // 15 minutes

  const handleDelete = () => {
    if (window.confirm("Are you sure you want to delete this message?")) {
      deleteMessage(message._id);
    }
    setShowActions(false);
  };

  return (
    <div className="relative opacity-0 group-hover:opacity-100 transition-opacity">
      <button
        onClick={() => setShowActions(!showActions)}
        className="text-slate-500 hover:text-slate-300 p-1 rounded"
      >
        <MoreVertical className="w-4 h-4" />
      </button>

      {showActions && (
        <div className="absolute top-full right-0 mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-lg z-20 min-w-[120px]">
          <button
            onClick={() => {
              onReply(message);
              setShowActions(false);
            }}
            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-slate-300 hover:bg-slate-700 first:rounded-t-lg"
          >
            <Reply className="w-4 h-4" />
            Reply
          </button>

          {canEditOrDelete && (
            <>
              <button
                onClick={() => {
                  onEdit(message);
                  setShowActions(false);
                }}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-slate-300 hover:bg-slate-700"
              >
                <Edit3 className="w-4 h-4" />
                Edit
              </button>
              <button
                onClick={handleDelete}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 last:rounded-b-lg"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default MessageActions;