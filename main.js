import Router from './SvelteStandaloneRouter.js';
import context, { location, mount, destroy } from './router.js';
import RouterComponent from './router.svelte';
import link from './link.js';
import { redirect, navigate } from './helpers.js';

// svelte component
export default RouterComponent;

// js implementations
export { 
  Router,
  context,
  link,
  location,
  mount, 
  destroy,
  redirect,
  navigate
 };