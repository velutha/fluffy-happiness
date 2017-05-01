$(document).ready(function(){
  var socket = io('/agent');
  var $currentInput = $('.inputMessage');

  socket.on('connect',function() {
    socket.emit('new_agent');
  });

  $(document).on('click','.inputMessage',function(){
    $currentInput = $(this);
  });

  $(window).keydown(function (event) {
    // Auto-focus the current input when a key is typed
    if (!(event.ctrlKey || event.metaKey || event.altKey)) {
      $currentInput.focus();
    }
    // When the client hits ENTER on their keyboard
    var socketID;
    if ($currentInput.val() !== "" && $currentInput.length !== 0) {
      socketID = $currentInput.parents('.chat-section').attr('data-socketID');
      if (event.which === 13) {
        var message = cleanInput($currentInput.val());
        socket.emit('agent_message',{
          socketID: socketID, 
          message: message
        });
        $currentInput.val('');
      } else {
        socket.emit('agent_typing', {
          socketID: socketID
        });
      }
    } else if ($currentInput.val() === "") {
      socketID = $currentInput.parents('.chat-section').attr('data-socketID');
      socket.emit('agent_stopped_typing', {
        socketID: socketID
      });
    }
  });

  function cleanInput(input) {
    return $('<div/>').text(input).text();
  }
  socket.on('new_user', function(data) {
    $('.agent-greeting').addClass('hide');
    var chatElement = "<div class = 'col-xs-3 chat-section' "+"data-socketID="+data.socketID+"><ul class = 'messages'>"+"<li><strong>fpTag: "+data.tag+"</strong><li><strong>username: "+data.userName+"</strong></li>"+"</ul><div class ='typing agent'></div><input type = 'text' class = 'inputMessage m-l-md' placeholder = 'Type your message...'/></div>";
    $('.chat-row').append(chatElement);
  });

  socket.on('new_message', function(data){
    $("[data-socketID='"+data.socketID+"']").find('.messages').append('<li><strong>' + data.userName + ':</strong> ' + data.message+ '</li>');
    $("[data-socketID='"+data.socketID+"']").find('.typing.agent').html('');
  });
  
  socket.on('user_typing', function(data) {
    $("[data-socketID='"+data.socketID+"']").find('.typing.agent').html('<strong>' + data.userName + '</strong> is typing' );
  });

  socket.on('stop_typing', function(data) {
    $("[data-socketID='"+data.socketID+"']").find('.typing.agent').html('');
  });

  socket.on('user_message', function(data){
    $(".chat-section[data-socketID='"+data.socketID+"']").find('.messages').append('<li>' + data.agentName + ': ' + data.message + '</li');
  });

  socket.on('customer_offline', function(data) {
    $(".chat-section[data-socketID='"+data.socketID+"']").append("<h4 class = 'text-center'>"+data.userName+" went offline</h4");
    $(".chat-section[data-socketID='"+data.socketID+"']").find('input').attr('disabled','disabled');
  });
});
