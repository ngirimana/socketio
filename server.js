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
 * send message to user connected on socket
 * @param {*} socket 
 * @param {Strinf} toUserSocketId 
 * @param {String} event 
 * @param {Object} chatMessage 
 */

const sendToConnectedSocket=(socket,toUserSocketId,event,chatMessage)=>{
	socket.to(`${toUserSocketId}`).emit(event,JSON.stringify(chatMessage));
}

/**
 * getting socket id using receiver id
 * @param {String} toUserId 
 */

const getSocketIDFromMapForThisUser=(toUserId)=>{
	const userMapVal=userMap.get(`${toUserId}`);
	if(undefined===userMapVal){
		return undefined;
	}
	return userMapVal.socket_id;
}
/**
 * 
 * @param {*} socket 
 * @param {String} event 
 * @param {Object} chatMessage 
 */

const sendBackToclient=(socket,event,chatMessage)=>{
	socket.emit(event,JSON.stringify(chatMessage))

}

/**
 * determining if user is online
 * @param {*} socket 
 * @param {Object} chat_user_details 
 */

const onlineCheckHandler=(socket,chatUserDetails)=>{
	const toUserId=chatUserDetails.to;
	const toUserSocketId=getSocketIDFromMapForThisUser(toUserId);
	const isOnline=undefined!==toUserSocketId;
	chatUserDetails.to_user_online_status=isOnline;
	sendBackToclient(socket,SUB_EVENT_IS_USER_CONNECTED,chatUserDetails);
}

/**
 * check if user is online
 * @param {*} socket 
 */

const checkOnline=(socket)=>{
	socket.on(EVENT_IS_USER_ONLINE,(chatUserDetails)=>{
		onlineCheckHandler(socket,chatUserDetails);
	});
}

/**
 * handling message
 * @param {*} socket 
 * @param {Object} chat_message 
 */

const singleMessageHandler=(socket,chatMessage)=>{
	const toUserId=chatMessage.to;
	const toUserSocketId=getSocketIDFromMapForThisUser(toUserId);
	if(toUserSocketId===undefined){
		chatMessage.to_user_online_status=false;
		return;
	}
	 
	chatMessage.to_user_online_status=true;
	sendToConnectedSocket(socket,toUserSocketId,SUB_EVENT_RECEIVE_MESSAGE,chatMessage);
}

/**
 * sending message on socket
 * @param {*} socket 
 */

const onMessage=(socket)=>{
	socket.on(EVENT_SINGLE_CHAT_MESSAGE,(chatMessage)=>{
		singleMessageHandler(socket,chatMessage);
	});
}

/**
 * remove user from user map using socket id
 * @param {String} socketId 
 */

const removeUserWithSocketIdFromMap=(socketId)=>{
	let toDeleteUser;
	for(const key of userMap){
		const userMapValue=key[1];
		if(userMapValue.socket_id === socketId){
			toDeleteUser=key[0];
		}
	}
	if(undefined!==toDeleteUser){
		userMap.delete(toDeleteUser);
	}
	
}



/**
 * Add user to map to get total number of user on socket
 * @param {String} keyUserId 
 * @param {String} socketId
 */

const addUserToMap=(keyUserId,socketId)=>{
	userMap.set(keyUserId,socketId)
}

/**
 * Disconnect from socket
 * @param {*} socket 
 */

const onDisconnected =(socket)=>{
	socket.on(ON_DISCONNECT,()=>{
	   removeUserWithSocketIdFromMap(socket.id);
	   socket.removeAllListeners( SUB_EVENT_RECEIVE_MESSAGE); 
	   socket.removeAllListeners(SUB_EVENT_IS_USER_CONNECTED); 
	   socket.removeAllListeners(ON_DISCONNECT);
	});
}

/**
 * when each user conected
 * @param {*} socket 
 */

const onEachUserConnection=(socket)=> {
	const fromUserId=socket.handshake.query.from;
	const userMapVal={socket_id:socket.id};
	addUserToMap(fromUserId,userMapVal);
	onMessage(socket);
	checkOnline(socket);
	onDisconnected(socket);
}

/**
 * connection to socket @param {*} socket
 */

io.sockets.on(ON_CONNECTION,  (socket)=> {
	onEachUserConnection(socket);
	/**
 * vidoe chat
 */

});