const mongoose = require('mongoose');
const dotenv = require('dotenv');
const http = require('http');
const { Server } = require('socket.io');
const socketHandler = require('./utils/socketHandler');

// This handles synchronous errors that aren't caught in the code
process.on('uncaughtException', (err) => {
  console.log('UNCAUGHT EXCEPTION! 💥 Shutting down...');
  console.log(err.name, err.message);
  process.exit(1);
});

dotenv.config({ path: './config.env' });
const app = require('./app');

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
  },
});

io.on('connection', (socket) => {
  console.log('New client connected');

  socketHandler(io, socket);

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

const DB = process.env.DATABASE.replace(
  '<db_password>',
  process.env.DATABASE_PASSWORD,
);

// Connect to database
mongoose
  .connect(DB)
  .then(() => console.log('DB now is connected successfully'));

// Running the server
const port = process.env.PORT || 3000;
const oldServer = server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

// This handle rejected promises
process.on('unhandledRejection', (err) => {
  console.log('UNHANDLED REJECTION! 💥 Shutting down...');
  console.log(err.name, err.message);
  oldServer.close(() => {
    process.exit(1);
  });
});
