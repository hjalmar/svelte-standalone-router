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
    component.set({
      context: class extends callback{},
      props
    });
  });
</script>

{#if $component}
  <slot component={$component.context} props={$component.props}>
    <svelte:component this={$component.context} {...$component.props}></svelte:component>
  </slot>
{/if}