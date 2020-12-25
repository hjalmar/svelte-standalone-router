<script>
  import { onDestroy } from 'svelte';
  import { link, Redirect } from 'svelte-standalone-router';
  export let time = 10;
  const interval = setInterval(() => {
    time--;
    if(!time){
      clearInterval(interval);
    }
  }, 1000);

  // clear the interval
  onDestroy(() => clearInterval(interval));
</script>

<h1>Page not found</h1>
<p>This is a page which demonstrates how to catch and handle routing errors.</p>
<button href="/" use:link={{ state: { type: 'click' } }}>Go back home ({time})</button>

{#if !time}
  <Redirect to="/" state={{ type: 'redirect' }} />
{/if}