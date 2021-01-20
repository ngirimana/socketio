// app.js
var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
// Reserved Events
const ON_CONNECTION = 'connection';
const ON_DISCONNECT = 'disconnect';
// Main Events
let EVENT_IS_USER_ONLINE = 'check_online';
let EVENT_SINGLE_CHAT_MESSAGE = 'single_chat_message';
// Sub Events
let EVENT_RECEIVE_MESSAGE = 'receive_message';
let SUB_EVENT_MESSAGE_FROM_SERVER = 'message_from_server';
let SUB_EVENT_IS_USER_CONNECTED = 'is_user_connected';

// status
const  STATUS_MESSAGE_NOT_SENT = 1001;
const STATUS_MESSAGE_SENT = 1002;

const listen_port= process.env.PORT||3000;
app.use('/',(req,res)=>{
	res.send('Server is running');
})

server.listen(listen_port,()=>{console.log(`Server is running on ${listen_port}`)});

const userMap=new Map();
io.sockets.on(ON_CONNECTION, function (socket) {
	onEachUserConnection(socket);
   });
   function onEachUserConnection(socket) {
	print('---------------------------------------');
	print(`Connected => Socket ID ${socket.id} , User:${JSON.stringify(socket.handshake.query)}`);
	const from_user_id=socket.handshake.query.from;
	let userMapVal={socket_id:socket.id};
	addUserToMap(from_user_id,userMapVal);
	print(userMap);
	printOnlineUsers();

	onMessage(socket);

	onDisconnected(socket);
}
const onMessage=(socket)=>{
	socket.on(EVENT_SINGLE_CHAT_MESSAGE,(chat_message)=>{
		singleMessageHandler(socket,chat_message);
	});
}
const singleMessageHandler=(socket,chat_message)=>{
	print(`OnMessage: ${JSON.stringify(chat_message)}`);
}

const onDisconnected =(socket)=>{
  socket.on(ON_DISCONNECT,function(){
	   print(`Disconnected ${socket.id}`);
	   socket.removeAllListeners(ON_DISCONNECT);
  });
}

const addUserToMap=(key_user_id,socket_id)=>{
	userMap.set(key_user_id,socket_id)
}
const printOnlineUsers=()=>{
	print(`Online users: ${userMap.size}`);
}

const print=(txt)=>{
	console.log(txt);
}


