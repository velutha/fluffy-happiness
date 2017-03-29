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
    var room,userName,rooms;

    getRooms()
    .then(getNumberOfChats)
    .then(getRoomDetails)
    .then(sendNewUserEvent)
    .catch(errorHandler);

    function getRooms() {
      return readFromRedis.smembersAsync('rooms');
    } 

    function getNumberOfChats(res) {
      if (res.length === 0) {
        var data = {};
        socket.emit('agents_offline', data);
        return;
      }
      rooms = res;
      return readFromRedis.hgetallAsync('numberOfChats');
    }

    function getRoomDetails(numberOfChats) {
      /* update numberOfChats here */
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
      userName = customerData.userName;
      socket.userName = userName;
      socket.tag = customerData.tag;
      writeToRedis.hincrbyAsync('numberOfChats',room,1)
      .catch(function(err) {
        console.log('Error increasing numberOfChats',room,err);
        return;
      });
      return readFromRedis.hgetallAsync('roomDetails.'+room);
    }

    function sendNewUserEvent(roomDetails) {

      var userData = {
        socketID: socket.id,
        userName: socket.userName,
        tag: socket.tag
      };

      io.to(roomDetails.socketID).emit('new_user',userData);

      var socketDetails = [
        'socketDetails.'+socket.id,
        'room',room,'userName',userName,
        'agentSocketID',roomDetails.socketID
      ];
      writeToRedis.hmsetAsync(socketDetails)
      .then(function(res) {
        var agentSocketID = roomDetails.socketID;
        var greetingMessage = socket.userName + ', hi there!';
        socket.emit('new_message', {
          agentName: roomDetails.agentName,
          message: greetingMessage
        });
        io.to(agentSocketID).emit('user_message',{
          socketID: socket.id,
          agentName: roomDetails.agentName,
          message: greetingMessage
        });
        
      }).catch(function(err) {
        console.log('Error writing socketDetails in customer event',socketDetails,err);
      });
    }

    function errorHandler(err) {
      console.log(err);
      return;
    }


  },

  'newMessage': function(io,socket,data) {

    getSocketDetails(data)
    .then(sendMessage)
    .catch(socketDetailsError);

    function getSocketDetails(data) {
      return readFromRedis.hgetallAsync('socketDetails.'+data.socketID);
    }
    function sendMessage(socketDetails) {
      var room = socketDetails.room;
      var agentSocketID = socketDetails.agentSocketID;
      var newData = {
        socketID: socket.id,
        userName: socket.userName,
        message: data.message
      };
      io.to(agentSocketID).emit('new_message', newData);
      socket.emit('user_message',newData);
    }

    function socketDetailsError(err) {
      console.log('Error fetching socketDetails in consumer_message',socketDetails,err);
      return;
    }

  },

  'typing': function(io,socket,data) {

    getSocketDetails(data)
    .then(sendTyping)
    .catch(socketDetailsError);

    function getSocketDetails(data) {
      return readFromRedis.hgetallAsync('socketDetails.'+data.socketID);
    }

    function sendTyping(socketDetails) {
      var room = socketDetails.room;
      var agentSocketID = socketDetails.agentSocketID;
      var newData = {
        socketID: socket.id,
        userName: socket.userName,
      };
      io.to(agentSocketID).emit('user_typing', newData);
    }

    function socketDetailsError(err) {
      console.log('Error fetching socketDetails in consumer_typing',socketDetails,err);
      return;
    }

  },

  'stopTyping': function(io,socket,data) {

    getSocketDetails(data)
    .then(sendStopTyping)
    .catch(socketDetailsError);

    function getSocketDetails(data) {
      return readFromRedis.hgetallAsync('socketDetails.'+data.socketID); 
    }

    function sendStopTyping(socketDetails) {
      var room = socketDetails.room;
      var agentSocketID = socketDetails.agentSocketID;
      var newData = {
        socketID: socket.id,
      };
      io.to(agentSocketID).emit('stop_typing', newData);
    }

    function socketDetailsError(err) {
      console.log('Error fetching socketDetails in consumer_stopped_typing',data.socketID,err);
      return;
    }

  }

};

module.exports = customer;
