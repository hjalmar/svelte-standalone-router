<script>
  import { writable } from 'svelte/store';
  import { component, context } from './router.js';
  if(!context){
    throw new Error(`Invalid Router context. Did you initialize the router?`);
  }
  export const unsubscribe = context.subscribe((callback, props = {}) => {
    component.set({
      context: class extends callback{},
      props
    });
  });
</script>
{#if $component}
  <svelte:component this={$component.context} {...$component.props}></svelte:component>
{/if}