##LPG-ui--svelte

This branch contains svelte (and svelte-cli) SSR. It also contains parcel for ease of client dev.


`npm run build` to build the client and server
`node server` to start the server listening on `1234`.


**good to knows:**
* Parcel will build and hash `client.js` and `index.html`. The result is a dist folder with `index.html` which includes the built `client.js` and `index.css`.
* Add HTML components to `${ROOT_DIR}/shared/components/`. `npm run svelte` is compiling components into js, which is useful for client side dev. (Although, we probably wont need or use it)
* Add Routes (*.html) to `${ROOT_DIR}/shared/routes`. From these files you can import components and pass data to them. Alternatively you can do this from `src/server/server.js`.


 
