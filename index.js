const express = require("express");
const http = require("http");
const socketIO = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, "public")));

// Serve the client HTML file
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "client.html"));
});

// Serve the dashboard HTML file
app.get("/dashboard", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "dashboard.html"));
});

// Socket.IO logic
io.on("connection", (socket) => {
  console.log(`Client connected: ${socket.id}`);

  dashboardNamespace.emit("message", {
    sender: socket.id,
    message: "Connected!!!!!!!!!!!!!!!",
  });

  // *****
  /**
   * Listen for a command to join a room
   */
  socket.on("joinRoom", (roomName) => {
    // Join the specified room
    socket.join(roomName);

    // Broadcast a message to the new room
    io.to(roomName).emit("roomMessage", `Socket ${socket.id} joined the room.`);
  });

  // *****
  /**
   * Listen for messages from clients
   */
  socket.on("message", (data) => {
    console.log(`Message from ${socket.id}: ${data}`);

    // Broadcast the message and response to the dashboard client only
    dashboardNamespace.emit("message", {
      sender: socket.id,
      message: data,
    });

    const reply = "got message -> " + data;

    // Respond back to the client
    socket.emit("message", reply);

    // Broadcast the message and response to the dashboard client only
    dashboardNamespace.emit("message", {
      sender: "AI System",
      message: reply,
    });
  });

  // Disconnect event
  socket.on("disconnect", () => {
    console.log(`Client disconnected: ${socket.id}`);
    dashboardNamespace.emit("message", {
      sender: socket.id,
      message: "DisconnectedXXXXXX!!!!!!!!!!!!!!!",
    });
  });
});

// Dashboard-client communication
const dashboardNamespace = io.of("/dashboard");
dashboardNamespace.on("connection", (socket) => {
  console.log(`Dashboard connected: ${socket.id}`);

  // Listen for messages from the dashboard
  socket.on("dashboardMessage", (data) => {
    console.log(`Dashboard message from ${socket.id}: ${data}`);
  });

  // Disconnect event
  socket.on("disconnect", () => {
    console.log(`Dashboard disconnected: ${socket.id}`);
  });
});

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
