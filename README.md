# LPG UI (lpg-services)

 
## Purpose

LPG-UI (previously called lpg-services when the project was a monolithic application) is the NodeJS/Express/GOV.UK Frontend based web application that forms the main website for regular users of the Learning Platform for Government application.

This app hosts the main homepage of the website, redirects users to the management and identity-management areas, acts as a client of backend APIs such as CSRS, Learning Record and Learning Catalogue, and shows the course content uploaded by learning admins.

### Runtime 

#### Other LPG Services

- `identity-service` for OAuth token validation on all requests
- `csl-service` business logic API
- `learner-record` for loading course completion data
- `learning-catalogue` for searching for courses
- `civil-servant-registry-service` for updating profile information

#### External integrations

- YouTube API for fetching metadata on external embed YouTube video courses
- Google Analytics to fetch and embed analytics code into user facing pages

#### Data Stores

- Redis for user session data

#### Data migrations

- none


## Application Build

The application requires NodeJS 20 and npm installed to build and run. An exhaustive list of build and run commands can be found in `package.json` under `scripts`.

Resolve application dependencies by running `npm install`

Build the application by compiling Typescript and running the SASS preprocessor: `npm run build`

### Styling
* scss is being used for css
* use `npm run watch-sass` to start watching scss files
* `src/views/assets/styles/main.scss` is where all styles are being imported
* govuk-frontend-toolkit and -elements are being used and imported in `src/views/assets/styles/custom`

We are using the [BEM](http://getbem.com/introduction/) (Block Element Modifier) methodology. To make the scss more readable you can use `@include e('nameofelement'){}` to do `&__(nameofelement){}`. The same with modifiers using `@include m()`.


## Run, test, deploy

Run the project with `npm dev:ui` to watch files for changes or `npm run start:build` to run normally, or import the project into your IDE of choice such as Webstorm or VS Code and use the IDE commands to Run Application.

Lint with `npm run lint`, test using `npm run test` for unit tests or choose individual test classes or packages using your IDE.

The application is packaged as a docker container image - see `Dockerfile` in the root directory for the container definition.

Azure CDN is used to cache the static assets served by LPG-UI. **After deployment the Azure CDN endpoint for static asset caching needs to be purged** so that the latest version of any changed styles, images, fonts, JS etc can be picked up and recached by the platform. This is completed by using the purge functionality on the static CDN endpoint for each environment (see Terraform config for canonical names).


## Configuration

Significant configuration properties are highlighted here. For the full configuration file see `src/config/` and in particular `src/config/index.ts` A `.env` file can also be provided in the root directory.

## Licenses

LPG UI is licensed by the MIT license, see `LICENSE` in the root folder for details. Dependent applications are licensed as according to their respective readme and license files.

