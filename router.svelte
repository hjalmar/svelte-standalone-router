<script>
  import Router from './SvelteStandaloneRouter';
  import { contexts } from './router.js';

  // as default get the first value from the contexts since a Map remembers the insertion 
  // order. this works as a way to fallback to the first context if none is provided
  export let context = contexts.keys().next().value;

  if(!context || !(context instanceof Router)){
    throw new Error(`Invalid Router context. Did you initialize the component with a valid context?`);
  }
  const { component } = contexts.get(context);
  export const unsubscribe = context.subscribe((callback, props = {}) => {
    // implement the option to either force a reload or use the already loaded
    // component that's already been mounted at some point. By default svelte does not mount 
    // a new instance so we have to do that manually by instead of passing a svelte component,
    // pass an object with a 'component' and a 'force' property to force a new instance.
    let _callback = callback;
    // we are using an object 
    if(callback.hasOwnProperty('component')){
      _callback = callback.component;
    }
    // force a new instance if force is true
    if(callback.force == true){
      _callback = class extends _callback{};
    }
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