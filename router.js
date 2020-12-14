import Router from './SvelteStandaloneRouter.js';
import { tick } from 'svelte';
import { writable } from 'svelte/store';

export let prevLocation = { ...window.location, firstLoad: false };
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
const popstateHandler = async e => {
  // if the location.hash is defined we don't want to execute any routing
  // if we are on the same route. Then we simply want to jump to that section
  // using the proper browser behaviour
  if(window.location.hash != '' && window.location.pathname == prevLocation.pathname){
    return;
  }
  // mark that we have already had our first load to prevent unwanted triggers when 
  // it's not forced manually by the user.
  prevLocation.firstLoad = true;

  // reset the scroll position depending on the static scrollReset value
  if(Router.scrollReset){
    // always start from the top of the page
    window.scrollTo({ top: 0 });
    // we need to await atick here so the sroll even finishes
    await tick();
  }

  // update location and execute the router contexts
  location.set(getPathname(window.location.pathname));
  contexts.forEach(context => context.router.execute(window.location.pathname, e.detail));
  // keep the previous location history
  prevLocation = { ...prevLocation, ...window.location };
  // wait for the current tick so we know the dom is loaded
  await tick();
  const target = window.location.hash.slice(1);
  if(target){
    const element = document.querySelector(`a[name="${target}"], #${target}`);
    if(element){
      const topPos = element.getBoundingClientRect().top + window.pageYOffset;
      window.scrollTo({ top: topPos });
    }
  }
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