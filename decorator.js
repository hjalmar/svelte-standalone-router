import { contexts } from './router.js';
import SvelteStandaloneRouter from './SvelteStandaloneRouter.js';

export default (context, ...middleware) => {
  let decorator;
  // if no context is provided
  if(!(context instanceof SvelteStandaloneRouter)){
    // then the context is actually the decorator
    decorator = context;
    // and so we get the first context from the context Map
    context = contexts.keys().next().value;
  }else{
    // but if we have a context the decorator is located at the first position
    // of the middlewares so we need to remove it and define it as the decorator
    decorator = middleware.shift();
  }
  if(!context){
    throw new Error(`Invalid Router context. Did you initialize the decorator with a valid context? or made sure to call it after one has been created?`);
  }
  // we need to keep track of the root url else 
  // everything would become nested one level deeper
  let root = '';
  const wrappedCall = (url, ...fns) => {
    // define the root of the chaining
    if(!root) root = url;
    let decoratorProps;
    let decoratorPropsCallback = (props) => {
      decoratorProps = { ...props };
    };

    const _decorator = { component: decorator };
    
    // NOTE: this resets decorator props. So those needs 
    // to be defined once again if e.g called in a error catch
    if(typeof url == 'function'){
      return (req, res) => url(req, {
        send: (component, props) => {
          if(decoratorProps){
            _decorator.props = decoratorProps
          }
          res.send(component, props, _decorator)
        },
        error: res.error
      }, decoratorPropsCallback);
    }
    
    const callback = fns.pop();
    context.get(url, ...[...middleware, ...fns], (req, res) => {
      callback(req, {
        send: (component, props) => { 
          if(decoratorProps){
            _decorator.props = decoratorProps
          }
          res.send(component, props, _decorator);
        },
        error: res.error
      }, decoratorPropsCallback);
    });
    return {
      get: (_url, ...args) => wrappedCall(`${root}/${_url}`, ...args)
    };
  }
  return wrappedCall;
}