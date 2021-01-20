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

// status
const  STATUS_MESSAGE_NOT_SENT = 1001;
const STATUS_MESSAGE_SENT = 1002;

const listen_port= process.env.PORT||3000;
app.use('/',(req,res)=>{
	res.send('Server is running');
})
const userMap=new Map();
io.sockets.on(ON_CONNECTION, function (socket) {
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