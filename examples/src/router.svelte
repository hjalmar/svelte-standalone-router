<script>
  import { fade } from 'svelte/transition';
  import RouterComponent, { context, Router } from 'svelte-standalone-router';

  // pages
  import Index from './pages/index.svelte';
  import Documentation from './documentation.svx';
  import Usage from './pages/usage.svx';
  import Contact from './pages/contact.svelte';
  import Error from './pages/error.svelte';

  const pages = { Index, Documentation, Usage, Contact };

  // get the href attribute from <Base> element.
  // we use getAttribute('href') so we don't get the absolute url
  Router.linkBase = document.querySelector('base').getAttribute('href');
  
  // implementaiton
  const app = context({
    initial: location.pathname,
    base: Router.linkBase,
    state: { what: 'is state' }
  });
  
  // catch fallbacks
  app.catch((req, res, props) => res.send(Error, { time: 5 }));

  // middlewares
  app.use((req, res, next) => {
    console.log('Middleware logging the Request object.');
    console.log(req);
    console.log('--------------------------------------');
    console.log('');
    next();
  });

  // routes
  app.get(['/', '/:page'], async (req, res) => {
    // simulate an api request
    // await new Promise((resolve) => {
    //   setTimeout(() => {
    //     resolve();
    //   }, 1000);
    // });

    const string = req.params.page;
    const p = pages[(string && string.charAt(0).toUpperCase() + string.slice(1)) || 'Index'];
    if(!p){
      return res.error();
    }
    res.send(p);
  });
</script>

<RouterComponent let:component let:props>
  {#key component}
    <div class="router" in:fade={{ duration: 300 }}>
      <svelte:component this={component} {...props} />
    </div>
  {/key}
</RouterComponent>

<style>
  .router{
    width: 100%;
    max-width: 1500px;
    padding: 50px 80px;
    background-color: white;
    border-radius: 4px;
  }
</style>