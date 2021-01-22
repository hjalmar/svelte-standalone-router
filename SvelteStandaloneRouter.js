import StandaloneRouter from 'standalone-router';
export class SvelteStandaloneRouterError extends Error{}
export default class SvelteRouter extends StandaloneRouter{}

// setting a singleton class with properties for 'global' access
export let Router = new class RouterProperties{
  constructor(){
    this.__linkBase = '';
    this.__scrollReset = true;
    this.__scrollOffset = 0;
  }
  setLinkBase(value){
    if(typeof value != 'string'){
      throw new SvelteStandaloneRouterError(`Invalid 'linkBase'. Expecting value of type 'string'`);
    }
    return this.__linkBase = value.endsWith('/') ? value : value + '/';
  }
  set linkBase(value){
    return this.setLinkBase(value);
  }
  get linkBase(){
    return this.__linkBase;
  }
  
  // handle scroll reset
  setScrollReset(value){
    if(typeof value != 'boolean'){
      throw new SvelteStandaloneRouterError(`Invalid 'scrollReset'. Expecting value of type 'boolean'`);
    }
    return this.__scrollReset = value;
  }
  set scrollReset(value){
    return this.setScrollReset(value);
  }
  get scrollReset(){
    return this.__scrollReset;
  }

  // handle scroll reset
  setScrollOffset(value){
    if(typeof value != 'number'){
      throw new SvelteStandaloneRouterError(`Invalid 'scrollOffset'. Expecting value of type 'number'`);
    }
    return this.__scrollOffset = value;
  }
  set scrollOffset(value){
    return this.setScrollOffset(value);
  }
  get scrollOffset(){
    return this.__scrollOffset;
  }
} 