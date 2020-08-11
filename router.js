import Router from 'standalone-router';
import { writable } from "svelte/store";

export const request = writable();
export const component = writable();
export let context = null;
export default (options) => {
  context = new Router(options);
  window.addEventListener('popstate', e => {
    context.execute(window.location.pathname);
  });
  return context;
};