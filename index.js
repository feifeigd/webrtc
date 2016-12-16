
var users = {};

var WebSocketServer = require("ws").Server;

wss = new WebSocketServer({port:8888});

wss.on("listening", function(){
    console.log("Server stared...");
});

wss.on("connection", function(connection){
    console.log("User connected.");
    connection.send("Hello World.");

    connection.on("message", function(message){
        console.log("Got message:", message);
        var data;
        try{
            data = JSON.parse(message);
        }catch(e){
            console.log("Error parsing JSON");
            data = {};
        }

        switch(data.type){
        case "login":
            var name = data.name;
            console.log("User logged in as ", name);
            if(users[name]){
                sendTo(connection, {type:"login",success:false});
                return;
            }
            users[name] = connection;
            connection.name = name;
            sendTo(connection, {type:"login",success:true});
            break;
        case "offer":
            var name = data.name;   // 被叫方
            console.log("Sending offer to ", name);
            var conn = users[name]; // 被叫方
            if(conn){
                connection.otherName = name;
                sendTo(conn, {type:"offer", offer:data.offer, name:connection.name});
            }
            break;
        case "answer":
            var name = data.name;   // 呼叫方
            console.log("Sending answer to ", name);
            var conn = users[name]; // 呼叫方
            if(conn){
                connection.otherName = name;
                sendTo(conn, {type:"answer", answer:data.answer});
            }
            break;
        case "candidate":
            var name = data.name;
            console.log("Sending candidate to ", name);
            var conn = users[name];
            if(conn){
                sendTo(conn, {type:"candidate", candidate:data.candidate});
            }
            break;
        case "leave":
            var name = data.name;
            console.log("Disconnecting user from ", name);
            var conn = users[name];
            if(conn){
                conn.otherName = null;  // 挂断对方
                sendTo(conn, {type:"leave"});
            }
            break;
        default:
            sendTo(connection, {
                type:"error",
                message:"Unrecongnized command: " + data.type
            });
        }
    });

    connection.on("close", function(){
        var name = connection.name;
        if(name){
            delete users[name];
            name = connection.otherName;
            if(name){
                console.log("Disconnecting user from ", name);
                var conn = users[name];
                if(conn){
                    conn.otherName = null;
                    sendTo(conn, {type:"leave"});
                }
            }
        }
    })
});

function sendTo(connection, message){
    connection.send(JSON.stringify(message));
}
