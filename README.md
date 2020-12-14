# svelte-standalone-router
A standalone router based on https://github.com/hjalmar/standalone-router

```
npm i -D svelte-standalone-router
```

Unlike the standalone router the implementation is done within a svelte component. Simply define your routes and middlewares as per the [standalone-router](https://github.com/hjalmar/standalone-router) documentation.

## Library implementation
Components and utilities the library exposes. As per the svelte specs all svelte components are Capitalized. 
```js
import RouterComponent, { context, link, navigate, redirect, location, mount, destroy Router, Navigate, Redirect } from 'svelte-standalone-router';
```

```
svelte-standalone-router {
  RouterComponent : svelte-component
  context : Function // creates a new router context
  link : svelte-action // Action directive used on 'a' tags. Uses 'href' attribute as path
  navigate(path : String ) : // push state 
  redirect(path : String) : // replace state
  location : svelte-store
  mount() : Function // add popstate listener (it has to have been destroyed before being able to be added again)
  destroy() : Function //destroy current listener for popstate event
  Router : class SvelteStandaloneRouter (inherited from standalone-router library) 
  Navigate : svelte-component // to navigate to a route
  Redirect : svelte-component // to redirect to a route
}
```

## Creating a router context
Most of the time you will only ever need one context, tho the ability to have several router contexts on the page at the same time is a possibility
```js
// import context from library
import { context } from 'svelte-standalone-router';

// main app context
const app = context({
  // optional initial route. Here we set it to be the current pathname of the url
  initial: location.pathname
});
```
### Adding routes
Add get routes to your created context with the `get` method. The get method takes an argument `String` for the route, a undefined number of middlewares and lastly a callback for when the route matches. 

A simple route that matches the root
```js
app.get('/', (req, res) => {
  // code
});
```

The callback function exposes two functions. The first argument is the Request object, this will contain data regarding the route request and the second argument will be the response object which exposes two functions `send` or `error`, which will either send the component and props to the `RouterComponent` or handle the error, which is documented a bit further down.

To pass along component properties, which is done by adding an Object literal as the second argument with the data that should be passed on to the component.
```js
app.get('/', (req, res) => {
  // to catch the props in a svelte component you simply do it like normal svelte props: 
  // export let myprop = 'default string'; // will become 'custom prop'
  res.send(SvelteComponent, { myprop: 'custom prop' });
})
```

Let's try a more advanced route with dynamic parameters. The route is separated in sections by `/`, like a directory structure. Each part can use a dynamic parameter which gets exposed on the `req.params` object.

NOTE: A dynamic parameter catches everything for it's section and cannot be combined with or placed within a string. It has to start with a `:`, so a route like this `/articles/article-title-:id` is therefore invalid, by design! 
```js
app.get('/articles/:id', (req, res) => {
  // spread the whole params object without having to hardcode anything
  // this will become { id: `The value that get's passed from the url` }
  res.send(SvelteComponent, { ...req.params });
});
```

On the occasion where you want to "bind" a static route to a dynamic parameter you can do so with a `->`. This will save slug: 'about' on the params object. This is so if your component expects a `slug` prop but you want to define a static route. Useful where the implementation for a dynamic and static route is the same.
```js
app.get('/:slug->about', (req, res) => {
  res.send(SvelteComponent, { ...req.params });
});
```
So far all routes have been explicit, meaning the route has matched from start to end. To make a route implicit you add a `*` to the end of the route. 

NOTE: `*` is not a wildcard you can place in the middle of the string. It is placed at the end to mark where it match up until and then anything else after that. So it's important in what order the routes are defined due to no ranking system in place in the library

This will match a route like `/articles/10` and `/articles/20/what-is-up-with-2020`. It will explicitly match up until the `:id` and then everything else.
```js
app.get('/articles/:id/*', (req, res) => {
  res.send(SvelteComponent, { ...req.params });
});
```

There is a few small things about routes that gets rid of some redundancy in some instances. For instance you can provide an array of routes, chain the get calls and discard the route completly.

Multiple routes with the sample implementation
```js
app.get(['/', 'home', 'index'], (req, res) => {
  res.send(SvelteComponent, { ...req.params });
});
```

Chain routes as sub routes. Here about and contact will actually become `/pages/about` and `/pages/contact` as they are chained under the pages route. A sub route is not a special case, it's simply a way to group code together and remove some redundancy. If you'd rather do `app.get('/pages/about', ...)` it would be the same thing.
```js
app.get('/pages', (req, res) => {
  res.send(SvelteComponent, { ...req.params });
})
.get('about', (req, res) => { /* do something */ })
.get('contact', (req, res) => { /* do something */ });
```

Or to catch all requests. the route is actually '*' so it catches everything. It is nothing more than a shorthand implementation for `app.get('/*', (req, res) => ...)`.
```js
app.get((req, res) => {
  res.send(SvelteComponent);
});
```

### Request object
The request object exposes everything related to the request. This you can use to determin if you want to preload data, what component to load or error out when a request does not meet the requirements.
```js
Request{
  base : String // current base
  params : Object // params from the request
  path : String // current pathname
  route : String // what route that got triggered, for instance: "/route/:param"
  // defined with the use:link action or with the navigate or redirect helper functions
  state : Object // the state object. unlike the get params that is the arguments attached to the route/pathname, this is the custom data you sent along with the request
}
```

### Response object
The response object is responsible for handling the response. Currently you can send the component and its props to the router or as an error.
```js
Response{
  send : Function(Component : svelte-component|{ Component : svelte-component, force : Boolean} : Object, props : Object)
  error : Function(props : Object)
}
```

## Base and linkbase
If you are deploying your site to the root no extra configuration has to be done to make it work. But on the occasions where you want to deploy it under a subdirectory you would want to defined the `base` and or perhaps the `linkBase` to cater to that location.

Let's start with base. Lets deploy our app under `/project`, so we would access our site under `https://example.com/project`.
```js
const app = context({
  initial: location.pathname,
  base: '/project'
});
```

This does not reflect the `linkBase`. It's implementation is separated due to the instances where you don't want the `use:link` action directive to reflect that, and the reason why they both aren't affected by setting the base property.

The linkBase is statically defined on the Router object. This will make all helpers like `navigate`, `redirect` and `link` prefix everything under `/project`. 
```js
Router.linkBase = '/project';
```
Since setting the linkBase returns the just defined string you can combine it with the base property.
```js
const app = context({
  initial: location.pathname,
  base: Router.linkBase = '/project';
});
```
Or how about dynamically depending on the base of your inde.html

Since setting the linkBase returns the just defined string you can combine it with the base property.
```js
// get the href attribute from <Base> element.
// we use getAttribute('href') so we don't get the absolute url
Router.linkBase = document.querySelector('base').getAttribute('href'); 

// add the linkBase as base to the context
const app = context({
  initial: location.pathname,
  base: Router.linkBase;
});
```

## Catching errors
Like routes you can catch errors with the `catch` method. The underlying implementation is basically the same as `get` routes except it will be used as a fallback if route is not found or manually triggered and that it recieves an additional argument with custom props.

```js
// catch all errors with the shorthand syntax.
app.catch((req, res, props)){
  res.send(ErrorComponent);
}
```

Manually trigger an error for current route `/`. The difference of error and send is that error only takes an object of optional custom properties.
```js
app.get('/', (req, res)){
  if(expression != true){
    res.error({ custom: 'props' });
    return;
  }
  res.send(ErrorComponent);
}
```

## Middlewares
There are two kinds of middlewares, globals and those attached on to the route itself.
To define a global middleware you use the `use` method. Unlike get and catch routes, global middlewares do not take a route. You can define multiple global middlewares and how they are executed is in the order they are defined. 

To move on to the next middleware you need to call `next()`.
```js
// logger
app.use((req, res, next) => {
  console.log(`Logger middleware that will run on each request.`);
  next();
});

// auth validator
app.use((req, res, next) => {
  if(auth){
    return next();
  }
  res.error({ message: 'Unatutorized' });
});
```

Instead of globally on each and every route you can attache the middleware on to the route itself. A middleware is simple a function, the same function used as the callback argument on the `use` method.
```js
// a hasAuth middleware
const hasAuth = (req, res, next) => {
  if(auth){
    return next();
  }
  res.error({ message: 'Unatutorized' });
}

// applying the middleware to a route
app.get('/user'. hasAuth, (req, res) => {
  res.send(Component)
});
```

## Svelte implementation
The `RouterComponent` takes optional slot argument and exposes both the `component` and the `props` as variables.

```html
<script>
  import RouterComponent from 'svelte-standalone-router';
</script>

<RouterComponent />
``` 
If you want to customize the implementation and perhaps add transitions or animations you can do so by using the exposed variables and utilizing the a `svelte:component` element.

NOTE: that svelte `{#key}` syntax does not exist in svelte `3.0.0`. Install `svelte@latest` to get the latest version and to be able to utilize that functionality. 

```html
<script>
  import RouterComponent from 'svelte-standalone-router';
</script>

<RouterComponent let:component let:props>
  {#key component}
    <div class="router" in:fade>
      <svelte:component this={component} {...props} />
    </div>
  {/key}
</RouterComponent>
``` 

### Changing routes
There is a few different ways to make a request to a route. First lets look at the `Actions` directive. The actions directive adds an on:click handler to the element it is used on. To reduce redundant code there are some fallbacks in place and it goes like this.

link:property : `to: '/first'` -> `href: '/second'`,
Element:attribute : `href="/third"` -> `data-href="/fourth"`

So it goes from link property `to`, then, `href`, then element attribute `href` and lastly data-attribute `data-href`. Why so complicated? Because on links we want to use the href attribute to reduce code, while on maybe buttons that according to the specs don't inmplement a href attribute. Now is that a problem using 'expando attributes', for some it might not, but for others arguing for correct semantics it perhaps would, i'm not the judge of that. Use the method that suits your needs.

The link `Action` also accepts an object of properties, but as the bare minimum it will fallback and use the `href` attribute to know which page to route to.
```html
<script>
  import { link } from 'svelte-standalone-router';
</script>
<a href="/about" use:link>about</a>
``` 

The link properties will always have precedence over the elements attributes. In the example below the page will navigate to `/contact`.
```html
<script>
  import { link } from 'svelte-standalone-router';
</script>
<a href="/about" use:link={{to: '/contact'}}>about</a>
``` 

Different ways of navigating with an example using a button.
```html
<script>
  import { link, navigate } from 'svelte-standalone-router';
</script>

<button href="/about" use:link>about</button>
<button data-href="/about" use:link>about</button>
<button use:link={{to: '/about'}}>about</button>
<button on:click={_ => navigate('/about')}>about</button>
``` 

You can also pass along a state object to the `Request` object.
```html
<script>
  import { link, navigate } from 'svelte-standalone-router';
</script>

<button use:link={{to: '/article', state: { id: 33 }}}>article</button>
```  
And to use it in a route it's available on the `Request` object, like so.
```js
app.get('/article', (req, res) => {
  res.send(ArticleComponent, { id: req.state.id })
});
``` 

The link implementation options.
```js
LinkOptions {
  type : String('navigate(default)|redirect')
  state : Object
  to : String
  href : String
}
```

Adding active class on active routes. The current location is stored in a svelte store. Compare that to the route to add an active class on the navigation link.
```html 
<script>
  import { location } from 'svelte-standalone-router';
</script>

<a href="/" use:link class:active={$location == '/'}>home</a>
<a href="/user" use:link class:active={$location.startsWith('/user')}>user</a>
```

### Programmatically changing routes
To programmatically navigate or redirect you have two functions to your exposure. The difference between the two is that `navigate` adds a record to the `History` object which means you can go back and forth in the history, while redirect does not add a record it just changes the current url.  

The helper implementation arguments
```
navigate(url : String, state : Object);
redirect(url : String, state : Object);
```
```js
  import { navigate, redirect } from 'svelte-standalone-router';
  navigate('/subpage');
  redirect('/subpage');
```

There also exists a `Navigate` and `Redirect` svelte components which is mure in tune with how a frontend library would do it. You can differentiate it by the fact that svelte-components needs to be Capitalized.

Like the link action you can use either `to` or `href` with the to prop having precedence. The components implement the helper functions so you can optionally pass a state prop.
```html
<script>
  import { Navigate, Redirect } from 'svelte-standalone-router';
</script>

{#if !expression}
  <Navigate to="/subpage" state={{ custom: 'state' }} />
{/if}
```

`mount` and `destroy` the popstate listener is as easy as calling their respective function.
```js
import { mount, destroy } from 'svelte-standalone-router';
// mount and destroy functions
mount();
destroy();
```

## Quick usage
```js
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
  res.send(Subpage, { slug: req.params.slug });
});
```

```html
<script>
  import RouterComponent from 'svelte-standalone-router';
</script>

<RouterComponent let:component let:props>
  {#key component}
    <div class="router" in:fade>
      <svelte:component this={component} {...props} />
    </div>
  {/key}
</RouterComponent>
```

Enable sirv for SPA with the flag '--single'
```js
"start": "sirv public --single"
```