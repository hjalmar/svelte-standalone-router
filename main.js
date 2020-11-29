import Router from './SvelteStandaloneRouter.js';
import context, { location } from './router.js';
import RouterComponent from './router.svelte';
import link from './link.js';

// svelte component
export default RouterComponent;

// js implementations
export { 
  Router,
  context,
  link,
  location,
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