'use strict';

// Load dev environment if not on Bluemix
if (!process.env.VCAP_SERVICES) {
  require('dotenv').load();
}

// Required Libraries
var Path = require('path');
var Hapi = require('hapi');
var Inert = require('inert');

// Instantiate the server
var server = new Hapi.Server({
  debug: {
    request: ['error','good'],
  },
  connections: {
    routes: {
      files: {
        relativeTo: Path.join(__dirname, 'public'),
      },
    },
  },
});

// Set Hapi Connections
server.connection({
  host: process.env.VCAP_APP_HOST || 'localhost',
  port: process.env.VCAP_APP_PORT || 3000,
});

// Hapi Log
server.log(['error', 'database', 'read']);

// Register Hapi Plugins
server.register(Inert, function() {});

// Static site
server.route({
  method: 'GET',
  path: '/{param*}',
  handler: {
    directory: {
      path: '.',
      redirectToSlash: true,
      index: true,
    },
  },
});

// Start Hapi
server.start(function(err) {
  if (err) {
    throw err;
  }

  console.log('Server running at:', server.info.uri);
});

// Scan Twitter
function getTweets(search, id) {

  console.log(Date.now() + " -- " + id);

  var params = {
    q: search,
    include_entities: false
  };

  if (typeof id !== 'undefined') {
    params.since_id = id;
  }

  twitterClient.get('search/tweets', params, function(error, tweets, response){
    if (!error) {
      tweets.statuses.forEach(function(index){
        if (((typeof id == 'undefined')? 0 : id) != index.id) {

          twitterClient.get('statuses/oembed', {id: index.id_str}, function(embederror, embed, response){
            if (!embederror) {
              // console.log(embed);

              pusher.trigger('stream', 'twitter', {
                id: index.id_str,
                tweet: embed.html,
              });
            } else {
              console.warn(embederror);
            }
          });

        }
      });

      setTimeout(function () {
        if (tweets.statuses.length > 0) {
          var since_id = (typeof id == 'undefined')? 0 : id;
          for(var i = 0; i < tweets.statuses.length; i++) {
            if (tweets.statuses[i].id > since_id) {
              var since_id = tweets.statuses[i].id;
              console.log(tweets.statuses[i].id);
            }
          }
          // var since_id = tweets.statuses[tweets.statuses.length - 1].id_str;
          getTweets(search, since_id);
        } else {
          getTweets(search, id);
        }

      }, 5000);
    } else {
      getTweets(search, id);
    }
  });

}
if (process.env.TWITTER && process.env.PUSHER) {
  var TWITTER = JSON.parse(process.env.TWITTER);
  var PUSHER = JSON.parse(process.env.PUSHER);

  var Twitter = require('twitter');
  var Pusher = require('pusher');

  var twitterClient = new Twitter({
    consumer_key: TWITTER.cKey,
    consumer_secret: TWITTER.cSecret,
    access_token_key: TWITTER.aToken,
    access_token_secret: TWITTER.aSecret,
  });

  var pusher = new Pusher({
    appId: PUSHER.appId,
    key: PUSHER.key,
    secret: PUSHER.secret,
    encrypted: PUSHER.encrypted
  });
  pusher.port = PUSHER.port;

  getTweets('#hackference');

}
