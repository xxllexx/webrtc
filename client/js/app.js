'use strict';

define([
    'm/webSocket',
    'm/register',
    'm/chat',
    'm/messages'
], function(
    ws,
    register,
    chat,
    messages
){

    ws.init().then(function(connection){

        messages.setup(connection);

        messages.on('register').then(function(data){
            ws.userClientId(data.clientId);

            register.render(data.clientId, messages).then(function(){
                register.destroy();
                chat.render(messages);
            });

            window.addEventListener('beforeunload', function(){
                messages.send({command: 'unregister', cid: data.clientId});
            });
        });

        messages.send({command: 'register'});
    });
});
