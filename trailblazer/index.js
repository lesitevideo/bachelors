const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const port = process.env.PORT || 3000;

var maxPlayers = 2;
var affichageId;
var usersIds = [];

app.use(express.static(__dirname + '/public'));

io.on('connection', function (socket) {
	
	socket.on('affichage', function (msg) {
		console.log( 'affichage ' + msg );
		affichageId = socket.id;
	});
  
	socket.on('newplayer', function() {
        if( usersIds.length < maxPlayers ){
		   
			console.log(socket.id + ' joined the game.');
			socket.emit('send_id', socket.id);
			usersIds.push(socket.id);
			
		}
		
		if( usersIds.length === maxPlayers ) {
			if( affichageId ){
			   io.sockets.sockets[affichageId].emit( 'startGame' );
			}
		}
	});
	
	socket.on('left', function(playerId) {
		if( playerId ){
			console.log(playerId + ' pressed left');

			if( affichageId ){
			   io.sockets.sockets[affichageId].emit( 'left', usersIds.indexOf(playerId) );
			}
		}
	});
	
	socket.on('right', function(playerId) {
		if( playerId ){
			console.log(playerId + ' pressed right');

			if( affichageId ){
			   io.sockets.sockets[affichageId].emit( 'right', usersIds.indexOf(playerId) );
			}
		}
	});
	
	socket.on('up', function(playerId) {
		if( playerId ){
			console.log(playerId + ' pressed up');

			if( affichageId ){
			   io.sockets.sockets[affichageId].emit( 'up', usersIds.indexOf(playerId) );
			}
		}
	});
	
	socket.on('disconnect', function () {
		console.log( socket.id + ' has disconnected');
		
		for( var i = 0; i < usersIds.length; i++){ 
		   if ( usersIds[i] === socket.id) {
			 usersIds.splice(i, 1);
			   
		   }
		}
		
		if( affichageId && affichageId != socket.id ){
			io.sockets.sockets[affichageId].emit( 'playerdisconnect', socket.id );
		}
		
	});
});

http.listen(port, () => console.log('listening on port ' + port));