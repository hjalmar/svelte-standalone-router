import router from './router.js';
import Router from './router.svelte';
import link from './link.js';

// svelte component
export default Router;

// js implementations
export { 
  router,
  link,
 };

// extending the standalone router with custom 
// methods to perform certain tasks.
export const navigate = (url, state, title) => {
  history.pushState(state || {}, title || '', url); 
  dispatchEvent(new Event('popstate'));
}

export const redirect = (url, state, title) => {
  history.replaceState(state || {}, title || '', url);
  dispatchEvent(new Event('popstate'));
}