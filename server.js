const express=require('express');
const app=express();
const server=require('http').createServer(app);
const io=require('socket.io')(server);

//Reserved Events
let ON_CONNECTION='connection';
let ON_DISCONNECT='disconnect';

//main events
let EVENT_IS_USER_ONLINE="check_online";
let EVENT_SINGLE_CHAT_MESSAGE="single_chat-message";

//sub events
let SUB_EVENT_RECEIVE_MESSAGE='receive_message';
let SUB_EVENT_IS_USER_CONNECTED="is_user_connected";

// status
const  STATUS_MESSAGE_NOT_SENT = 1001;
const STATUS_MESSAGE_SENT = 1002;

let listen_port=3000;

const userMap=new Map();
io.sockets.on(ON_CONNECTION,()=>{
	onEachUserConnection(socket);
});
const onEachUserConnection=(socket)=>{
print('----------------------');
print(`Connected => Socket ID': ${socket.id}, User: ${stringfyToJson(socket.handshake.query)}`);
}

const print=(txt)=>{
	console.log(txt);
}
const stringfyToJson =(data)=>{
	return JSON.stringfy(data);
}

server.listen(listen_port,()=>{console.log(`Server is running on ${listen_port}`)});