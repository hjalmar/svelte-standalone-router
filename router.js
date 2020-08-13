import Router from 'standalone-router';
import { writable } from 'svelte/store';

export let contexts = new Map();
export let location = writable();
let initialized = false;

if(!initialized){
  initialized = true;
  location.set(window.location.pathname);
  window.addEventListener('popstate', e => {
    location.set(window.location.pathname);
    contexts.forEach(context => context.router.execute(window.location.pathname));
  });
}

export default (options) => {
  const router = new Router(options);
  contexts.set(router, {
    component: writable(),
    router
  });
  return router;
};