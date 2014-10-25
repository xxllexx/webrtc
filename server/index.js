"use strict";

//exports
var http = require('http')
  , webSocketServer = require('websocket').server
  , url = require("url")
  , path = require("path")
  , fs = require("fs")
  , mime = require("mime");

//vars
var port = process.argv[2] || 8888
  , clients = []
  , saveFile = function(name, dataUrl){
        var buffer = new Buffer(dataUrl.split(",")[1], 'base64');

        var _path = path.join('../', 'client', 'img', (name + '.gif'));

        fs.writeFileSync(_path, buffer);
    },
    getClientID = function(){
        return [
            process.pid,
            "XXXX".split('X').map(function(){return (Math.random() * 0x1000000000).toString(36)}).join("")
        ].join('');
    };



var server = http.createServer(function(request, response) {

    if(request.method === 'POST'){

        var body = '';
        request.on('data', function (data) {
            body += data;
            if (body.length > 1e6) {
                request.connection.destroy();
            }
        });

        request.on('end', function () {
            body = body.split(/[&]/);

            var cid = body[0].split('=')[1];
            var string = body[1].substr(body[1].indexOf('='), body[1].length - 1);

            saveFile(cid, string);

            clients[cid].registred = true;

            response.writeHead(200, {"Content-Type": "json"});
            response.write(JSON.stringify({
                "success": true
            }));
            response.end();
        });

    } else {
        var uri = url.parse(request.url).pathname
            , filename = path.join(process.cwd(), uri);

        filename = filename.replace('server', 'client');

        fs.exists(filename, function(exists) {
            if(!exists) {
                response.writeHead(404, {"Content-Type": "text/plain"});
                response.write("404 Not Found\n");
                response.end();
                return;
            }


            if (fs.statSync(filename).isDirectory()) filename = path.join(filename, 'index.html');

//        console.log(filename);

            fs.readFile(filename, "binary", function(err, file) {
                if(err) {
                    response.writeHead(500, {"Content-Type": "text/plain"});
                    response.write(err + "\n");
                    response.end();
                    return;
                }

                response.writeHead(200, {"Content-Type": mime.lookup(filename)});
                response.write(file, "binary");
                response.end();
            });
        });
    }
});

server.listen(parseInt(port, 10));

var wsServer = new webSocketServer({
    httpServer: server
});

wsServer.on('request', function(request) {
    var connection = request.accept(null, request.origin);

    var clientID = getClientID();

    clients[clientID] = {
        registred: false,
        connection: connection
    };

    (function(cid){
        connection.on('message', function(message) {

            console.log(message);

            if (message.type === 'utf8') {
                var mess = JSON.parse(message['utf8Data']);


                if(mess['command'] === 'register'){
                    connection.sendUTF(JSON.stringify({
                        clientId: cid,
                        type: 'register'
                    }));
                }

                if(mess['command'] === 'getUserList'){
                    var list = [];
                    for(var i in clients){
                        if(i !== cid && clients[i].registred){
                            clients[i].connection.sendUTF(JSON.stringify({type: 'newUser', cid: cid}));
                            list.push(i);
                        }
                    }

                    connection.sendUTF(JSON.stringify({
                        clientList: list,
                        type: 'getUserList'
                    }));


                }

                if(mess['command'] === 'unregister'){
                    clients[mess['cid']].connection.close();
                    delete clients[mess['cid']];
                }

                if(mess['command'] === 'offer'){

                    clients[mess['toUser']].connection.sendUTF(JSON.stringify({
                        fromUser: mess['fromUser'],
                        toUser: mess['toUser'],
                        data: mess['data'],
                        type: 'offer'
                    }));
                }

                if(mess['command'] === 'candidate'){

                    clients[mess['toUser']].connection.sendUTF(JSON.stringify({
                        fromUser: mess['fromUser'],
                        toUser: mess['toUser'],
                        data: mess['data'],
                        type: 'candidate'
                    }));
                }

                if(mess['command'] === 'answer'){
                    clients[mess['toUser']].connection.sendUTF(JSON.stringify({
                        fromUser: mess['fromUser'],
                        toUser: mess['toUser'],
                        data: mess['data'],
                        type: 'answer'
                    }));
                }

                if(mess['command'] === 'end'){
                    clients[mess['toUser']].connection.sendUTF(JSON.stringify({
                        fromUser: mess['fromUser'],
                        toUser: mess['toUser'],
                        type: 'end'
                    }));
                    clients[mess['fromUser']].connection.sendUTF(JSON.stringify({
                        fromUser: mess['fromUser'],
                        toUser: mess['toUser'],
                        type: 'end'
                    }));
                }

                if(mess['command'] === 'busy'){
                    for(var i in clients){
                        if(i !== cid && clients[i].registred){
                            clients[i].connection.sendUTF(JSON.stringify({type: 'busy', cid: mess.cid}));
                        }
                    }
                }

                if(mess['command'] === 'free'){
                    for(var i in clients){
                        if(i !== cid && clients[i].registred){
                            clients[i].connection.sendUTF(JSON.stringify({type: 'free', cid: mess.cid}));
                        }
                    }
                }

            }
        });

        connection.on('close', function(connection) {});
    })(clientID);




});
