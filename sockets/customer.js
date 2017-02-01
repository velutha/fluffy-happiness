var randomstring = require('randomstring');
var redis = require('redis');
var Promise = require('bluebird');
Promise.promisifyAll(redis);
var redisHost = process.env.redisHost || '127.0.0.1';
var redisPort = process.env.redisPort || '6379';
var writeToRedis = redis.createClient(redisPort,redisHost);
var readFromRedis = redis.createClient(redisPort,redisHost);

var customer = {

  'newUser': function(io,socket,customerData) {
    //console.log('Socket id is',socket.id);
    var room,userName;
    // read rooms key
    readFromRedis.smembersAsync('rooms')
    .then(function(rooms) {
      if (rooms.length === 0) {
        var data = {};
        socket.emit('agents_offline', data);
      } else {
        // read numberOfChats key
        readFromRedis.hgetallAsync('numberOfChats')
        .then(function(numberOfChats){
          var minConnections = numberOfChats[rooms[0]];
          for (var i=0; i<rooms.length; i++) {
            var numberOfConnections = numberOfChats[rooms[i]];
            if (numberOfConnections === 0) {
              room = rooms[i];
              break;
            } else if (numberOfConnections <= minConnections) {
              minConnections = numberOfConnections;
              room = rooms[i];
            }
          }
          socket.join(room);
          // write to numberOfChats
          //numberOfChats[room]++;
          writeToRedis.hincrbyAsync('numberOfChats',room,1)
          .then(function(res) {
            console.log('numberOfChats increased for',room);
          }).catch(function(err) {
            console.log('Error increasing numberOfChats',room,err);
            return;
          });
          userName = customerData.userName;
          socket.userName = userName;
          socket.tag = customerData.tag;
          // read rooms socketID and add it to this socketDetails
          // it is an extra db operation here but reduces an operation in consumer_message event
          // write to socketDetails.socket.id
          readFromRedis.hgetallAsync('roomDetails.'+room)
          .then(function(roomDetails) {
            var userData = {
              socketID: socket.id,
              userName: socket.userName,
              tag: socket.tag
            };

            io.to(roomDetails.socketID).emit('new_user',userData);

            var socketDetails = ['socketDetails.'+socket.id,'room',room,'userName',userName,'agentSocketID',roomDetails.socketID];
            //socketDetails[socket.id] = {
              //room: room,
              //userName: userName,
              //agentSocketID: roomDetails.socketID
            //};
            writeToRedis.hmsetAsync(socketDetails)
            .then(function(res) {
              var agentSocketID = roomDetails.socketID;
              var greetingMessage = socket.userName + ', hi there!';
              socket.emit('new_message', {agentName: roomDetails.agentName, message: greetingMessage});
              io.to(agentSocketID).emit('user_message',{socketID: socket.id, agentName: roomDetails.agentName, message: greetingMessage});
              
            }).catch(function(err) {
              console.log('Error writing socketDetails in customer event',socketDetails,err);
            });

              
          }).catch(function(err) {
            console.log('Error getting roomDetails in customer event',room,err);
            return;
          });

        }).catch(function(err) {
          console.log('Error reading numberOfChats in customer event',err);
          return;
        });
      }

    }).catch(function(err) {
      console.log('Error reading rooms in consumer event',err);
      return;
    });

  },

  'newMessage': function(io,socket,data) {
    readFromRedis.hgetallAsync('socketDetails.'+data.socketID)
    .then(function(socketDetails) {
      var room = socketDetails.room;
      var agentSocketID = socketDetails.agentSocketID;
      var newData = {
        socketID: socket.id,
        userName: socket.userName,
        message: data.message
      };
      io.to(agentSocketID).emit('new_message', newData);
      socket.emit('user_message',newData);
    }).catch(function(err) {
      console.log('Error fetching socketDetails in consumer_message',socketDetails,err);
      return;
    });

  },

  'typing': function(io,socket,data) {
    readFromRedis.hgetallAsync('socketDetails.'+data.socketID)
    .then(function(socketDetails) {
      var room = socketDetails.room;
      var agentSocketID = socketDetails.agentSocketID;
      var newData = {
        socketID: socket.id,
        userName: socket.userName,
      };
      io.to(agentSocketID).emit('user_typing', newData);
    }).catch(function(err) {
      console.log('Error fetching socketDetails in consumer_typing',socketDetails,err);
      return;
    });

  },

  'stopTyping': function(io,socket,data) {
    readFromRedis.hgetallAsync('socketDetails.'+data.socketID)
    .then(function(socketDetails) {
      var room = socketDetails.room;
      var agentSocketID = socketDetails.agentSocketID;
      var newData = {
        socketID: socket.id,
      };
      io.to(agentSocketID).emit('stop_typing', newData);
    }).catch(function(err) {
      console.log('Error fetching socketDetails in consumer_stopped_typing',data.socketID,err);
      return;
    });
  },

  //'disconnect': function(data) {

  //}

};

module.exports = customer;
