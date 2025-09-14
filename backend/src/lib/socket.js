import { Server } from "socket.io";
import http from "http";
import express from "express";
import { ENV } from "./env.js";
import { socketAuthMiddleware } from "../middleware/socket.auth.middleware.js";
import User from "../models/User.js";

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
