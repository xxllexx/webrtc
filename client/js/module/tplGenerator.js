'use strict';

define(['_'], function(_){
    return function(tpl, params){
        var htmlString = _.template(tpl, params || {}),
            domEl = document.createElement('div');

        domEl.innerHTML = htmlString;
        return domEl;
    }
});
