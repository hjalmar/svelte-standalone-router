import Router from './SvelteStandaloneRouter.js';
export default (element, props) => {
  const clickHandler = (e) => {
    e.preventDefault();
    // replace all duplicate '/' that might be going on
    const href = `/${Router.linkBase}/${e.currentTarget.getAttribute('href')}`.replace(/[\/]+/g, '/');
    if(!href){
      return;
    }
    history.pushState(null, '', href);
    dispatchEvent(new Event('popstate'));
  }
  element.addEventListener('click', clickHandler);
  return {
    update(parameters){},
    destroy(){element.removeEventListener('click', clickHandler);}
  }
}