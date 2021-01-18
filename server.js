var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);



app.use('/',(req,res)=>{
    res.send('connected');
})
// Reserved Events
let ON_CONNECTION = 'connection';
let ON_DISCONNECT = 'disconnect';

// Main Events
let EVENT_IS_USER_ONLINE = 'check_online';
let EVENT_SINGLE_CHAT_MESSAGE = 'single_chat_message';

// Sub Events
let SUB_EVENT_RECEIVE_MESSAGE = 'receive_message';
let SUB_EVENT_MESSAGE_FROM_SERVER = 'message_from_server';
let SUB_EVENT_IS_USER_CONNECTED = 'is_user_connected';

let listen_port = process.env.PORT||3000;

// Status
let STATUS_MESSAGE_NOT_SENT = 10001;
let STATUS_MESSAGE_SENT = 10002;

// This map has all users connected
const userMap = new Map();

io.sockets.on(ON_CONNECTION, function (socket) {
	onEachUserConnection(socket);
});

// This function is fired when each user connects to socket
function onEachUserConnection(socket) {
	print('---------------------------------------');
	print('Connected => Socket ID ' + socket.id + ', User: ' + JSON.stringify(socket.handshake.query));

	var from_user_id = socket.handshake.query.from;
	// Add to Map
	let userMapVal = { socket_id: socket.id };
	addUserToMap(from_user_id, userMapVal);
	print(userMap);
	printNumOnlineUsers();

	onMessage(socket);
	checkOnline(socket);
	onUserDisconnect(socket);
}

function addUserToMap(key_user_id, val) {
	userMap.set(key_user_id, val);
}

function removeUserWithSocketIdFromMap(socket_id) {
	print('Deleting user with socket id: ' + socket_id);
	let toDeleteUser;
	for (let key of userMap) {
		// index 1, returns the value for each map key
		let userMapValue = key[1];
		if (userMapValue.socket_id == socket_id) {
			toDeleteUser = key[0];
		}
	}
	print('Deleting User: ' + toDeleteUser);
	if (undefined != toDeleteUser) {
		userMap.delete(toDeleteUser);
	}
	print(userMap);
	printNumOnlineUsers();
}

function getSocketIDfromMapForthisUser(to_user_id) {
	let userMapVal = userMap.get(`${to_user_id}`);
	if (userMapVal == undefined) {
		return undefined;
	}
	return userMapVal.socket_id;
}

function sendBackToClient(socket, event, message) {
	socket.emit(event, stringifyJson(message));
}

function sendToConnectedSocket(socket, to_user_socket_id, event, message) {
	socket.to(`${to_user_socket_id}`).emit(event, stringifyJson(message));
}

function userFoundOnMap(to_user_id) {
	let to_user_socket_id = getSocketIDfromMapForthisUser(to_user_id);
	return to_user_socket_id != undefined;
}

// Always stringify to create proper json before sending.
function stringifyJson(data) {
	return JSON.stringify(data);
}

function print(logData) {
	console.log(logData);
}

function printNumOnlineUsers() {
	print('Online Users: ' + userMap.size);
}

server.listen(listen_port,()=>console.log(`Server is running on port ${listen_port} `));