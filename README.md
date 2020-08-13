# svelte-standalone-router
A standalone router based on https://github.com/hjalmar/standalone-router

```
npm i -D svelte-standalone-router
```

Unlike the standalone router the implementation is done within a svelte component. Simply define your routes and middlewares as per the [standalone-router](https://github.com/hjalmar/standalone-router) documentation.

## Usage
```js
// router.js
import { router } from 'svelte-standalone-router';

// import components
import Index from './index.svelte';
import Subpage from './subpage.svelte';

// initialize router 
export const app = router({
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
});
```

## Component implementation
```js
import Router, { link, navigate, redirect, location } from 'svelte-standalone-router';
// Router : svelte-component
// link : Action directive used on 'a' tags. Uses 'href' attribute as path
// navigate(path : String ) : push state 
// redirect(path : String) : replace state
// $location : svelte-store
```

Router links are defined using the Actions directive. The action will use the 'href' attribute for internal routing.
```html
// app.svelte
<script>
  import Router, { link, location } from 'svelte-standalone-router';
</script>

<nav>
  <!-- one way to check for currently active route by using the location store -->
  <a href="/" class:active={$location == '/'} use:link>Home</a>
  <a href="/subpage" use:link>Subpage</a>
</nav>

<Router />
```

Not specifying a context will default back to the first one defined being used as it's context.

But at times where one might want to have more than one router it's as simple as creating another router(context) and export that and pass it along as a prop to the Router component.

```js
// main router
export const main = router({initial: location.pathname});
// create main routes
main.get((req, res) => res.send(MainComponent, {...req.params}));

// secondary router
export const secondary = router({initial: location.pathname});
// create secondary routes
secondary.get((req, res) => res.send(SecondaryComponent, {...req.params}));
```


```html
// app.svelte
<script>
  import Router, { link } from 'svelte-standalone-router';
  import { main, secondary } from './router.js';
</script>

<Router context={main} />
<Router context={secondary} />
```

The router also accepts slotted content. On the Router component you have the component and props variables at your disposal.

```html 
<Router let:component let:props>
  <h2>Showing page : {props.slug}</h2>
  <svelte:component this={component} {...props} />
</Router>
```

Enable sirv for SPA with the flag '--single'
```js
"start": "sirv public --single"
```