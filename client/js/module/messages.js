define(function(){
    var _connection, events = {}, promises = {};

    return {
        setup: function(connection){
            _connection = connection;
            _connection.addEventListener('message', function(message){
                var mess = JSON.parse(message.data);

                mess.type && events[mess.type] && events[mess.type].forEach(function(e){
                    e.callback.call(e.context, mess);
                });

                mess.type && promises[mess.type] && promises[mess.type].forEach(function(p){
                    p.resolve(mess);
                });
            });
        },
        on: function(type , callback, context){
            if(!callback){
                promises[type] = promises[type] || [];
                return new Promise(function(resolve, reject){
                    promises[type].push({
                        'resolve': resolve,
                        'reject': reject
                    });
                });
            }

            events[type] = events[type] || [];

            events[type].push({
                'callback': callback,
                'context': context || null
            });
        },
        send: function(mess){
            mess = (typeof mess === "object" ? JSON.stringify(mess) : mess);
            _connection.send(mess);
        }
    }
});
