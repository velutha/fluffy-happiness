var Agent = require('./agent');
var Customer = require('./customer');

module.exports = function(io) {
  io.on('connection', function(socket) {
    socket.on('new_agent',function() { 
      Agent.newUser();
    });

    socket.on('agent_message', function(data) {
      Agent.newMessage(data);
    });

    socket.on('agent_typing', function(data) {
      Agent.typing(data);
    });

    socket.on('agent_stopped_typing', function(data) {
      Agent.stopTyping(data);
    });

    socket.on('new_customer', function(data) {
      Customer.newUser(data);
    });

    socket.on('customer_message', function(data) {
      Customer.newMessage(data);
    });

    socket.on('customer_typing', function(data) {
      Customer.typing(data);
    });

    socket.on('customer_stopped_typing', function(data) {
      Customer.stopTyping(data);
    });

    socket.on('disconnect', function() {
      console.log('An agent disconnected');
    });
  });
};
