var randomstring = require('randomstring');
var redis = require('redis');
var Promise = require('bluebird');
Promise.promisifyAll(redis);
var redisHost = process.env.redisHost || '127.0.0.1';
var redisPort = process.env.redisPort || '6379';
var writeToRedis = redis.createClient(redisPort,redisHost);
var readFromRedis = redis.createClient(redisPort,redisHost);

var agent = {

  'newUser': function(io,socket) {
    var room = randomstring.generate({
      length: 6,
      charset: 'alphabetic'
    }); 
    socket.join(room);
    writeToRedis.hmsetAsync('numberOfChats',room,0)
    .then(function() {
      console.log('numberOfChats set 0 for',room);
    }).catch(function(err) {
      console.log('Error setting numberOfChats for',room,err);
    });
    writeToRedis.hmsetAsync(room,'id',socket.id)
    .then(function() {
      console.log('room key written',room,socket.id);
    }).catch(function(err) {
      console.log(err);
    });

  },

  'newMessage': function(io,socket,data) {
    var newData = {
      socketID: data.socketID,
      agentName: socket.agentName,
      message: data.message
    };
    io.to(data.socketID).emit('new_message',newData);
    socket.emit('user_message',newData);
  },

  'typing': function(io,socket,data) {
    var newData = {
      socketID: data.socketID,
      agentName: socket.agentName
    };
    io.to(data.socketID).emit('agent_typing',newData);
  },

  'stopTyping': function(io,socket,data) {
    io.to(data.socketID).emit('stop_typing');
  },

  'removeUser': function(io,socket) {
    var socketID = socket.id;
    readFromRedis.hgetallAsync('socketDetails.'+socket.id)
    .then(function(consumerSocketDetails) {
      if (consumerSocketDetails) {
        var room = consumerSocketDetails.room;
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
  }

};

module.exports = agent;
