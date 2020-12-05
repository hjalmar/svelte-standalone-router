import Router from './SvelteStandaloneRouter.js';
import { navigate, redirect } from './helpers.js';

export default (element, props) => {
  props = {
    type: 'navigate',
    state: {},
    title: '',
    ...props
  };
  const clickHandler = (e) => {
    e.preventDefault();
    // replace all duplicate '/' that might be going on
    const href = `/${Router.linkBase}/${e.currentTarget.getAttribute('href')}`.replace(/[\/]+/g, '/');
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