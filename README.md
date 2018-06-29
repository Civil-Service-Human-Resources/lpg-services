# LPG Services

**Getting started**

To start the services, most of what you need will be in this repo. You will also need:

* Docker
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

* The templating engine we are currently using is [svelte.technology](https://svelte.technology)@v2.
  See more about how to use it in this project [here](src/lib/ui/README.md)

**Testing**

* [WebdriverIO](test/webdriver)

All the services required to run this are npm dependencies. To run against different environments locally you need to set the appropriate environment variable.

**In the webdriver dir of this repo, run**

1. `npm install`
2. `npm run build`
3. `npm run test`

**Configure WebdriverIO capabilities**

Browser type, timeouts, services and browser instances can be configured within [wdio.conf.js](test/webdriver/wdio.conf.js)

**Styling**

* scss is being used for css
* use `npm run watch-sass:ui` to start watching scss files in the ui repo
* `src/[ui/management-ui]/assets/styles/main.scss` is where all styles are being imported
* govuk-frontend-toolkit and -elements are being used and imported in `src/[ui/management-ui]/assets/styles/custom`

We are using the [BEM](http://getbem.com/introduction/) (Block Element Modifier) methodology. To make the scss more readable you can use `@include e('nameofelement'){}` to do `&__(nameofelement){}`. The same with modifiers using `@include m()`.

Deciding whether something should be a block, element or modifier is sometimes tricky or confusing. Here is an example:
html:

```
<div class="human">
    <div class="human__head">
        <span class="human__eye human__eye--blue human__eye--left">
        </span>
        <span class="human__eye human__eye--blue human__eye--right">
        </span>
    </div>

</div>
```

scss:

```
.human {
    height: 180px;
    @include e('head') { //.human__head: head is an element, a part of the block
        display: block;
    }
    @include e('eye') {
    /*
     *.human__eye: eye although is an element of head, that introduces a level of nesting which is anti-BEM
     */

        /* you could still use .human__eye, and it will be blue but wont float.
        * all of the tags (div, span, etc) all need .human__eye, otherwise they will not be the right size, or display-inline.  
        */
        width: 2px;
        display: inline-block;


        @include m(blue) { //.human__eye--blue: if you want the eye to be blue
            color: blue;
        }

        @include m(left) { //.human__eye--left this is modifying the eye for left types
            float: left;
        }
        @include m(right) { //and right eye..
            float: right;
        }
    }

}
```
