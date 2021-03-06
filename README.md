# Svelte Standalone Router
A standalone router based on https://github.com/hjalmar/standalone-router

```js
npm i -D svelte-standalone-router
```

Unlike the standalone router the implementation is done within a svelte component. Simply define your routes and middlewares as per the [standalone-router](https://github.com/hjalmar/standalone-router) documentation.

---

## <a name="library-implementation" href="#library-implementation">Library implementation</a>
Components and utilities the library exposes. As per the svelte specs all svelte components are Capitalized. 
```js
import RouterComponent, { context, decorator, link, navigate, redirect, replace, alter, location, mount, destroy Router, Navigate, Redirect, Replace, Alter } from 'svelte-standalone-router';
```

```
svelte-standalone-router {
  RouterComponent : svelte-component
  context : Function // creates a new router context
  decorator : Funcion // decorator creator 
  link : svelte-action // Action directive used on 'a' tags.
  navigate(path : String, state : Object ) : // push to History 
  redirect(path : String, state : Object ) : // replace History
  replace(path : String, state : Object ) : // change url push To History 
  alter(path : String, state : Object ) : // replace url replace History
  location : svelte-store
  mount() : Function // add popstate listener (it has to have been destroyed before being able to be added again)
  destroy() : Function //destroy current listener for popstate event
  Router : class SvelteStandaloneRouter (inherited from standalone-router library) 
  Navigate : svelte-component // to navigate to a route
  Redirect : svelte-component // to redirect to a route
  Replace : svelte-component // to replace a route
  Alter : svelte-component // to alter a route
}
```

---

## <a name="creating-a-router-context" href="#creating-a-router-context">Creating a router context</a>
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

---

## <a name="adding-routes" href="#adding-routes">Adding routes</a>
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

> A dynamic parameter catches everything for it's section and cannot be combined with or placed within a string. It has to start with a `:`, so a route like this `/articles/article-title-:id` is therefore invalid, by design! 

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

> `*` is not a wildcard you can place in the middle of the string. It is placed at the end to mark where it match up until and then anything else after that. So it's important in what order the routes are defined due to no ranking system in place in the library

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

Or to catch all requests. the route is actually '\*' so it catches everything. It is nothing more than a shorthand implementation for `app.get('/*', (req, res) => ...)`.
```js
app.get((req, res) => {
  res.send(SvelteComponent);
});
```

---

## <a name="decorator" href="#decorator">Decorators</a>
Decorators are routes that are wrapped inside a parent component. The interface for creating a decorator is almost identical to creating get routes.
Let's start with a simple decorator route.

```js
// first we need to import the decorator helper function
import { decorator } from 'svelte-standalone-router';
// creating a general layout wrapper
const layout = decorator(_layout);
// we can now use that decorator to create our routes
layout('/', (req, res) => res.send(Index));
```

The decorator callback function exposes an additional third argument which is a function call that accepts properties. This is so we can pass props to the decorator at run time where props might change depending on conditions not yet known.

```js
layout('/', (req, res, props) => {
  // define props on the decorator. this has to be defined before 
  // responding with send and a component gets send to be rendered.
  props({
    props: 'prop defined on the decorator component'
  });
  // send our component to be rendered
  res.send(Index, { props: 'props on the inner component' });
});
```

There is some overloading going on behind the scenes due to the fact that we might need to register the route on the right context. 
Without the first argument being the context, the context defaults back to the first one defined, the same as it does for the `RouterComponent`.

Let's take a look at how the overloading is handled internally. You can see the pattern that it shifts the first argument if a context is provided or not.
```js
// the first argument needs to be a context if not wanting to default back to the first one defined
// otherwise the first argument is the decorator component. and lastly all the rest arguments are
// middlewares executed for every route under this decorator
const layout = decorator(app, _layout, loggerMiddleware, hasAuthMiddleware, ...);
// without the first argument being the context
const layout = decorator(_layout, loggerMiddleware);
// without middlewares
const layout = decorator(_layout);
```

And just as with get routes you can apply middlewares to that as well. So you aren't limited to only be applying middlewares to the decorator in this case.
```js
// apply inline middlewares
layout('/user', hasAuth, log, (req, res) => res.send(Index));
```

It's also possible like get routes to chain them together

```js
const user = layout('/user', hasAuth, log, (req, res) => res.send(Index));
// becomes '/user/profile' that is decorated with the '_layout' component
user.get('/profile', ...)
// '/user/settings'
user.get('/settings', ...);

```

> Note that inline middlewares are only attached to that particular route, however in the case of decorators, middlewares attached to the decorator will be applied to the route as well. And if it isn't obvious the middleware order is, global `app.use` middlewares executes first in order they are defined, followed by `decorator middlewares` and lastly, the `inline middlewares` attached on the route itself.

---

## <a name="request-object" href="#request-object">Request object</a>
The request object exposes everything related to the request. This you can use to determin if you want to preload data, what component to load or error out when a request does not meet the requirements.
```js
Request{
  base : String // current base
  params : Object // params from the request
  path : String // current pathname
  route : String // what route that got triggered, for instance: "/route/:param"
  // defined with the use:link action or with the navigate or redirect helper functions
  state : Object // the state object. unlike the get params that is the arguments attached to the route/pathname, this is the custom data you sent along with the request
  query : Object // query parameters for the request. i.e ?query=search&parameters=search string. Same keys will group values as an Array.
}
```

---

## <a name="response-object" href="#response-object">Response object</a>
The response object is responsible for handling the response. Currently you can send the component and its props to the router or as an error.
```js
Response{
  send : Function(Component : svelte-component, props : Object)
  error : Function(props : Object)
}
```

---

## <a name="base-and-linkbase" href="#base-and-linkbase">Base and linkbase</a>
If you are deploying your site to the root no extra configuration has to be done to make it work. But on the occasions where you want to deploy it under a subdirectory you would want to defined the `base` and or perhaps the `linkBase` to cater to that location.

Let's start with base. Lets deploy our app under `/project`, so we would access our site under `https://example.com/project`.
```js
const app = context({
  initial: location.pathname,
  base: '/project'
});
```

This does not reflect the `linkBase`. It's implementation is separated due to the instances where you don't want the `use:link` action directive to reflect that, and the reason why they both aren't affected by setting the base property.

The linkBase is set on the router-settings object. This will make all helpers like `navigate`, `redirect` and `link` prefix everything under `/project`. 
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
Or how about dynamically depending on the base of your index.html

Since setting the linkBase returns the just defined string you can combine it with the base property.
```js
// get the href attribute from <Base> element.
// we use getAttribute('href') so we don't get the absolute url
Router.linkBase = document.querySelector('base').getAttribute('href'); 

// add the linkBase as base to the context
const app = context({
  initial: location.pathname,
  base: Router.linkBase
});
```

---

## <a name="scroll-reset" href="#scroll-reset">Scroll reset</a>
By default the router will scroll back top on every route change. You can toggle it off if you want to implement your own scroll behaviour or want to load the component in place, as is.

Like linkBase, that setting is statically defined on the Router class.
```js
Router.scrollReset = false;
```
or with the `setScrollReset` function. 
```js
Router.setScrollReset(false);
```

---

## <a name="scroll-offset" href="#scroll-offset">Scroll offset</a>
Scroll offset is the offset applied after an internal hash-route has taken place. One might have a sticky header or some fixed overlapping element after scrolling which would overlap the content at the hash link destination. The offset value is defined on the `Router` instance and only accepts a `Number` as value.
```js
Router.scrollOffset = 100;
```
or with the `setScrollOffset` function. 
```js
Router.setScrollOffset(100);
```

---

## <a name="state-object" href="#state-object">State object</a>
On every request you can pass a states object and so does the initial request by the `state` property passed to the context creation.
```js
// add custom state on the initial request
const app = context({
  initial: location.pathname,
  state: { custom: 'initial state' }
});
```
---

## <a name="catching-errors" href="#catching-errors">Catching errors</a>
> At this point decorators only work on get routes. Hoping to add it to catch routes in future updates as well.

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

---

## <a name="middlewares" href="#middlewares">Middlewares</a>
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
  res.error({ message: 'Unauthorized' });
});
```

Instead of globally on each and every route you can attache the middleware on to the route itself. A middleware is simple a function, the same function used as the callback argument on the `use` method.
```js
// a hasAuth middleware
const hasAuth = (req, res, next) => {
  if(auth){
    return next();
  }
  res.error({ message: 'Unauthorized' });
}

// applying the middleware to a route
app.get('/user', hasAuth, (req, res) => {
  res.send(Component)
});
```

---

## <a name="svelte-implementation" href="#svelte-implementation">Svelte implementation</a>
The `RouterComponent` takes optional slot argument and exposes both the `decorator`, `component` and `props` as variables.

```svelte
<script>
  import RouterComponent from 'svelte-standalone-router';
</script>

<RouterComponent />
``` 
If you want to customize the implementation and perhaps add transitions or animations you can do so by using the exposed variables and utilizing the `svelte:component` element.

> svelte `{#key}` syntax does not exist in svelte `3.0.0`. Install `svelte@latest` to get the latest version and to be able to utilize that functionality. 


```svelte
<script>
  import RouterComponent from 'svelte-standalone-router';
</script>

<RouterComponent let:decorator let:decoratorProps let:component let:props>
  {#key component}
    {#if decorator}
      <svelte:component this={decorator} {...decoratorProps}>
        <div in:fade><svelte:component this={component} {...props} /></div>
      </svelte:component>
    {:else}
      <div in:fade><svelte:component this={component} {...props} /></div>
    {/if}
  {/key}
</RouterComponent>
``` 

---

## <a name="changing-routes" href="#changing-routes">Changing routes</a>
There is a few different ways to make a request to a route. First lets look at the `Actions` directive. The actions directive adds an on:click handler to the element it is used on. To reduce redundant code there are some fallbacks in place and it goes like this.

link:property : `to: '/first'` -> `href: '/second'`,
Element:attribute : `href="/third"` -> `data-href="/fourth"`

So it goes from link property `to`, then, `href`, then element attribute `href` and lastly data-attribute `data-href`. Why so complicated? Because on links we want to use the href attribute to reduce code, while on maybe buttons that according to the specs don't implement a href attribute. Is that such a problem using 'expando attributes'? for some it might not, but for others arguing for correct semantics it perhaps would, i'm not the judge of that. Use the method that suits your needs.

The link `Action` also accepts an object of properties, but as the bare minimum it will fallback and use the `href` attribute to know which page to route to.
```svelte
<script>
  import { link } from 'svelte-standalone-router';
</script>
<a href="/about" use:link>about</a>
``` 

The link properties will always have precedence over the elements attributes. In the example below the page will navigate to `/contact`.
```svelte
<script>
  import { link } from 'svelte-standalone-router';
</script>
<a href="/about" use:link={{to: '/contact'}}>about</a>
``` 

Different ways of navigating with an example using a button.
```svelte
<script>
  import { link, navigate } from 'svelte-standalone-router';
</script>

<button href="/about" use:link>about</button>
<button data-href="/about" use:link>about</button>
<button use:link={{to: '/about'}}>about</button>
<button on:click={_ => navigate('/about')}>about</button>
``` 

You can also pass along a state object to the `Request` object.
```svelte
<script>
  import { link } from 'svelte-standalone-router';
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
  type : String('navigate(default)|redirect|replace|alter')
  state : Object
  to : String
  href : String
}
```

Adding active class on active routes. The current location is stored in a svelte store. Compare that to the route to add an active class on the navigation link.
```svelte 
<script>
  import { location } from 'svelte-standalone-router';
</script>

<a href="/" use:link class:active={$location == '/'}>home</a>
<a href="/user" use:link class:active={$location.startsWith('/user')}>user</a>
```

---

## <a name="programmatically-changing-routes" href="#programmatically-changing-routes">Programmatically changing routes</a>
To programmatically navigate or redirect you have two functions to your exposure. The difference between the two is that `navigate` adds a record to the `History` object which means you can go back and forth in the history, while `redirect` does not add a record, it just changes the current url. 

Also where one wants to change the url without triggering a route change there is the `replace` and `alter` functions. Where `replace` will change the url and add a record to the History object and `alter` will change the url but don't add a record on to the History object.

The helper implementation arguments
```js
navigate(url : String, state : Object);
redirect(url : String, state : Object);
replace(url : String, state : Object);
alter(url : String, state : Object);
```
```js
import { navigate, redirect, replace, alter } from 'svelte-standalone-router';
navigate('/subpage');
redirect('/subpage');
replace('/subpage');
alter('/subpage');
```

There also exists a `Navigate`, `Redirect`, `Replace` and `Alter` svelte components that implement the same logic as the link/navigation methods. You can differentiate it by the fact that svelte-components needs to be Capitalized.

Like the link action you can use either `to` or `href` with the `to` prop having precedence. The components implement the helper functions so you can optionally pass a state prop.
```svelte
<script>
  import { Navigate, Redirect, Replace, Alter } from 'svelte-standalone-router';
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

--- 

## <a name="quick-usage" href="#quick-usage">Quick usage</a>

```svelte
<script>
  import RouterComponent, { context } from 'svelte-standalone-router';

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
</script>

<RouterComponent />
```

Enable sirv for SPA with the flag `--single`
```js
"start": "sirv public --single"
```