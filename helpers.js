const dispatch = ({ state }) => {
  dispatchEvent(new CustomEvent('popstate', { 
    detail: {
      ...state
    } 
  }));
}
// extending the standalone router with custom 
// methods to perform certain tasks.
export const navigate = (url, state = {}) => {
  history.pushState(state, '', url);
  dispatch({ url, state }); 
}
export const redirect = (url, state = {}) => {
  history.replaceState(state, '', url);
  dispatch({ url, state });
}