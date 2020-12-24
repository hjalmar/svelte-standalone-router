import { navigate, redirect, cleanURL } from './helpers.js';

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
    // cleanup the url
    const href = cleanURL(url);
    if(!href){
      return;
    }
    if(props.type == 'navigate'){
      navigate(href, props.state, props.title);
    }else if(props.type == 'redirect'){
      redirect(href, props.state, props.title);
    }else{
      console.warn(`Invalid 'use:link' type. Expecting 'navigate'(default) or 'redirect'`);
      return;
    }
  }
  element.addEventListener('click', clickHandler);
  return {
    update(parameters){},
    destroy(){element.removeEventListener('click', clickHandler);}
  }
}