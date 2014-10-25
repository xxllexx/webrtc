define([
    "m/tplGenerator",
    "text!templates/chatItem.html",
    "text!templates/chat.html",
    'm/webSocket',
    'm/webRtc'
], function(
    tplGenerator,
    chatItemTemplate,
    chatTemplate,
    ws,
    wr
){
    if(!Math.log2) Math.log2 = function(x){
        return Math.log(x) / Math.LN2;
    };

    var _messages,
        chatHtml = tplGenerator(chatTemplate, {}),
        online = false,
        maxSize = 180,
        sizeStep = 15,
        current = 0,

        defPos = {
            x: 2500 - maxSize/2,
            y: 2500 - maxSize/2
        },

        onCallClick = function(e){
            document.querySelector('body').classList.add('online');
            e.target.parentNode.classList.add('connecting');

            _messages.send({'command': 'busy', cid: ws.userClientId()});

            wr.doCall(e.target.dataset.cid).then(function(videoElement){
                e.target.parentNode.classList.remove('connecting');
                e.target.parentNode.classList.add('lineup');
                e.target.parentNode.querySelector('figure').appendChild(videoElement);
                document.querySelector('body').classList.add('online');
            });
        },

        hangUp = function(e){
            var user = e.target.parentNode;
            _messages.send({'command': 'end', fromUser: ws.userClientId(), toUser: user.querySelector('.call').dataset.cid});
            user.classList.remove('lineup');

            _messages.send({'command': 'free', cid: ws.userClientId()});
        },

        onOffer = function(cid, remoteVideo){
            return new Promise(function(resolve, reject){
                  document.querySelector('body').classList.add('online');

                  var userElement = document.querySelector('[data-cid="'+ cid +'"]').parentNode;

                  userElement.classList.remove('busy');
                  userElement.classList.add('doAnswer');

                    var doAnswerBtn = document.createElement('button');
                    doAnswerBtn.setAttribute('name', 'answer');
                    doAnswerBtn.innerText = "Answer";

                    doAnswerBtn.addEventListener('click', function(){
                        resolve([userElement, doAnswerBtn]);
                    }, false);

                    userElement.appendChild(doAnswerBtn);

                    _messages.send({'command': 'busy', cid: ws.userClientId()});

            }).then(function(el){
                el[1].parentNode.removeChild(el[1]);

                el[0].classList.remove('doAnswer');
                el[0].classList.add('lineup');
                el[0].querySelector('figure').appendChild(remoteVideo);
            });
        },

        setItem = function(size, top, left, imgID){
            var itemHtml = tplGenerator(chatItemTemplate, {}).querySelector('.chat-item'),
                img = 'img/' + imgID + '.gif';

            itemHtml.querySelector('.call').setAttribute('data-cid', imgID);

            itemHtml.querySelector('img').src = img;
            itemHtml.style.width = size + 'px';
            itemHtml.style.height = size + 'px';
            itemHtml.style.top = top + 'px';
            itemHtml.style.left = left + 'px';

            document.querySelector('body .chat').appendChild(itemHtml);

            return itemHtml;
        },

        createItem = function(index, imgID){

            var n = Math.log2(index + 8) - 3;
            n = (n < 0 ? 1 : Math.ceil(n + 1)) - 1;

            var a = ((360 / (n * 8)) * (Math.PI/180)),
                size = (maxSize - sizeStep * n),
                distanceDelta = ((maxSize - sizeStep * (n - 1)) + 40) * n,

                left = defPos.x + Math.cos(a * index) * distanceDelta,
                top = defPos.y + Math.sin(a * index) * distanceDelta;

            return setItem(size, top, left, imgID);
        },

        init = function(userList){
            return new Promise(function(resolve){
                document.querySelector('body').appendChild(chatHtml);

                document.querySelector('body').addEventListener('click', function(e){
                    if(e.target.classList.contains('call')){
                        onCallClick(e);
                    } else if(e.target.classList.contains('hangup')){
                        hangUp(e);
                    }
                }, false);

                _messages.on('end', function(data){
                    var user = document.querySelector('[data-cid="'+ data.fromUser +'"]');
                    user && user.parentNode.classList.remove('lineup');
                    _messages.send({'command': 'free', cid: ws.userClientId()});

                    document.querySelector('body').classList.remove('online');
                });

                _messages.on('busy', function(data){
                    var user = document.querySelector('[data-cid="'+ data.cid +'"]');
                    if(!user.parentNode.classList.contains('lineup')
                        && !user.parentNode.classList.contains('doAnswer')
                        && !user.parentNode.classList.contains('connecting'))
                        user.parentNode.classList.add('busy');
                });

                _messages.on('free', function(data){
                    var user = document.querySelector('[data-cid="'+ data.cid +'"]');
                    user.parentNode.classList.remove('busy');
                });

                wr.setupOffer(onOffer);

                setTimeout(function(){
                    userList.clientList.forEach(function(cl){
                        onNewUser({cid: cl});
                    });
                }, 600);

                resolve();
            });
        },

        onNewUser = function(data){
            current++;
            var item = createItem(current, data.cid);
            setTimeout(function(){
                window.requestAnimationFrame(function() {
                    item.classList.add('show');
                });
            }, 100);
        },

        userOut = function(data){
            console.log(data);
        };

    return {
        render: function(messages){
            _messages = messages;

            _messages.on('getUserList').then(function(userList){
                return init(userList);
            }).then(function(item){

                _messages.on('newUser', onNewUser);
                _messages.on('userOut', userOut);

                window.requestAnimationFrame(function(){
                    document.querySelector('body').scrollTop = 2500 - window.innerHeight/2;
                    document.querySelector('body').scrollLeft = 2500 - window.innerWidth/2;

                    window.requestAnimationFrame(function() {
                        document.querySelector('.video-avatar').classList.add('chatVideo');
                    });
                });


            });
            _messages.send({command: 'getUserList'});
        }
    }
});
