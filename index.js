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

// Define your whitelist of allowed domains or IP addresses
const whitelist = ["localhost", "::1"];

// Dashboard-client communication
const dashboardNamespace = io.of("/dashboard");
const clientNamespace = io.of("/client");

/**
 * This function whitelists the socket connections and ensures that we don't connect with invalid clients
 * @param {*} socket
 * @param {*} next
 * @returns
 */
function whitelistConnection(socket, next) {
  // Access information about the connection
  const clientAddress = socket.handshake.address;
  const clientDomain = socket.handshake.headers.origin;

  // Can monitor the clients that try to connect
  console.log({ clientAddress, clientDomain });

  // Check if the client's domain or IP is in the whitelist
  if (whitelist.includes(clientDomain) || whitelist.includes(clientAddress)) {
    return next(); // Allow the connection
  } else {
    return next(new Error("Connection not allowed")); // Deny the connection
  }
}

/**
 * Applying whitelisting to all the routes
 */
io.use(whitelistConnection); // Ideally here instead of whitelisting, we should directly reject connection request
dashboardNamespace.use(whitelistConnection);
clientNamespace.use(whitelistConnection);

/**
 * Rate limiting - We should rate limit all the connections that are established between the client and the server.
 * Any other security issue that might come up should be addressed and resolved
 */

/**
 * Client socket connection
 */
clientNamespace.on("connection", (socket) => {
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

/**
 * Dashboard socket connection
 */
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
