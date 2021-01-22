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
  import Guides from './pages/usage.svx';
  import Error from './pages/error.svelte';

  Router.scrollOffset = 100;
  Router.linkBase = '/svelte-standalone-router';
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
  documentation('/how-to/guides', (req, res) => res.send(Guides));
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
