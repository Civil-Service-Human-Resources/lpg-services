const conf = require('extension/config')

exports.config = {
	specs: ['dist/test/profile.spec.js'],
	exclude: [],
	maxInstances: 10,
	capabilities: [
		{
			maxInstances: 1,
			browserName: 'chrome',
			// chromeOptions: {
			// 	args: ['--headless', '--disable-gpu'],
			// },
		},
	],
	sync: true,
	logLevel: 'silent',
	coloredLogs: true,
	deprecationWarnings: true,
	bail: 0,
	screenshotPath: './errorShots/',
	baseUrl: 'http://localhost',
	waitforTimeout: 40000,
	connectionRetryTimeout: 90000,
	connectionRetryCount: 3,
	services: ['selenium-standalone', 'screenshots-cleanup'],
	screenshotRoot: 'my-shots',
	framework: 'jasmine',
	jasmineNodeOpts: {
		defaultTimeoutInterval: 40000,
		expectationResultHandler: function(passed, assertion) {},
	},
}
