//
// # SimpleServer
//
// A simple chat server using Socket.IO, Express, and Async.
//
var http = require('http');
var path = require('path');

var async = require('async');
var socketio = require('socket.io');
var express = require('express');

//set up discovery instance
var DiscoveryV1 = require('watson-developer-cloud/discovery/v1');
//define a discovery object with our credentials
var discovery = new DiscoveryV1({
  username: '5d158f99-62ee-448a-b172-b3c66c5dfce8',
  password: 'imBJJCr07OYZ',
  version_date: '2017-11-07'
});


//
// ## SimpleServer `SimpleServer(obj)`
//
// Creates a new instance of SimpleServer with the following options:
//  * `port` - The HTTP port to listen on. If `process.env.PORT` is set, _it overrides this value_.
//
var router = express();
var server = http.createServer(router);
var io = socketio.listen(server);

router.use(express.static(path.resolve(__dirname, 'client')));
var messages = [];
var sockets = [];

io.on('connection', function (socket) {
    messages.forEach(function (data) {
      socket.emit('message', data);
    });

    sockets.push(socket);

    socket.on('disconnect', function () {
      sockets.splice(sockets.indexOf(socket), 1);
      updateRoster();
    });

    socket.on('message', function (msg) {
      var text = String(msg || '');

      if (!text)
        return;

      socket.get('name', function (err, name) {
        var data = {
          name: name,
          text: text
        };

        broadcast('message', data);
        messages.push(data);
        console.log(data.text);
        
         //pull file name, body if a file was returned
        function isThere(data){
        try {
          if(data['matching_results'] == 0)
          {
            return;
          }
        var docName = data.results[0].extracted_metadata.filename;
        var docBody = data.results[0].html;
          return docName, docBody;
          
        } catch(e) {
        console.log("error; undefined");
                    }
                              }
        
        socket.emit('buildField');
        
      discovery.query(
      //here's the query itself
      { 
        environment_id: 'be9e9b77-6d60-4c3d-a849-fa6b44343b72', 
        collection_id: '3a0fb7ea-a29b-44b0-8038-c3b235ac15df', 
        natural_language_query: data.text, count: 1
      }, 
      function(error, data) {
        if(error) return;
        //function with generic error handling to do things with the data - currently sends the full json to the console and an okay to the webpage
      var clubDoc = JSON.stringify(data, null, 2);
      console.log(clubDoc);
      var suggestion = isThere(data);
      //send suggestion name, anything else we want to build with
      socket.emit('sendClubs', {suggestion});
      });
      
      discovery.query(
        //here's the query itself
      { environment_id: 'be9e9b77-6d60-4c3d-a849-fa6b44343b72', collection_id: '05267db0-53c9-461a-948b-46ae4449add2', natural_language_query: data.text, count: 1}, 
      function(error, data) {
        if(error) return;
        //function with generic error handling to do things with the data - currently sends the full json to the console and an okay to the webpage
      var constitutionDoc = JSON.stringify(data, null, 2);
      console.log(constitutionDoc);
      //pull file name if a file was returned - covers edge test cases
      var suggestion = isThere(data);
        console.log(suggestion);
        //send suggestion name, anything else we want to build with
      socket.emit('sendClubs', {suggestion});
      });
      
      
      
      
      });
    });

    socket.on('identify', function (name) {
      socket.set('name', String(name || 'Anonymous'), function (err) {
        updateRoster();
      });
    });
  });

function updateRoster() {
  async.map(
    sockets,
    function (socket, callback) {
      socket.get('name', callback);
    },
    function (err, names) {
      broadcast('roster', names);
    }
  );
}

function broadcast(event, data) {
  sockets.forEach(function (socket) {
    socket.emit(event, data);
  });
}

server.listen(process.env.PORT || 3000, process.env.IP || "0.0.0.0", function(){
  var addr = server.address();
  console.log("Chat server listening at", addr.address + ":" + addr.port);
});

