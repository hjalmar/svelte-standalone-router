const dispatch = (url, state, title) => {
  dispatchEvent(new CustomEvent('popstate', { 
    detail: {
      // url,
      title,
      params: { ...state }
    } 
  }));
}
// extending the standalone router with custom 
// methods to perform certain tasks.
export const navigate = (url, state = {}, title = '') => {
  history.pushState(state, title, url);
  dispatch(url, state, title); 
}
export const redirect = (url, state = {}, title = '') => {
  history.replaceState(state, title, url);
  dispatch(url, state, title);
}