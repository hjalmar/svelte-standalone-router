<script>
  import { tick } from 'svelte';
  import RouterContext, { Router, SvelteStandaloneRouterError } from './SvelteStandaloneRouter.js';
  import { contexts, prev } from './router.js';
  import { internalGoTo } from './helpers.js';

  // as default get the first value from the contexts since a Map remembers the insertion 
  // order. this works as a way to fallback to the first context if none is provided
  export let context = contexts.keys().next().value;
  
  if(!context || !(context instanceof RouterContext)){
    throw new Error(`Invalid Router context. Did you initialize the component with a valid context?`);
  }
  const { component } = contexts.get(context);

  context.subscribe(async (callback, props = {}, decorator = {}) => {
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
      decorator: !decorator.component ? undefined : decorator.component,
      decoratorProps: decorator.props || undefined,
      props
    });

    // if we have visited a a url with a hash in it
    // we need to await a tick so the component is loaded
    // before we can scroll to that place in the dom
    if(window.location.hash){
      await tick();
      // but we also have this weird behaviour where the location pathname is
      // not accessible so we need to pass it manually.
      setTimeout(() => {internalGoTo(window.location.pathname + window.location.hash)}, 0); 
    }

    // flag that we have a first load
    if(!prev.firstLoad){
      prev.firstLoad = true;
    }
  });
</script>

{#if $component}
  <slot component={$component.context} props={$component.props} decorator={$component.decorator} decoratorProps={$component.decoratorProps}>
    {#if $component.decorator}
      <svelte:component this={$component.decorator} {...($component.decoratorProps ? $component.decoratorProps : {})}>
        <svelte:component this={$component.context} {...$component.props} />
      </svelte:component>
    {:else}
      <svelte:component this={$component.context} {...$component.props} />
    {/if}
  </slot>
{/if}