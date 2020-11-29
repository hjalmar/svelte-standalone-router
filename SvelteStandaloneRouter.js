import Router from 'standalone-router';
export class SvelteStandaloneRouterError extends Error{}
export default class SvelteRouter extends Router{
  static __linkBase = '';
  static setLinkBase(value){
    if(typeof value != 'string'){
      throw new SvelteStandaloneRouterError(`Invalid 'linkBase'. Expecting value of type 'string'`);
    }
    return SvelteRouter.__linkBase = value;
  }
  static set linkBase(value){
    return SvelteRouter.setLinkBase(value);
  }
  static get linkBase(){
    return SvelteRouter.__linkBase;
  }
}