import { Server } from "socket.io";
import http from "http";
import express from "express";

// Create Express app and HTTP server
const app = express();
const server = http.createServer(app);

// Create Socket.IO server
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173", // Frontend URL
    methods: ["GET", "POST"],
    credentials: true, // ✅ Required to send cookies (like JWT)
  },
});

// Store online users: { userId: socketId }
const userSocketMap = {};

// Function to get socket ID of a user
export function getReceiverSocketId(userId) {
  return userSocketMap[userId];
}

// Listen for socket connections
io.on("connection", (socket) => {
  console.log("✅ Socket.IO: A user connected:", socket.id); // ✅ New log

  // Get userId from query (sent by frontend)
  const userId = socket.handshake.query.userId;
  if (userId) {
    userSocketMap[userId] = socket.id;
    console.log(`🟢 User online: ${userId} (Socket ID: ${socket.id})`); // ✅ Enhanced log
  } else {
    console.log("🟨 No userId provided in handshake query"); // 🔍 Debug if missing
  }

  // Notify all clients about online users
  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  // When user disconnects
  socket.on("disconnect", () => {
    console.log("🔴 A user disconnected:", socket.id);
    if (userId) {
      delete userSocketMap[userId];
      console.log(`❌ User offline: ${userId}`);
    } else {
      console.log("⚠️ Disconnected socket had no userId");
    }

    // Update all clients with current online users
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });
});

// Export io, app, and server for use in other files
export { io, app, server };