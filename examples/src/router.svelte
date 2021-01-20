<script>
  import { fade } from 'svelte/transition';
  import RouterComponent, { context, Router, decorator } from 'svelte-standalone-router';

  // _layouts
  import _error from './_layout/_error.svelte';
  import _main from './_layout/_main.svelte';
  import _documentation from './_layout/_documentation.svelte';

  // pages
  import Index from './pages/index.svelte';
  import Documentation from './pages/documentation.svx';
  import Usage from './pages/usage.svx';
  import Contact from './pages/contact.svelte';
  import Error from './pages/error.svelte';


  // individual pages
  const pages = { Usage, Contact };

  // get the href attribute from <Base> element.
  // we use getAttribute('href') so we don't get the absolute url
  Router.linkBase = document.querySelector('base').getAttribute('href');
  Router.scrollOffset = 100;
  
  // implementaiton
  const app = context({
    initial: location.pathname,
    base: Router.linkBase,
  });
 
  // catch fallbacks
  app.catch((req, res, props) => res.send(Error, { time: 5 }));
  
  // decorators
  const main = decorator(_main);
  main('/', (req, res) => res.send(Index));
  // documentation
  const documentation = decorator(_documentation);
  documentation('/how-to/documentation', (req, res) => res.send(Documentation));
  documentation('/how-to/usage', (req, res) => res.send(Usage));

  main('/:page', (req, res) => {
    const string = req.params.page;
    const p = pages[(string && string.charAt(0).toUpperCase() + string.slice(1)) || 'Index'];
    if(!p){
      return res.error();
    }
    res.send(p);
  });
</script>

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
