define(['q'], function(Q){

    window.WebSocket = window.WebSocket || window.MozWebSocket;
    var _cid;

    return {
        userClientId: function(cid){
            if(cid) _cid = cid;
            return _cid;
        },
        init: function(){

            var promise = new Promise(function(resolve, reject) {

                var connection = new WebSocket('ws://' + location.host);

                connection.addEventListener('open', function(){
                    resolve(connection);
                });

                connection.addEventListener('error', function(error){
                    reject(Error(error));
                });
            });

            return promise;
        }
    };
});
