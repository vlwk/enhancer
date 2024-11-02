import { createServer } from "node:http";
import { Server } from "socket.io";

const hostname = "localhost";
const port = 5000;

const httpServer = createServer();

const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log("New client connected");

  socket.on("audioStream", (audioData) => {
    console.log("Received audio data:", audioData);
  });

  socket.on("lol", (data) => {
    console.log(data);
  })

  socket.on("disconnect", () => {
    console.log("Client disconnected");
  });
});

// Handle server shutdown
const shutdown = () => {
  console.log("Shutting down server...");
  io.close(() => {
    console.log("Disconnected all clients.");
    httpServer.close(() => {
      console.log("HTTP server closed.");
      process.exit(0);
    });
  });
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

httpServer.listen(port, hostname, () => {
  console.log(`Backend server running at http://${hostname}:${port}`);
});
