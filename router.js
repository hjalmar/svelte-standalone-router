import Router from './SvelteStandaloneRouter.js';
import { writable } from 'svelte/store';

export let contexts = new Map();
export let location = writable();
let initialized = false;
let firstLoad = false;
// handle the linkBase in pathname
const getPathname = (path) => {
  const re = new RegExp(`^${Router.linkBase}`, 'i');
  path = `/${path}/`.replace(/[\/]+/g, '/').replace(re, '').replace(/^\/|\/$/g, '');
  return '/' + path;
}
// the popstate callback handler
const popstateHandler = e => {
  location.set(getPathname(window.location.pathname));
  contexts.forEach(context => context.router.execute(window.location.pathname, e.detail));
};

// if the popstate listener has been destroy 'mount' re-adds the listener 
export const mount = async () => {
  if(!initialized){
    // mark it initialized and update the location store with the current pathname
    initialized = true;
    if(!firstLoad){
      firstLoad = true;
      location.set(getPathname(window.location.pathname));
    }
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