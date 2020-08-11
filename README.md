# svelte-standalone-router
A standalone router based on https://github.com/hjalmar/standalone-router

```
npm i -D svelte-standalone-router
```

Unlike the standalone router the implementation is done within a svelte component. Simply define your routes and middlewares as per the [standalone-router](https://github.com/hjalmar/standalone-router) documentation.

## Usage
```js
import { router } from 'svelte-standalone-router';

// import components
import Index from './index.svelte';
import Subpage from './subpage.svelte';

// initialize router 
const app = router({
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
import Router, { link, navigate, redirect } from 'svelte-standalone-router';
// Router : svelte-component
// link : Action directive used on 'a' tags. Uses 'href' attribute as path
// navigate(path : String ) : push state 
// redirect(path : String) : replace state
```

Router links are defined using the Actions directive. The action will use the 'href' attribute for internal routing.
```html
// app.svelte
<script>
  import Router, { link } from 'svelte-standalone-router';
</script>

<nav>
  <a href="/" use:link>Home</a>
  <a href="/subpage" use:link>Subpage</a>
</nav>

<Router />
```

Enable sirv for SPA with the flag '--single'
```js
"start": "sirv public --single"
```