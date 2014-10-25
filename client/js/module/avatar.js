define([], function(){

    var now = window.performance && (
        performance.now || performance.mozNow || performance.msNow ||
        performance.oNow || performance.webkitNow
        );

    var getTime = function() {
        return (now && now.call(performance)) ||
            (new Date().getTime());
    };

    window.requestAnimationFrame = (function() {
        return window.requestAnimationFrame ||
            window.webkitRequestAnimationFrame ||
            window.mozRequestAnimationFrame ||
            window.msRequestAnimationFrame ||
            window.oRequestAnimationFrame ||
            function(f) { return window.setTimeout(f, 1000 / 60); };
    }());

    window.cancelAnimationFrame = (function() {
        return window.cancelAnimationFrame ||
            window.cancelRequestAnimationFrame ||
            window.webkitCancelAnimationFrame ||
            window.webkitCancelRequestAnimationFrame ||
            window.mozCancelAnimationFrame ||
            window.mozCancelRequestAnimationFrame ||
            window.msCancelAnimationFrame ||
            window.msCancelRequestAnimationFrame ||
            window.oCancelAnimationFrame ||
            window.oCancelRequestAnimationFrame ||
            function(id) { window.clearTimeout(id); };
    }());

    function encode64(input) {
        var output = "", i = 0, l = input.length,
            key = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",
            chr1, chr2, chr3, enc1, enc2, enc3, enc4;

        while (i < l) {
            chr1 = input.charCodeAt(i++);
            chr2 = input.charCodeAt(i++);
            chr3 = input.charCodeAt(i++);
            enc1 = chr1 >> 2;
            enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
            enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
            enc4 = chr3 & 63;
            if (isNaN(chr2)) enc3 = enc4 = 64;
            else if (isNaN(chr3)) enc4 = 64;
            output = output + key.charAt(enc1) + key.charAt(enc2) + key.charAt(enc3) + key.charAt(enc4);
        }

        return output;
    }

    var fps = 10, timeMax = 4000, video, canvas, context, localMediaStream, encoder, cFlag = false,
    cFrames = 0, cTimer, cTimeSum = 0, cTimeOld = 0, aTimer, aTimeSum = 0, aTimeOld = 0, dataUrl, callback,
    width, height,

    captureFrame = function() {
        context.drawImage(video, 0, 0, width, height);

        encoder.postMessage({
            cmd: 'frame',
            data: context.getImageData(0, 0, width, height).data
        });

        cFrames++;
    },

    captureLoop = function() {
        var now = getTime();

        cTimeSum += (now - cTimeOld);
        cTimeOld = now;

        if (!cFlag) {
            captureStopped();
            return;
        }

        if (cTimeSum >= timeMax)  captureStop();

        captureFrame();

        var td = getTime() - now;
        cTimer = setTimeout(captureLoop, Math.max(Math.round(1000 / fps - td), 0));
    },

    captureStart = function() {
        if (cFlag) return;
        cFlag = true;

        timerStart();
        encoderStart();

        cTimeOld = getTime();
        captureLoop();
    },

    captureStop = function() {
        if (!cFlag) return;
        cFlag = false;
    },

    captureStopped = function() {
        timerStop();

        if (cTimeSum >= timeMax) {
            aTimeSum = timeMax;

            encoderFinish();
            return;
        }
    },

    timerLoop = function() {
        var now = getTime();
        aTimeSum += (now - aTimeOld);
        aTimeOld = now;

        aTimer = window.requestAnimationFrame(timerLoop);
    },

    timerStart = function() {
        aTimeOld = getTime();
        timerLoop();
    },

    timerStop = function() {
        if (aTimer) {
            window.cancelAnimationFrame(aTimer);
            aTimer = null;
        }
    },

    encoderStart = function() {
        if (!encoder) {
            encoder = new Worker('js/gif.js');

            var option = {
                delay:   Math.round(1000 / fps),
                repeat:  0,
                width:   width,
                height:  height
            };

            encoder.postMessage({ cmd: 'start', data: option });
        }
    },

    encoderFinish = function() {
        encoder.postMessage({ cmd: 'finish' });

        encoder.onmessage = function (e) {
            dataUrl = 'data:image/gif;base64,' + encode64(e.data);
            callback.call(null, dataUrl);
            cTimeSum = 0;
            encoder = null;
        };
    };

    return {
        getGif: function(){
            return dataUrl;
        },
        /**
         *
         * @param stream
         * @param video
         * @param canvas
         * @param duration
         * @param width
         * @param height
         * @returns {*}
         */
        init: function(s, v, c, d, w, h){

            timeMax = d || 1000;

            localMediaStream = s;

            video = v;
            canvas = c;
            context = canvas.getContext('2d');

            width = w || canvas.width;
            height = h || canvas.height;

            return this;
        },
        capture: function(c){
            callback = c;
            captureStart();
            return this;
        },
        captureStop: function(){
            captureStop();
            return this;
        }
    }
});