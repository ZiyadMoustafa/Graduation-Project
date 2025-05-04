const Message = require('../models/messageModel');

module.exports = (io, socket) => {
  // Listen to message
  socket.on('sendMessage', async (data) => {
    const { bookingId, senderId, receiverId, senderType, text } = data;

    const newMessage = new Message({
      bookingId,
      senderId,
      receiverId,
      senderType,
      text,
    });

    await newMessage.save();

    // Send to the sender only
    socket.emit('receiveMessage', newMessage);

    // Send to the other user
    socket.broadcast.to(bookingId).emit('receiveMessage', newMessage);
  });

  // Join chat room
  socket.on('joinRoom', (bookingId) => {
    socket.join(bookingId);
  });
};
