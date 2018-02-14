module.exports = {
	globalSetup: './setup/setup.js',
	globalTeardown: './setup/teardown.js',
	setupTestFrameworkScriptFile: './setup/jest.js',
	testEnvironment: './setup/env.js',
	testMatch: ['**/dist/test/**/*.js'],
	//testRunner: './setup/circus',
}
