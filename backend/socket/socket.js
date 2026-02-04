import { Server } from "socket.io";
import http from "http";
import express from "express";

const app = express();
const server = http.createServer(app);

// Allow CORS for localhost and deployed frontend
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:4173", "https://chat-app-yt.onrender.com"],
    methods: ["GET", "POST"],
  },
  transports: ["websocket", "polling"], // polling add kiya for fallback
});

const userSocketMap = {}; // { userId: socketId }

// helper to get receiver socketId
export const getReceiverSocketId = (receiverId) => userSocketMap[receiverId];

io.on("connection", (socket) => {
  console.log("a user connected:", socket.id);

  const userId = socket.handshake.query.userId;
  if (userId && userId !== "undefined") {
    userSocketMap[userId] = socket.id;
  }

  // Emit online users whenever someone connects
  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  // Listen for private messages
  socket.on("sendMessage", ({ toUserId, message }) => {
    const receiverSocketId = getReceiverSocketId(toUserId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("receiveMessage", { fromUserId: userId, message });
    }
  });

  // Handle disconnect
  socket.on("disconnect", () => {
    console.log("user disconnected:", socket.id);
    delete userSocketMap[userId];
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });
});

export { app, io, server };
