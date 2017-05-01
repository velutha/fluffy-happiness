$(document).ready(function(){
  var userName,tag;
  var socket = io('/customer');
  var $userNameInput = $('.userNameInput');
  var $currentInput = $userNameInput;

  setFocus($userNameInput);


  $(window).keydown(function (event) {
    // Auto-focus the current input when a key is typed
    if (!(event.ctrlKey || event.metaKey || event.altKey)) {
      $currentInput.focus();
    }
    // When the client hits ENTER on their keyboard
    if (event.which === 13) {
      if (userName) {
        var message = cleanInput($('.inputMessageCustomer').val());
        socket.emit('customer_message',{
          socketID: socket.id,
          message: message
        });
        $('.inputMessageCustomer').val('');
      } else {
        setUsername();
        $('.login.page').fadeOut(150);
        $currentInput = $('.inputMessageCustomer');
        setFocus($currentInput);
      }
    } else if ($('.inputMessageCustomer').val() !== ""){
      socket.emit('customer_typing',{
        socketID: socket.id
      });
    } else if (userName && $('.inputMessageCustomer').val() === ""){
      socket.emit('customer_stopped_typing',{
        socketID: socket.id
      });
    }
  });


  function cleanInput(input) {
    return $('<div/>').text(input).text();
  }

  function setFocus(el) {
    el.focus();
  }

  function setUsername() {
    userName = $userNameInput.val();
    tag = window.location.search.replace('?tag=','');
    var data = {
      userName : userName,
      tag: tag
    };
    socket.emit('new_customer', data);
  }

  socket.on('new_message', function(data){
    $('.messages').append('<li>' + data.agentName + ': ' + data.message + '</li');
    $('.typing').html('');
  });

  socket.on('agent_typing', function(data){
    $('.typing').html('<strong>' + data.agentName + '</strong> '+ 'is typing' );
  });

  socket.on('stop_typing', function(data) {
    $('.typing').html('');
  });

  socket.on('user_message', function(data){
    $('.messages').append('<li><strong>' + data.userName+ '</strong>: ' + data.message + '</li');
  });

  socket.on('agents_offline', function(data) {
    $('.chatArea').append("<h2 class = 'text-center'> Sorry, our agent is offline. Try again after sometime</h2>");
  });

  socket.on('agent_offline', function(data) {
    $('.chatArea').append("<h4 class = 'text-center'>"+data.agentName+" went offline</h4");
  });

});
