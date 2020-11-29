import Router from './SvelteStandaloneRouter.js';
import { writable } from 'svelte/store';

export let contexts = new Map();
export let location = writable();
let initialized = false;

// the popstate callback handler
const popstateHandler = e => {
  location.set(window.location.pathname);
  contexts.forEach(context => context.router.execute(window.location.pathname));
};

// if the popstate listener has been destroy 'mount' readds the listener 
export const mount = () => {
  if(!initialized){
    // mark it initialized and update the locaiton store with the current pathname
    initialized = true;
    location.set(window.location.pathname);
    window.addEventListener('popstate', popstateHandler);
  }
}

// destroy a current listener
export const destroy = () => {
  initialized = false;
  window.removeEventListener('popstate', popstateHandler);
}

// mount on the first load to avoid having 
// the user doing it manually
mount();

// export the context creator "wrapper"
export default (options) => {
  const router = new Router(options);
  contexts.set(router, {
    component: writable(),
    router
  });
  return router;
};