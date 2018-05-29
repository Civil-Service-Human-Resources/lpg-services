# LPG-Services Templating

As per #LPFG-375, we have updated our svelte engine to v2.6.5.
We are also using more standard svelte API so please refer to [svelte.technology](svelte.technology) for details.

**Quick start and gotchas**

* Using components: [https://svelte.technology/guide#nested-components](https://svelte.technology/guide#nested-components)
  * We are no longer "automatically" compiling and injecting components into templates since it was not standard svelte API.
    You must import the component you need.
  * So you can now put components in folders. Please do if it keeps things tidy and more readable!
* Using stores: [https://svelte.technology/guide#creating-components-with-stores](https://svelte.technology/guide#creating-components-with-stores)
  * We are no longer "automatically" compiling components and injecting shared `data()` into all components, even if they are nested.  
    Instead use a svelte store.
  * Stores are available to each parent which is rendered, and its children. You do not need to continually pass down data as a parameter to nested components.
  * To call a store inside a component, use `{$var}`. Occasionally you may need to wrap it in parentheses like so: `{($var)}`.
  *
