// app.js
var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);

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

// This is for Private Chat/Single Chat
function onMessage(socket) {
	socket.on(EVENT_SINGLE_CHAT_MESSAGE, function (chat_message) {
		singleChatHandler(socket, chat_message);
	});
}

// CHECK if a user is online
function checkOnline(socket) {
	socket.on(EVENT_IS_USER_ONLINE, function (chat_user_data) {
		checkOnlineHandler(socket, chat_user_data);
	});
}

function onUserDisconnect(socket) {
	onDisconnect(socket);
}

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

function singleChatHandler(socket, chat_message) {
	//
	print('Message: ' + stringifyJson(chat_message));
	// Get the 'to' User...
	let to_user_id = chat_message.to;
	let from_user_id = chat_message.from;
	print(from_user_id + '=>' + to_user_id);

	let to_user_socket_id = getSocketIDfromMapForthisUser(to_user_id);
	let userOnline = userFoundOnMap(to_user_id);

	print('to_user_socket_id: ' + to_user_socket_id + ', userOnline: ' + userOnline);

	if (!userOnline) {
		print('To Chat User not connected.');
		chat_message.message_sent_status = STATUS_MESSAGE_NOT_SENT;
		chat_message.to_user_online_status = false;
		sendBackToClient(socket, SUB_EVENT_MESSAGE_FROM_SERVER, chat_message);
		return;
	}

	// User Connected and his Socket ID Found on the UserMap
	chat_message.message_sent_status = STATUS_MESSAGE_SENT;
	chat_message.to_user_online_status = true;
	sendToConnectedSocket(socket, to_user_socket_id, SUB_EVENT_RECEIVE_MESSAGE, chat_message);

	// Sending Status back to Client
	// Update the Chat ID and send back
	chat_message.message_sent_status = STATUS_MESSAGE_SENT;
	chat_message.to_user_online_status = false;
	sendBackToClient(socket, SUB_EVENT_MESSAGE_FROM_SERVER, chat_message);

	print('Message Sent!!');
}

function checkOnlineHandler(socket, chat_user_data) {
	let to_user_id = chat_user_data.to;
	print('Checking Online User: ' + to_user_id);

	let to_user_socket_id = getSocketIDfromMapForthisUser(`${to_user_id}`);
	let user_online = userFoundOnMap(to_user_id);

	print('To User Socket ID: ' + to_user_socket_id);

	chat_user_data.message_sent_status = user_online ? STATUS_MESSAGE_SENT : STATUS_MESSAGE_NOT_SENT;
	chat_user_data.to_user_online_status = user_online ? true : false;
	sendBackToClient(socket, SUB_EVENT_IS_USER_CONNECTED, chat_user_data);
}

function onDisconnect(socket) {
	socket.on(ON_DISCONNECT, function () {
		print('Disconnected ' + socket.id);
		removeUserWithSocketIdFromMap(socket.id);
		socket.removeAllListeners('message');
		socket.removeAllListeners('disconnect');
	});
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

server.listen(listen_port,()=>console.log(`Server is running on port ${listen_port}`));