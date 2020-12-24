import { Router } from './SvelteStandaloneRouter.js';

// dispatch custom event
const dispatch = ({ state }) => {
  dispatchEvent(new CustomEvent('popstate', { 
    detail: {
      ...state
    } 
  }));
}

// navigate to a new page and pushing it to the History object
export const navigate = (url, state = {}) => {
  url = cleanURL(url);
  history.pushState(state, '', url);
  dispatch({ url, state }); 
}
// redirect to a new page and replacing it on the History object
export const redirect = (url, state = {}) => {
  url = cleanURL(url);
  history.replaceState(state, '', url);
  dispatch({ url, state });
}

// replace all duplicate '/' that might be going on
export const cleanURL = (url) => `/${Router.linkBase}/${url}`.replace(/[\/]+/g, '/');