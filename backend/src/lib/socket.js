import { Server } from "socket.io";
import http from "http";
import express from "express";
import { ENV } from "./env.js";
import { socketAuthMiddleware } from "../middleware/socket.auth.middleware.js";
import User from "../models/User.js";
import Message from "../models/Message.js";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: [ENV.CLIENT_URL],
    credentials: true,
  },
});

// apply authentication middleware to all socket connections
io.use(socketAuthMiddleware);

// we will use this function to check if the user is online or not
export function getReceiverSocketId(userId) {
  return userSocketMap[userId];
}

// this is for storig online users
const userSocketMap = {}; // {userId:socketId}

io.on("connection", async (socket) => {
  console.log("A user connected", socket.user.fullName);

  const userId = socket.userId;
  userSocketMap[userId] = socket.id;

  // Update user online status and lastSeen
  await User.findByIdAndUpdate(userId, {
    isOnline: true,
    lastSeen: new Date()
  });

  // io.emit() is used to send events to all connected clients
  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  // Broadcast user came online
  socket.broadcast.emit("userStatusUpdate", {
    userId: userId,
    isOnline: true,
    lastSeen: new Date()
  });

  // Handle typing events
  socket.on("typing", (data) => {
    console.log(`${socket.user.fullName} is typing to user ${data.receiverId}`);
    const receiverSocketId = getReceiverSocketId(data.receiverId);
    console.log(`Receiver socket ID: ${receiverSocketId}`);

    if (receiverSocketId) {
      io.to(receiverSocketId).emit("userTyping", {
        userId: userId,
        userName: socket.user.fullName,
        isTyping: true
      });
      console.log(`Emitted typing event to socket ${receiverSocketId}`);
    } else {
      console.log("Receiver not online or socket not found");
    }
  });

  socket.on("stopTyping", (data) => {
    console.log(`${socket.user.fullName} stopped typing to user ${data.receiverId}`);
    const receiverSocketId = getReceiverSocketId(data.receiverId);

    if (receiverSocketId) {
      io.to(receiverSocketId).emit("userTyping", {
        userId: userId,
        userName: socket.user.fullName,
        isTyping: false
      });
      console.log(`Emitted stopTyping event to socket ${receiverSocketId}`);
    }
  });

  // Handle message delivery confirmation
  socket.on("messageDelivered", async (data) => {
    try {
      const { messageId } = data;
      console.log(`Message ${messageId} delivered to ${socket.user.fullName}`);

      // Update message delivery status
      const updatedMessage = await Message.findByIdAndUpdate(
        messageId,
        { deliveredAt: new Date() },
        { new: true }
      );

      if (updatedMessage) {
        // Notify sender about delivery
        const senderSocketId = getReceiverSocketId(updatedMessage.senderId);
        if (senderSocketId) {
          io.to(senderSocketId).emit("messageStatusUpdate", {
            messageId: messageId,
            deliveredAt: updatedMessage.deliveredAt
          });
        }
      }
    } catch (error) {
      console.error("Error updating message delivery status:", error);
    }
  });

  // Handle message read confirmation
  socket.on("messageRead", async (data) => {
    try {
      const { messageId } = data;
      console.log(`Message ${messageId} read by ${socket.user.fullName}`);

      // Update message read status
      const updatedMessage = await Message.findByIdAndUpdate(
        messageId,
        {
          readAt: new Date(),
          deliveredAt: new Date() // Ensure delivered is set when read
        },
        { new: true }
      );

      if (updatedMessage) {
        // Notify sender about read status
        const senderSocketId = getReceiverSocketId(updatedMessage.senderId);
        if (senderSocketId) {
          io.to(senderSocketId).emit("messageStatusUpdate", {
            messageId: messageId,
            readAt: updatedMessage.readAt,
            deliveredAt: updatedMessage.deliveredAt
          });
        }
      }
    } catch (error) {
      console.error("Error updating message read status:", error);
    }
  });

  // Handle bulk message read (when user opens chat)
  socket.on("markMessagesRead", async (data) => {
    try {
      const { senderId } = data;
      console.log(`${socket.user.fullName} opened chat with ${senderId}`);

      // Mark all unread messages from this sender as read
      const result = await Message.updateMany(
        {
          senderId: senderId,
          receiverId: userId,
          readAt: { $exists: false }
        },
        {
          readAt: new Date(),
          deliveredAt: new Date()
        }
      );

      if (result.modifiedCount > 0) {
        console.log(`Marked ${result.modifiedCount} messages as read`);

        // Get updated messages to send status updates
        const updatedMessages = await Message.find({
          senderId: senderId,
          receiverId: userId,
          readAt: { $exists: true }
        }).select('_id readAt deliveredAt');

        // Notify sender about read status for all messages
        const senderSocketId = getReceiverSocketId(senderId);
        if (senderSocketId) {
          updatedMessages.forEach(msg => {
            io.to(senderSocketId).emit("messageStatusUpdate", {
              messageId: msg._id,
              readAt: msg.readAt,
              deliveredAt: msg.deliveredAt
            });
          });
        }
      }
    } catch (error) {
      console.error("Error marking messages as read:", error);
    }
  });

  // WebRTC Signaling Events

  // Handle call initiation
  socket.on("initiateCall", (data) => {
    const { receiverId, callType, offer } = data; // callType: 'voice' or 'video'
    const receiverSocketId = getReceiverSocketId(receiverId);

    console.log(`${socket.user.fullName} initiating ${callType} call to user ${receiverId}`);

    if (receiverSocketId) {
      io.to(receiverSocketId).emit("incomingCall", {
        callerId: userId,
        callerName: socket.user.fullName,
        callerAvatar: socket.user.profilePic,
        callType: callType,
        offer: offer,
        callId: `${userId}-${receiverId}-${Date.now()}`
      });

      // Notify caller that call is ringing
      socket.emit("callRinging", {
        receiverId: receiverId,
        callType: callType
      });
    } else {
      // User is offline, notify caller
      socket.emit("callFailed", {
        reason: "user_offline",
        message: "User is not available"
      });
    }
  });

  // Handle call answer
  socket.on("answerCall", (data) => {
    const { callerId, answer, callId } = data;
    const callerSocketId = getReceiverSocketId(callerId);

    console.log(`${socket.user.fullName} answered call from ${callerId}`);

    if (callerSocketId) {
      io.to(callerSocketId).emit("callAnswered", {
        answer: answer,
        callId: callId,
        receiverId: userId
      });
    }
  });

  // Handle call rejection
  socket.on("rejectCall", (data) => {
    const { callerId, callId } = data;
    const callerSocketId = getReceiverSocketId(callerId);

    console.log(`${socket.user.fullName} rejected call from ${callerId}`);

    if (callerSocketId) {
      io.to(callerSocketId).emit("callRejected", {
        callId: callId,
        receiverId: userId,
        reason: "rejected"
      });
    }
  });

  // Handle call end
  socket.on("endCall", (data) => {
    const { participantId, callId } = data;
    const participantSocketId = getReceiverSocketId(participantId);

    console.log(`${socket.user.fullName} ended call with ${participantId}`);

    if (participantSocketId) {
      io.to(participantSocketId).emit("callEnded", {
        callId: callId,
        endedBy: userId
      });
    }
  });

  // Handle ICE candidates exchange
  socket.on("iceCandidate", (data) => {
    const { participantId, candidate, callId } = data;
    const participantSocketId = getReceiverSocketId(participantId);

    if (participantSocketId) {
      io.to(participantSocketId).emit("iceCandidate", {
        candidate: candidate,
        callId: callId,
        from: userId
      });
    }
  });

  // Handle call status updates (mute, video toggle, etc.)
  socket.on("callStatusUpdate", (data) => {
    const { participantId, status, callId } = data; // status: { audio: boolean, video: boolean }
    const participantSocketId = getReceiverSocketId(participantId);

    if (participantSocketId) {
      io.to(participantSocketId).emit("participantStatusUpdate", {
        participantId: userId,
        participantName: socket.user.fullName,
        status: status,
        callId: callId
      });
    }
  });

  // with socket.on we listen for events from clients
  socket.on("disconnect", async () => {
    console.log("A user disconnected", socket.user.fullName);

    // Update user offline status and lastSeen
    await User.findByIdAndUpdate(userId, {
      isOnline: false,
      lastSeen: new Date()
    });

    delete userSocketMap[userId];
    io.emit("getOnlineUsers", Object.keys(userSocketMap));

    // Broadcast user went offline
    socket.broadcast.emit("userStatusUpdate", {
      userId: userId,
      isOnline: false,
      lastSeen: new Date()
    });
  });
});

export { io, app, server };
