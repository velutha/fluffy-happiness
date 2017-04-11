var Agent = require('./agent');
var Customer = require('./customer');
//var randomstring = require('randomstring');
//var redis = require('redis');
//var Promise = require('bluebird');
//Promise.promisifyAll(redis);
//var redisHost = process.env.redisHost || '127.0.0.1';
//var redisPort = process.env.redisPort || '6379';
//var writeToRedis = redis.createClient(redisPort,redisHost);
//var readFromRedis = redis.createClient(redisPort,redisHost);

module.exports = function(io) {

  io.of('/agent').on('connection', function(socket) {

    socket.on('new_agent', function() {
      Agent.newUser(io,socket);
    });

    socket.on('new_message', function(data) {
      Agent.newMessage(io,socket,data);
    });

    socket.on('typing', function() {
      Agent.typing(io,socket,data);
    });

    socket.on('stop_typing', function() {
      Agent.stopTyping(io,socket,data);
    });

    socket.on('disconnect', function() {
      Agent.removeUser(io,socket);
    });

  });

  io.of('/customer').on('connection', function(socket) {

    socket.on('new_customer', function() {
      Customer.newUser(io,socket);
    });

    socket.on('new_message', function(data) {
      Customer.newMessage(io,socket,data);
    });

    socket.on('typing', function() {
      Customer.typing(io,socket,data);
    });

    socket.on('stop_typing', function() {
      Customer.stopTyping(io,socket,data);
    });

    socket.on('disconnect', function() {
      Customer.removeUser(io,socket);
    });
  });
};
