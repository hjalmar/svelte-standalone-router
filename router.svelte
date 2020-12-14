<script>
  import Router, { SvelteStandaloneRouterError } from './SvelteStandaloneRouter';
  import { contexts, prevLocation } from './router.js';

  // as default get the first value from the contexts since a Map remembers the insertion 
  // order. this works as a way to fallback to the first context if none is provided
  export let context = contexts.keys().next().value;
  
  if(!context || !(context instanceof Router)){
    throw new Error(`Invalid Router context. Did you initialize the component with a valid context?`);
  }
  const { component } = contexts.get(context);
  // store the current/previous pathname to compare with the next route that wants to get loaded 
  context.subscribe((callback, props = {}) => {
    // implement the option to either force a reload or use the already loaded
    // component that's already been mounted at some point. By default svelte does not mount 
    // a new instance so we have to do that manually by instead of passing a svelte component,
    // pass an object with a 'component' and a 'force' property to force a new instance.
    let _callback = callback;
    // we are using an object 
    if(callback.hasOwnProperty('component')){
      _callback = callback.component;
    }
    // a dirty check to see it is a "component". Since there is not way to check if it is a svelte component
    // this would atleast force it to be a function and will catch most errors where a svelte component isn't passed
    if(typeof _callback != 'function'){
      throw new SvelteStandaloneRouterError(`Unable to load component. Did you pass a valid svelte component to the 'send' response?`);
    }
    // check if the current url pathname is the same and it's not forced. if it's the same don't do anything
    // because we are already on the current page. If we force it we want it to reload.
    if(location.pathname == prevLocation.pathname && prevLocation.firstLoad && callback.force != true){
      // we end early so we don't update the store
      return;
    }
    _callback = class extends _callback{};
    // update the writable store
    component.set({
      context: _callback,
      props
    });
  });
</script>

{#if $component}
  <slot component={$component.context} props={$component.props}>
    <svelte:component this={$component.context} {...$component.props}></svelte:component>
  </slot>
{/if}