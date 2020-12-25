<script>
  import { tick } from 'svelte';
  import RouterContext, { Router, SvelteStandaloneRouterError } from './SvelteStandaloneRouter';
  import { contexts, prev } from './router.js';

  // as default get the first value from the contexts since a Map remembers the insertion 
  // order. this works as a way to fallback to the first context if none is provided
  export let context = contexts.keys().next().value;
  
  if(!context || !(context instanceof RouterContext)){
    throw new Error(`Invalid Router context. Did you initialize the component with a valid context?`);
  }
  const { component } = contexts.get(context);
  
  // store the current/previous pathname to compare with the next route that wants to get loaded 
  context.subscribe(async (callback, props = {}) => {
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
      context: class extends callback{},
      props
    });

    // wait for the current tick so we know the dom is loaded
    await tick();
    const target = window.location.hash.slice(1);
    if(target){
      const element = document.querySelector(`a[name="${target}"], #${target}`);
      if(element){
        const topPos = element.getBoundingClientRect().top + window.pageYOffset;
        window.scrollTo({ top: topPos });
      }
    }

    // flag that we have a first load
    if(!prev.firstLoad){
      prev.firstLoad = true;
    }
  });
</script>

{#if $component}
  <slot component={$component.context} props={$component.props}>
    <svelte:component this={$component.context} {...$component.props}></svelte:component>
  </slot>
{/if}