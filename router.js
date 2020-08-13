import Router from 'standalone-router';
import { writable } from 'svelte/store';

export let contexts = new Map();
let initialized = false;

if(!initialized){
  initialized = true;
  window.addEventListener('popstate', e => {
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