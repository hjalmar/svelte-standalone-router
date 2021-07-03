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
    
    const decoratorWrapper = (fn) => (req, res) => {
      let _dProps = undefined;
      let _props = undefined;
      let _component = undefined;
      fn(req, { send: (component, props) => {
        _component = component; 
        _props = props;
        res.send(_component, _props, { component: decorator, props: _dProps });
      }, error: res.error }, (dprops) => _dProps = dprops);
    }
    
    // wrapping a callback in a decorator
    if(typeof url == 'function'){
      return decoratorWrapper(url);
    }
    
    const callback = fns.pop();
    context.get(url, ...[...middleware, ...fns], decoratorWrapper(callback));
    return {
      get: (_url, ...args) => wrappedCall(`${root}/${_url}`, ...args)
    };
  }
  return wrappedCall;
}