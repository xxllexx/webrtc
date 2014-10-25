'use strict';

define(['m/userMedia'], function(um){
    var video;
    var localMediaStream;

    return function(videoElement){
        if(!videoElement) return;
        video = videoElement;

        return {
            start: function(){
                um.userMedia({
                    video: true
        //        ,
        //        "audio": {
        //            "mandatory": {
        //                "googEchoCancellation": "true",
        //                "googAutoGainControl": "true",
        //                "googNoiseSuppression": "true",
        //                "googHighpassFilter": "true"
        //            },
        //            "optional": []
        //        }
                }, function(stream) {

                    video.src = um.URL.createObjectURL(stream);

                    localMediaStream = stream;

                    video.onloadedmetadata = function(e) {};

                }, function(err){
                    console.log(err);
                });

                return {
                    stream: function(){
                        return localMediaStream;
                    },
                    stop: function(){
                        localMediaStream.stop();
                        localMediaStream = null;
                        video.src = '';
                    }
                }
            }
        }
    }
});
