const express = require("express");
const { Server } = require("socket.io");

const app = express();

const io = new Server(8000, {
  cors: "*",
});

const emailToSocketIdMap = new Map();
const socketIdToEmailMap = new Map();

io.on("connection", (socket) => {
  console.log("a user connected", socket.id);

  socket.on("room:join", (data) => {
    const { email, room } = data;
    emailToSocketIdMap.set(email, socket.id);
    socketIdToEmailMap.set(socket.id, email);
    io.to(room).emit("user-joined", { email, id: socket.id });
    socket.join(room);
    io.to(socket.id).emit("room:join", data);
    // console.log("room:join");
  });

  socket.on("user:call", ({ to, offer }) => {
    io.to(to).emit("incoming-call", { from: socket.id, offer });
  });

  socket.on("call:accepted", ({ to, ans }) => {
    io.to(to).emit("call-accepted", { from: socket.id, ans });
  });

  socket.on("peer:nego:needed", ({ to, offer }) => {
    io.to(to).emit("peer:nego:needed", { from: socket.id, offer });
  });

  socket.on("peer:nego:done", ({ to, ans }) => {
    io.to(to).emit("peer:nego:final", { ans, from: socket.id });
  });
});

app.listen(8080, () => {
  // console.log("Server is running on port 8080");
});
