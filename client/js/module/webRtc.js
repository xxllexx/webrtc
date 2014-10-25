define(['m/userMedia', 'm/spd', 'm/webSocket'], function(um, spd, ws){

    if (!webkitMediaStream.prototype.getVideoTracks) {
        webkitMediaStream.prototype.getVideoTracks = function() {
            return this.videoTracks;
        };

        webkitMediaStream.prototype.getAudioTracks = function() {
            return this.audioTracks;
        };
    }

    if (!webkitRTCPeerConnection.prototype.getLocalStreams) {

        webkitRTCPeerConnection.prototype.getLocalStreams = function() {
            return this.localStreams;
        };

        webkitRTCPeerConnection.prototype.getRemoteStreams = function() {
            return this.remoteStreams;
        };

    }

    var _messenger,
        pc,
        localStream,
        remoteStream,
        _remoteUser,
        _offerCallback,
        _sendChannel,

        _localVideo,
        _remoteVideo,
        answerResolve,

        sdpConstraints = {'mandatory': {'OfferToReceiveAudio':true, 'OfferToReceiveVideo':true }},

        RTCPeerConnection = webkitRTCPeerConnection,

        attachMediaStream = function(element, stream) {
            element.src = um.URL.createObjectURL(stream);
        },

        mergeConstraints = function(cons1, cons2) {
            var merged = cons1;

            for (var name in cons2.mandatory){
                merged.mandatory[name] = cons2.mandatory[name];
            }

            merged.optional.concat(cons2.optional);

            return merged;
        },

        onRemoteStreamAdded = function(event){

            attachMediaStream(_remoteVideo, event.stream);

            remoteStream = event.stream;
        },

        onRemoteStreamRemoved = function(){
            console.log('removed');
        },

        onRemoteDataChannel = function(event){
            var receiveChannel = event.channel;
            receiveChannel.onmessage = function(e){
                console.log(e.data);
            }
        },

        createPeerConnection = function() {
            var pc_config = {"iceServers": [{"url": "stun:stun.l.google.com:19302"}]};
            var pc_constraints = {"optional": [{"RtpDataChannels": true}]};
            var _pc = new RTCPeerConnection(pc_config, pc_constraints);

            _sendChannel = _pc.createDataChannel('sendDataChannel', {reliable: true});

            _pc.onicecandidate = onIceCandidate;
            _pc.onaddstream = onRemoteStreamAdded;
            _pc.onremovestream = onRemoteStreamRemoved;
            _pc.ondatachannel = onRemoteDataChannel;

            return _pc;
        },

        onIceCandidate = function(event){
            if (event.candidate){
                _messenger.send({
                    command: 'candidate',
                    toUser: _remoteUser,
                    fromUser: ws.userClientId(),
                    data: {
                        type: 'candidate',
                        label: event.candidate.sdpMLineIndex,
                        id: event.candidate.sdpMid,
                        candidate: event.candidate.candidate
                    }
                });
            }
        },

        onOffer = function(msg){

            pc.setRemoteDescription(new RTCSessionDescription(msg.data));

            _remoteVideo = document.createElement('video');
            _remoteVideo.setAttribute('autoplay', true);

            _offerCallback(msg.fromUser, _remoteVideo).then(function(){
                _remoteUser = msg.fromUser;

                pc.createAnswer(function(sessionDescription) {

                    sessionDescription.sdp = spd.preferOpus(sessionDescription.sdp);

                    pc.setLocalDescription(sessionDescription);

                    _messenger.send({
                        command: 'answer',
                        toUser: msg.fromUser,
                        fromUser: ws.userClientId(),
                        data: sessionDescription
                    });

                }, function(){
                    console.log('error');
                }, sdpConstraints);
            });
        },

        onAnswer = function(msg){
            _remoteVideo = document.createElement('video');
            _remoteVideo.setAttribute('autoplay', true);

            _remoteUser = _remoteUser || msg.fromUser;

            pc.setRemoteDescription(new RTCSessionDescription(msg.data));

            answerResolve && answerResolve(_remoteVideo);
        },

        onCandidate = function(msg){
            _remoteUser = _remoteUser || msg.fromUser;

            var candidate = new RTCIceCandidate({sdpMLineIndex: msg.data.label, candidate: msg.data.candidate});

            pc.addIceCandidate(candidate);
        },

        doCall = function(cid) {

            return new Promise(function(resolve, reject){

                _remoteUser = cid;

                var constraints = {"optional": [], "mandatory": {}};

                constraints = mergeConstraints(constraints, sdpConstraints);

                pc.createOffer(function(sessionDescription) {

                    sessionDescription.sdp = spd.preferOpus(sessionDescription.sdp);

                    pc.setLocalDescription(sessionDescription);

                    _messenger.send({
                        command: 'offer',
                        toUser: _remoteUser,
                        fromUser: ws.userClientId(),
                        data: sessionDescription
                    });

                    answerResolve = resolve;

                }, function(err){
                    console.log(err);
                    reject(err);
                }, constraints);
            });
        },

        onEnd = function(){
            pc.close();
            pc = createPeerConnection();
            pc.addStream(localStream);
            _remoteVideo.parentNode.removeChild(_remoteVideo);
        },

        init = function() {

            _messenger.on('offer', onOffer);
            _messenger.on('answer', onAnswer);
            _messenger.on('candidate', onCandidate);
            _messenger.on('end', onEnd);

            var constraints = {"audio": true, "video": {"mandatory": {}, "optional": []}};

            return new Promise(function(resolve, reject){
                um.userMedia(constraints, function(stream){
                    attachMediaStream(_localVideo, stream);
                    localStream = stream;
                    pc = createPeerConnection();
                    pc.addStream(localStream);

                    resolve(localStream);
                }, function(err){
                    reject(err);
                });
            });
        };


    return {
        init: function(messenger, localVideo){
            _messenger = messenger;
            _localVideo = localVideo;

            return init();
        },
        doCall: doCall,
        setupOffer: function(offerCallback){
            _offerCallback = offerCallback;
        }
    }
});





