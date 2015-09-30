$(document).ready(function(){

  // Add notification to list
  function addNotification(notification) {
    console.log(notification);
    var htmlBlock = '<li class="text-center">';
    htmlBlock += notification;
    htmlBlock += '</li>';
    $('#notification-stream').prepend(htmlBlock);
  }

  // Pusher Channels
  var pusher = new Pusher('87a9c3d53c56456e61b7', {
    encrypted: true
  });
  var channel = pusher.subscribe('stream');

  // Notifications
  channel.bind('notification', function(data) {
    var notification = '<h2>' + data.title + '</h2>';
    notification += '<p>' + data.message + '</p>';
    addNotification(notification);
  });

  // Twitter
  var repeatBlock = [];
  channel.bind('twitter', function(data) {
    if (repeatBlock.indexOf(data.id) < 0) {
      addNotification(data.tweet);
      repeatBlock.push(data.id);
      twttr.widgets.load();
    }
  });

});
