import router, { context } from './router';
import Router from './router.svelte';
import link from './link';

// svelte component
export default Router;

// js implementations
export { 
  context,
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