# LPG Services

**Getting started**

To start the services, most of what you need will be in this repo. You will also need:

* Docker
* [lpg-wso2-is](https://github.com/Civil-Service-Human-Resources/lpg-wso2-is) run `scripts/reset.sh` in the root dir. This will start the identity server.
* prettier
* tslint

**In the root dir of this repo, run**

1. `npm install`
2. `docker-compose up`

**To build and run the services**

There are several npm scripts. Find them in [package.json](package.json)

* `npm run build`
* to start the ui: `npm run start:ui`, to start management: `npm run start:management`
* for dev, you can run `npm run dev:ui` to watch typescript files, sass files and start the server.

**Services**

* [UI](src/ui)
* [Management UI](src/management-ui)

**[Lib](src/lib)**

* The templating engine we are currently using is [svelte.technology](svelte.technology)@v2.
  See more about how to use it in this project [here](src/lib/ui/README.md)

**Testing**

* [WebdriverIO](test/webdriver)

All the services required to run this are npm dependancies. To run against different environments locally you need to set the appropriate environment variable.

**In the webdriver dir of this repo, run**

1. `npm install`
2. `npm run build`
3. `npm run test`

**Configure WebdriverIO capabilities**

Browser type, timeouts, services and browser instances can be configured within [wdio.conf.js](test/webdriver/wdio.conf.js)
