const chalk = require('chalk')
const puppeteer = require('puppeteer')
const fs = require('fs')
const mkdirp = require('mkdirp')
const os = require('os')
const path = require('path')
const dotenv = require('dotenv')
dotenv.load()

const DIR = path.join(os.tmpdir(), 'jest_puppeteer_global_setup')

module.exports = async function() {
	console.log(chalk.green('Setup Puppeteer'))
	const b = await puppeteer.launch({
		ignoreHTTPSErrors: false,
		args: [
			'--ignore-certificate-errors',
			'--ignore-certificate-errors-spki-list ',
			'--disk-cache-size=0',
		],
		headless: false,
	})
	global.browser = b
	mkdirp.sync(DIR)
	fs.writeFileSync(path.join(DIR, 'wsEndpoint'), b.wsEndpoint())
}
