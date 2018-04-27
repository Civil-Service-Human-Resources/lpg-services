const conf = require('extension/config')

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
			chromeOptions: {
				args: [
					'--headless',
					'--disable-gpu',
					'--window-size=1280,800',
					'--no-sandbox',
				],
			},
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
	//services: ['selenium-standalone', 'screenshots-cleanup', 'sauce'],
	services: ['selenium-standalone', 'screenshots-cleanup'],
	// user: conf.SAUCE_USERNAME,
	// key: conf.SAUCE_ACCESS_KEY,
	//TODO(Will):Clean this up
	//Enable to run against SauceLabs
	//sauceConnect: true,
	screenshotRoot: 'my-shots',
	framework: 'jasmine',
	jasmineNodeOpts: {
		defaultTimeoutInterval: 20000,
		expectationResultHandler: function(passed, assertion) {},
	},
}
