import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";

const REACTION_EMOJIS = {
  like: "👍",
  love: "❤️",
  laugh: "😂",
  wow: "😮",
  angry: "😠",
  sad: "😢"
};

const MessageReactions = ({ message, isMyMessage }) => {
  const { addMessageReaction } = useChatStore();
  const { authUser } = useAuthStore();

  const handleReactionClick = (reactionType) => {
    addMessageReaction(message._id, reactionType);
  };

  // Group reactions by type
  const groupedReactions = message.reactions?.reduce((acc, reaction) => {
    if (!acc[reaction.type]) {
      acc[reaction.type] = [];
    }
    acc[reaction.type].push(reaction);
    return acc;
  }, {}) || {};

  const hasReactions = Object.keys(groupedReactions).length > 0;

  return (
    <div className="relative">
      {/* Reaction Display */}
      {hasReactions && (
        <div className="flex items-center gap-1 mt-1 flex-wrap">
          {Object.entries(groupedReactions).map(([type, reactions]) => (
            <button
              key={type}
              onClick={() => handleReactionClick(type)}
              className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs border transition-all hover:scale-110 ${
                reactions.some(r => r.userId === authUser._id)
                  ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300'
                  : 'bg-slate-700/50 border-slate-600/50 text-slate-300 hover:bg-slate-600/50'
              }`}
            >
              <span>{REACTION_EMOJIS[type]}</span>
              <span>{reactions.length}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// Quick reaction picker that appears on hover
export const QuickReactionPicker = ({ message, isMyMessage, onReactionClick }) => {
  const { authUser } = useAuthStore();
  const userReaction = message.reactions?.find(r => r.userId === authUser._id);

  return (
    <div
      className={`absolute top-0 ${
        isMyMessage ? 'right-full mr-2' : 'left-full ml-2'
      } bg-slate-800 border border-slate-700 rounded-lg p-1 shadow-lg z-20 opacity-0 group-hover:opacity-100 transition-all duration-200 transform scale-95 group-hover:scale-100`}
    >
      <div className="flex gap-1">
        {Object.entries(REACTION_EMOJIS).map(([type, emoji]) => (
          <button
            key={type}
            onClick={() => onReactionClick(type)}
            className={`w-8 h-8 flex items-center justify-center rounded-lg text-lg transition-all hover:scale-125 hover:bg-slate-700 ${
              userReaction?.type === type ? 'bg-cyan-500/20' : ''
            }`}
            title={type}
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
};

export default MessageReactions;