import RouterContext from './SvelteStandaloneRouter.js';
import { internalGoTo, getPathname, cleanURL } from './helpers.js';
import { writable } from 'svelte/store';

export let prev = { location: { ...window.location }, firstLoad: false };
export let contexts = new Map();
export let location = writable();

let initialized = false;
let firstLoad = false;

// handle internal # links
const internalLinksHandler = (e) => {
  const target = e.target;
  if(target.tagName == 'A'){
    const href = target.getAttribute('href');
    const isHashLink = href.indexOf('#') > -1;
    if(!(/^[a-zA-Z]+\:\/\/(.*)/.test(href)) && isHashLink){
      // go to position
      internalGoTo(href.startsWith('#') ? window.location.pathname + href : href, e);
      // update the prev data
      prev.location = { ...window.location };
    }
  }
}

// the popstate callback handler
const popstateHandler = async e => {
  let endEarly = false;
  const sameURL = cleanURL(window.location.pathname + '/') == cleanURL(prev.location.pathname + '/') && prev.location.search == window.location.search;
  // don't continue if we are doing internal hash linking
  if(window.location.hash != '' && sameURL && prev.firstLoad){
    endEarly = true;
  }

  // if the hash is empty and not the same as the previous and it's on the same url we 
  // don't want to load a new page, then we simply end early and scroll to the top.
  if(window.location.hash == '' && window.location.hash != prev.location.hash && sameURL){
    endEarly = true;
    window.scrollTo({ top: 0 });
  }

  // if we don't end early we want to update the router contexts
  if(!endEarly){
    // update location and execute the router contexts
    location.set(getPathname(window.location.pathname));
    contexts.forEach(context => context.router.execute(window.location.pathname, e.detail));
  }

  // update the prev data
  prev.location = { ...window.location };
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
    window.addEventListener('click', internalLinksHandler);
  }
}

// destroy a current listener
export const destroy = () => {
  initialized = false;
  window.removeEventListener('popstate', popstateHandler);
  window.removeEventListener('click', internalLinksHandler);
}

// export the context creator "wrapper"
export default (options) => {
  // mount on the first load to avoid having 
  // the user doing it manually
  mount();
  // creates a new context
  const router = new RouterContext(options);
  contexts.set(router, {
    component: writable(),
    router
  });
  return router;
};