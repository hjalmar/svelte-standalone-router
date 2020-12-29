import { Router } from './SvelteStandaloneRouter.js';
import context, { location, mount, destroy } from './router.js';
import RouterComponent from './router.svelte';
import link from './link.js';
import { redirect, navigate, replace } from './helpers.js';

import Redirect from './redirect.svelte';
import Navigate from './navigate.svelte';

// svelte component
export default RouterComponent;

// js implementations
export { 
  // Router globals
  Router,
  // api
  context,
  link,
  location,
  mount, 
  destroy,
  // helpers
  redirect,
  navigate,
  replace,
  // svelte components
  Redirect,
  Navigate,
 };