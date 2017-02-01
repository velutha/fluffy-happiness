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
    //console.log('Socket id is',socket.id);
    var room = randomstring.generate({
      length: 6,
      charset: 'alphabetic'
    }); 
    // write to rooms
    //rooms.push(room);
    writeToRedis.saddAsync('rooms',room)
    .then(function(res){
      console.log('Room added',room);
      readFromRedis.smembersAsync('rooms')
      .then(function(rooms){
        console.log('Rooms',rooms);
        var agentName = 'agent' + (rooms.length);
        socket.agentName= agentName;
        // write to roomDetails.room key
        var roomDetails = ['roomDetails.'+room, 'socketID', socket.id, 'agentName', agentName];
        writeToRedis.hmsetAsync(roomDetails)
        .then(function(){
          console.log('RoomDetails set',roomDetails);
        }).catch(function(err){
          console.log('Error setting roomDetails',err);
          return;
        });
        //roomDetails[room] = {'socketID': socket.id, 'agentName': agentName};
        // write to numberOfChats
        writeToRedis.hmsetAsync('numberOfChats',room,0)
        .then(function(res) {
          console.log('numberOfChats set 0 for',room);
        }).catch(function(err){
          console.log('Error setting numberOfChats for',room,err);
          return;
        });
        //numberOfChats[room] = 0;
        socket.join(room);
        // write to socketDetails.socket.id
        //socketDetails[socket.id] = {
          //room: room,
          //userName: agentName 
        //};
        var socketDetails = ['socketDetails.'+socket.id, 'room', room, 'userName', agentName];
        writeToRedis.hmsetAsync(socketDetails)
        .then(function(res) {
          console.log('socketDetails updated', socketDetails); 
        }).catch(function(err) {
          console.log('Error setting socketDetails',socketDetails,err);
          return;
        });
      }).catch(function(err){
        console.log('Error writing to rooms',err);
        return;
      });

    }).catch(function(err){
        console.log('Error writing to rooms',err);
        return;
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

  //'disconnect': function(data) {

  //}

};

module.exports = agent;
