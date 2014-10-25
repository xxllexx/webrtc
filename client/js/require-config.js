require.config({
    baseUrl: 'js',
    deps: ['app'],
	paths: {
        m: 'module',
        text: 'lib/text',
        templates: '../templates',
		q: 'lib/q',
        _: 'lib/lodash'
	},
	shim: {
        '_' : {
            'exports' : '_'
        }
	}
});