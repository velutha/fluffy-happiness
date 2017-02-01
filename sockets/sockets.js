var Agent = require('./agent');
var Customer = require('./customer');
var randomstring = require('randomstring');
var redis = require('redis');
var Promise = require('bluebird');
Promise.promisifyAll(redis);
var redisHost = process.env.redisHost || '127.0.0.1';
var redisPort = process.env.redisPort || '6379';
var writeToRedis = redis.createClient(redisPort,redisHost);
var readFromRedis = redis.createClient(redisPort,redisHost);

module.exports = function(io) {
  io.on('connection', function(socket) {
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

    socket.on('disconnect', function() {
      var socketID = socket.id;
      // read socketDetails.socket.id
      //var consumerSocketDetails = socketDetails[socketID];
      readFromRedis.hgetallAsync('socketDetails.'+socket.id)
      .then(function(consumerSocketDetails) {
        if (consumerSocketDetails) {
          var room = consumerSocketDetails.room;
          // read roomDetails.room 
          readFromRedis.hgetallAsync('roomDetails.'+room)
          .then(function(agentSocketDetails) {
            //var agentSocketDetails = roomDetails[room];
            if (agentSocketDetails) {
              var agentSocketID = agentSocketDetails.socketID;
              if (agentSocketID === socketID) {
                // write to roomDetails.room
                //delete roomDetails[room];
                writeToRedis.delAsync('roomDetails.'+room)
                .then(function(res) {
                  io.to(room).emit('agent_offline', {agentName: agentSocketDetails.agentName});
                }).catch(function(err) {
                  console.log('Error deleting roomDetails for',room);
                  return;
                });
                writeToRedis.sremAsync('rooms',room)
                .then(function(res) {
                  console.log('Removed from rooms',room);
                }).catch(function(err) {
                  console.log('Error removing from rooms for',room);
                  return;
                });
                // Also delete from numberOfChats
                //var index = rooms.indexOf(room);
                //if (index > -1) {
                  //rooms.splice(index,1);
                //}
              } else {
                var userData = {
                  socketID: socketID,
                  userName: socket.userName
                };
                // write to numberOfChats
                //numberOfChats[room]--;
                writeToRedis.hincrbyAsync('numberOfChats',room,-1)
                .then(function(res) {
                  console.log('numberOfChats reduced on disconnect');
                  io.to(agentSocketID).emit('customer_offline', userData);
                }).catch(function(err) {
                  console.log('Error reducing numberOfChats for',room);
                  return;
                });
              }
            }
            // write to socketDetails.socket.id
            //delete socketDetails[socket.id];
            writeToRedis.delAsync('socketDetails.'+socket.id)
            .then(function(res) {
              console.log('socketDetails removed for',socket.id);
            }).catch(function(err) {
              console.log('Error deleting socketDetails for',socket.id);
            });

          }).catch(function(err) {
            console.log('Error reading roomDetails in disconnect event for',room,err);
            return;
          });
        }
      }).catch(function(err) {
        console.log('Error reading socketDetails in disconnect event',err);
      });
    });
  });
};
