import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import { useAuthStore } from "./useAuthStore";

export const useChatStore = create((set, get) => ({
  allContacts: [],
  chats: [],
  messages: [],
  activeTab: "chats",
  selectedUser: null,
  isUsersLoading: false,
  isMessagesLoading: false,
  isSoundEnabled: JSON.parse(localStorage.getItem("isSoundEnabled")) === true,
  typingUsers: {}, // { userId: { isTyping: boolean, userName: string } }
  replyToMessage: null, // Message being replied to
  editingMessage: null, // Message being edited

  toggleSound: () => {
    localStorage.setItem("isSoundEnabled", !get().isSoundEnabled);
    set({ isSoundEnabled: !get().isSoundEnabled });
  },

  setActiveTab: (tab) => set({ activeTab: tab }),
  setSelectedUser: (selectedUser) => set({ selectedUser }),
  setReplyToMessage: (message) => set({ replyToMessage: message }),
  setEditingMessage: (message) => set({ editingMessage: message }),

  setTypingUser: (userId, isTyping, userName) => {
    console.log("Setting typing user:", { userId, isTyping, userName });
    const { typingUsers } = get();

    if (isTyping) {
      const newTypingUsers = {
        ...typingUsers,
        [userId]: { isTyping: true, userName }
      };
      console.log("Updated typingUsers (adding):", newTypingUsers);
      set({ typingUsers: newTypingUsers });
    } else {
      const updatedTypingUsers = { ...typingUsers };
      delete updatedTypingUsers[userId];
      console.log("Updated typingUsers (removing):", updatedTypingUsers);
      set({ typingUsers: updatedTypingUsers });
    }
  },

  getAllContacts: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/messages/contacts");
      set({ allContacts: res.data });
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isUsersLoading: false });
    }
  },
  getMyChatPartners: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/messages/chats");
      set({ chats: res.data });
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isUsersLoading: false });
    }
  },

  getMessagesByUserId: async (userId) => {
    set({ isMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/messages/${userId}`);
      set({ messages: res.data });
    } catch (error) {
      toast.error(error.response?.data?.message || "Something went wrong");
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  sendMessage: async (messageData) => {
    const { selectedUser, messages, replyToMessage } = get();
    const { authUser } = useAuthStore.getState();

    // Add replyTo to messageData if replying
    if (replyToMessage) {
      messageData.replyTo = replyToMessage._id;
    }

    const tempId = `temp-${Date.now()}`;

    const optimisticMessage = {
      _id: tempId,
      senderId: authUser._id,
      receiverId: selectedUser._id,
      text: messageData.text,
      image: messageData.image,
      createdAt: new Date().toISOString(),
      isOptimistic: true, // flag to identify optimistic messages (optional)
    };
    // immidetaly update the ui by adding the message
    set({ messages: [...messages, optimisticMessage] });

    try {
      const res = await axiosInstance.post(`/messages/send/${selectedUser._id}`, messageData);
      set({ messages: messages.concat(res.data), replyToMessage: null }); // Clear reply after sending
    } catch (error) {
      // remove optimistic message on failure
      set({ messages: messages });
      toast.error(error.response?.data?.message || "Something went wrong");
    }
  },

  addMessageReaction: async (messageId, reactionType) => {
    try {
      // Optimistic update for immediate feedback
      const { messages } = get();
      const { authUser } = useAuthStore.getState();

      const optimisticMessages = messages.map(msg => {
        if (msg._id !== messageId) return msg;

        const currentReactions = msg.reactions || [];
        const existingReactionIndex = currentReactions.findIndex(r => r.userId === authUser._id);

        let newReactions;
        if (existingReactionIndex >= 0) {
          if (currentReactions[existingReactionIndex].type === reactionType) {
            // Remove reaction
            newReactions = currentReactions.filter(r => r.userId !== authUser._id);
          } else {
            // Update reaction
            newReactions = [...currentReactions];
            newReactions[existingReactionIndex] = { userId: authUser._id, type: reactionType };
          }
        } else {
          // Add new reaction
          newReactions = [...currentReactions, { userId: authUser._id, type: reactionType }];
        }

        return { ...msg, reactions: newReactions };
      });

      set({ messages: optimisticMessages });

      // Send to server (real-time update will come via socket)
      await axiosInstance.post(`/messages/${messageId}/react`, { type: reactionType });
    } catch (error) {
      // Revert optimistic update on error
      toast.error(error.response?.data?.message || "Failed to add reaction");
      // Note: We could refetch messages here, but socket will handle the correct state
    }
  },

  editMessage: async (messageId, newText) => {
    try {
      const res = await axiosInstance.put(`/messages/${messageId}/edit`, { text: newText });
      const { messages } = get();
      const updatedMessages = messages.map(msg =>
        msg._id === messageId ? res.data : msg
      );
      set({ messages: updatedMessages, editingMessage: null });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to edit message");
    }
  },

  deleteMessage: async (messageId) => {
    try {
      const res = await axiosInstance.delete(`/messages/${messageId}`);
      const { messages } = get();
      const updatedMessages = messages.map(msg =>
        msg._id === messageId ? res.data : msg
      );
      set({ messages: updatedMessages });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete message");
    }
  },

  subscribeToMessages: () => {
    const { selectedUser, isSoundEnabled } = get();
    if (!selectedUser) return;

    const socket = useAuthStore.getState().socket;

    socket.on("newMessage", (newMessage) => {
      const isMessageSentFromSelectedUser = newMessage.senderId === selectedUser._id;
      if (!isMessageSentFromSelectedUser) return;

      const currentMessages = get().messages;
      set({ messages: [...currentMessages, newMessage] });

      if (isSoundEnabled) {
        const notificationSound = new Audio("/sounds/notification.mp3");

        notificationSound.currentTime = 0; // reset to start
        notificationSound.play().catch((e) => console.log("Audio play failed:", e));
      }
    });
  },

  // Subscribe to typing events globally (for all users)
  subscribeToTypingEvents: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;

    socket.on("userTyping", (data) => {
      const { userId, userName, isTyping } = data;
      console.log("Received typing event:", { userId, userName, isTyping });
      get().setTypingUser(userId, isTyping, userName);
    });

    // Subscribe to user status updates (online/offline and lastSeen)
    socket.on("userStatusUpdate", (data) => {
      const { userId, isOnline, lastSeen } = data;
      console.log("User status update:", { userId, isOnline, lastSeen });

      const { chats, allContacts, selectedUser } = get();

      // Update chats list
      const updatedChats = chats.map(chat =>
        chat._id === userId ? { ...chat, isOnline, lastSeen } : chat
      );

      // Update contacts list
      const updatedContacts = allContacts.map(contact =>
        contact._id === userId ? { ...contact, isOnline, lastSeen } : contact
      );

      // Update selected user if it's the same user
      const updatedSelectedUser = selectedUser?._id === userId
        ? { ...selectedUser, isOnline, lastSeen }
        : selectedUser;

      set({
        chats: updatedChats,
        allContacts: updatedContacts,
        selectedUser: updatedSelectedUser
      });
    });
  },

  // Subscribe to message reactions, edits, and deletions
  subscribeToMessageUpdates: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;

    socket.on("messageReaction", (data) => {
      const { messageId, reactions, updatedBy } = data;
      const { messages } = get();
      console.log(`Reaction updated by ${updatedBy} on message ${messageId}`);

      const updatedMessages = messages.map(msg =>
        msg._id === messageId ? { ...msg, reactions } : msg
      );
      set({ messages: updatedMessages });
    });

    socket.on("messageEdited", (updatedMessage) => {
      const { messages } = get();
      const { updatedBy } = updatedMessage;
      console.log(`Message edited by ${updatedBy}:`, updatedMessage._id);

      const updatedMessages = messages.map(msg =>
        msg._id === updatedMessage._id ? updatedMessage : msg
      );
      set({ messages: updatedMessages });
    });

    socket.on("messageDeleted", (deletedMessage) => {
      const { messages } = get();
      const { updatedBy } = deletedMessage;
      console.log(`Message deleted by ${updatedBy}:`, deletedMessage._id);

      const updatedMessages = messages.map(msg =>
        msg._id === deletedMessage._id ? deletedMessage : msg
      );
      set({ messages: updatedMessages });
    });
  },

  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    socket.off("newMessage");
  },

  unsubscribeFromTypingEvents: () => {
    const socket = useAuthStore.getState().socket;
    socket.off("userTyping");
    socket.off("userStatusUpdate");
  },

  unsubscribeFromMessageUpdates: () => {
    const socket = useAuthStore.getState().socket;
    socket.off("messageReaction");
    socket.off("messageEdited");
    socket.off("messageDeleted");
  },
}));
