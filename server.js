// app.js
var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
/**
 * Reserved Events
 */

const ON_CONNECTION = 'connection';
const ON_DISCONNECT = 'disconnect';
/**
 * Main Events
 */

const EVENT_IS_USER_ONLINE = 'check_online';
const EVENT_SINGLE_CHAT_MESSAGE = 'single_chat_message';

/**
 * Sub Events
 */

const SUB_EVENT_RECEIVE_MESSAGE = 'receive_message';
const SUB_EVENT_IS_USER_CONNECTED = 'is_user_connected';


const listen_port= process.env.PORT||3000;

app.use('/',(req,res)=>{
	res.send('Server is running');
})

server.listen(listen_port,()=>{console.log(`Server is running on ${listen_port}`)});
/**
 * declaring userMap
 */
const userMap=new Map();
/**
 * connection to socket @param {*} socket
 */
io.sockets.on(ON_CONNECTION, function (socket) {
	onEachUserConnection(socket);
   });
   const onEachUserConnection=(socket)=> {
	const from_user_id=socket.handshake.query.from;
	let userMapVal={socket_id:socket.id};
	addUserToMap(from_user_id,userMapVal);
	onMessage(socket);
	checkOnline(socket);
	onDisconnected(socket);
}
/**
 * sending message on socket
 * @param {*} socket 
 */
const onMessage=(socket)=>{
	socket.on(EVENT_SINGLE_CHAT_MESSAGE,(chat_message)=>{
		singleMessageHandler(socket,chat_message);
	});
}
/**
 * check if user is online
 * @param {*} socket 
 */
const checkOnline=(socket)=>{
	socket.on(EVENT_IS_USER_ONLINE,(chat_user_details)=>{
		onlineCheckHandler(socket,chat_user_details);
	});
}
/**
 * determining if user is online
 * @param {*} socket 
 * @param {Object} chat_user_details 
 */
const onlineCheckHandler=(socket,chat_user_details)=>{
	let to_user_id=chat_user_details.to;
	let to_user_socket_id=getSocketIDFromMapForThisUser(to_user_id);
	let isOnline=undefined!=to_user_socket_id;
	chat_user_details.to_user_online_status=isOnline;
	sendBackToclient(socket,SUB_EVENT_IS_USER_CONNECTED,chat_user_details);
}
/**
 * 
 * @param {*} socket 
 * @param {Object} chat_message 
 */
const singleMessageHandler=(socket,chat_message)=>{
	let to_user_id=chat_message.to;
	let from_user_id=chat_message.from;
	let to_user_socket_id=getSocketIDFromMapForThisUser(to_user_id);
	if(to_user_socket_id==undefined){
		chat_message.to_user_online_status=false;
		return;
	}
	chat_message.to_user_online_status=true;
	sendToConnectedSocket(socket,to_user_socket_id,SUB_EVENT_RECEIVE_MESSAGE,chat_message);
}

/**
 * get message from socket
 * @param {*} socket 
 * @param {String} event 
 * @param {Object} chat_message 
 */

 const sendBackToclient=(socket,event,chat_message)=>{
	socket.emit(event,JSON.stringify(chat_message))

 }

 /**
  * send message to user connected on socket
  * @param {*} socket 
  * @param {String} to_user_socket_id 
  * @param {String} event 
  * @param {Object} chat_message 
  */

const sendToConnectedSocket=(socket,to_user_socket_id,event,chat_message)=>{
	socket.to(`${to_user_socket_id}`).emit(event,JSON.stringify(chat_message));
}

/**
 * getting socket id using receiver id
 * @param {String} to_user_id 
 */

const getSocketIDFromMapForThisUser=(to_user_id)=>{
	let userMapVal=userMap.get(`${to_user_id}`);
	if(undefined==userMapVal){
		return undefined;
	}
	return userMapVal.socket_id;
}

/**
 * remove user from user map using socket id
 * @param {String} socket_id 
 */

const removeUserWithSocketIdFromMap=(socket_id)=>{
	let toDeleteUser;
	for(let key of userMap){
		let userMapValue=key[1];
		if(userMapValue.socket_id==socket_id){
			toDeleteUser=key[0];
		}
	}
	if(undefined!=toDeleteUser){
		userMap.delete(toDeleteUser);
	}
	
}

/**
 * Disconnect from socket
 * @param {*} socket 
 */

const onDisconnected =(socket)=>{
  socket.on(ON_DISCONNECT,function(){
	   removeUserWithSocketIdFromMap(socket.id);
	   socket.removeAllListeners( SUB_EVENT_RECEIVE_MESSAGE); 
	   socket.removeAllListeners(SUB_EVENT_IS_USER_CONNECTED); 
	   socket.removeAllListeners(ON_DISCONNECT);
  });
}

/**
 * Add user to map to get total number of user on socket
 * @param {String} key_user_id 
 * @param {String} socket_id 
 */

const addUserToMap=(key_user_id,socket_id)=>{
	userMap.set(key_user_id,socket_id)
}






