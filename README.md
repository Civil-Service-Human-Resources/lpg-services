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
* for dev, you can run `npm run dev:ui` to watch typescript files, sass files and start  the server.
 

**Services**

* [UI](src/ui)
* [Management UI](src/management-ui)

**[Lib](src/lib)**

**Testing**

* [Headless](test/headless)
