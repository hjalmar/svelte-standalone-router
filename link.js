import { navigate, redirect, replace, alter } from './helpers.js';

export default (element, props) => {
  props = {
    type: 'navigate',
    state: {},
    title: '',
    ...props
  };
  const clickHandler = (e) => {
    // make the check before preventing default behaviour since we should not block 
    // the default behaviour if we don't supply the required url string
    const url = props.to || props.href || e.currentTarget.getAttribute('href') || e.currentTarget.getAttribute('data-href');
    if(!url){
      return;
    }
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