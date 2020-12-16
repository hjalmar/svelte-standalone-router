# Usage examples
Boilerplate examples to quickly get you started with implementing svelte-standalone-router in your project.

### <a name="installation" href="usage#installation">Installation</a>
Start by installing the library in your svelte project.
```js
npm i -D svelte-standalone-router
```

### <a name="basic" href="usage#basic">Basic</a>
Minimal example with static routes
```html
<!-- component.svelte -->
<script>
  import RouterComponent, { context } from 'svelte-standalone-router';

  // pages
  import Index from './pages/index.svelte';
  import About from './pages/about.svelte';
  import Contact from './pages/contact.svelte';
  import Error from './pages/error.svelte';

  // implementaiton
  const app = context({ initial: location.pathname });

  // catch fallbacks
  app.catch((req, res, props) => res.send(Error));

  // routes
  app.get('/', (req, res) => res.send(Index));
  app.get('/about', (req, res) => res.send(About));
  app.get('/contact', (req, res) => res.send(Contact));
</script>

<main>
  <RouterComponent />
</main>
```

### <a name="advanced" href="usage#advanced">Advanced example</a>
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