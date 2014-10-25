'use strict';

importScripts('lib/LZWEncoder.js', 'lib/NeuQuant.js', 'lib/GIFEncoder.js');

var encoder = new GIFEncoder();

self.addEventListener('message', function(e) {
    switch (e.data.cmd) {
        case 'start':
            var data = e.data.data;
            encoder.setRepeat(data.repeat);
            encoder.setDelay(data.delay);
            encoder.setSize(data.width, data.height);
            encoder.start();
            break;
        case 'frame':
            encoder.addFrame(e.data.data, true);
            break;
        case 'finish':
            encoder.finish();
            postMessage(encoder.stream().getData());
            break;
    }
});
