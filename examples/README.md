# Usage examples
Boilerplate examples to quickly get you started with implementing svelte-standalone-router in your project.

### <a name="installation" href="#installation">Installation</a>
Start by installing the library in your svelte project.
```js
npm i -D svelte-standalone-router
```

> Remember that only if you want to modify the view before it's rendered is when you have to create your own `svelte:component`'s from the returned props. 
Otherwise simply initialize the `RouterComponent` and decorators and components work as is.

### <a name="basic" href="#basic">Basic</a>
Minimal example with static routes
```html
<!-- component.svelte -->
<script>
  import RouterComponent, { context } from 'svelte-standalone-router';

  // pages
  import Index from './pages/index.svelte';
  import About from './pages/about.svelte';
  import Contact from './pages/contact.svelte';
  import ErrorPage from './pages/error.svelte';

  // implementaiton
  const app = context({ initial: location.pathname });

  // catch fallbacks
  app.catch((req, res, props) => res.send(ErrorPage));

  // routes
  app.get('/', (req, res) => res.send(Index));
  app.get('/about', (req, res) => res.send(About));
  app.get('/contact', (req, res) => res.send(Contact));
</script>

<main>
  <RouterComponent />
</main>
```

### <a name="advanced" href="#advanced">Advanced example</a>
A more complex example showing how to preload data and decoupling business logic from the component and how to add a transition on route change by utilizing sveltes `#key` along with slotted parameters.
```html
<!-- component.svelte -->
<script>
  import { fade } from 'svelte/transition';
  import RouterComponent, { context, link } from 'svelte-standalone-router';

  // pages
  import Index from './pages/index.svelte';
  import DataPage from './pages/datapage.svelte';
  import ErrorPage from './pages/error.svelte';

  // implementaiton
  const app = context({ initial: location.pathname });

  // catch fallbacks
  app.catch((req, res, props) => res.send(ErrorPage, { message: props.message || 'unknown error' }));

  // routes
  app.get('/', (req, res) => res.send(Index));
  app.get('/:endpoint', async (req, res) => {
    try{
      // in a real world you would make sure the endpoint is of desired format and valid, but for the sake of simplify things lets use it as is
      const endpoint = `https://jsonplaceholder.typicode.com/${req.params.endpoint}/1`;
      // try fetching data
      const response = await fetch(endpoint);
      if(response.status != 200){
        throw new Error(`Invalid api request`);
      }
      const data = await response.json();
      // send response as props to DataPage
      res.send(DataPage, { data });
    }catch(error){
      // trigger error and send along some custom props
      res.error({ message: error.message });
    }
  });
</script>

<nav>
  <a href="/" use:link>Index</a>
  <a href="/todos" use:link>Todos</a>
  <a href="/users" use:link>Users</a>
  <a href="/posts" use:link>Posts</a>
  <a href="/invalid-endpoint" use:link>invalid endpoint</a>
</nav>

<main>
  <RouterComponent let:component let:props>
    {#key component}
      <div class="router" in:fade>
        <svelte:component this={component} {...props} />
      </div>
    {/key}
  </RouterComponent>
</main>
```

### <a name="decorators" href="#decorators">Decorators</a>
Often times it would be nice to be able to wrap your views in an outer `layout` wrapper. That is what decorators do. You define your 
wrapping component and your view will be loaded inside the default slot. This way you can toggle sidebar navigation or layout structure 
depending on what content your want to display.

```html
<!-- component.svelte -->
<script>
    // import the decorator helper function
  import { decorator } from 'svelte-standalone-router';
  // create a new decorator with the wrapping component. First argument is the layout(svelte-component)
  // and the following arguments are middleware attached to this decorator. so all calls will call 
  // with said applied middlewares.
  const main = decorator(_layout, hasAuth, logger);
  // create your new views with the decorator. The decorator 
  // works exactly like how you would use app.get('/', ...); 
  const root = main('/main', (req, res) => res.send(Index));
  // and just like normal get routes you can chain them together
  // they will then use the same decorator and concatenate the 
  // parent route with it's own route. i.e '/main/contact' in this case
  root.get('/contact', (req, res) => res.send(Contact));
  // however you could also do it like this which yields the same result
  main('/main/contact', (req, res) => res.send(Contact));
</script>

<main>
  <!-- Since decorator needs to be wrapped there is another slot property(let:decorator) passed back to the component. -->
  <RouterComponent let:decorator let:component let:props>
    {#key component}
      {#if decorator}
        <svelte:component this={decorator}>
          <div in:fade><svelte:component this={component} {...props}></svelte:component></div>
        </svelte:component>
      {:else}
        <div in:fade><svelte:component this={component} {...props}></svelte:component></div>
      {/if}
    {/key}
  </RouterComponent>
</main>
```

