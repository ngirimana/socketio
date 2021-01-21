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
const SUB_EVENT_RECEIVE_MESSAGE = 'receive_message';
const SUB_EVENT_MESSAGE_FROM_SERVER = 'message_from_server';
const SUB_EVENT_IS_USER_CONNECTED = 'is_user_connected';

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
	checkOnline(socket);
	onDisconnected(socket);
}
const onMessage=(socket)=>{
	socket.on(EVENT_SINGLE_CHAT_MESSAGE,(chat_message)=>{
		singleMessageHandler(socket,chat_message);
	});
}
const checkOnline=(socket)=>{
	socket.on(EVENT_IS_USER_ONLINE,(chat_user_details)=>{
		onlineCheckHandler(socket,chat_user_details);
	});
}
const onlineCheckHandler=(socket,chat_user_details)=>{
	let to_user_id=chat_user_details.to;
	print(`Checking online User => ${to_user_id}` );
	let to_user_socket_id=getSocketIDFromMapForThisUser(to_user_id);
	let isOnline=undefined!=to_user_socket_id;
	chat_user_details.to_user_online_status=isOnline;
	sendBackToclient(socket,SUB_EVENT_IS_USER_CONNECTED,chat_user_details);
}
const singleMessageHandler=(socket,chat_message)=>{
	print(`OnMessage: ${JSON.stringify(chat_message)}`);
	let to_user_id=chat_message.to;
	let from_user_id=chat_message.from;
	print(`${from_user_id} => ${to_user_id}`);
	let to_user_socket_id=getSocketIDFromMapForThisUser(to_user_id);
	print(to_user_socket_id);
	if(to_user_socket_id==undefined){
		print('Chat user not connected');
		chat_message.to_user_online_status=false;
		return;
	}
	chat_message.to_user_online_status=true;
	sendToConnectedSocket(socket,to_user_socket_id,SUB_EVENT_RECEIVE_MESSAGE,chat_message);
}
 const sendBackToclient=(socket,event,chat_message)=>{
	socket.emit(event,JSON.stringify(chat_message))

 }
const sendToConnectedSocket=(socket,to_user_socket_id,event,chat_message)=>{
	socket.to(`${to_user_socket_id}`).emit(event,JSON.stringify(chat_message));
}
const getSocketIDFromMapForThisUser=(to_user_id)=>{
	let userMapVal=userMap.get(`${to_user_id}`);
	if(undefined==userMapVal){
		return undefined;
	}
	return userMapVal.socket_id;
}
const removeUserWithSocketIdFromMap=(socket_id)=>{
	print(`Deleting user from map :${socket_id}`);
	let toDeleteUser;
	for(let key of userMap){
		let userMapValue=key[1];
		if(userMapValue.socket_id==socket_id){
			toDeleteUser=key[0];
		}
	}
	print(`Deleting user : ${toDeleteUser}`);
	if(undefined!=toDeleteUser){
		userMap.delete(toDeleteUser);
	}
	print(userMap);
	printOnlineUsers();
}
const onDisconnected =(socket)=>{
  socket.on(ON_DISCONNECT,function(){
	   print(`Disconnected ${socket.id}`);
	   removeUserWithSocketIdFromMap(socket.id);
	   socket.removeAllListeners( SUB_EVENT_RECEIVE_MESSAGE); 
	   socket.removeAllListeners(SUB_EVENT_IS_USER_CONNECTED); 
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


