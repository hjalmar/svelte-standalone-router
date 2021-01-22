import { Router } from './SvelteStandaloneRouter';
import { navigate, redirect, replace, alter, getPathname, cleanURL } from './helpers.js';

export default (element, props) => {
  props = {
    type: 'navigate',
    state: {},
    title: '',
    ...props
  };

  if(Router.linkBase){
    // first we need to clean the url and add the linkbase. Thats so one can right click and
    // open the page in a new tab or window and go to the right url
    const clean = cleanURL(element.getAttribute('href') || '');
    element.setAttribute('href', clean);
  }
  
  const clickHandler = (e) => {
    // make the check before preventing default behaviour since we should not block 
    // the default behaviour if we don't supply the required url string
    let url = props.to || props.href || e.currentTarget.getAttribute('href') || e.currentTarget.getAttribute('data-href');
    if(!url){
      return;
    }
    // here we need to only get the pathname without any linkbase
    // because that is handled in the navigational helpers
    url = getPathname(url);
    e.preventDefault();
    if(props.type == 'navigate'){
      navigate(url, props.state, props.title);
    }else if(props.type == 'redirect'){
      redirect(url, props.state, props.title);
    }else if(props.type == 'replace'){
      replace(url, props.state, props.title);
    }else if(props.type == 'alter'){
      alter(url, props.state, props.title);
    }else{
      console.warn(`Invalid 'use:link' type. Expecting 'navigate'(default), 'redirect', 'replace' or 'alter'`);
      return;
    }
  }
  element.addEventListener('click', clickHandler);
  return {
    update(parameters){
      props = {
        ...props,
        ...parameters
      }
    },
    destroy(){element.removeEventListener('click', clickHandler);}
  }
}