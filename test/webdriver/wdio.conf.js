exports.config = {
	specs: ['dist/test/*.spec.js'],
	exclude: [
		// 'path/to/excluded/files'
	],
	maxInstances: 10,
	capabilities: [
		{
			maxInstances: 5,
			browserName: 'chrome',
		},
	],
	sync: true,
	logLevel: 'silent',
	coloredLogs: true,
	deprecationWarnings: true,
	bail: 0,
	screenshotPath: './errorShots/',
	baseUrl: 'http://localhost',
	waitforTimeout: 20000,
	connectionRetryTimeout: 90000,
	connectionRetryCount: 3,
	services: ['selenium-standalone', 'screenshots-cleanup'],
	screenshotRoot: 'my-shots',
	framework: 'jasmine',
	jasmineNodeOpts: {
		defaultTimeoutInterval: 20000,
		expectationResultHandler: function(passed, assertion) {},
	},
}
