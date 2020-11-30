# svelte-standalone-router
A standalone router based on https://github.com/hjalmar/standalone-router

```
npm i -D svelte-standalone-router
```

Unlike the standalone router the implementation is done within a svelte component. Simply define your routes and middlewares as per the [standalone-router](https://github.com/hjalmar/standalone-router) documentation.

## Usage
```js
// router.js
import { context } from 'svelte-standalone-router';

// import components
import Index from './index.svelte';
import Subpage from './subpage.svelte';

// initialize router 
export const app = context({
  initial: location.pathname
});

// define general fallback
app.catch((req, res) => {
  console.log('Catching all routes');
});
// sample middleware
app.use((req, res, next) => {
  console.log('A logger middleware');
  next();
});

// root route
app.get('/', (req, res) => {
  res.send(Index, { slug: 'index' });
});

// subroute with parameter
app.get('/:slug', (req, res) => {
  // send a component as first argument and the second 
  // argument will be props passed to said component
  res.send(Subpage, { slug: req.params.slug });
  // or force a new instance
  // res.send({ component: Subpage, force: true }, { slug: req.params.slug });
});
```

Sending a component to be rendered is done in two ways. One is to simply pass the Svelte component as the first argument or if you need to force a new instance and a redraw of the componennt you pass in an object with the properties 'component' and 'force'
```js
// quick way if you don't have any dynamic data that needs to 
// be updated on every new page load
res.send(Subpage, { slug: req.params.slug });
// updates with a new component instance on each route change. Simply pass 
// false to the force property to avoid forcing a new instance
res.send({ component: Subpage, force: true }, { slug: req.params.slug });
```

Adding linkBase to have all links be prefixed with a sub path. A note about using linkBase is that 
your $location store will discard the linkBase so your routes will still be "contexted" under root. I.e `http://localhost/sub/dir/ -> /`, `http://localhost/sub/dir/path -> /path` and so on 
```js
// add linkBase to make all link actions be prefixed with a base
import { Router } from 'svelte-standalone-router';

// notice how it is static on the Router class
Router.linkBase = '/sub/dir';

// one can also use the setter function
// Router.setLinkBase('/sub/dir');

// initialize router 
export const app = context({
  initial: location.pathname,
  base: Router.linkBase
});

```

`mount` and `destroy` the popstate listener is as easy as calling their respective function.
```js
import { mount, destroy } from 'svelte-standalone-router';
// mount and destroy functions
mount();
destroy();
```


## Component implementation
```js
import RouterComponent, { link, navigate, redirect, location, mount, destroy, Router } from 'svelte-standalone-router';
// RouterComponent : svelte-component
// link : Action directive used on 'a' tags. Uses 'href' attribute as path
// navigate(path : String ) : push state 
// redirect(path : String) : replace state
// $location : svelte-store
// mount() : add popstate listener (it has to have been destroyed before being able to be added again)
// destroy() : destroy current listener for popstate event
// Router : class SvelteStandaloneRouter (inherited from standalone-router library) 
```

Router links are defined using the actions directive. The action will use the 'href' attribute for internal routing.
```html
// app.svelte
<script>
  import RouterComponent, { link, location } from 'svelte-standalone-router';
</script>

<nav>
  <!-- one way to check for currently active route by using the location store -->
  <a href="/" class:active={$location == '/'} use:link>Home</a>
  <a href="/subpage" use:link>Subpage</a>
</nav>

<RouterComponent />
```

Not specifying a context will default back to the first one defined being used as it's context.

But at times where one might want to have more than one router it's as simple as creating another router(context) and export that and pass it along as a prop to the Router component.

```js
// main router
export const main = context({ initial: location.pathname });
// create main routes
main.get((req, res) => res.send(MainComponent, { ...req.params }));

// secondary router
export const secondary = context({ initial: location.pathname });
// create secondary routes
secondary.get((req, res) => res.send(SecondaryComponent, { ...req.params }));
```


```html
// app.svelte
<script>
  import RouterComponent, { link } from 'svelte-standalone-router';
  import { main, secondary } from './router.js';
</script>

<RouterComponent context={main} />
<RouterComponent context={secondary} />
```

The router also accepts slotted content. On the Router component you have the component and props variables at your disposal.

```html 
<RouterComponent let:component let:props>
  <h2>Showing page : {props.slug}</h2>
  <svelte:component this={component} {...props} />
</RouterComponent>
```

Enable sirv for SPA with the flag '--single'
```js
"start": "sirv public --single"
```