var Agent = require('./agent');
var Customer = require('./customer');

module.exports = function(io) {

  io.of('/agent').on('connection', function(socket) {

    socket.on('new_agent',function() { 
      Agent.newUser(io,socket);
    });

    socket.on('agent_message', function(data) {
      Agent.newMessage(io,socket,data);
    });

    socket.on('agent_typing', function(data) {
      Agent.typing(io,socket,data);
    });

    socket.on('agent_stopped_typing', function(data) {
      Agent.stopTyping(io,socket,data);
    });

    socket.on('disconnect', function(data) {
      Agent.removeUser(io,socket,data);
    });

  });

  io.of('/customer').on('connection', function(socket) {

    socket.on('new_customer', function(data) {
      Customer.newUser(io,socket,data);
    });

    socket.on('customer_message', function(data) {
      Customer.newMessage(io,socket,data);
    });

    socket.on('customer_typing', function(data) {
      Customer.typing(io,socket,data);
    });

    socket.on('customer_stopped_typing', function(data) {
      Customer.stopTyping(io,socket,data);
    });

    socket.on('disconnect', function(data) {
      Customer.removeUser(io,socket,data);
    });

  });
};
