<script>
  import { onMount } from 'svelte';
  import RouterContext, { Router, SvelteStandaloneRouterError } from './SvelteStandaloneRouter';
  import { contexts, prev } from './router.js';
  import { internalGoTo } from './helpers.js';

  // as default get the first value from the contexts since a Map remembers the insertion 
  // order. this works as a way to fallback to the first context if none is provided
  export let context = contexts.keys().next().value;
  
  if(!context || !(context instanceof RouterContext)){
    throw new Error(`Invalid Router context. Did you initialize the component with a valid context?`);
  }
  const { component } = contexts.get(context);

  // store the current/previous pathname to compare with the next route that wants to get loaded 
  context.subscribe(async (callback, props = {}, decorator) => {
    // a dirty check to see it is a "component". Since there is not way to check if it is a svelte component
    // this would atleast force it to be a function and will catch most errors where a svelte component isn't passed
    if(typeof callback != 'function'){
      throw new SvelteStandaloneRouterError(`Unable to load component. Did you pass a valid svelte component to the 'send' response?`);
    }
    
    // reset the scroll position depending on the static scrollReset value
    if(Router.scrollReset){
      // always start from the top of the page
      window.scrollTo({ top: 0 });
    }

    // update the writable store
    component.set({
      context: decorator ? callback : class extends callback{},
      decorator: !decorator ? undefined : class extends decorator{},
      props
    });

    // flag that we have a first load
    if(!prev.firstLoad){
      prev.firstLoad = true;
    }
  });

  onMount(() => {
    // NOTE: we have to this settimeout hack to move the 
    // execution to the end of the call stack. on load the #hash 
    // take some time before finishing, and sveltes tick does not
    // register it, perhaps because it's a scroll event? either way
    // back of the call-stack and it works as expected.
    setTimeout(_ => internalGoTo(window.location.pathname + window.location.hash), 0);
  })
</script>

{#if $component}
  <slot component={$component.context} decorator={$component.decorator} props={$component.props}>
    {#if $component.decorator}
      <svelte:component this={$component.decorator}>
        <svelte:component this={$component.context} {...$component.props}></svelte:component>
      </svelte:component>
    {:else}
      <svelte:component this={$component.context} {...$component.props}></svelte:component>
    {/if}
  </slot>
{/if}