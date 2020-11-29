import Router from 'standalone-router';
import context, { location } from './router.js';
import RouterComponent from './router.svelte';
import link from './link.js';

class SvelteStandaloneRouterError extends Error{}
class SvelteRouter extends Router{
  static __linkBase = '';
  static setLinkBase(value){
    if(typeof value != 'string'){
      throw new SvelteStandaloneRouterError(`Invalid 'linkBase'. Expecting value of type 'string'`);
    }
    return SvelteRouter.__linkBase = value;
  }
  static set linkBase(value){
    return SvelteRouter.setLinkBase(value);
  }
  static get linkBase(){
    return SvelteRouter.__linkBase;
  }
}

// svelte component
export default RouterComponent;

// js implementations
export { 
  SvelteRouter as Router,
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