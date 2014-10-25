'use strict';

define([], function(){

    var getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;
    var URL = window.URL || window.webkitURL || window.mozURL || window.msURL;

    return {
        userMedia: getUserMedia.bind(navigator),
        URL: URL
    };
});
