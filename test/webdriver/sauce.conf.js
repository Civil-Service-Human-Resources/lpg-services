const conf = require('extension/config')

exports.config = {
	specs: ['dist/test/*.spec.js'],
	exclude: [
		// 'path/to/excluded/files'
	],
	maxInstances: 10,
	capabilities: [
		{
			maxInstances: 1,
			browserName: 'chrome',
		},
		{
			maxInstances: 1,
			browserName: 'firefox',
		},
		{
			maxInstances: 1,
			browserName: 'Safari',
			appiumVersion: '1.7.2',
			deviceName: 'iPhone X Simulator',
			deviceOrientation: 'portrait',
			platformVersion: '11.2',
			platformName: 'iOS',
		},
		{
			maxInstances: 1,
			browserName: 'Chrome',
			appiumVersion: '1.7.2',
			deviceName: 'Android GoogleAPI Emulator',
			deviceOrientation: 'portrait',
			platformVersion: '7.1',
			platformName: 'Android',
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
	services: ['selenium-standalone', 'screenshots-cleanup', 'sauce'],
	user: conf.SAUCE_USERNAME,
	key: conf.SAUCE_ACCESS_KEY,
	sauceConnect: true,
	screenshotRoot: 'my-shots',
	framework: 'jasmine',
	jasmineNodeOpts: {
		defaultTimeoutInterval: 20000,
		expectationResultHandler: function(passed, assertion) {},
	},
}
