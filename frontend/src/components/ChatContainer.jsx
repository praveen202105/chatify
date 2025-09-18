import { useEffect, useRef, useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import ChatHeader from "./ChatHeader";
import NoChatHistoryPlaceholder from "./NoChatHistoryPlaceholder";
import MessageInput from "./MessageInput";
import MessagesLoadingSkeleton from "./MessagesLoadingSkeleton";
import TypingIndicator from "./TypingIndicator";
import MessageReactions, { QuickReactionPicker } from "./MessageReactions";
import MessageActions from "./MessageActions";
import ReplyPreview from "./ReplyPreview";
import VoiceMessagePlayer from "./VoiceMessagePlayer";
import MessageStatus from "./MessageStatus";

function ChatContainer() {
  const {
    selectedUser,
    getMessagesByUserId,
    messages,
    isMessagesLoading,
    subscribeToMessages,
    unsubscribeFromMessages,
    replyToMessage,
    setReplyToMessage,
    editingMessage,
    setEditingMessage,
    editMessage,
    addMessageReaction,
  } = useChatStore();
  const { authUser } = useAuthStore();
  const messageEndRef = useRef(null);
  const [editText, setEditText] = useState("");
  const [activeMessageId, setActiveMessageId] = useState(null);

  const handleReply = (message) => {
    setReplyToMessage({
      ...message,
      senderName: message.senderId === authUser._id ? "You" : selectedUser.fullName
    });
  };

  const handleEdit = (message) => {
    setEditingMessage(message);
    setEditText(message.text);
  };

  const handleSaveEdit = () => {
    if (editText.trim() && editingMessage) {
      editMessage(editingMessage._id, editText.trim());
      setEditText("");
    }
  };

  const handleCancelEdit = () => {
    setEditingMessage(null);
    setEditText("");
  };

  useEffect(() => {
    getMessagesByUserId(selectedUser._id);
    subscribeToMessages();

    // clean up
    return () => unsubscribeFromMessages();
  }, [selectedUser, getMessagesByUserId, subscribeToMessages, unsubscribeFromMessages]);

  useEffect(() => {
    if (messageEndRef.current) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  return (
    <>
      <ChatHeader />
      <div className="flex-1 px-2 sm:px-6 overflow-y-auto py-8">
        {messages.length > 0 && !isMessagesLoading ? (
          <div
            className="max-w-3xl mx-auto space-y-6"
            onClick={() => setActiveMessageId(null)} // Clear active message on background click
          >
            {messages.map((msg) => {
              const isMyMessage = msg.senderId === authUser._id;
              const isActive = activeMessageId === msg._id;

              return (
                <div
                  key={msg._id}
                  className={`chat group ${isMyMessage ? "chat-end" : "chat-start"}`}
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent background click from firing
                    setActiveMessageId(msg._id);
                  }}
                >
                  <div className="flex items-start gap-2 relative">
                    <div
                      className={`chat-bubble relative ${
                        isMyMessage
                          ? "bg-cyan-600 text-white"
                          : "bg-slate-800 text-slate-200"
                      } ${msg.isDeleted ? "opacity-60 italic" : ""}`}
                    >
                      {/* Reply reference */}
                      {msg.replyTo && (
                        <div className="border-l-2 border-slate-500 pl-2 mb-2 text-xs opacity-70">
                          <p className="font-medium">Replying to message</p>
                        </div>
                      )}

                      {/* Message content */}
                      {msg.image && !msg.isDeleted && (
                        <img src={msg.image} alt="Shared" className="rounded-lg h-48 object-cover" />
                      )}

                      {/* Voice message */}
                      {msg.voice && !msg.isDeleted && (
                        <VoiceMessagePlayer
                          voiceUrl={msg.voice}
                          duration={msg.voiceDuration}
                          isMyMessage={isMyMessage}
                        />
                      )}

                      {editingMessage?._id === msg._id ? (
                        <div className="mt-2">
                          <input
                            type="text"
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            className="w-full bg-slate-700 text-white px-2 py-1 rounded"
                            onKeyPress={(e) => {
                              if (e.key === "Enter") handleSaveEdit();
                              if (e.key === "Escape") handleCancelEdit();
                            }}
                            autoFocus
                          />
                          <div className="flex gap-2 mt-2">
                            <button onClick={handleSaveEdit} className="text-xs bg-green-600 px-2 py-1 rounded">
                              Save
                            </button>
                            <button onClick={handleCancelEdit} className="text-xs bg-gray-600 px-2 py-1 rounded">
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        msg.text && <p className="mt-2">{msg.text}</p>
                      )}

                      {/* Reactions */}
                      <MessageReactions message={msg} isMyMessage={isMyMessage} />

                      <div className="text-xs mt-1 opacity-75 flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          {new Date(msg.createdAt).toLocaleTimeString(undefined, {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                          {msg.isEdited && <span className="italic">(edited)</span>}
                        </div>
                        <MessageStatus message={msg} isMyMessage={isMyMessage} />
                      </div>
                    </div>

                    {/* Quick Reaction Picker (appears on active) */}
                    {isActive && (
                      <QuickReactionPicker
                        message={msg}
                        isMyMessage={isMyMessage}
                        onReactionClick={(reactionType) => addMessageReaction(msg._id, reactionType)}
                      />
                    )}

                    {/* Message Actions (appears on active) */}
                    {isActive && (
                      <MessageActions
                        message={msg}
                        onReply={handleReply}
                        onEdit={handleEdit}
                      />
                    )}
                  </div>
                </div>
              );
            })}
            {/* 👇 scroll target */}
            <div ref={messageEndRef} />
          </div>
        ) : isMessagesLoading ? (
          <MessagesLoadingSkeleton />
        ) : (
          <NoChatHistoryPlaceholder name={selectedUser.fullName} />
        )}
      </div>

      <ReplyPreview
        replyToMessage={replyToMessage}
        onCancelReply={() => setReplyToMessage(null)}
      />
      <TypingIndicator />
      <MessageInput />
    </>
  );
}

export default ChatContainer;
