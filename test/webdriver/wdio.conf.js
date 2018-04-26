export const config = {
	specs: ['./test/specs/**/*.js'],
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
	waitforTimeout: 10000,
	connectionRetryTimeout: 90000,
	connectionRetryCount: 3,
	screenshotRoot: 'my-shots',
	framework: 'jasmine',
	jasmineNodeOpts: {
		defaultTimeoutInterval: 10000,
		expectationResultHandler: function(passed, assertion) {},
	},
}
