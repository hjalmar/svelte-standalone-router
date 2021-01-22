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
  const wrappedCall = (url, ...fns) => {
    const callback = fns.pop();
    context.get(url, ...[...middleware, ...fns], (req, res) => {
      callback(req, {
        send: (component, props) => {
          res.send(component, props, decorator);
        },
        error: res.error
      });
    });
    return {
      get: (_url, ...args) => wrappedCall(url + _url, ...args)
    };
  }
  return wrappedCall;
}