define([
    'q',
    'm/tplGenerator',
    'm/video',
    'm/webRtc',
    'm/avatar',
    'text!templates/register.html'
], function(Q, tplGenerator, video, wr, avatar, tpl){
    var html = tplGenerator(tpl, {}),

    init = function(cid, messenger){

        var videoElement = document.querySelector('video#local'),
            canvas = html.querySelector('canvas'),
            registerButton = html.querySelector('button'),
            isRegistrationStarted = false;

        canvas.setAttribute('width', 300);
        canvas.setAttribute('height', 225);

        return wr.init(messenger, videoElement).then(function(localStream){

            return new Promise(function(resolve, reject){

                registerButton.addEventListener('click', function(e){
                    var self = this;
                    self.innerText = 'Connecting ...';

                    if(isRegistrationStarted) return;

                    avatar.init(localStream, videoElement, canvas, 2000, canvas.width/1.5, canvas.height/1.5).capture(function(dataUrl){

                        var xhr = new XMLHttpRequest();
                        xhr.open('post', location.href, true);
                        xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
                        xhr.onload = function () {
                            var resp = JSON.parse(this.response);
                            if(resp && resp.success){
                                self.innerText = 'Connected!!!';
                                resolve(resp);
                            } else {
                                reject(resp);
                            }
                        };

                        xhr.send('cid=' + cid + '&dataUri=' + dataUrl);
                    });

                    isRegistrationStarted = true;

                }, false);
            });

        });
    };

    return {
        render: function(clientId, messenger){
            document.querySelector('body').appendChild(html);

            return init(clientId, messenger);
        },
        destroy: function(){
            html.parentNode.removeChild(html);
        }
    }
});