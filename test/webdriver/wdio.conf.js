const conf = require('extension/config')

exports.config = {
	bail: 0,
	baseUrl: 'http://localhost',
	capabilities: [
		{
			maxInstances: 1,
			browserName: 'chrome',
			chromeOptions: {
				args: ['--headless', '--disable-gpu'],
			},
		},
	],
	coloredLogs: true,
	connectionRetryTimeout: 90000,
	connectionRetryCount: 3,
	deprecationWarnings: true,
	exclude: [],
	framework: 'jasmine',
	jasmineNodeOpts: {
		defaultTimeoutInterval: 40000,
		expectationResultHandler: function(passed, assertion) {},
	},
	logLevel: 'silent',
	maxInstances: 10,
	screenshotPath: './errorShots/',
	screenshotRoot: 'my-shots',
	services: ['selenium-standalone', 'screenshots-cleanup'],
	seleniumInstallArgs: {version: '3.4.0'},
	seleniumArgs: {version: '3.4.0'},
	specs: [
		'dist/test/feedback.spec.js',
		'dist/test/login.spec.js',
		'dist/test/footer.spec.js',
		'dist/test/home.spec.js',
		// 'dist/test/search.spec.js',
		//'dist/test/book.spec.js',
	],
	sync: true,
	waitforTimeout: 40000,
}
