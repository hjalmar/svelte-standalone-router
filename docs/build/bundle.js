
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    const identity = x => x;
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function validate_store(store, name) {
        if (store != null && typeof store.subscribe !== 'function') {
            throw new Error(`'${name}' is not a store with a 'subscribe' method`);
        }
    }
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop;
        }
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function component_subscribe(component, store, callback) {
        component.$$.on_destroy.push(subscribe(store, callback));
    }
    function create_slot(definition, ctx, $$scope, fn) {
        if (definition) {
            const slot_ctx = get_slot_context(definition, ctx, $$scope, fn);
            return definition[0](slot_ctx);
        }
    }
    function get_slot_context(definition, ctx, $$scope, fn) {
        return definition[1] && fn
            ? assign($$scope.ctx.slice(), definition[1](fn(ctx)))
            : $$scope.ctx;
    }
    function get_slot_changes(definition, $$scope, dirty, fn) {
        if (definition[2] && fn) {
            const lets = definition[2](fn(dirty));
            if ($$scope.dirty === undefined) {
                return lets;
            }
            if (typeof lets === 'object') {
                const merged = [];
                const len = Math.max($$scope.dirty.length, lets.length);
                for (let i = 0; i < len; i += 1) {
                    merged[i] = $$scope.dirty[i] | lets[i];
                }
                return merged;
            }
            return $$scope.dirty | lets;
        }
        return $$scope.dirty;
    }
    function update_slot(slot, slot_definition, ctx, $$scope, dirty, get_slot_changes_fn, get_slot_context_fn) {
        const slot_changes = get_slot_changes(slot_definition, $$scope, dirty, get_slot_changes_fn);
        if (slot_changes) {
            const slot_context = get_slot_context(slot_definition, ctx, $$scope, get_slot_context_fn);
            slot.p(slot_context, slot_changes);
        }
    }
    function action_destroyer(action_result) {
        return action_result && is_function(action_result.destroy) ? action_result.destroy : noop;
    }

    const is_client = typeof window !== 'undefined';
    let now = is_client
        ? () => window.performance.now()
        : () => Date.now();
    let raf = is_client ? cb => requestAnimationFrame(cb) : noop;

    const tasks = new Set();
    function run_tasks(now) {
        tasks.forEach(task => {
            if (!task.c(now)) {
                tasks.delete(task);
                task.f();
            }
        });
        if (tasks.size !== 0)
            raf(run_tasks);
    }
    /**
     * Creates a new task that runs on each raf frame
     * until it returns a falsy value or is aborted
     */
    function loop(callback) {
        let task;
        if (tasks.size === 0)
            raf(run_tasks);
        return {
            promise: new Promise(fulfill => {
                tasks.add(task = { c: callback, f: fulfill });
            }),
            abort() {
                tasks.delete(task);
            }
        };
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function element(name) {
        return document.createElement(name);
    }
    function svg_element(name) {
        return document.createElementNS('http://www.w3.org/2000/svg', name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_style(node, key, value, important) {
        node.style.setProperty(key, value, important ? 'important' : '');
    }
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    const active_docs = new Set();
    let active = 0;
    // https://github.com/darkskyapp/string-hash/blob/master/index.js
    function hash(str) {
        let hash = 5381;
        let i = str.length;
        while (i--)
            hash = ((hash << 5) - hash) ^ str.charCodeAt(i);
        return hash >>> 0;
    }
    function create_rule(node, a, b, duration, delay, ease, fn, uid = 0) {
        const step = 16.666 / duration;
        let keyframes = '{\n';
        for (let p = 0; p <= 1; p += step) {
            const t = a + (b - a) * ease(p);
            keyframes += p * 100 + `%{${fn(t, 1 - t)}}\n`;
        }
        const rule = keyframes + `100% {${fn(b, 1 - b)}}\n}`;
        const name = `__svelte_${hash(rule)}_${uid}`;
        const doc = node.ownerDocument;
        active_docs.add(doc);
        const stylesheet = doc.__svelte_stylesheet || (doc.__svelte_stylesheet = doc.head.appendChild(element('style')).sheet);
        const current_rules = doc.__svelte_rules || (doc.__svelte_rules = {});
        if (!current_rules[name]) {
            current_rules[name] = true;
            stylesheet.insertRule(`@keyframes ${name} ${rule}`, stylesheet.cssRules.length);
        }
        const animation = node.style.animation || '';
        node.style.animation = `${animation ? `${animation}, ` : ''}${name} ${duration}ms linear ${delay}ms 1 both`;
        active += 1;
        return name;
    }
    function delete_rule(node, name) {
        const previous = (node.style.animation || '').split(', ');
        const next = previous.filter(name
            ? anim => anim.indexOf(name) < 0 // remove specific animation
            : anim => anim.indexOf('__svelte') === -1 // remove all Svelte animations
        );
        const deleted = previous.length - next.length;
        if (deleted) {
            node.style.animation = next.join(', ');
            active -= deleted;
            if (!active)
                clear_rules();
        }
    }
    function clear_rules() {
        raf(() => {
            if (active)
                return;
            active_docs.forEach(doc => {
                const stylesheet = doc.__svelte_stylesheet;
                let i = stylesheet.cssRules.length;
                while (i--)
                    stylesheet.deleteRule(i);
                doc.__svelte_rules = {};
            });
            active_docs.clear();
        });
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    function onDestroy(fn) {
        get_current_component().$$.on_destroy.push(fn);
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function tick() {
        schedule_update();
        return resolved_promise;
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }

    let promise;
    function wait() {
        if (!promise) {
            promise = Promise.resolve();
            promise.then(() => {
                promise = null;
            });
        }
        return promise;
    }
    function dispatch(node, direction, kind) {
        node.dispatchEvent(custom_event(`${direction ? 'intro' : 'outro'}${kind}`));
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }
    const null_transition = { duration: 0 };
    function create_in_transition(node, fn, params) {
        let config = fn(node, params);
        let running = false;
        let animation_name;
        let task;
        let uid = 0;
        function cleanup() {
            if (animation_name)
                delete_rule(node, animation_name);
        }
        function go() {
            const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
            if (css)
                animation_name = create_rule(node, 0, 1, duration, delay, easing, css, uid++);
            tick(0, 1);
            const start_time = now() + delay;
            const end_time = start_time + duration;
            if (task)
                task.abort();
            running = true;
            add_render_callback(() => dispatch(node, true, 'start'));
            task = loop(now => {
                if (running) {
                    if (now >= end_time) {
                        tick(1, 0);
                        dispatch(node, true, 'end');
                        cleanup();
                        return running = false;
                    }
                    if (now >= start_time) {
                        const t = easing((now - start_time) / duration);
                        tick(t, 1 - t);
                    }
                }
                return running;
            });
        }
        let started = false;
        return {
            start() {
                if (started)
                    return;
                delete_rule(node);
                if (is_function(config)) {
                    config = config();
                    wait().then(go);
                }
                else {
                    go();
                }
            },
            invalidate() {
                started = false;
            },
            end() {
                if (running) {
                    cleanup();
                    running = false;
                }
            }
        };
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);

    function get_spread_update(levels, updates) {
        const update = {};
        const to_null_out = {};
        const accounted_for = { $$scope: 1 };
        let i = levels.length;
        while (i--) {
            const o = levels[i];
            const n = updates[i];
            if (n) {
                for (const key in o) {
                    if (!(key in n))
                        to_null_out[key] = 1;
                }
                for (const key in n) {
                    if (!accounted_for[key]) {
                        update[key] = n[key];
                        accounted_for[key] = 1;
                    }
                }
                levels[i] = n;
            }
            else {
                for (const key in o) {
                    accounted_for[key] = 1;
                }
            }
        }
        for (const key in to_null_out) {
            if (!(key in update))
                update[key] = undefined;
        }
        return update;
    }
    function get_spread_object(spread_props) {
        return typeof spread_props === 'object' && spread_props !== null ? spread_props : {};
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const prop_values = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.31.0' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    const prepare = (base, route) => {
      // prefix the base to always start with a '/' and remove trailing slash
      base = '/'+base.replace(/^[\/]+|[\/]+$/g, '');
      // strip multiple occurences of '/'
      route = (`${base}/${route}`).replace(/[\/]+/g, '/');
      // remove leading and trailing slashes
      route = route.replace(/^[\/]+|[\/]+$/g, '');
      // get if it's explicit or not. could be a factor when determining route based on it's size/weight 
      // in terms of what has presedent when two routes would've matched the same url
      const explicit = /\*$/.test(route);
      // if it's implicit or explicit
      const lazy = explicit ? (route = route.replace(/[\*]+$/g, ''), ''): '/?$';
      // store parameters
      const parameters = [];
      let index = 0;
      let regexpRoute = route.replace(/(:)?([^\\/]+)/g, (parameter, colonParameter, identifier) => {
        const [ param, boundValue ] = identifier.split('->');
        if(colonParameter){
          // check for duplicates
          const duplicates = parameters.filter(old => old.identifier == boundValue); 
          if(duplicates.length > 0){
            throw new Error(`Duplicated parameter. [${duplicates.map(_=>_.identifier)}]`);
          }
          // store parameter reference
          parameters.push({
            index: index++,
            parameter,
            identifier: param,
          });
          // bound parameter
          return boundValue ? `(${boundValue})` : `([^\/]+)`;
        }
        return `${parameter}`;
      });
      regexpRoute = `^/${regexpRoute}${lazy}`;
      return {
        base,
        route,
        regexpRoute,
        parameters,
      }
    };

    class Route{
      constructor(base, route, fn, middlewares = []){
        Object.assign(this, prepare(base, route));
        this.callback = fn;
        this.middlewares = middlewares;
      }
    }

    class Middleware{
      constructor(...props){
        this.props = props;
      }
      use(fn){
        if(typeof fn != 'function'){
          throw new Error(`Invalid Middleware use argument. Expecting 'function' got : '${typeof fn}'`); 
        }
        const f = (stack) => next => stack(fn.bind(this, ...this.props, next));
        this.execute = f(this.execute);
        return this;
      }
      execute(fn){
        return fn.call(null);
      }
    }

    class Request{
      constructor(props){
        Object.assign(this, {
          base: '',
          path: '',
          route: '',
          query: {},
          params: {},
          state: {}
        }, props);
      }
    }

    class Response{
      constructor(callbacks){
        Object.assign(this, callbacks);
      }
    }

    // router
    class Router{
      constructor(props){
        // store properties and freeze them so not to be able to get modified
        Object.freeze(this.__properties = {
          initial: undefined,
          base: '',
          state: {},
          ...props
        });
        // are we subscribing?
        this.__subscribing = false;
        // store
        this.__get = new Map();
        this.__catch = new Map();
        this.__use = new Set();
      }
      _register(routes, fn, middlewares, list){
        routes.map(route => {
          const r = new Route(this.__properties.base, route, fn, middlewares);
          if(list.has(r.regexpRoute)){
            throw new Error(`Route with same endpoint already exist. [${route}, /${list.get(r.regexpRoute).route}](${r.regexpRoute})`);
          }
          list.set(r.regexpRoute, r);
        });
        return routes;
      }
      _props(...args){
        let routes, fn, middlewares = [];
        if(args.length == 1){
          [ fn ] = args;
          routes = '*';
        }else if(args.length == 2){
          [ routes, fn ] = args;
        }else if(args.length > 2){
          routes = args.shift();
          fn = args.pop();
          middlewares = args;      
        }else {
          throw new Error(`Invalid number prop arguments.`);
        }
        routes = Array.isArray(routes) ? routes : [routes];
        return { routes, fn, middlewares };
      }
      _storeInList(fnName, list, ...args){
        const { routes, fn, middlewares } = this._props(...args);
        const parentRoutes = this._register(routes, fn, middlewares, list);
        // enable chaining to group sub routes to a main route
        // not needed since the routes are store as unique strings in the end 
        // but might be a nicer way to organize the implementation
        const ret = {
          [fnName]: (...innerArgs) => {
            const { routes: innerRoutes, fn: innerFn, middlewares: innerMiddlewares } = this._props(...innerArgs);
            parentRoutes.map(route => innerRoutes.map(_ => route + _).map(_ => this[fnName](_, ...[...innerMiddlewares, innerFn])));
            return ret;
          }
        };
        return ret;
      }
      get(...args){
        return this._storeInList('get', this.__get, ...args);
      }
      use(...args){
        const { routes, fn } = this._props(args);
        routes.map(url => this.__use.add(new Route(this.__properties.base, url, ...fn)));
      }
      catch(...args){
        return this._storeInList('catch', this.__catch, ...args);
      }
      _findRoute(url, list, data){
        for(let [ regexpRoute, RouteInstance ] of list){
          const parameters = url.match(new RegExp(regexpRoute, 'i'));
          if(parameters){
            const uri = parameters.shift();
            // update Route with new parameters
            let params = {};
            if(parameters.length > 0){
              // create a parameters object
              params = RouteInstance.parameters.reduce((obj, value, index) => {
                obj[value.identifier] = parameters[index];
                return obj;
              }, params);
            }
            // query parameters
            const urlParams = new URLSearchParams(window.location.search);
            const queryParameters = {};
            for(const [key, value] of urlParams.entries()){ 
              if(queryParameters[key]){
                if(Array.isArray(queryParameters[key])){
                  queryParameters[key].push(value);
                }else {
                  queryParameters[key] = [queryParameters[key], value];
                }
              }else {
                queryParameters[key] = value;
              }
            }
            // update request object
            const returnObject = { 
              RouteInstance,
              Request: new Request({
                path: url,
                route: '/' + RouteInstance.route,
                base: RouteInstance.base,
                query: queryParameters,
                params: params,
                state: { ...data },
              })
            };
            return returnObject;
          }
        }
      }
      execute(url, data = {}){
        if(typeof url != 'string'){
          throw new Error(`Invalid 'execute' argument. Expecting 'string'`);
        }
        if(!this.__subscribing){
          return;
        }
        const response = new Response({
          send: (...props) => this.__router_callback.call(null, ...props),
          error: (props) => {
            const errorsFound = this._findRoute(url, this.__catch, data);
            if(!errorsFound){
              console.warn(`No route or catch fallbacks found for [${url}]`);
              return;
            }
            errorsFound.RouteInstance.callback.call(null, errorsFound.Request, response, props);
          }
        });
        let matchFound = this._findRoute(url, this.__get, data);
        if(!matchFound){
          response.error();
          return;
        }
        let middlewares = [];
        const middleware = new Middleware(matchFound.Request, response);
        this.__use.forEach(middlewareRoute => {
          const RouteInstance = url.match(new RegExp(middlewareRoute.regexpRoute, 'i'));
          if(RouteInstance){
            middlewares.push(middlewareRoute.callback);
          }
        });
        middlewares = [...middlewares, ...matchFound.RouteInstance.middlewares, matchFound.RouteInstance.callback];
        middlewares.map(fn => middleware.use(fn));
        // execute middleware
        middleware.execute();
      }
      subscribe(fn){
        this.__subscribing = true;
        if(typeof fn == 'function'){
          this.__router_callback = fn;
        }
        if(this.__properties.initial){
          this.execute(this.__properties.initial, this.__properties.state);
        }
        return () => {
          this.__subscribing = false;
        }
      }
    }

    class SvelteStandaloneRouterError extends Error{}
    class SvelteRouter extends Router{
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

      // handle scroll reset
      static __scrollReset = true;
      static setScrollReset(value){
        if(typeof value != 'boolean'){
          throw new SvelteStandaloneRouterError(`Invalid 'scrollReset'. Expecting value of type 'boolean'`);
        }
        return SvelteRouter.__scrollReset = value;
      }
      static set scrollReset(value){
        return SvelteRouter.setScrollReset(value);
      }
      static get scrollReset(){
        return SvelteRouter.__scrollReset;
      }
    }

    const subscriber_queue = [];
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = [];
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (let i = 0; i < subscribers.length; i += 1) {
                        const s = subscribers[i];
                        s[1]();
                        subscriber_queue.push(s, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.push(subscriber);
            if (subscribers.length === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                const index = subscribers.indexOf(subscriber);
                if (index !== -1) {
                    subscribers.splice(index, 1);
                }
                if (subscribers.length === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }

    let prev = { location: { ...window.location }, firstLoad: false };
    let contexts = new Map();
    let location$1 = writable();

    let initialized = false;
    let firstLoad = false;

    // handle the linkBase in pathname
    const getPathname = (path) => {
      const re = new RegExp(`^${SvelteRouter.linkBase}`, 'i');
      path = `/${path}/`.replace(/[\/]+/g, '/').replace(re, '').replace(/^\/|\/$/g, '');
      return '/' + path;
    };

    // the popstate callback handler
    const popstateHandler = async e => {
      let endEarly = false;
      const sameURL = prev.location.pathname == window.location.pathname && prev.location.search == window.location.search;
      // don't continue if we are doing internal hash linking
      if(window.location.hash != '' && sameURL && prev.firstLoad){
        endEarly = true;
      }
      
      // if the hash is empty and not the same as the previous and it's on the same url we don't want to load a new page, then we simply end early and scroll to the top.
      if(window.location.hash == '' && window.location.hash != prev.location.hash && sameURL){
        endEarly = true;
        window.scrollTo({ top: 0 });
      }

      // if we don't end early we want to update the router contexts
      if(!endEarly){
        // update location and execute the router contexts
        location$1.set(getPathname(window.location.pathname));
        contexts.forEach(context => context.router.execute(window.location.pathname, e.detail));
      }

      // update the prev data
      prev.location = { ...window.location };
    };

    // if the popstate listener has been destroy 'mount' re-adds the listener 
    const mount = async () => {
      if(!initialized){
        // mark it initialized and update the location store with the current pathname
        initialized = true;
        if(!firstLoad){
          firstLoad = true;
          location$1.set(getPathname(window.location.pathname));
        }
        window.addEventListener('popstate', popstateHandler);
      }
    };

    // export the context creator "wrapper"
    var context = (options) => {
      // mount on the first load to avoid having 
      // the user doing it manually
      mount();
      // creates a new context
      const router = new SvelteRouter(options);
      contexts.set(router, {
        component: writable(),
        router
      });
      return router;
    };

    /* ..\router.svelte generated by Svelte v3.31.0 */

    const { Error: Error_1 } = globals;

    const get_default_slot_changes = dirty => ({
    	component: dirty & /*$component*/ 1,
    	props: dirty & /*$component*/ 1
    });

    const get_default_slot_context = ctx => ({
    	component: /*$component*/ ctx[0].context,
    	props: /*$component*/ ctx[0].props
    });

    // (53:0) {#if $component}
    function create_if_block(ctx) {
    	let current;
    	const default_slot_template = /*#slots*/ ctx[4].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[3], get_default_slot_context);
    	const default_slot_or_fallback = default_slot || fallback_block(ctx);

    	const block = {
    		c: function create() {
    			if (default_slot_or_fallback) default_slot_or_fallback.c();
    		},
    		m: function mount(target, anchor) {
    			if (default_slot_or_fallback) {
    				default_slot_or_fallback.m(target, anchor);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope, $component*/ 9) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[3], dirty, get_default_slot_changes, get_default_slot_context);
    				}
    			} else {
    				if (default_slot_or_fallback && default_slot_or_fallback.p && dirty & /*$component*/ 1) {
    					default_slot_or_fallback.p(ctx, dirty);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot_or_fallback, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot_or_fallback, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (default_slot_or_fallback) default_slot_or_fallback.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(53:0) {#if $component}",
    		ctx
    	});

    	return block;
    }

    // (54:64)       
    function fallback_block(ctx) {
    	let switch_instance;
    	let switch_instance_anchor;
    	let current;
    	const switch_instance_spread_levels = [/*$component*/ ctx[0].props];
    	var switch_value = /*$component*/ ctx[0].context;

    	function switch_props(ctx) {
    		let switch_instance_props = {};

    		for (let i = 0; i < switch_instance_spread_levels.length; i += 1) {
    			switch_instance_props = assign(switch_instance_props, switch_instance_spread_levels[i]);
    		}

    		return {
    			props: switch_instance_props,
    			$$inline: true
    		};
    	}

    	if (switch_value) {
    		switch_instance = new switch_value(switch_props());
    	}

    	const block = {
    		c: function create() {
    			if (switch_instance) create_component(switch_instance.$$.fragment);
    			switch_instance_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (switch_instance) {
    				mount_component(switch_instance, target, anchor);
    			}

    			insert_dev(target, switch_instance_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const switch_instance_changes = (dirty & /*$component*/ 1)
    			? get_spread_update(switch_instance_spread_levels, [get_spread_object(/*$component*/ ctx[0].props)])
    			: {};

    			if (switch_value !== (switch_value = /*$component*/ ctx[0].context)) {
    				if (switch_instance) {
    					group_outros();
    					const old_component = switch_instance;

    					transition_out(old_component.$$.fragment, 1, 0, () => {
    						destroy_component(old_component, 1);
    					});

    					check_outros();
    				}

    				if (switch_value) {
    					switch_instance = new switch_value(switch_props());
    					create_component(switch_instance.$$.fragment);
    					transition_in(switch_instance.$$.fragment, 1);
    					mount_component(switch_instance, switch_instance_anchor.parentNode, switch_instance_anchor);
    				} else {
    					switch_instance = null;
    				}
    			} else if (switch_value) {
    				switch_instance.$set(switch_instance_changes);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			if (switch_instance) transition_in(switch_instance.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(switch_instance_anchor);
    			if (switch_instance) destroy_component(switch_instance, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: fallback_block.name,
    		type: "fallback",
    		source: "(54:64)       ",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let if_block_anchor;
    	let current;
    	let if_block = /*$component*/ ctx[0] && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error_1("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*$component*/ ctx[0]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*$component*/ 1) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let $component;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Router", slots, ['default']);
    	let { context = contexts.keys().next().value } = $$props;

    	if (!context || !(context instanceof SvelteRouter)) {
    		throw new Error(`Invalid Router context. Did you initialize the component with a valid context?`);
    	}

    	const { component } = contexts.get(context);
    	validate_store(component, "component");
    	component_subscribe($$self, component, value => $$invalidate(0, $component = value));

    	// store the current/previous pathname to compare with the next route that wants to get loaded 
    	context.subscribe(async (callback, props = {}) => {
    		// a dirty check to see it is a "component". Since there is not way to check if it is a svelte component
    		// this would atleast force it to be a function and will catch most errors where a svelte component isn't passed
    		if (typeof callback != "function") {
    			throw new SvelteStandaloneRouterError(`Unable to load component. Did you pass a valid svelte component to the 'send' response?`);
    		}

    		// reset the scroll position depending on the static scrollReset value
    		if (SvelteRouter.scrollReset) {
    			// always start from the top of the page
    			window.scrollTo({ top: 0 });
    		}

    		// update the writable store
    		component.set({
    			context: class extends callback {
    				
    			},
    			props
    		});

    		// wait for the current tick so we know the dom is loaded
    		await tick();

    		const target = window.location.hash.slice(1);

    		if (target) {
    			const element = document.querySelector(`a[name="${target}"], #${target}`);

    			if (element) {
    				const topPos = element.getBoundingClientRect().top + window.pageYOffset;
    				window.scrollTo({ top: topPos });
    			}
    		}

    		// flag that we have a first load
    		if (!prev.firstLoad) {
    			prev.firstLoad = true;
    		}
    	});

    	const writable_props = ["context"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Router> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("context" in $$props) $$invalidate(2, context = $$props.context);
    		if ("$$scope" in $$props) $$invalidate(3, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		tick,
    		Router: SvelteRouter,
    		SvelteStandaloneRouterError,
    		contexts,
    		prev,
    		context,
    		component,
    		$component
    	});

    	$$self.$inject_state = $$props => {
    		if ("context" in $$props) $$invalidate(2, context = $$props.context);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [$component, component, context, $$scope, slots];
    }

    class Router_1 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, { context: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Router_1",
    			options,
    			id: create_fragment.name
    		});
    	}

    	get context() {
    		throw new Error_1("<Router>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set context(value) {
    		throw new Error_1("<Router>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    const dispatch$1 = ({ state }) => {
      dispatchEvent(new CustomEvent('popstate', { 
        detail: {
          ...state
        } 
      }));
    };
    // extending the standalone router with custom 
    // methods to perform certain tasks.
    const navigate = (url, state = {}) => {
      history.pushState(state, '', url);
      dispatch$1({ url, state }); 
    };
    const redirect = (url, state = {}) => {
      history.replaceState(state, '', url);
      dispatch$1({ url, state });
    };

    var link = (element, props) => {
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
        // replace all duplicate '/' that might be going on
        const href = `/${SvelteRouter.linkBase}/${url}`.replace(/[\/]+/g, '/');
        if(!href){
          return;
        }
        if(props.type == 'navigate'){
          navigate(href, props.state, props.title);
        }else if(props.type == 'redirect'){
          redirect(href, props.state, props.title);
        }else {
          console.warn(`Invalid 'use:link' type. Expecting 'navigate'(default) or 'redirect'`);
          return;
        }
      };
      element.addEventListener('click', clickHandler);
      return {
        update(parameters){},
        destroy(){element.removeEventListener('click', clickHandler);}
      }
    };

    /* ..\redirect.svelte generated by Svelte v3.31.0 */

    function create_fragment$1(ctx) {
    	const block = {
    		c: noop,
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: noop,
    		p: noop,
    		i: noop,
    		o: noop,
    		d: noop
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Redirect", slots, []);

    	let { to = undefined } = $$props,
    		{ href = undefined } = $$props,
    		{ state = {} } = $$props;

    	redirect(to || href, state);
    	const writable_props = ["to", "href", "state"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Redirect> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("to" in $$props) $$invalidate(0, to = $$props.to);
    		if ("href" in $$props) $$invalidate(1, href = $$props.href);
    		if ("state" in $$props) $$invalidate(2, state = $$props.state);
    	};

    	$$self.$capture_state = () => ({ redirect, to, href, state });

    	$$self.$inject_state = $$props => {
    		if ("to" in $$props) $$invalidate(0, to = $$props.to);
    		if ("href" in $$props) $$invalidate(1, href = $$props.href);
    		if ("state" in $$props) $$invalidate(2, state = $$props.state);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [to, href, state];
    }

    class Redirect extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { to: 0, href: 1, state: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Redirect",
    			options,
    			id: create_fragment$1.name
    		});
    	}

    	get to() {
    		throw new Error("<Redirect>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set to(value) {
    		throw new Error("<Redirect>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get href() {
    		throw new Error("<Redirect>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set href(value) {
    		throw new Error("<Redirect>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get state() {
    		throw new Error("<Redirect>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set state(value) {
    		throw new Error("<Redirect>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    function fade(node, { delay = 0, duration = 400, easing = identity }) {
        const o = +getComputedStyle(node).opacity;
        return {
            delay,
            duration,
            easing,
            css: t => `opacity: ${t * o}`
        };
    }

    /* src\pages\index.svelte generated by Svelte v3.31.0 */
    const file = "src\\pages\\index.svelte";

    function create_fragment$2(ctx) {
    	let h1;
    	let t1;
    	let h30;
    	let t3;
    	let p0;
    	let t5;
    	let button0;
    	let link_action;
    	let t7;
    	let h31;
    	let t9;
    	let p1;
    	let t10;
    	let strong;
    	let t12;
    	let t13;
    	let button1;
    	let link_action_1;
    	let t15;
    	let h2;
    	let t17;
    	let p2;
    	let t19;
    	let a;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			h1 = element("h1");
    			h1.textContent = "Welcome to the svelte standalone router library";
    			t1 = space();
    			h30 = element("h3");
    			h30.textContent = "Read the documentation";
    			t3 = space();
    			p0 = element("p");
    			p0.textContent = "Learn the inner workings of the library on the documentations page.";
    			t5 = space();
    			button0 = element("button");
    			button0.textContent = "Documentation";
    			t7 = space();
    			h31 = element("h3");
    			h31.textContent = "Usage in your projects";
    			t9 = space();
    			p1 = element("p");
    			t10 = text("Implementation guide on how to implement ");
    			strong = element("strong");
    			strong.textContent = "svelte standalone router";
    			t12 = text(" in your projects.");
    			t13 = space();
    			button1 = element("button");
    			button1.textContent = "Usage examples";
    			t15 = space();
    			h2 = element("h2");
    			h2.textContent = "Support";
    			t17 = space();
    			p2 = element("p");
    			p2.textContent = "Do you like this project and feel it's beneficial to you and your work? A small coffe tip is always appreciated, but not required.";
    			t19 = space();
    			a = element("a");
    			a.textContent = "Tip on paypal";
    			add_location(h1, file, 3, 0, 73);
    			add_location(h30, file, 5, 0, 133);
    			add_location(p0, file, 6, 0, 166);
    			add_location(button0, file, 7, 0, 242);
    			add_location(h31, file, 9, 0, 310);
    			add_location(strong, file, 10, 44, 387);
    			add_location(p1, file, 10, 0, 343);
    			add_location(button1, file, 11, 0, 452);
    			add_location(h2, file, 13, 0, 513);
    			add_location(p2, file, 14, 0, 531);
    			attr_dev(a, "class", "button");
    			attr_dev(a, "href", "https://www.paypal.me/jenshjalmarsson");
    			add_location(a, file, 15, 0, 670);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h1, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, h30, anchor);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, p0, anchor);
    			insert_dev(target, t5, anchor);
    			insert_dev(target, button0, anchor);
    			insert_dev(target, t7, anchor);
    			insert_dev(target, h31, anchor);
    			insert_dev(target, t9, anchor);
    			insert_dev(target, p1, anchor);
    			append_dev(p1, t10);
    			append_dev(p1, strong);
    			append_dev(p1, t12);
    			insert_dev(target, t13, anchor);
    			insert_dev(target, button1, anchor);
    			insert_dev(target, t15, anchor);
    			insert_dev(target, h2, anchor);
    			insert_dev(target, t17, anchor);
    			insert_dev(target, p2, anchor);
    			insert_dev(target, t19, anchor);
    			insert_dev(target, a, anchor);

    			if (!mounted) {
    				dispose = [
    					action_destroyer(link_action = link.call(null, button0, { to: "/documentation" })),
    					action_destroyer(link_action_1 = link.call(null, button1, { to: "/usage" }))
    				];

    				mounted = true;
    			}
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h1);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(h30);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(p0);
    			if (detaching) detach_dev(t5);
    			if (detaching) detach_dev(button0);
    			if (detaching) detach_dev(t7);
    			if (detaching) detach_dev(h31);
    			if (detaching) detach_dev(t9);
    			if (detaching) detach_dev(p1);
    			if (detaching) detach_dev(t13);
    			if (detaching) detach_dev(button1);
    			if (detaching) detach_dev(t15);
    			if (detaching) detach_dev(h2);
    			if (detaching) detach_dev(t17);
    			if (detaching) detach_dev(p2);
    			if (detaching) detach_dev(t19);
    			if (detaching) detach_dev(a);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Pages", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Pages> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ link });
    	return [];
    }

    class Pages extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Pages",
    			options,
    			id: create_fragment$2.name
    		});
    	}
    }

    /* ..\README.md generated by Svelte v3.31.0 */

    const file$1 = "..\\README.md";

    function create_fragment$3(ctx) {
    	let h1;
    	let t1;
    	let p0;
    	let t2;
    	let a0;
    	let t4;
    	let pre0;
    	let raw0_value = `<code class="language-null">npm i -D svelte-standalone-router</code>` + "";
    	let t5;
    	let p1;
    	let t6;
    	let a1;
    	let t8;
    	let t9;
    	let h20;
    	let a2;
    	let t11;
    	let p2;
    	let t13;
    	let pre1;
    	let raw1_value = `<code class="language-js"><span class="token keyword">import</span> RouterComponent<span class="token punctuation">,</span> <span class="token punctuation">&#123;</span> context<span class="token punctuation">,</span> link<span class="token punctuation">,</span> navigate<span class="token punctuation">,</span> redirect<span class="token punctuation">,</span> location<span class="token punctuation">,</span> mount<span class="token punctuation">,</span> destroy Router<span class="token punctuation">,</span> Navigate<span class="token punctuation">,</span> Redirect <span class="token punctuation">&#125;</span> <span class="token keyword">from</span> <span class="token string">'svelte-standalone-router'</span><span class="token punctuation">;</span></code>` + "";
    	let t14;
    	let pre2;

    	let raw2_value = `<code class="language-null">svelte-standalone-router &#123;
  RouterComponent : svelte-component
  context : Function // creates a new router context
  link : svelte-action // Action directive used on &#39;a&#39; tags. Uses &#39;href&#39; attribute as path
  navigate(path : String ) : // push state 
  redirect(path : String) : // replace state
  location : svelte-store
  mount() : Function // add popstate listener (it has to have been destroyed before being able to be added again)
  destroy() : Function //destroy current listener for popstate event
  Router : class SvelteStandaloneRouter (inherited from standalone-router library) 
  Navigate : svelte-component // to navigate to a route
  Redirect : svelte-component // to redirect to a route
&#125;</code>` + "";

    	let t15;
    	let hr0;
    	let t16;
    	let h21;
    	let a3;
    	let t18;
    	let p3;
    	let t20;
    	let pre3;

    	let raw3_value = `<code class="language-js"><span class="token comment">// import context from library</span>
<span class="token keyword">import</span> <span class="token punctuation">&#123;</span> context <span class="token punctuation">&#125;</span> <span class="token keyword">from</span> <span class="token string">'svelte-standalone-router'</span><span class="token punctuation">;</span>

<span class="token comment">// main app context</span>
<span class="token keyword">const</span> app <span class="token operator">=</span> <span class="token function">context</span><span class="token punctuation">(</span><span class="token punctuation">&#123;</span>
  <span class="token comment">// optional initial route. Here we set it to be the current pathname of the url</span>
  initial<span class="token operator">:</span> location<span class="token punctuation">.</span>pathname
<span class="token punctuation">&#125;</span><span class="token punctuation">)</span><span class="token punctuation">;</span></code>` + "";

    	let t21;
    	let h30;
    	let a4;
    	let t23;
    	let p4;
    	let t24;
    	let code0;
    	let t26;
    	let code1;
    	let t28;
    	let t29;
    	let p5;
    	let t31;
    	let pre4;

    	let raw4_value = `<code class="language-js">app<span class="token punctuation">.</span><span class="token function">get</span><span class="token punctuation">(</span><span class="token string">'/'</span><span class="token punctuation">,</span> <span class="token punctuation">(</span><span class="token parameter">req<span class="token punctuation">,</span> res</span><span class="token punctuation">)</span> <span class="token operator">=></span> <span class="token punctuation">&#123;</span>
  <span class="token comment">// code</span>
<span class="token punctuation">&#125;</span><span class="token punctuation">)</span><span class="token punctuation">;</span></code>` + "";

    	let t32;
    	let p6;
    	let t33;
    	let code2;
    	let t35;
    	let code3;
    	let t37;
    	let code4;
    	let t39;
    	let t40;
    	let p7;
    	let t42;
    	let pre5;

    	let raw5_value = `<code class="language-js">app<span class="token punctuation">.</span><span class="token function">get</span><span class="token punctuation">(</span><span class="token string">'/'</span><span class="token punctuation">,</span> <span class="token punctuation">(</span><span class="token parameter">req<span class="token punctuation">,</span> res</span><span class="token punctuation">)</span> <span class="token operator">=></span> <span class="token punctuation">&#123;</span>
  <span class="token comment">// to catch the props in a svelte component you simply do it like normal svelte props: </span>
  <span class="token comment">// export let myprop = 'default string'; // will become 'custom prop'</span>
  res<span class="token punctuation">.</span><span class="token function">send</span><span class="token punctuation">(</span>SvelteComponent<span class="token punctuation">,</span> <span class="token punctuation">&#123;</span> myprop<span class="token operator">:</span> <span class="token string">'custom prop'</span> <span class="token punctuation">&#125;</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
<span class="token punctuation">&#125;</span><span class="token punctuation">)</span></code>` + "";

    	let t43;
    	let p8;
    	let t44;
    	let code5;
    	let t46;
    	let code6;
    	let t48;
    	let t49;
    	let blockquote0;
    	let h40;
    	let t51;
    	let p9;
    	let t52;
    	let code7;
    	let t54;
    	let code8;
    	let t56;
    	let t57;
    	let pre6;

    	let raw6_value = `<code class="language-js">app<span class="token punctuation">.</span><span class="token function">get</span><span class="token punctuation">(</span><span class="token string">'/articles/:id'</span><span class="token punctuation">,</span> <span class="token punctuation">(</span><span class="token parameter">req<span class="token punctuation">,</span> res</span><span class="token punctuation">)</span> <span class="token operator">=></span> <span class="token punctuation">&#123;</span>
  <span class="token comment">// spread the whole params object without having to hardcode anything</span>
  <span class="token comment">// this will become &#123; id: &#96;The value that get's passed from the url&#96; &#125;</span>
  res<span class="token punctuation">.</span><span class="token function">send</span><span class="token punctuation">(</span>SvelteComponent<span class="token punctuation">,</span> <span class="token punctuation">&#123;</span> <span class="token operator">...</span>req<span class="token punctuation">.</span>params <span class="token punctuation">&#125;</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
<span class="token punctuation">&#125;</span><span class="token punctuation">)</span><span class="token punctuation">;</span></code>` + "";

    	let t58;
    	let p10;
    	let t59;
    	let code9;
    	let t61;
    	let code10;
    	let t63;
    	let t64;
    	let pre7;

    	let raw7_value = `<code class="language-js">app<span class="token punctuation">.</span><span class="token function">get</span><span class="token punctuation">(</span><span class="token string">'/:slug->about'</span><span class="token punctuation">,</span> <span class="token punctuation">(</span><span class="token parameter">req<span class="token punctuation">,</span> res</span><span class="token punctuation">)</span> <span class="token operator">=></span> <span class="token punctuation">&#123;</span>
  res<span class="token punctuation">.</span><span class="token function">send</span><span class="token punctuation">(</span>SvelteComponent<span class="token punctuation">,</span> <span class="token punctuation">&#123;</span> <span class="token operator">...</span>req<span class="token punctuation">.</span>params <span class="token punctuation">&#125;</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
<span class="token punctuation">&#125;</span><span class="token punctuation">)</span><span class="token punctuation">;</span></code>` + "";

    	let t65;
    	let p11;
    	let t66;
    	let code11;
    	let t68;
    	let t69;
    	let blockquote1;
    	let h41;
    	let t71;
    	let p12;
    	let code12;
    	let t73;
    	let t74;
    	let p13;
    	let t75;
    	let code13;
    	let t77;
    	let code14;
    	let t79;
    	let code15;
    	let t81;
    	let t82;
    	let pre8;

    	let raw8_value = `<code class="language-js">app<span class="token punctuation">.</span><span class="token function">get</span><span class="token punctuation">(</span><span class="token string">'/articles/:id/*'</span><span class="token punctuation">,</span> <span class="token punctuation">(</span><span class="token parameter">req<span class="token punctuation">,</span> res</span><span class="token punctuation">)</span> <span class="token operator">=></span> <span class="token punctuation">&#123;</span>
  res<span class="token punctuation">.</span><span class="token function">send</span><span class="token punctuation">(</span>SvelteComponent<span class="token punctuation">,</span> <span class="token punctuation">&#123;</span> <span class="token operator">...</span>req<span class="token punctuation">.</span>params <span class="token punctuation">&#125;</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
<span class="token punctuation">&#125;</span><span class="token punctuation">)</span><span class="token punctuation">;</span></code>` + "";

    	let t83;
    	let p14;
    	let t85;
    	let p15;
    	let t87;
    	let pre9;

    	let raw9_value = `<code class="language-js">app<span class="token punctuation">.</span><span class="token function">get</span><span class="token punctuation">(</span><span class="token punctuation">[</span><span class="token string">'/'</span><span class="token punctuation">,</span> <span class="token string">'home'</span><span class="token punctuation">,</span> <span class="token string">'index'</span><span class="token punctuation">]</span><span class="token punctuation">,</span> <span class="token punctuation">(</span><span class="token parameter">req<span class="token punctuation">,</span> res</span><span class="token punctuation">)</span> <span class="token operator">=></span> <span class="token punctuation">&#123;</span>
  res<span class="token punctuation">.</span><span class="token function">send</span><span class="token punctuation">(</span>SvelteComponent<span class="token punctuation">,</span> <span class="token punctuation">&#123;</span> <span class="token operator">...</span>req<span class="token punctuation">.</span>params <span class="token punctuation">&#125;</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
<span class="token punctuation">&#125;</span><span class="token punctuation">)</span><span class="token punctuation">;</span></code>` + "";

    	let t88;
    	let p16;
    	let t89;
    	let code16;
    	let t91;
    	let code17;
    	let t93;
    	let code18;
    	let t95;
    	let t96;
    	let pre10;

    	let raw10_value = `<code class="language-js">app<span class="token punctuation">.</span><span class="token function">get</span><span class="token punctuation">(</span><span class="token string">'/pages'</span><span class="token punctuation">,</span> <span class="token punctuation">(</span><span class="token parameter">req<span class="token punctuation">,</span> res</span><span class="token punctuation">)</span> <span class="token operator">=></span> <span class="token punctuation">&#123;</span>
  res<span class="token punctuation">.</span><span class="token function">send</span><span class="token punctuation">(</span>SvelteComponent<span class="token punctuation">,</span> <span class="token punctuation">&#123;</span> <span class="token operator">...</span>req<span class="token punctuation">.</span>params <span class="token punctuation">&#125;</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
<span class="token punctuation">&#125;</span><span class="token punctuation">)</span>
<span class="token punctuation">.</span><span class="token function">get</span><span class="token punctuation">(</span><span class="token string">'about'</span><span class="token punctuation">,</span> <span class="token punctuation">(</span><span class="token parameter">req<span class="token punctuation">,</span> res</span><span class="token punctuation">)</span> <span class="token operator">=></span> <span class="token punctuation">&#123;</span> <span class="token comment">/* do something */</span> <span class="token punctuation">&#125;</span><span class="token punctuation">)</span>
<span class="token punctuation">.</span><span class="token function">get</span><span class="token punctuation">(</span><span class="token string">'contact'</span><span class="token punctuation">,</span> <span class="token punctuation">(</span><span class="token parameter">req<span class="token punctuation">,</span> res</span><span class="token punctuation">)</span> <span class="token operator">=></span> <span class="token punctuation">&#123;</span> <span class="token comment">/* do something */</span> <span class="token punctuation">&#125;</span><span class="token punctuation">)</span><span class="token punctuation">;</span></code>` + "";

    	let t97;
    	let p17;
    	let t98;
    	let em;
    	let t100;
    	let t101;
    	let pre11;

    	let raw11_value = `<code class="language-js">app<span class="token punctuation">.</span><span class="token function">get</span><span class="token punctuation">(</span><span class="token punctuation">(</span><span class="token parameter">req<span class="token punctuation">,</span> res</span><span class="token punctuation">)</span> <span class="token operator">=></span> <span class="token punctuation">&#123;</span>
  res<span class="token punctuation">.</span><span class="token function">send</span><span class="token punctuation">(</span>SvelteComponent<span class="token punctuation">)</span><span class="token punctuation">;</span>
<span class="token punctuation">&#125;</span><span class="token punctuation">)</span><span class="token punctuation">;</span></code>` + "";

    	let t102;
    	let h31;
    	let a5;
    	let t104;
    	let p18;
    	let t106;
    	let pre12;

    	let raw12_value = `<code class="language-js">Request<span class="token punctuation">&#123;</span>
  base <span class="token operator">:</span> String <span class="token comment">// current base</span>
  params <span class="token operator">:</span> Object <span class="token comment">// params from the request</span>
  path <span class="token operator">:</span> String <span class="token comment">// current pathname</span>
  route <span class="token operator">:</span> String <span class="token comment">// what route that got triggered, for instance: "/route/:param"</span>
  <span class="token comment">// defined with the use:link action or with the navigate or redirect helper functions</span>
  state <span class="token operator">:</span> Object <span class="token comment">// the state object. unlike the get params that is the arguments attached to the route/pathname, this is the custom data you sent along with the request</span>
  query <span class="token operator">:</span> Object <span class="token comment">// query parameters for the request. i.e ?query=search&amp;parameters=search string. Same keys will group values as an Array.</span>
<span class="token punctuation">&#125;</span></code>` + "";

    	let t107;
    	let h32;
    	let a6;
    	let t109;
    	let p19;
    	let t111;
    	let pre13;

    	let raw13_value = `<code class="language-js">Response<span class="token punctuation">&#123;</span>
  send <span class="token operator">:</span> <span class="token function">Function</span><span class="token punctuation">(</span>Component <span class="token operator">:</span> svelte<span class="token operator">-</span>component<span class="token punctuation">,</span> props <span class="token operator">:</span> Object<span class="token punctuation">)</span>
  error <span class="token operator">:</span> <span class="token function">Function</span><span class="token punctuation">(</span>props <span class="token operator">:</span> Object<span class="token punctuation">)</span>
<span class="token punctuation">&#125;</span></code>` + "";

    	let t112;
    	let hr1;
    	let t113;
    	let h22;
    	let a7;
    	let t115;
    	let p20;
    	let t116;
    	let code19;
    	let t118;
    	let code20;
    	let t120;
    	let t121;
    	let p21;
    	let t122;
    	let code21;
    	let t124;
    	let code22;
    	let t126;
    	let t127;
    	let pre14;

    	let raw14_value = `<code class="language-js"><span class="token keyword">const</span> app <span class="token operator">=</span> <span class="token function">context</span><span class="token punctuation">(</span><span class="token punctuation">&#123;</span>
  initial<span class="token operator">:</span> location<span class="token punctuation">.</span>pathname<span class="token punctuation">,</span>
  base<span class="token operator">:</span> <span class="token string">'/project'</span>
<span class="token punctuation">&#125;</span><span class="token punctuation">)</span><span class="token punctuation">;</span></code>` + "";

    	let t128;
    	let p22;
    	let t129;
    	let code23;
    	let t131;
    	let code24;
    	let t133;
    	let t134;
    	let p23;
    	let t135;
    	let code25;
    	let t137;
    	let code26;
    	let t139;
    	let code27;
    	let t141;
    	let code28;
    	let t143;
    	let t144;
    	let pre15;
    	let raw15_value = `<code class="language-js">Router<span class="token punctuation">.</span>linkBase <span class="token operator">=</span> <span class="token string">'/project'</span><span class="token punctuation">;</span></code>` + "";
    	let t145;
    	let p24;
    	let t147;
    	let pre16;

    	let raw16_value = `<code class="language-js"><span class="token keyword">const</span> app <span class="token operator">=</span> <span class="token function">context</span><span class="token punctuation">(</span><span class="token punctuation">&#123;</span>
  initial<span class="token operator">:</span> location<span class="token punctuation">.</span>pathname<span class="token punctuation">,</span>
  base<span class="token operator">:</span> Router<span class="token punctuation">.</span>linkBase <span class="token operator">=</span> <span class="token string">'/project'</span><span class="token punctuation">;</span>
<span class="token punctuation">&#125;</span><span class="token punctuation">)</span><span class="token punctuation">;</span></code>` + "";

    	let t148;
    	let p25;
    	let t150;
    	let p26;
    	let t152;
    	let pre17;

    	let raw17_value = `<code class="language-js"><span class="token comment">// get the href attribute from &lt;Base> element.</span>
<span class="token comment">// we use getAttribute('href') so we don't get the absolute url</span>
Router<span class="token punctuation">.</span>linkBase <span class="token operator">=</span> document<span class="token punctuation">.</span><span class="token function">querySelector</span><span class="token punctuation">(</span><span class="token string">'base'</span><span class="token punctuation">)</span><span class="token punctuation">.</span><span class="token function">getAttribute</span><span class="token punctuation">(</span><span class="token string">'href'</span><span class="token punctuation">)</span><span class="token punctuation">;</span> 

<span class="token comment">// add the linkBase as base to the context</span>
<span class="token keyword">const</span> app <span class="token operator">=</span> <span class="token function">context</span><span class="token punctuation">(</span><span class="token punctuation">&#123;</span>
  initial<span class="token operator">:</span> location<span class="token punctuation">.</span>pathname<span class="token punctuation">,</span>
  base<span class="token operator">:</span> Router<span class="token punctuation">.</span>linkBase
<span class="token punctuation">&#125;</span><span class="token punctuation">)</span><span class="token punctuation">;</span></code>` + "";

    	let t153;
    	let hr2;
    	let t154;
    	let h23;
    	let a8;
    	let t156;
    	let p27;
    	let t158;
    	let p28;
    	let t160;
    	let pre18;
    	let raw18_value = `<code class="language-js">Router<span class="token punctuation">.</span>scrollReset <span class="token operator">=</span> <span class="token boolean">false</span><span class="token punctuation">;</span></code>` + "";
    	let t161;
    	let p29;
    	let t162;
    	let code29;
    	let t164;
    	let t165;
    	let pre19;
    	let raw19_value = `<code class="language-js">Router<span class="token punctuation">.</span><span class="token function">setScrollReset</span><span class="token punctuation">(</span><span class="token boolean">false</span><span class="token punctuation">)</span><span class="token punctuation">;</span></code>` + "";
    	let t166;
    	let hr3;
    	let t167;
    	let h24;
    	let a9;
    	let t169;
    	let p30;
    	let t170;
    	let code30;
    	let t172;
    	let t173;
    	let pre20;

    	let raw20_value = `<code class="language-js"><span class="token comment">// add custom state on the initial request</span>
<span class="token keyword">const</span> app <span class="token operator">=</span> <span class="token function">context</span><span class="token punctuation">(</span><span class="token punctuation">&#123;</span>
  initial<span class="token operator">:</span> location<span class="token punctuation">.</span>pathname<span class="token punctuation">,</span>
  state<span class="token operator">:</span> <span class="token punctuation">&#123;</span> custom<span class="token operator">:</span> <span class="token string">'initial state'</span> <span class="token punctuation">&#125;</span>
<span class="token punctuation">&#125;</span><span class="token punctuation">)</span><span class="token punctuation">;</span></code>` + "";

    	let t174;
    	let hr4;
    	let t175;
    	let h25;
    	let a10;
    	let t177;
    	let p31;
    	let t178;
    	let code31;
    	let t180;
    	let code32;
    	let t182;
    	let t183;
    	let pre21;

    	let raw21_value = `<code class="language-js"><span class="token comment">// catch all errors with the shorthand syntax.</span>
app<span class="token punctuation">.</span><span class="token function">catch</span><span class="token punctuation">(</span><span class="token punctuation">(</span>req<span class="token punctuation">,</span> res<span class="token punctuation">,</span> props<span class="token punctuation">)</span><span class="token punctuation">)</span><span class="token punctuation">&#123;</span>
  res<span class="token punctuation">.</span><span class="token function">send</span><span class="token punctuation">(</span>ErrorComponent<span class="token punctuation">)</span><span class="token punctuation">;</span>
<span class="token punctuation">&#125;</span></code>` + "";

    	let t184;
    	let p32;
    	let t185;
    	let code33;
    	let t187;
    	let t188;
    	let pre22;

    	let raw22_value = `<code class="language-js">app<span class="token punctuation">.</span><span class="token function">get</span><span class="token punctuation">(</span><span class="token string">'/'</span><span class="token punctuation">,</span> <span class="token punctuation">(</span>req<span class="token punctuation">,</span> res<span class="token punctuation">)</span><span class="token punctuation">)</span><span class="token punctuation">&#123;</span>
  <span class="token keyword">if</span><span class="token punctuation">(</span>expression <span class="token operator">!=</span> <span class="token boolean">true</span><span class="token punctuation">)</span><span class="token punctuation">&#123;</span>
    res<span class="token punctuation">.</span><span class="token function">error</span><span class="token punctuation">(</span><span class="token punctuation">&#123;</span> custom<span class="token operator">:</span> <span class="token string">'props'</span> <span class="token punctuation">&#125;</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token keyword">return</span><span class="token punctuation">;</span>
  <span class="token punctuation">&#125;</span>
  res<span class="token punctuation">.</span><span class="token function">send</span><span class="token punctuation">(</span>ErrorComponent<span class="token punctuation">)</span><span class="token punctuation">;</span>
<span class="token punctuation">&#125;</span></code>` + "";

    	let t189;
    	let hr5;
    	let t190;
    	let h26;
    	let a11;
    	let t192;
    	let p33;
    	let t193;
    	let code34;
    	let t195;
    	let t196;
    	let p34;
    	let t197;
    	let code35;
    	let t199;
    	let t200;
    	let pre23;

    	let raw23_value = `<code class="language-js"><span class="token comment">// logger</span>
app<span class="token punctuation">.</span><span class="token function">use</span><span class="token punctuation">(</span><span class="token punctuation">(</span><span class="token parameter">req<span class="token punctuation">,</span> res<span class="token punctuation">,</span> next</span><span class="token punctuation">)</span> <span class="token operator">=></span> <span class="token punctuation">&#123;</span>
  console<span class="token punctuation">.</span><span class="token function">log</span><span class="token punctuation">(</span><span class="token template-string"><span class="token template-punctuation string">&#96;</span><span class="token string">Logger middleware that will run on each request.</span><span class="token template-punctuation string">&#96;</span></span><span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token function">next</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
<span class="token punctuation">&#125;</span><span class="token punctuation">)</span><span class="token punctuation">;</span>

<span class="token comment">// auth validator</span>
app<span class="token punctuation">.</span><span class="token function">use</span><span class="token punctuation">(</span><span class="token punctuation">(</span><span class="token parameter">req<span class="token punctuation">,</span> res<span class="token punctuation">,</span> next</span><span class="token punctuation">)</span> <span class="token operator">=></span> <span class="token punctuation">&#123;</span>
  <span class="token keyword">if</span><span class="token punctuation">(</span>auth<span class="token punctuation">)</span><span class="token punctuation">&#123;</span>
    <span class="token keyword">return</span> <span class="token function">next</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">&#125;</span>
  res<span class="token punctuation">.</span><span class="token function">error</span><span class="token punctuation">(</span><span class="token punctuation">&#123;</span> message<span class="token operator">:</span> <span class="token string">'Unauthorized'</span> <span class="token punctuation">&#125;</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
<span class="token punctuation">&#125;</span><span class="token punctuation">)</span><span class="token punctuation">;</span></code>` + "";

    	let t201;
    	let p35;
    	let t202;
    	let code36;
    	let t204;
    	let t205;
    	let pre24;

    	let raw24_value = `<code class="language-js"><span class="token comment">// a hasAuth middleware</span>
<span class="token keyword">const</span> <span class="token function-variable function">hasAuth</span> <span class="token operator">=</span> <span class="token punctuation">(</span><span class="token parameter">req<span class="token punctuation">,</span> res<span class="token punctuation">,</span> next</span><span class="token punctuation">)</span> <span class="token operator">=></span> <span class="token punctuation">&#123;</span>
  <span class="token keyword">if</span><span class="token punctuation">(</span>auth<span class="token punctuation">)</span><span class="token punctuation">&#123;</span>
    <span class="token keyword">return</span> <span class="token function">next</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">&#125;</span>
  res<span class="token punctuation">.</span><span class="token function">error</span><span class="token punctuation">(</span><span class="token punctuation">&#123;</span> message<span class="token operator">:</span> <span class="token string">'Unauthorized'</span> <span class="token punctuation">&#125;</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
<span class="token punctuation">&#125;</span>

<span class="token comment">// applying the middleware to a route</span>
app<span class="token punctuation">.</span><span class="token function">get</span><span class="token punctuation">(</span><span class="token string">'/user'</span><span class="token punctuation">.</span> hasAuth<span class="token punctuation">,</span> <span class="token punctuation">(</span><span class="token parameter">req<span class="token punctuation">,</span> res</span><span class="token punctuation">)</span> <span class="token operator">=></span> <span class="token punctuation">&#123;</span>
  res<span class="token punctuation">.</span><span class="token function">send</span><span class="token punctuation">(</span>Component<span class="token punctuation">)</span>
<span class="token punctuation">&#125;</span><span class="token punctuation">)</span><span class="token punctuation">;</span></code>` + "";

    	let t206;
    	let hr6;
    	let t207;
    	let h27;
    	let a12;
    	let t209;
    	let p36;
    	let t210;
    	let code37;
    	let t212;
    	let code38;
    	let t214;
    	let code39;
    	let t216;
    	let t217;
    	let pre25;

    	let raw25_value = `<code class="language-html"><span class="token tag"><span class="token tag"><span class="token punctuation">&lt;</span>script</span><span class="token punctuation">></span></span><span class="token script"><span class="token language-javascript">
  <span class="token keyword">import</span> RouterComponent <span class="token keyword">from</span> <span class="token string">'svelte-standalone-router'</span><span class="token punctuation">;</span>
</span></span><span class="token tag"><span class="token tag"><span class="token punctuation">&lt;/</span>script</span><span class="token punctuation">></span></span>

<span class="token tag"><span class="token tag"><span class="token punctuation">&lt;</span>RouterComponent</span> <span class="token punctuation">/></span></span></code>` + "";

    	let t218;
    	let p37;
    	let t219;
    	let code40;
    	let t221;
    	let t222;
    	let blockquote2;
    	let h42;
    	let t224;
    	let p38;
    	let t225;
    	let code41;
    	let t227;
    	let code42;
    	let t229;
    	let code43;
    	let t231;
    	let t232;
    	let pre26;

    	let raw26_value = `<code class="language-html"><span class="token tag"><span class="token tag"><span class="token punctuation">&lt;</span>script</span><span class="token punctuation">></span></span><span class="token script"><span class="token language-javascript">
  <span class="token keyword">import</span> RouterComponent <span class="token keyword">from</span> <span class="token string">'svelte-standalone-router'</span><span class="token punctuation">;</span>
</span></span><span class="token tag"><span class="token tag"><span class="token punctuation">&lt;/</span>script</span><span class="token punctuation">></span></span>

<span class="token tag"><span class="token tag"><span class="token punctuation">&lt;</span>RouterComponent</span> <span class="token attr-name"><span class="token namespace">let:</span>component</span> <span class="token attr-name"><span class="token namespace">let:</span>props</span><span class="token punctuation">></span></span>
  &#123;#key component&#125;
    <span class="token tag"><span class="token tag"><span class="token punctuation">&lt;</span>div</span> <span class="token attr-name">class</span><span class="token attr-value"><span class="token punctuation attr-equals">=</span><span class="token punctuation">"</span>router<span class="token punctuation">"</span></span> <span class="token attr-name"><span class="token namespace">in:</span>fade</span><span class="token punctuation">></span></span>
      <span class="token tag"><span class="token tag"><span class="token punctuation">&lt;</span><span class="token namespace">svelte:</span>component</span> <span class="token attr-name">this</span><span class="token attr-value"><span class="token punctuation attr-equals">=</span>&#123;component&#125;</span> <span class="token attr-name">&#123;...props&#125;</span> <span class="token punctuation">/></span></span>
    <span class="token tag"><span class="token tag"><span class="token punctuation">&lt;/</span>div</span><span class="token punctuation">></span></span>
  &#123;/key&#125;
<span class="token tag"><span class="token tag"><span class="token punctuation">&lt;/</span>RouterComponent</span><span class="token punctuation">></span></span></code>` + "";

    	let t233;
    	let h33;
    	let a13;
    	let t235;
    	let p39;
    	let t236;
    	let code44;
    	let t238;
    	let t239;
    	let p40;
    	let t240;
    	let code45;
    	let t242;
    	let code46;
    	let t244;
    	let code47;
    	let t246;
    	let code48;
    	let t248;
    	let p41;
    	let t249;
    	let code49;
    	let t251;
    	let code50;
    	let t253;
    	let code51;
    	let t255;
    	let code52;
    	let t257;
    	let t258;
    	let p42;
    	let t259;
    	let code53;
    	let t261;
    	let code54;
    	let t263;
    	let t264;
    	let pre27;

    	let raw27_value = `<code class="language-html"><span class="token tag"><span class="token tag"><span class="token punctuation">&lt;</span>script</span><span class="token punctuation">></span></span><span class="token script"><span class="token language-javascript">
  <span class="token keyword">import</span> <span class="token punctuation">&#123;</span> link <span class="token punctuation">&#125;</span> <span class="token keyword">from</span> <span class="token string">'svelte-standalone-router'</span><span class="token punctuation">;</span>
</span></span><span class="token tag"><span class="token tag"><span class="token punctuation">&lt;/</span>script</span><span class="token punctuation">></span></span>
<span class="token tag"><span class="token tag"><span class="token punctuation">&lt;</span>a</span> <span class="token attr-name">href</span><span class="token attr-value"><span class="token punctuation attr-equals">=</span><span class="token punctuation">"</span>/about<span class="token punctuation">"</span></span> <span class="token attr-name"><span class="token namespace">use:</span>link</span><span class="token punctuation">></span></span>about<span class="token tag"><span class="token tag"><span class="token punctuation">&lt;/</span>a</span><span class="token punctuation">></span></span></code>` + "";

    	let t265;
    	let p43;
    	let t266;
    	let code55;
    	let t268;
    	let t269;
    	let pre28;

    	let raw28_value = `<code class="language-html"><span class="token tag"><span class="token tag"><span class="token punctuation">&lt;</span>script</span><span class="token punctuation">></span></span><span class="token script"><span class="token language-javascript">
  <span class="token keyword">import</span> <span class="token punctuation">&#123;</span> link <span class="token punctuation">&#125;</span> <span class="token keyword">from</span> <span class="token string">'svelte-standalone-router'</span><span class="token punctuation">;</span>
</span></span><span class="token tag"><span class="token tag"><span class="token punctuation">&lt;/</span>script</span><span class="token punctuation">></span></span>
&lt;a href="/about" use:link=&#123;&#123;to: '/contact'&#125;&#125;>about<span class="token tag"><span class="token tag"><span class="token punctuation">&lt;/</span>a</span><span class="token punctuation">></span></span></code>` + "";

    	let t270;
    	let p44;
    	let t272;
    	let pre29;

    	let raw29_value = `<code class="language-html"><span class="token tag"><span class="token tag"><span class="token punctuation">&lt;</span>script</span><span class="token punctuation">></span></span><span class="token script"><span class="token language-javascript">
  <span class="token keyword">import</span> <span class="token punctuation">&#123;</span> link<span class="token punctuation">,</span> navigate <span class="token punctuation">&#125;</span> <span class="token keyword">from</span> <span class="token string">'svelte-standalone-router'</span><span class="token punctuation">;</span>
</span></span><span class="token tag"><span class="token tag"><span class="token punctuation">&lt;/</span>script</span><span class="token punctuation">></span></span>

<span class="token tag"><span class="token tag"><span class="token punctuation">&lt;</span>button</span> <span class="token attr-name">href</span><span class="token attr-value"><span class="token punctuation attr-equals">=</span><span class="token punctuation">"</span>/about<span class="token punctuation">"</span></span> <span class="token attr-name"><span class="token namespace">use:</span>link</span><span class="token punctuation">></span></span>about<span class="token tag"><span class="token tag"><span class="token punctuation">&lt;/</span>button</span><span class="token punctuation">></span></span>
<span class="token tag"><span class="token tag"><span class="token punctuation">&lt;</span>button</span> <span class="token attr-name">data-href</span><span class="token attr-value"><span class="token punctuation attr-equals">=</span><span class="token punctuation">"</span>/about<span class="token punctuation">"</span></span> <span class="token attr-name"><span class="token namespace">use:</span>link</span><span class="token punctuation">></span></span>about<span class="token tag"><span class="token tag"><span class="token punctuation">&lt;/</span>button</span><span class="token punctuation">></span></span>
&lt;button use:link=&#123;&#123;to: '/about'&#125;&#125;>about<span class="token tag"><span class="token tag"><span class="token punctuation">&lt;/</span>button</span><span class="token punctuation">></span></span>
&lt;button on:click=&#123;_ => navigate('/about')&#125;>about<span class="token tag"><span class="token tag"><span class="token punctuation">&lt;/</span>button</span><span class="token punctuation">></span></span></code>` + "";

    	let t273;
    	let p45;
    	let t274;
    	let code56;
    	let t276;
    	let t277;
    	let pre30;

    	let raw30_value = `<code class="language-html"><span class="token tag"><span class="token tag"><span class="token punctuation">&lt;</span>script</span><span class="token punctuation">></span></span><span class="token script"><span class="token language-javascript">
  <span class="token keyword">import</span> <span class="token punctuation">&#123;</span> link <span class="token punctuation">&#125;</span> <span class="token keyword">from</span> <span class="token string">'svelte-standalone-router'</span><span class="token punctuation">;</span>
</span></span><span class="token tag"><span class="token tag"><span class="token punctuation">&lt;/</span>script</span><span class="token punctuation">></span></span>

&lt;button use:link=&#123;&#123;to: '/article', state: &#123; id: 33 &#125;&#125;&#125;>article<span class="token tag"><span class="token tag"><span class="token punctuation">&lt;/</span>button</span><span class="token punctuation">></span></span></code>` + "";

    	let t278;
    	let p46;
    	let t279;
    	let code57;
    	let t281;
    	let t282;
    	let pre31;

    	let raw31_value = `<code class="language-js">app<span class="token punctuation">.</span><span class="token function">get</span><span class="token punctuation">(</span><span class="token string">'/article'</span><span class="token punctuation">,</span> <span class="token punctuation">(</span><span class="token parameter">req<span class="token punctuation">,</span> res</span><span class="token punctuation">)</span> <span class="token operator">=></span> <span class="token punctuation">&#123;</span>
  res<span class="token punctuation">.</span><span class="token function">send</span><span class="token punctuation">(</span>ArticleComponent<span class="token punctuation">,</span> <span class="token punctuation">&#123;</span> id<span class="token operator">:</span> req<span class="token punctuation">.</span>state<span class="token punctuation">.</span>id <span class="token punctuation">&#125;</span><span class="token punctuation">)</span>
<span class="token punctuation">&#125;</span><span class="token punctuation">)</span><span class="token punctuation">;</span></code>` + "";

    	let t283;
    	let p47;
    	let t285;
    	let pre32;

    	let raw32_value = `<code class="language-js">LinkOptions <span class="token punctuation">&#123;</span>
  type <span class="token operator">:</span> <span class="token function">String</span><span class="token punctuation">(</span><span class="token string">'navigate(default)|redirect'</span><span class="token punctuation">)</span>
  state <span class="token operator">:</span> Object
  to <span class="token operator">:</span> String
  href <span class="token operator">:</span> String
<span class="token punctuation">&#125;</span></code>` + "";

    	let t286;
    	let p48;
    	let t288;
    	let pre33;

    	let raw33_value = `<code class="language-html"><span class="token tag"><span class="token tag"><span class="token punctuation">&lt;</span>script</span><span class="token punctuation">></span></span><span class="token script"><span class="token language-javascript">
  <span class="token keyword">import</span> <span class="token punctuation">&#123;</span> location <span class="token punctuation">&#125;</span> <span class="token keyword">from</span> <span class="token string">'svelte-standalone-router'</span><span class="token punctuation">;</span>
</span></span><span class="token tag"><span class="token tag"><span class="token punctuation">&lt;/</span>script</span><span class="token punctuation">></span></span>

&lt;a href="/" use:link class:active=&#123;$location == '/'&#125;>home<span class="token tag"><span class="token tag"><span class="token punctuation">&lt;/</span>a</span><span class="token punctuation">></span></span>
&lt;a href="/user" use:link class:active=&#123;$location.startsWith('/user')&#125;>user<span class="token tag"><span class="token tag"><span class="token punctuation">&lt;/</span>a</span><span class="token punctuation">></span></span></code>` + "";

    	let t289;
    	let h34;
    	let a14;
    	let t291;
    	let p49;
    	let t292;
    	let code58;
    	let t294;
    	let code59;
    	let t296;
    	let t297;
    	let p50;
    	let t299;
    	let pre34;

    	let raw34_value = `<code class="language-null">navigate(url : String, state : Object);
redirect(url : String, state : Object);</code>` + "";

    	let t300;
    	let pre35;

    	let raw35_value = `<code class="language-js">  <span class="token keyword">import</span> <span class="token punctuation">&#123;</span> navigate<span class="token punctuation">,</span> redirect <span class="token punctuation">&#125;</span> <span class="token keyword">from</span> <span class="token string">'svelte-standalone-router'</span><span class="token punctuation">;</span>
  <span class="token function">navigate</span><span class="token punctuation">(</span><span class="token string">'/subpage'</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token function">redirect</span><span class="token punctuation">(</span><span class="token string">'/subpage'</span><span class="token punctuation">)</span><span class="token punctuation">;</span></code>` + "";

    	let t301;
    	let p51;
    	let t302;
    	let code60;
    	let t304;
    	let code61;
    	let t306;
    	let t307;
    	let p52;
    	let t308;
    	let code62;
    	let t310;
    	let code63;
    	let t312;
    	let t313;
    	let pre36;

    	let raw36_value = `<code class="language-html"><span class="token tag"><span class="token tag"><span class="token punctuation">&lt;</span>script</span><span class="token punctuation">></span></span><span class="token script"><span class="token language-javascript">
  <span class="token keyword">import</span> <span class="token punctuation">&#123;</span> Navigate<span class="token punctuation">,</span> Redirect <span class="token punctuation">&#125;</span> <span class="token keyword">from</span> <span class="token string">'svelte-standalone-router'</span><span class="token punctuation">;</span>
</span></span><span class="token tag"><span class="token tag"><span class="token punctuation">&lt;/</span>script</span><span class="token punctuation">></span></span>

&#123;#if !expression&#125;
  <span class="token tag"><span class="token tag"><span class="token punctuation">&lt;</span>Navigate</span> <span class="token attr-name">to</span><span class="token attr-value"><span class="token punctuation attr-equals">=</span><span class="token punctuation">"</span>/subpage<span class="token punctuation">"</span></span> <span class="token attr-name">state</span><span class="token attr-value"><span class="token punctuation attr-equals">=</span>&#123;&#123;</span> <span class="token attr-name"><span class="token namespace">custom:</span></span> <span class="token attr-name">'state'</span> <span class="token attr-name">&#125;&#125;</span> <span class="token punctuation">/></span></span>
&#123;/if&#125;</code>` + "";

    	let t314;
    	let p53;
    	let code64;
    	let t316;
    	let code65;
    	let t318;
    	let t319;
    	let pre37;

    	let raw37_value = `<code class="language-js"><span class="token keyword">import</span> <span class="token punctuation">&#123;</span> mount<span class="token punctuation">,</span> destroy <span class="token punctuation">&#125;</span> <span class="token keyword">from</span> <span class="token string">'svelte-standalone-router'</span><span class="token punctuation">;</span>
<span class="token comment">// mount and destroy functions</span>
<span class="token function">mount</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
<span class="token function">destroy</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span></code>` + "";

    	let t320;
    	let hr7;
    	let t321;
    	let h28;
    	let a15;
    	let t323;
    	let pre38;

    	let raw38_value = `<code class="language-html"><span class="token tag"><span class="token tag"><span class="token punctuation">&lt;</span>script</span><span class="token punctuation">></span></span><span class="token script"><span class="token language-javascript">
  <span class="token keyword">import</span> <span class="token punctuation">&#123;</span> fade <span class="token punctuation">&#125;</span> <span class="token keyword">from</span> <span class="token string">'svelte/transition'</span><span class="token punctuation">;</span>
  <span class="token keyword">import</span> RouterComponent<span class="token punctuation">,</span> <span class="token punctuation">&#123;</span> context <span class="token punctuation">&#125;</span> <span class="token keyword">from</span> <span class="token string">'svelte-standalone-router'</span><span class="token punctuation">;</span>

  <span class="token comment">// import components</span>
  <span class="token keyword">import</span> Index <span class="token keyword">from</span> <span class="token string">'./index.svelte'</span><span class="token punctuation">;</span>
  <span class="token keyword">import</span> Subpage <span class="token keyword">from</span> <span class="token string">'./subpage.svelte'</span><span class="token punctuation">;</span>

  <span class="token comment">// initialize router </span>
  <span class="token keyword">export</span> <span class="token keyword">const</span> app <span class="token operator">=</span> <span class="token function">context</span><span class="token punctuation">(</span><span class="token punctuation">&#123;</span>
    initial<span class="token operator">:</span> location<span class="token punctuation">.</span>pathname
  <span class="token punctuation">&#125;</span><span class="token punctuation">)</span><span class="token punctuation">;</span>

  <span class="token comment">// define general fallback</span>
  app<span class="token punctuation">.</span><span class="token function">catch</span><span class="token punctuation">(</span><span class="token punctuation">(</span><span class="token parameter">req<span class="token punctuation">,</span> res</span><span class="token punctuation">)</span> <span class="token operator">=></span> <span class="token punctuation">&#123;</span>
    console<span class="token punctuation">.</span><span class="token function">log</span><span class="token punctuation">(</span><span class="token string">'Catching all routes'</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">&#125;</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token comment">// sample middleware</span>
  app<span class="token punctuation">.</span><span class="token function">use</span><span class="token punctuation">(</span><span class="token punctuation">(</span><span class="token parameter">req<span class="token punctuation">,</span> res<span class="token punctuation">,</span> next</span><span class="token punctuation">)</span> <span class="token operator">=></span> <span class="token punctuation">&#123;</span>
    console<span class="token punctuation">.</span><span class="token function">log</span><span class="token punctuation">(</span><span class="token string">'A logger middleware'</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token function">next</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">&#125;</span><span class="token punctuation">)</span><span class="token punctuation">;</span>

  <span class="token comment">// root route</span>
  app<span class="token punctuation">.</span><span class="token function">get</span><span class="token punctuation">(</span><span class="token string">'/'</span><span class="token punctuation">,</span> <span class="token punctuation">(</span><span class="token parameter">req<span class="token punctuation">,</span> res</span><span class="token punctuation">)</span> <span class="token operator">=></span> <span class="token punctuation">&#123;</span>
    res<span class="token punctuation">.</span><span class="token function">send</span><span class="token punctuation">(</span>Index<span class="token punctuation">,</span> <span class="token punctuation">&#123;</span> slug<span class="token operator">:</span> <span class="token string">'index'</span> <span class="token punctuation">&#125;</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">&#125;</span><span class="token punctuation">)</span><span class="token punctuation">;</span>

  <span class="token comment">// subroute with parameter</span>
  app<span class="token punctuation">.</span><span class="token function">get</span><span class="token punctuation">(</span><span class="token string">'/:slug'</span><span class="token punctuation">,</span> <span class="token punctuation">(</span><span class="token parameter">req<span class="token punctuation">,</span> res</span><span class="token punctuation">)</span> <span class="token operator">=></span> <span class="token punctuation">&#123;</span>
    res<span class="token punctuation">.</span><span class="token function">send</span><span class="token punctuation">(</span>Subpage<span class="token punctuation">,</span> <span class="token punctuation">&#123;</span> slug<span class="token operator">:</span> req<span class="token punctuation">.</span>params<span class="token punctuation">.</span>slug <span class="token punctuation">&#125;</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">&#125;</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
</span></span><span class="token tag"><span class="token tag"><span class="token punctuation">&lt;/</span>script</span><span class="token punctuation">></span></span>

<span class="token tag"><span class="token tag"><span class="token punctuation">&lt;</span>RouterComponent</span> <span class="token attr-name"><span class="token namespace">let:</span>component</span> <span class="token attr-name"><span class="token namespace">let:</span>props</span><span class="token punctuation">></span></span>
  &#123;#key component&#125;
    <span class="token tag"><span class="token tag"><span class="token punctuation">&lt;</span>div</span> <span class="token attr-name">class</span><span class="token attr-value"><span class="token punctuation attr-equals">=</span><span class="token punctuation">"</span>router<span class="token punctuation">"</span></span> <span class="token attr-name"><span class="token namespace">in:</span>fade</span><span class="token punctuation">></span></span>
      <span class="token tag"><span class="token tag"><span class="token punctuation">&lt;</span><span class="token namespace">svelte:</span>component</span> <span class="token attr-name">this</span><span class="token attr-value"><span class="token punctuation attr-equals">=</span>&#123;component&#125;</span> <span class="token attr-name">&#123;...props&#125;</span> <span class="token punctuation">/></span></span>
    <span class="token tag"><span class="token tag"><span class="token punctuation">&lt;/</span>div</span><span class="token punctuation">></span></span>
  &#123;/key&#125;
<span class="token tag"><span class="token tag"><span class="token punctuation">&lt;/</span>RouterComponent</span><span class="token punctuation">></span></span></code>` + "";

    	let t324;
    	let p54;
    	let t326;
    	let pre39;
    	let raw39_value = `<code class="language-js"><span class="token string">"start"</span><span class="token operator">:</span> <span class="token string">"sirv public --single"</span></code>` + "";

    	const block = {
    		c: function create() {
    			h1 = element("h1");
    			h1.textContent = "Svelte Standalone Router";
    			t1 = space();
    			p0 = element("p");
    			t2 = text("A standalone router based on ");
    			a0 = element("a");
    			a0.textContent = "https://github.com/hjalmar/standalone-router";
    			t4 = space();
    			pre0 = element("pre");
    			t5 = space();
    			p1 = element("p");
    			t6 = text("Unlike the standalone router the implementation is done within a svelte component. Simply define your routes and middlewares as per the ");
    			a1 = element("a");
    			a1.textContent = "standalone-router";
    			t8 = text(" documentation.");
    			t9 = space();
    			h20 = element("h2");
    			a2 = element("a");
    			a2.textContent = "Library implementation";
    			t11 = space();
    			p2 = element("p");
    			p2.textContent = "Components and utilities the library exposes. As per the svelte specs all svelte components are Capitalized.";
    			t13 = space();
    			pre1 = element("pre");
    			t14 = space();
    			pre2 = element("pre");
    			t15 = space();
    			hr0 = element("hr");
    			t16 = space();
    			h21 = element("h2");
    			a3 = element("a");
    			a3.textContent = "Creating a router context";
    			t18 = space();
    			p3 = element("p");
    			p3.textContent = "Most of the time you will only ever need one context, tho the ability to have several router contexts on the page at the same time is a possibility";
    			t20 = space();
    			pre3 = element("pre");
    			t21 = space();
    			h30 = element("h3");
    			a4 = element("a");
    			a4.textContent = "Adding routes";
    			t23 = space();
    			p4 = element("p");
    			t24 = text("Add get routes to your created context with the ");
    			code0 = element("code");
    			code0.textContent = "get";
    			t26 = text(" method. The get method takes an argument ");
    			code1 = element("code");
    			code1.textContent = "String";
    			t28 = text(" for the route, a undefined number of middlewares and lastly a callback for when the route matches.");
    			t29 = space();
    			p5 = element("p");
    			p5.textContent = "A simple route that matches the root";
    			t31 = space();
    			pre4 = element("pre");
    			t32 = space();
    			p6 = element("p");
    			t33 = text("The callback function exposes two functions. The first argument is the Request object, this will contain data regarding the route request and the second argument will be the response object which exposes two functions ");
    			code2 = element("code");
    			code2.textContent = "send";
    			t35 = text(" or ");
    			code3 = element("code");
    			code3.textContent = "error";
    			t37 = text(", which will either send the component and props to the ");
    			code4 = element("code");
    			code4.textContent = "RouterComponent";
    			t39 = text(" or handle the error, which is documented a bit further down.");
    			t40 = space();
    			p7 = element("p");
    			p7.textContent = "To pass along component properties, which is done by adding an Object literal as the second argument with the data that should be passed on to the component.";
    			t42 = space();
    			pre5 = element("pre");
    			t43 = space();
    			p8 = element("p");
    			t44 = text("Let’s try a more advanced route with dynamic parameters. The route is separated in sections by ");
    			code5 = element("code");
    			code5.textContent = "/";
    			t46 = text(", like a directory structure. Each part can use a dynamic parameter which gets exposed on the ");
    			code6 = element("code");
    			code6.textContent = "req.params";
    			t48 = text(" object.");
    			t49 = space();
    			blockquote0 = element("blockquote");
    			h40 = element("h4");
    			h40.textContent = "NOTE";
    			t51 = space();
    			p9 = element("p");
    			t52 = text("A dynamic parameter catches everything for it’s section and cannot be combined with or placed within a string. It has to start with a ");
    			code7 = element("code");
    			code7.textContent = ":";
    			t54 = text(", so a route like this ");
    			code8 = element("code");
    			code8.textContent = "/articles/article-title-:id";
    			t56 = text(" is therefore invalid, by design!");
    			t57 = space();
    			pre6 = element("pre");
    			t58 = space();
    			p10 = element("p");
    			t59 = text("On the occasion where you want to “bind” a static route to a dynamic parameter you can do so with a ");
    			code9 = element("code");
    			code9.textContent = "->";
    			t61 = text(". This will save slug: ‘about’ on the params object. This is so if your component expects a ");
    			code10 = element("code");
    			code10.textContent = "slug";
    			t63 = text(" prop but you want to define a static route. Useful where the implementation for a dynamic and static route is the same.");
    			t64 = space();
    			pre7 = element("pre");
    			t65 = space();
    			p11 = element("p");
    			t66 = text("So far all routes have been explicit, meaning the route has matched from start to end. To make a route implicit you add a ");
    			code11 = element("code");
    			code11.textContent = "*";
    			t68 = text(" to the end of the route.");
    			t69 = space();
    			blockquote1 = element("blockquote");
    			h41 = element("h4");
    			h41.textContent = "NOTE";
    			t71 = space();
    			p12 = element("p");
    			code12 = element("code");
    			code12.textContent = "*";
    			t73 = text(" is not a wildcard you can place in the middle of the string. It is placed at the end to mark where it match up until and then anything else after that. So it’s important in what order the routes are defined due to no ranking system in place in the library");
    			t74 = space();
    			p13 = element("p");
    			t75 = text("This will match a route like ");
    			code13 = element("code");
    			code13.textContent = "/articles/10";
    			t77 = text(" and ");
    			code14 = element("code");
    			code14.textContent = "/articles/20/what-is-up-with-2020";
    			t79 = text(". It will explicitly match up until the ");
    			code15 = element("code");
    			code15.textContent = ":id";
    			t81 = text(" and then everything else.");
    			t82 = space();
    			pre8 = element("pre");
    			t83 = space();
    			p14 = element("p");
    			p14.textContent = "There is a few small things about routes that gets rid of some redundancy in some instances. For instance you can provide an array of routes, chain the get calls and discard the route completly.";
    			t85 = space();
    			p15 = element("p");
    			p15.textContent = "Multiple routes with the sample implementation";
    			t87 = space();
    			pre9 = element("pre");
    			t88 = space();
    			p16 = element("p");
    			t89 = text("Chain routes as sub routes. Here about and contact will actually become ");
    			code16 = element("code");
    			code16.textContent = "/pages/about";
    			t91 = text(" and ");
    			code17 = element("code");
    			code17.textContent = "/pages/contact";
    			t93 = text(" as they are chained under the pages route. A sub route is not a special case, it’s simply a way to group code together and remove some redundancy. If you’d rather do ");
    			code18 = element("code");
    			code18.textContent = "app.get('/pages/about', ...)";
    			t95 = text(" it would be the same thing.");
    			t96 = space();
    			pre10 = element("pre");
    			t97 = space();
    			p17 = element("p");
    			t98 = text("Or to catch all requests. the route is actually ’");
    			em = element("em");
    			em.textContent = "’ so it catches everything. It is nothing more than a shorthand implementation for `app.get(‘/";
    			t100 = text("’, (req, res) => …)`.");
    			t101 = space();
    			pre11 = element("pre");
    			t102 = space();
    			h31 = element("h3");
    			a5 = element("a");
    			a5.textContent = "Request object";
    			t104 = space();
    			p18 = element("p");
    			p18.textContent = "The request object exposes everything related to the request. This you can use to determin if you want to preload data, what component to load or error out when a request does not meet the requirements.";
    			t106 = space();
    			pre12 = element("pre");
    			t107 = space();
    			h32 = element("h3");
    			a6 = element("a");
    			a6.textContent = "Response object";
    			t109 = space();
    			p19 = element("p");
    			p19.textContent = "The response object is responsible for handling the response. Currently you can send the component and its props to the router or as an error.";
    			t111 = space();
    			pre13 = element("pre");
    			t112 = space();
    			hr1 = element("hr");
    			t113 = space();
    			h22 = element("h2");
    			a7 = element("a");
    			a7.textContent = "Base and linkbase";
    			t115 = space();
    			p20 = element("p");
    			t116 = text("If you are deploying your site to the root no extra configuration has to be done to make it work. But on the occasions where you want to deploy it under a subdirectory you would want to defined the ");
    			code19 = element("code");
    			code19.textContent = "base";
    			t118 = text(" and or perhaps the ");
    			code20 = element("code");
    			code20.textContent = "linkBase";
    			t120 = text(" to cater to that location.");
    			t121 = space();
    			p21 = element("p");
    			t122 = text("Let’s start with base. Lets deploy our app under ");
    			code21 = element("code");
    			code21.textContent = "/project";
    			t124 = text(", so we would access our site under ");
    			code22 = element("code");
    			code22.textContent = "https://example.com/project";
    			t126 = text(".");
    			t127 = space();
    			pre14 = element("pre");
    			t128 = space();
    			p22 = element("p");
    			t129 = text("This does not reflect the ");
    			code23 = element("code");
    			code23.textContent = "linkBase";
    			t131 = text(". It’s implementation is separated due to the instances where you don’t want the ");
    			code24 = element("code");
    			code24.textContent = "use:link";
    			t133 = text(" action directive to reflect that, and the reason why they both aren’t affected by setting the base property.");
    			t134 = space();
    			p23 = element("p");
    			t135 = text("The linkBase is statically defined on the Router object. This will make all helpers like ");
    			code25 = element("code");
    			code25.textContent = "navigate";
    			t137 = text(", ");
    			code26 = element("code");
    			code26.textContent = "redirect";
    			t139 = text(" and ");
    			code27 = element("code");
    			code27.textContent = "link";
    			t141 = text(" prefix everything under ");
    			code28 = element("code");
    			code28.textContent = "/project";
    			t143 = text(".");
    			t144 = space();
    			pre15 = element("pre");
    			t145 = space();
    			p24 = element("p");
    			p24.textContent = "Since setting the linkBase returns the just defined string you can combine it with the base property.";
    			t147 = space();
    			pre16 = element("pre");
    			t148 = space();
    			p25 = element("p");
    			p25.textContent = "Or how about dynamically depending on the base of your inde.html";
    			t150 = space();
    			p26 = element("p");
    			p26.textContent = "Since setting the linkBase returns the just defined string you can combine it with the base property.";
    			t152 = space();
    			pre17 = element("pre");
    			t153 = space();
    			hr2 = element("hr");
    			t154 = space();
    			h23 = element("h2");
    			a8 = element("a");
    			a8.textContent = "Scroll reset";
    			t156 = space();
    			p27 = element("p");
    			p27.textContent = "By default the router will scroll back top on every route change. You can toggle it off if you want to implement your own scroll behaviour or want to load the component in place, as is.";
    			t158 = space();
    			p28 = element("p");
    			p28.textContent = "Like linkBase, that setting is statically defined on the Router class.";
    			t160 = space();
    			pre18 = element("pre");
    			t161 = space();
    			p29 = element("p");
    			t162 = text("or with the ");
    			code29 = element("code");
    			code29.textContent = "setScrollReset";
    			t164 = text(" function.");
    			t165 = space();
    			pre19 = element("pre");
    			t166 = space();
    			hr3 = element("hr");
    			t167 = space();
    			h24 = element("h2");
    			a9 = element("a");
    			a9.textContent = "State object";
    			t169 = space();
    			p30 = element("p");
    			t170 = text("On every request you can pass a states object and so does the initial request by the ");
    			code30 = element("code");
    			code30.textContent = "state";
    			t172 = text(" property passed to the context creation.");
    			t173 = space();
    			pre20 = element("pre");
    			t174 = space();
    			hr4 = element("hr");
    			t175 = space();
    			h25 = element("h2");
    			a10 = element("a");
    			a10.textContent = "Catching errors";
    			t177 = space();
    			p31 = element("p");
    			t178 = text("Like routes you can catch errors with the ");
    			code31 = element("code");
    			code31.textContent = "catch";
    			t180 = text(" method. The underlying implementation is basically the same as ");
    			code32 = element("code");
    			code32.textContent = "get";
    			t182 = text(" routes except it will be used as a fallback if route is not found or manually triggered and that it recieves an additional argument with custom props.");
    			t183 = space();
    			pre21 = element("pre");
    			t184 = space();
    			p32 = element("p");
    			t185 = text("Manually trigger an error for current route ");
    			code33 = element("code");
    			code33.textContent = "/";
    			t187 = text(". The difference of error and send is that error only takes an object of optional custom properties.");
    			t188 = space();
    			pre22 = element("pre");
    			t189 = space();
    			hr5 = element("hr");
    			t190 = space();
    			h26 = element("h2");
    			a11 = element("a");
    			a11.textContent = "Middlewares";
    			t192 = space();
    			p33 = element("p");
    			t193 = text("There are two kinds of middlewares, globals and those attached on to the route itself.\nTo define a global middleware you use the ");
    			code34 = element("code");
    			code34.textContent = "use";
    			t195 = text(" method. Unlike get and catch routes, global middlewares do not take a route. You can define multiple global middlewares and how they are executed is in the order they are defined.");
    			t196 = space();
    			p34 = element("p");
    			t197 = text("To move on to the next middleware you need to call ");
    			code35 = element("code");
    			code35.textContent = "next()";
    			t199 = text(".");
    			t200 = space();
    			pre23 = element("pre");
    			t201 = space();
    			p35 = element("p");
    			t202 = text("Instead of globally on each and every route you can attache the middleware on to the route itself. A middleware is simple a function, the same function used as the callback argument on the ");
    			code36 = element("code");
    			code36.textContent = "use";
    			t204 = text(" method.");
    			t205 = space();
    			pre24 = element("pre");
    			t206 = space();
    			hr6 = element("hr");
    			t207 = space();
    			h27 = element("h2");
    			a12 = element("a");
    			a12.textContent = "Svelte implementation";
    			t209 = space();
    			p36 = element("p");
    			t210 = text("The ");
    			code37 = element("code");
    			code37.textContent = "RouterComponent";
    			t212 = text(" takes optional slot argument and exposes both the ");
    			code38 = element("code");
    			code38.textContent = "component";
    			t214 = text(" and the ");
    			code39 = element("code");
    			code39.textContent = "props";
    			t216 = text(" as variables.");
    			t217 = space();
    			pre25 = element("pre");
    			t218 = space();
    			p37 = element("p");
    			t219 = text("If you want to customize the implementation and perhaps add transitions or animations you can do so by using the exposed variables and utilizing the a ");
    			code40 = element("code");
    			code40.textContent = "svelte:component";
    			t221 = text(" element.");
    			t222 = space();
    			blockquote2 = element("blockquote");
    			h42 = element("h4");
    			h42.textContent = "NOTE";
    			t224 = space();
    			p38 = element("p");
    			t225 = text("that svelte ");
    			code41 = element("code");
    			code41.textContent = "{#key}";
    			t227 = text(" syntax does not exist in svelte ");
    			code42 = element("code");
    			code42.textContent = "3.0.0";
    			t229 = text(". Install ");
    			code43 = element("code");
    			code43.textContent = "svelte@latest";
    			t231 = text(" to get the latest version and to be able to utilize that functionality.");
    			t232 = space();
    			pre26 = element("pre");
    			t233 = space();
    			h33 = element("h3");
    			a13 = element("a");
    			a13.textContent = "Changing routes";
    			t235 = space();
    			p39 = element("p");
    			t236 = text("There is a few different ways to make a request to a route. First lets look at the ");
    			code44 = element("code");
    			code44.textContent = "Actions";
    			t238 = text(" directive. The actions directive adds an on:click handler to the element it is used on. To reduce redundant code there are some fallbacks in place and it goes like this.");
    			t239 = space();
    			p40 = element("p");
    			t240 = text("link:property : ");
    			code45 = element("code");
    			code45.textContent = "to: '/first'";
    			t242 = text(" -> ");
    			code46 = element("code");
    			code46.textContent = "href: '/second'";
    			t244 = text(",\nElement:attribute : ");
    			code47 = element("code");
    			code47.textContent = "href=\"/third\"";
    			t246 = text(" -> ");
    			code48 = element("code");
    			code48.textContent = "data-href=\"/fourth\"";
    			t248 = space();
    			p41 = element("p");
    			t249 = text("So it goes from link property ");
    			code49 = element("code");
    			code49.textContent = "to";
    			t251 = text(", then, ");
    			code50 = element("code");
    			code50.textContent = "href";
    			t253 = text(", then element attribute ");
    			code51 = element("code");
    			code51.textContent = "href";
    			t255 = text(" and lastly data-attribute ");
    			code52 = element("code");
    			code52.textContent = "data-href";
    			t257 = text(". Why so complicated? Because on links we want to use the href attribute to reduce code, while on maybe buttons that according to the specs don’t implement a href attribute. Is that such a problem using ‘expando attributes’? for some it might not, but for others arguing for correct semantics it perhaps would, i’m not the judge of that. Use the method that suits your needs.");
    			t258 = space();
    			p42 = element("p");
    			t259 = text("The link ");
    			code53 = element("code");
    			code53.textContent = "Action";
    			t261 = text(" also accepts an object of properties, but as the bare minimum it will fallback and use the ");
    			code54 = element("code");
    			code54.textContent = "href";
    			t263 = text(" attribute to know which page to route to.");
    			t264 = space();
    			pre27 = element("pre");
    			t265 = space();
    			p43 = element("p");
    			t266 = text("The link properties will always have precedence over the elements attributes. In the example below the page will navigate to ");
    			code55 = element("code");
    			code55.textContent = "/contact";
    			t268 = text(".");
    			t269 = space();
    			pre28 = element("pre");
    			t270 = space();
    			p44 = element("p");
    			p44.textContent = "Different ways of navigating with an example using a button.";
    			t272 = space();
    			pre29 = element("pre");
    			t273 = space();
    			p45 = element("p");
    			t274 = text("You can also pass along a state object to the ");
    			code56 = element("code");
    			code56.textContent = "Request";
    			t276 = text(" object.");
    			t277 = space();
    			pre30 = element("pre");
    			t278 = space();
    			p46 = element("p");
    			t279 = text("And to use it in a route it’s available on the ");
    			code57 = element("code");
    			code57.textContent = "Request";
    			t281 = text(" object, like so.");
    			t282 = space();
    			pre31 = element("pre");
    			t283 = space();
    			p47 = element("p");
    			p47.textContent = "The link implementation options.";
    			t285 = space();
    			pre32 = element("pre");
    			t286 = space();
    			p48 = element("p");
    			p48.textContent = "Adding active class on active routes. The current location is stored in a svelte store. Compare that to the route to add an active class on the navigation link.";
    			t288 = space();
    			pre33 = element("pre");
    			t289 = space();
    			h34 = element("h3");
    			a14 = element("a");
    			a14.textContent = "Programmatically changing routes";
    			t291 = space();
    			p49 = element("p");
    			t292 = text("To programmatically navigate or redirect you have two functions to your exposure. The difference between the two is that ");
    			code58 = element("code");
    			code58.textContent = "navigate";
    			t294 = text(" adds a record to the ");
    			code59 = element("code");
    			code59.textContent = "History";
    			t296 = text(" object which means you can go back and forth in the history, while redirect does not add a record it just changes the current url.");
    			t297 = space();
    			p50 = element("p");
    			p50.textContent = "The helper implementation arguments";
    			t299 = space();
    			pre34 = element("pre");
    			t300 = space();
    			pre35 = element("pre");
    			t301 = space();
    			p51 = element("p");
    			t302 = text("There also exists a ");
    			code60 = element("code");
    			code60.textContent = "Navigate";
    			t304 = text(" and ");
    			code61 = element("code");
    			code61.textContent = "Redirect";
    			t306 = text(" svelte components which is more in tune with how a frontend library would do it. You can differentiate it by the fact that svelte-components needs to be Capitalized.");
    			t307 = space();
    			p52 = element("p");
    			t308 = text("Like the link action you can use either ");
    			code62 = element("code");
    			code62.textContent = "to";
    			t310 = text(" or ");
    			code63 = element("code");
    			code63.textContent = "href";
    			t312 = text(" with the to prop having precedence. The components implement the helper functions so you can optionally pass a state prop.");
    			t313 = space();
    			pre36 = element("pre");
    			t314 = space();
    			p53 = element("p");
    			code64 = element("code");
    			code64.textContent = "mount";
    			t316 = text(" and ");
    			code65 = element("code");
    			code65.textContent = "destroy";
    			t318 = text(" the popstate listener is as easy as calling their respective function.");
    			t319 = space();
    			pre37 = element("pre");
    			t320 = space();
    			hr7 = element("hr");
    			t321 = space();
    			h28 = element("h2");
    			a15 = element("a");
    			a15.textContent = "Quick usage";
    			t323 = space();
    			pre38 = element("pre");
    			t324 = space();
    			p54 = element("p");
    			p54.textContent = "Enable sirv for SPA with the flag ‘—single’";
    			t326 = space();
    			pre39 = element("pre");
    			add_location(h1, file$1, 1, 0, 1);
    			attr_dev(a0, "href", "https://github.com/hjalmar/standalone-router");
    			attr_dev(a0, "rel", "nofollow");
    			add_location(a0, file$1, 2, 32, 67);
    			add_location(p0, file$1, 2, 0, 35);
    			attr_dev(pre0, "class", "language-null");
    			add_location(pre0, file$1, 6, 0, 195);
    			attr_dev(a1, "href", "https://github.com/hjalmar/standalone-router");
    			attr_dev(a1, "rel", "nofollow");
    			add_location(a1, file$1, 7, 139, 446);
    			add_location(p1, file$1, 7, 0, 307);
    			attr_dev(a2, "name", "library-implementation");
    			attr_dev(a2, "href", "documentation#library-implementation");
    			add_location(a2, file$1, 11, 4, 566);
    			add_location(h20, file$1, 11, 0, 562);
    			add_location(p2, file$1, 12, 0, 675);
    			attr_dev(pre1, "class", "language-js");
    			add_location(pre1, file$1, 13, 0, 792);
    			attr_dev(pre2, "class", "language-null");
    			add_location(pre2, file$1, 14, 0, 1596);
    			add_location(hr0, file$1, 27, 0, 2404);
    			attr_dev(a3, "name", "creating-a-router-context");
    			attr_dev(a3, "href", "documentation#creating-a-router-context");
    			add_location(a3, file$1, 28, 4, 2413);
    			add_location(h21, file$1, 28, 0, 2409);
    			add_location(p3, file$1, 29, 0, 2531);
    			attr_dev(pre3, "class", "language-js");
    			add_location(pre3, file$1, 30, 0, 2686);
    			attr_dev(a4, "name", "adding-routes");
    			attr_dev(a4, "href", "documentation#adding-routes");
    			add_location(a4, file$1, 38, 4, 3728);
    			add_location(h30, file$1, 38, 0, 3724);
    			add_location(code0, file$1, 39, 51, 3861);
    			add_location(code1, file$1, 39, 109, 3919);
    			add_location(p4, file$1, 39, 0, 3810);
    			add_location(p5, file$1, 40, 0, 4043);
    			attr_dev(pre4, "class", "language-js");
    			add_location(pre4, file$1, 41, 0, 4087);
    			add_location(code2, file$1, 44, 221, 5003);
    			add_location(code3, file$1, 44, 242, 5024);
    			add_location(code4, file$1, 44, 316, 5098);
    			add_location(p6, file$1, 44, 0, 4782);
    			add_location(p7, file$1, 45, 0, 5192);
    			attr_dev(pre5, "class", "language-js");
    			add_location(pre5, file$1, 46, 0, 5357);
    			add_location(code5, file$1, 51, 98, 6742);
    			add_location(code6, file$1, 51, 206, 6850);
    			add_location(p8, file$1, 51, 0, 6644);
    			add_location(h40, file$1, 53, 0, 6899);
    			add_location(code7, file$1, 54, 137, 7050);
    			add_location(code8, file$1, 54, 174, 7087);
    			add_location(p9, file$1, 54, 0, 6913);
    			add_location(blockquote0, file$1, 52, 0, 6886);
    			attr_dev(pre6, "class", "language-js");
    			add_location(pre6, file$1, 56, 0, 7180);
    			add_location(code9, file$1, 61, 103, 8620);
    			add_location(code10, file$1, 61, 213, 8730);
    			add_location(p10, file$1, 61, 0, 8517);
    			attr_dev(pre7, "class", "language-js");
    			add_location(pre7, file$1, 62, 0, 8872);
    			add_location(code11, file$1, 65, 125, 10101);
    			add_location(p11, file$1, 65, 0, 9976);
    			add_location(h41, file$1, 67, 0, 10159);
    			add_location(code12, file$1, 68, 3, 10176);
    			add_location(p12, file$1, 68, 0, 10173);
    			add_location(blockquote1, file$1, 66, 0, 10146);
    			add_location(code13, file$1, 70, 32, 10497);
    			add_location(code14, file$1, 70, 62, 10527);
    			add_location(code15, file$1, 70, 148, 10613);
    			add_location(p13, file$1, 70, 0, 10465);
    			attr_dev(pre8, "class", "language-js");
    			add_location(pre8, file$1, 71, 0, 10660);
    			add_location(p14, file$1, 74, 0, 11766);
    			add_location(p15, file$1, 75, 0, 11968);
    			attr_dev(pre9, "class", "language-js");
    			add_location(pre9, file$1, 76, 0, 12022);
    			add_location(code16, file$1, 79, 75, 13432);
    			add_location(code17, file$1, 79, 105, 13462);
    			add_location(code18, file$1, 79, 299, 13656);
    			add_location(p16, file$1, 79, 0, 13357);
    			attr_dev(pre10, "class", "language-js");
    			add_location(pre10, file$1, 80, 0, 13730);
    			add_location(em, file$1, 85, 52, 16063);
    			add_location(p17, file$1, 85, 0, 16011);
    			attr_dev(pre11, "class", "language-js");
    			add_location(pre11, file$1, 86, 0, 16192);
    			attr_dev(a5, "name", "request-object");
    			attr_dev(a5, "href", "documentation#request-object");
    			add_location(a5, file$1, 89, 4, 16989);
    			add_location(h31, file$1, 89, 0, 16985);
    			add_location(p18, file$1, 90, 0, 17074);
    			attr_dev(pre12, "class", "language-js");
    			add_location(pre12, file$1, 91, 0, 17284);
    			attr_dev(a6, "name", "response-object");
    			attr_dev(a6, "href", "documentation#response-object");
    			add_location(a6, file$1, 100, 4, 18517);
    			add_location(h32, file$1, 100, 0, 18513);
    			add_location(p19, file$1, 101, 0, 18605);
    			attr_dev(pre13, "class", "language-js");
    			add_location(pre13, file$1, 102, 0, 18755);
    			add_location(hr1, file$1, 106, 0, 19511);
    			attr_dev(a7, "name", "base-and-linkbase");
    			attr_dev(a7, "href", "documentation#base-and-linkbase");
    			add_location(a7, file$1, 107, 4, 19520);
    			add_location(h22, file$1, 107, 0, 19516);
    			add_location(code19, file$1, 108, 201, 19815);
    			add_location(code20, file$1, 108, 238, 19852);
    			add_location(p20, file$1, 108, 0, 19614);
    			add_location(code21, file$1, 109, 52, 19957);
    			add_location(code22, file$1, 109, 109, 20014);
    			add_location(p21, file$1, 109, 0, 19905);
    			attr_dev(pre14, "class", "language-js");
    			add_location(pre14, file$1, 110, 0, 20060);
    			add_location(code23, file$1, 114, 29, 20734);
    			add_location(code24, file$1, 114, 131, 20836);
    			add_location(p22, file$1, 114, 0, 20705);
    			add_location(code25, file$1, 115, 92, 21063);
    			add_location(code26, file$1, 115, 115, 21086);
    			add_location(code27, file$1, 115, 141, 21112);
    			add_location(code28, file$1, 115, 183, 21154);
    			add_location(p23, file$1, 115, 0, 20971);
    			attr_dev(pre15, "class", "language-js");
    			add_location(pre15, file$1, 116, 0, 21182);
    			add_location(p24, file$1, 117, 0, 21434);
    			attr_dev(pre16, "class", "language-js");
    			add_location(pre16, file$1, 118, 0, 21543);
    			add_location(p25, file$1, 122, 0, 22321);
    			add_location(p26, file$1, 123, 0, 22393);
    			attr_dev(pre17, "class", "language-js");
    			add_location(pre17, file$1, 124, 0, 22502);
    			add_location(hr2, file$1, 133, 0, 23980);
    			attr_dev(a8, "name", "scroll-reset");
    			attr_dev(a8, "href", "documentation#scroll-reset");
    			add_location(a8, file$1, 134, 4, 23989);
    			add_location(h23, file$1, 134, 0, 23985);
    			add_location(p27, file$1, 135, 0, 24068);
    			add_location(p28, file$1, 136, 0, 24261);
    			attr_dev(pre18, "class", "language-js");
    			add_location(pre18, file$1, 137, 0, 24339);
    			add_location(code29, file$1, 138, 15, 24605);
    			add_location(p29, file$1, 138, 0, 24590);
    			attr_dev(pre19, "class", "language-js");
    			add_location(pre19, file$1, 139, 0, 24648);
    			add_location(hr3, file$1, 140, 0, 24979);
    			attr_dev(a9, "name", "state-object");
    			attr_dev(a9, "href", "documentation#state-object");
    			add_location(a9, file$1, 141, 4, 24988);
    			add_location(h24, file$1, 141, 0, 24984);
    			add_location(code30, file$1, 142, 88, 25155);
    			add_location(p30, file$1, 142, 0, 25067);
    			attr_dev(pre20, "class", "language-js");
    			add_location(pre20, file$1, 143, 0, 25219);
    			add_location(hr4, file$1, 148, 0, 26084);
    			attr_dev(a10, "name", "catching-errors");
    			attr_dev(a10, "href", "documentation#catching-errors");
    			add_location(a10, file$1, 149, 4, 26093);
    			add_location(h25, file$1, 149, 0, 26089);
    			add_location(code31, file$1, 150, 45, 26226);
    			add_location(code32, file$1, 150, 127, 26308);
    			add_location(p31, file$1, 150, 0, 26181);
    			attr_dev(pre21, "class", "language-js");
    			add_location(pre21, file$1, 151, 0, 26480);
    			add_location(code33, file$1, 155, 47, 27332);
    			add_location(p32, file$1, 155, 0, 27285);
    			attr_dev(pre22, "class", "language-js");
    			add_location(pre22, file$1, 156, 0, 27451);
    			add_location(hr5, file$1, 163, 0, 28978);
    			attr_dev(a11, "name", "middlewares");
    			attr_dev(a11, "href", "documentation#middlewares");
    			add_location(a11, file$1, 164, 4, 28987);
    			add_location(h26, file$1, 164, 0, 28983);
    			add_location(code34, file$1, 166, 42, 29195);
    			add_location(p33, file$1, 165, 0, 29063);
    			add_location(code35, file$1, 167, 54, 29451);
    			add_location(p34, file$1, 167, 0, 29397);
    			attr_dev(pre23, "class", "language-js");
    			add_location(pre23, file$1, 168, 0, 29476);
    			add_location(code36, file$1, 181, 192, 32360);
    			add_location(p35, file$1, 181, 0, 32168);
    			attr_dev(pre24, "class", "language-js");
    			add_location(pre24, file$1, 182, 0, 32389);
    			add_location(hr6, file$1, 194, 0, 34697);
    			attr_dev(a12, "name", "svelte-implementation");
    			attr_dev(a12, "href", "documentation#svelte-implementation");
    			add_location(a12, file$1, 195, 4, 34706);
    			add_location(h27, file$1, 195, 0, 34702);
    			add_location(code37, file$1, 196, 7, 34819);
    			add_location(code38, file$1, 196, 86, 34898);
    			add_location(code39, file$1, 196, 117, 34929);
    			add_location(p36, file$1, 196, 0, 34812);
    			attr_dev(pre25, "class", "language-html");
    			add_location(pre25, file$1, 197, 0, 34966);
    			add_location(code40, file$1, 202, 154, 35949);
    			add_location(p37, file$1, 202, 0, 35795);
    			add_location(h42, file$1, 204, 0, 36005);
    			add_location(code41, file$1, 205, 15, 36034);
    			add_location(code42, file$1, 205, 77, 36096);
    			add_location(code43, file$1, 205, 105, 36124);
    			add_location(p38, file$1, 205, 0, 36019);
    			add_location(blockquote2, file$1, 203, 0, 35992);
    			attr_dev(pre26, "class", "language-html");
    			add_location(pre26, file$1, 207, 0, 36242);
    			attr_dev(a13, "name", "changing-routes");
    			attr_dev(a13, "href", "documentation#changing-routes");
    			add_location(a13, file$1, 218, 4, 38481);
    			add_location(h33, file$1, 218, 0, 38477);
    			add_location(code44, file$1, 219, 86, 38655);
    			add_location(p39, file$1, 219, 0, 38569);
    			add_location(code45, file$1, 220, 19, 38869);
    			add_location(code46, file$1, 220, 48, 38898);
    			add_location(code47, file$1, 221, 20, 38948);
    			add_location(code48, file$1, 221, 50, 38978);
    			add_location(p40, file$1, 220, 0, 38850);
    			add_location(code49, file$1, 222, 33, 39048);
    			add_location(code50, file$1, 222, 56, 39071);
    			add_location(code51, file$1, 222, 98, 39113);
    			add_location(code52, file$1, 222, 142, 39157);
    			add_location(p41, file$1, 222, 0, 39015);
    			add_location(code53, file$1, 223, 12, 39571);
    			add_location(code54, file$1, 223, 123, 39682);
    			add_location(p42, file$1, 223, 0, 39559);
    			attr_dev(pre27, "class", "language-html");
    			add_location(pre27, file$1, 224, 0, 39746);
    			add_location(code55, file$1, 228, 128, 41220);
    			add_location(p43, file$1, 228, 0, 41092);
    			attr_dev(pre28, "class", "language-html");
    			add_location(pre28, file$1, 229, 0, 41247);
    			add_location(p44, file$1, 233, 0, 42214);
    			attr_dev(pre29, "class", "language-html");
    			add_location(pre29, file$1, 234, 0, 42282);
    			add_location(code56, file$1, 242, 49, 44781);
    			add_location(p45, file$1, 242, 0, 44732);
    			attr_dev(pre30, "class", "language-html");
    			add_location(pre30, file$1, 243, 0, 44814);
    			add_location(code57, file$1, 248, 50, 45859);
    			add_location(p46, file$1, 248, 0, 45809);
    			attr_dev(pre31, "class", "language-js");
    			add_location(pre31, file$1, 249, 0, 45901);
    			add_location(p47, file$1, 252, 0, 47003);
    			attr_dev(pre32, "class", "language-js");
    			add_location(pre32, file$1, 253, 0, 47043);
    			add_location(p48, file$1, 259, 0, 47606);
    			attr_dev(pre33, "class", "language-html");
    			add_location(pre33, file$1, 260, 0, 47774);
    			attr_dev(a14, "name", "programmatically-changing-routes");
    			attr_dev(a14, "href", "documentation#programmatically-changing-routes");
    			add_location(a14, file$1, 266, 4, 48982);
    			add_location(h34, file$1, 266, 0, 48978);
    			add_location(code58, file$1, 267, 124, 49245);
    			add_location(code59, file$1, 267, 167, 49288);
    			add_location(p49, file$1, 267, 0, 49121);
    			add_location(p50, file$1, 268, 0, 49446);
    			attr_dev(pre34, "class", "language-null");
    			add_location(pre34, file$1, 269, 0, 49489);
    			attr_dev(pre35, "class", "language-js");
    			add_location(pre35, file$1, 271, 0, 49647);
    			add_location(code60, file$1, 274, 23, 50501);
    			add_location(code61, file$1, 274, 49, 50527);
    			add_location(p51, file$1, 274, 0, 50478);
    			add_location(code62, file$1, 275, 43, 50762);
    			add_location(code63, file$1, 275, 62, 50781);
    			add_location(p52, file$1, 275, 0, 50719);
    			attr_dev(pre36, "class", "language-html");
    			add_location(pre36, file$1, 276, 0, 50926);
    			add_location(code64, file$1, 283, 3, 52471);
    			add_location(code65, file$1, 283, 26, 52494);
    			add_location(p53, file$1, 283, 0, 52468);
    			attr_dev(pre37, "class", "language-js");
    			add_location(pre37, file$1, 284, 0, 52590);
    			add_location(hr7, file$1, 288, 0, 53385);
    			attr_dev(a15, "name", "quick-usage");
    			attr_dev(a15, "href", "documentation#quick-usage");
    			add_location(a15, file$1, 289, 4, 53394);
    			add_location(h28, file$1, 289, 0, 53390);
    			attr_dev(pre38, "class", "language-html");
    			add_location(pre38, file$1, 290, 0, 53470);
    			add_location(p54, file$1, 331, 0, 61160);
    			attr_dev(pre39, "class", "language-js");
    			add_location(pre39, file$1, 332, 0, 61211);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h1, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, p0, anchor);
    			append_dev(p0, t2);
    			append_dev(p0, a0);
    			insert_dev(target, t4, anchor);
    			insert_dev(target, pre0, anchor);
    			pre0.innerHTML = raw0_value;
    			insert_dev(target, t5, anchor);
    			insert_dev(target, p1, anchor);
    			append_dev(p1, t6);
    			append_dev(p1, a1);
    			append_dev(p1, t8);
    			insert_dev(target, t9, anchor);
    			insert_dev(target, h20, anchor);
    			append_dev(h20, a2);
    			insert_dev(target, t11, anchor);
    			insert_dev(target, p2, anchor);
    			insert_dev(target, t13, anchor);
    			insert_dev(target, pre1, anchor);
    			pre1.innerHTML = raw1_value;
    			insert_dev(target, t14, anchor);
    			insert_dev(target, pre2, anchor);
    			pre2.innerHTML = raw2_value;
    			insert_dev(target, t15, anchor);
    			insert_dev(target, hr0, anchor);
    			insert_dev(target, t16, anchor);
    			insert_dev(target, h21, anchor);
    			append_dev(h21, a3);
    			insert_dev(target, t18, anchor);
    			insert_dev(target, p3, anchor);
    			insert_dev(target, t20, anchor);
    			insert_dev(target, pre3, anchor);
    			pre3.innerHTML = raw3_value;
    			insert_dev(target, t21, anchor);
    			insert_dev(target, h30, anchor);
    			append_dev(h30, a4);
    			insert_dev(target, t23, anchor);
    			insert_dev(target, p4, anchor);
    			append_dev(p4, t24);
    			append_dev(p4, code0);
    			append_dev(p4, t26);
    			append_dev(p4, code1);
    			append_dev(p4, t28);
    			insert_dev(target, t29, anchor);
    			insert_dev(target, p5, anchor);
    			insert_dev(target, t31, anchor);
    			insert_dev(target, pre4, anchor);
    			pre4.innerHTML = raw4_value;
    			insert_dev(target, t32, anchor);
    			insert_dev(target, p6, anchor);
    			append_dev(p6, t33);
    			append_dev(p6, code2);
    			append_dev(p6, t35);
    			append_dev(p6, code3);
    			append_dev(p6, t37);
    			append_dev(p6, code4);
    			append_dev(p6, t39);
    			insert_dev(target, t40, anchor);
    			insert_dev(target, p7, anchor);
    			insert_dev(target, t42, anchor);
    			insert_dev(target, pre5, anchor);
    			pre5.innerHTML = raw5_value;
    			insert_dev(target, t43, anchor);
    			insert_dev(target, p8, anchor);
    			append_dev(p8, t44);
    			append_dev(p8, code5);
    			append_dev(p8, t46);
    			append_dev(p8, code6);
    			append_dev(p8, t48);
    			insert_dev(target, t49, anchor);
    			insert_dev(target, blockquote0, anchor);
    			append_dev(blockquote0, h40);
    			append_dev(blockquote0, t51);
    			append_dev(blockquote0, p9);
    			append_dev(p9, t52);
    			append_dev(p9, code7);
    			append_dev(p9, t54);
    			append_dev(p9, code8);
    			append_dev(p9, t56);
    			insert_dev(target, t57, anchor);
    			insert_dev(target, pre6, anchor);
    			pre6.innerHTML = raw6_value;
    			insert_dev(target, t58, anchor);
    			insert_dev(target, p10, anchor);
    			append_dev(p10, t59);
    			append_dev(p10, code9);
    			append_dev(p10, t61);
    			append_dev(p10, code10);
    			append_dev(p10, t63);
    			insert_dev(target, t64, anchor);
    			insert_dev(target, pre7, anchor);
    			pre7.innerHTML = raw7_value;
    			insert_dev(target, t65, anchor);
    			insert_dev(target, p11, anchor);
    			append_dev(p11, t66);
    			append_dev(p11, code11);
    			append_dev(p11, t68);
    			insert_dev(target, t69, anchor);
    			insert_dev(target, blockquote1, anchor);
    			append_dev(blockquote1, h41);
    			append_dev(blockquote1, t71);
    			append_dev(blockquote1, p12);
    			append_dev(p12, code12);
    			append_dev(p12, t73);
    			insert_dev(target, t74, anchor);
    			insert_dev(target, p13, anchor);
    			append_dev(p13, t75);
    			append_dev(p13, code13);
    			append_dev(p13, t77);
    			append_dev(p13, code14);
    			append_dev(p13, t79);
    			append_dev(p13, code15);
    			append_dev(p13, t81);
    			insert_dev(target, t82, anchor);
    			insert_dev(target, pre8, anchor);
    			pre8.innerHTML = raw8_value;
    			insert_dev(target, t83, anchor);
    			insert_dev(target, p14, anchor);
    			insert_dev(target, t85, anchor);
    			insert_dev(target, p15, anchor);
    			insert_dev(target, t87, anchor);
    			insert_dev(target, pre9, anchor);
    			pre9.innerHTML = raw9_value;
    			insert_dev(target, t88, anchor);
    			insert_dev(target, p16, anchor);
    			append_dev(p16, t89);
    			append_dev(p16, code16);
    			append_dev(p16, t91);
    			append_dev(p16, code17);
    			append_dev(p16, t93);
    			append_dev(p16, code18);
    			append_dev(p16, t95);
    			insert_dev(target, t96, anchor);
    			insert_dev(target, pre10, anchor);
    			pre10.innerHTML = raw10_value;
    			insert_dev(target, t97, anchor);
    			insert_dev(target, p17, anchor);
    			append_dev(p17, t98);
    			append_dev(p17, em);
    			append_dev(p17, t100);
    			insert_dev(target, t101, anchor);
    			insert_dev(target, pre11, anchor);
    			pre11.innerHTML = raw11_value;
    			insert_dev(target, t102, anchor);
    			insert_dev(target, h31, anchor);
    			append_dev(h31, a5);
    			insert_dev(target, t104, anchor);
    			insert_dev(target, p18, anchor);
    			insert_dev(target, t106, anchor);
    			insert_dev(target, pre12, anchor);
    			pre12.innerHTML = raw12_value;
    			insert_dev(target, t107, anchor);
    			insert_dev(target, h32, anchor);
    			append_dev(h32, a6);
    			insert_dev(target, t109, anchor);
    			insert_dev(target, p19, anchor);
    			insert_dev(target, t111, anchor);
    			insert_dev(target, pre13, anchor);
    			pre13.innerHTML = raw13_value;
    			insert_dev(target, t112, anchor);
    			insert_dev(target, hr1, anchor);
    			insert_dev(target, t113, anchor);
    			insert_dev(target, h22, anchor);
    			append_dev(h22, a7);
    			insert_dev(target, t115, anchor);
    			insert_dev(target, p20, anchor);
    			append_dev(p20, t116);
    			append_dev(p20, code19);
    			append_dev(p20, t118);
    			append_dev(p20, code20);
    			append_dev(p20, t120);
    			insert_dev(target, t121, anchor);
    			insert_dev(target, p21, anchor);
    			append_dev(p21, t122);
    			append_dev(p21, code21);
    			append_dev(p21, t124);
    			append_dev(p21, code22);
    			append_dev(p21, t126);
    			insert_dev(target, t127, anchor);
    			insert_dev(target, pre14, anchor);
    			pre14.innerHTML = raw14_value;
    			insert_dev(target, t128, anchor);
    			insert_dev(target, p22, anchor);
    			append_dev(p22, t129);
    			append_dev(p22, code23);
    			append_dev(p22, t131);
    			append_dev(p22, code24);
    			append_dev(p22, t133);
    			insert_dev(target, t134, anchor);
    			insert_dev(target, p23, anchor);
    			append_dev(p23, t135);
    			append_dev(p23, code25);
    			append_dev(p23, t137);
    			append_dev(p23, code26);
    			append_dev(p23, t139);
    			append_dev(p23, code27);
    			append_dev(p23, t141);
    			append_dev(p23, code28);
    			append_dev(p23, t143);
    			insert_dev(target, t144, anchor);
    			insert_dev(target, pre15, anchor);
    			pre15.innerHTML = raw15_value;
    			insert_dev(target, t145, anchor);
    			insert_dev(target, p24, anchor);
    			insert_dev(target, t147, anchor);
    			insert_dev(target, pre16, anchor);
    			pre16.innerHTML = raw16_value;
    			insert_dev(target, t148, anchor);
    			insert_dev(target, p25, anchor);
    			insert_dev(target, t150, anchor);
    			insert_dev(target, p26, anchor);
    			insert_dev(target, t152, anchor);
    			insert_dev(target, pre17, anchor);
    			pre17.innerHTML = raw17_value;
    			insert_dev(target, t153, anchor);
    			insert_dev(target, hr2, anchor);
    			insert_dev(target, t154, anchor);
    			insert_dev(target, h23, anchor);
    			append_dev(h23, a8);
    			insert_dev(target, t156, anchor);
    			insert_dev(target, p27, anchor);
    			insert_dev(target, t158, anchor);
    			insert_dev(target, p28, anchor);
    			insert_dev(target, t160, anchor);
    			insert_dev(target, pre18, anchor);
    			pre18.innerHTML = raw18_value;
    			insert_dev(target, t161, anchor);
    			insert_dev(target, p29, anchor);
    			append_dev(p29, t162);
    			append_dev(p29, code29);
    			append_dev(p29, t164);
    			insert_dev(target, t165, anchor);
    			insert_dev(target, pre19, anchor);
    			pre19.innerHTML = raw19_value;
    			insert_dev(target, t166, anchor);
    			insert_dev(target, hr3, anchor);
    			insert_dev(target, t167, anchor);
    			insert_dev(target, h24, anchor);
    			append_dev(h24, a9);
    			insert_dev(target, t169, anchor);
    			insert_dev(target, p30, anchor);
    			append_dev(p30, t170);
    			append_dev(p30, code30);
    			append_dev(p30, t172);
    			insert_dev(target, t173, anchor);
    			insert_dev(target, pre20, anchor);
    			pre20.innerHTML = raw20_value;
    			insert_dev(target, t174, anchor);
    			insert_dev(target, hr4, anchor);
    			insert_dev(target, t175, anchor);
    			insert_dev(target, h25, anchor);
    			append_dev(h25, a10);
    			insert_dev(target, t177, anchor);
    			insert_dev(target, p31, anchor);
    			append_dev(p31, t178);
    			append_dev(p31, code31);
    			append_dev(p31, t180);
    			append_dev(p31, code32);
    			append_dev(p31, t182);
    			insert_dev(target, t183, anchor);
    			insert_dev(target, pre21, anchor);
    			pre21.innerHTML = raw21_value;
    			insert_dev(target, t184, anchor);
    			insert_dev(target, p32, anchor);
    			append_dev(p32, t185);
    			append_dev(p32, code33);
    			append_dev(p32, t187);
    			insert_dev(target, t188, anchor);
    			insert_dev(target, pre22, anchor);
    			pre22.innerHTML = raw22_value;
    			insert_dev(target, t189, anchor);
    			insert_dev(target, hr5, anchor);
    			insert_dev(target, t190, anchor);
    			insert_dev(target, h26, anchor);
    			append_dev(h26, a11);
    			insert_dev(target, t192, anchor);
    			insert_dev(target, p33, anchor);
    			append_dev(p33, t193);
    			append_dev(p33, code34);
    			append_dev(p33, t195);
    			insert_dev(target, t196, anchor);
    			insert_dev(target, p34, anchor);
    			append_dev(p34, t197);
    			append_dev(p34, code35);
    			append_dev(p34, t199);
    			insert_dev(target, t200, anchor);
    			insert_dev(target, pre23, anchor);
    			pre23.innerHTML = raw23_value;
    			insert_dev(target, t201, anchor);
    			insert_dev(target, p35, anchor);
    			append_dev(p35, t202);
    			append_dev(p35, code36);
    			append_dev(p35, t204);
    			insert_dev(target, t205, anchor);
    			insert_dev(target, pre24, anchor);
    			pre24.innerHTML = raw24_value;
    			insert_dev(target, t206, anchor);
    			insert_dev(target, hr6, anchor);
    			insert_dev(target, t207, anchor);
    			insert_dev(target, h27, anchor);
    			append_dev(h27, a12);
    			insert_dev(target, t209, anchor);
    			insert_dev(target, p36, anchor);
    			append_dev(p36, t210);
    			append_dev(p36, code37);
    			append_dev(p36, t212);
    			append_dev(p36, code38);
    			append_dev(p36, t214);
    			append_dev(p36, code39);
    			append_dev(p36, t216);
    			insert_dev(target, t217, anchor);
    			insert_dev(target, pre25, anchor);
    			pre25.innerHTML = raw25_value;
    			insert_dev(target, t218, anchor);
    			insert_dev(target, p37, anchor);
    			append_dev(p37, t219);
    			append_dev(p37, code40);
    			append_dev(p37, t221);
    			insert_dev(target, t222, anchor);
    			insert_dev(target, blockquote2, anchor);
    			append_dev(blockquote2, h42);
    			append_dev(blockquote2, t224);
    			append_dev(blockquote2, p38);
    			append_dev(p38, t225);
    			append_dev(p38, code41);
    			append_dev(p38, t227);
    			append_dev(p38, code42);
    			append_dev(p38, t229);
    			append_dev(p38, code43);
    			append_dev(p38, t231);
    			insert_dev(target, t232, anchor);
    			insert_dev(target, pre26, anchor);
    			pre26.innerHTML = raw26_value;
    			insert_dev(target, t233, anchor);
    			insert_dev(target, h33, anchor);
    			append_dev(h33, a13);
    			insert_dev(target, t235, anchor);
    			insert_dev(target, p39, anchor);
    			append_dev(p39, t236);
    			append_dev(p39, code44);
    			append_dev(p39, t238);
    			insert_dev(target, t239, anchor);
    			insert_dev(target, p40, anchor);
    			append_dev(p40, t240);
    			append_dev(p40, code45);
    			append_dev(p40, t242);
    			append_dev(p40, code46);
    			append_dev(p40, t244);
    			append_dev(p40, code47);
    			append_dev(p40, t246);
    			append_dev(p40, code48);
    			insert_dev(target, t248, anchor);
    			insert_dev(target, p41, anchor);
    			append_dev(p41, t249);
    			append_dev(p41, code49);
    			append_dev(p41, t251);
    			append_dev(p41, code50);
    			append_dev(p41, t253);
    			append_dev(p41, code51);
    			append_dev(p41, t255);
    			append_dev(p41, code52);
    			append_dev(p41, t257);
    			insert_dev(target, t258, anchor);
    			insert_dev(target, p42, anchor);
    			append_dev(p42, t259);
    			append_dev(p42, code53);
    			append_dev(p42, t261);
    			append_dev(p42, code54);
    			append_dev(p42, t263);
    			insert_dev(target, t264, anchor);
    			insert_dev(target, pre27, anchor);
    			pre27.innerHTML = raw27_value;
    			insert_dev(target, t265, anchor);
    			insert_dev(target, p43, anchor);
    			append_dev(p43, t266);
    			append_dev(p43, code55);
    			append_dev(p43, t268);
    			insert_dev(target, t269, anchor);
    			insert_dev(target, pre28, anchor);
    			pre28.innerHTML = raw28_value;
    			insert_dev(target, t270, anchor);
    			insert_dev(target, p44, anchor);
    			insert_dev(target, t272, anchor);
    			insert_dev(target, pre29, anchor);
    			pre29.innerHTML = raw29_value;
    			insert_dev(target, t273, anchor);
    			insert_dev(target, p45, anchor);
    			append_dev(p45, t274);
    			append_dev(p45, code56);
    			append_dev(p45, t276);
    			insert_dev(target, t277, anchor);
    			insert_dev(target, pre30, anchor);
    			pre30.innerHTML = raw30_value;
    			insert_dev(target, t278, anchor);
    			insert_dev(target, p46, anchor);
    			append_dev(p46, t279);
    			append_dev(p46, code57);
    			append_dev(p46, t281);
    			insert_dev(target, t282, anchor);
    			insert_dev(target, pre31, anchor);
    			pre31.innerHTML = raw31_value;
    			insert_dev(target, t283, anchor);
    			insert_dev(target, p47, anchor);
    			insert_dev(target, t285, anchor);
    			insert_dev(target, pre32, anchor);
    			pre32.innerHTML = raw32_value;
    			insert_dev(target, t286, anchor);
    			insert_dev(target, p48, anchor);
    			insert_dev(target, t288, anchor);
    			insert_dev(target, pre33, anchor);
    			pre33.innerHTML = raw33_value;
    			insert_dev(target, t289, anchor);
    			insert_dev(target, h34, anchor);
    			append_dev(h34, a14);
    			insert_dev(target, t291, anchor);
    			insert_dev(target, p49, anchor);
    			append_dev(p49, t292);
    			append_dev(p49, code58);
    			append_dev(p49, t294);
    			append_dev(p49, code59);
    			append_dev(p49, t296);
    			insert_dev(target, t297, anchor);
    			insert_dev(target, p50, anchor);
    			insert_dev(target, t299, anchor);
    			insert_dev(target, pre34, anchor);
    			pre34.innerHTML = raw34_value;
    			insert_dev(target, t300, anchor);
    			insert_dev(target, pre35, anchor);
    			pre35.innerHTML = raw35_value;
    			insert_dev(target, t301, anchor);
    			insert_dev(target, p51, anchor);
    			append_dev(p51, t302);
    			append_dev(p51, code60);
    			append_dev(p51, t304);
    			append_dev(p51, code61);
    			append_dev(p51, t306);
    			insert_dev(target, t307, anchor);
    			insert_dev(target, p52, anchor);
    			append_dev(p52, t308);
    			append_dev(p52, code62);
    			append_dev(p52, t310);
    			append_dev(p52, code63);
    			append_dev(p52, t312);
    			insert_dev(target, t313, anchor);
    			insert_dev(target, pre36, anchor);
    			pre36.innerHTML = raw36_value;
    			insert_dev(target, t314, anchor);
    			insert_dev(target, p53, anchor);
    			append_dev(p53, code64);
    			append_dev(p53, t316);
    			append_dev(p53, code65);
    			append_dev(p53, t318);
    			insert_dev(target, t319, anchor);
    			insert_dev(target, pre37, anchor);
    			pre37.innerHTML = raw37_value;
    			insert_dev(target, t320, anchor);
    			insert_dev(target, hr7, anchor);
    			insert_dev(target, t321, anchor);
    			insert_dev(target, h28, anchor);
    			append_dev(h28, a15);
    			insert_dev(target, t323, anchor);
    			insert_dev(target, pre38, anchor);
    			pre38.innerHTML = raw38_value;
    			insert_dev(target, t324, anchor);
    			insert_dev(target, p54, anchor);
    			insert_dev(target, t326, anchor);
    			insert_dev(target, pre39, anchor);
    			pre39.innerHTML = raw39_value;
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h1);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(p0);
    			if (detaching) detach_dev(t4);
    			if (detaching) detach_dev(pre0);
    			if (detaching) detach_dev(t5);
    			if (detaching) detach_dev(p1);
    			if (detaching) detach_dev(t9);
    			if (detaching) detach_dev(h20);
    			if (detaching) detach_dev(t11);
    			if (detaching) detach_dev(p2);
    			if (detaching) detach_dev(t13);
    			if (detaching) detach_dev(pre1);
    			if (detaching) detach_dev(t14);
    			if (detaching) detach_dev(pre2);
    			if (detaching) detach_dev(t15);
    			if (detaching) detach_dev(hr0);
    			if (detaching) detach_dev(t16);
    			if (detaching) detach_dev(h21);
    			if (detaching) detach_dev(t18);
    			if (detaching) detach_dev(p3);
    			if (detaching) detach_dev(t20);
    			if (detaching) detach_dev(pre3);
    			if (detaching) detach_dev(t21);
    			if (detaching) detach_dev(h30);
    			if (detaching) detach_dev(t23);
    			if (detaching) detach_dev(p4);
    			if (detaching) detach_dev(t29);
    			if (detaching) detach_dev(p5);
    			if (detaching) detach_dev(t31);
    			if (detaching) detach_dev(pre4);
    			if (detaching) detach_dev(t32);
    			if (detaching) detach_dev(p6);
    			if (detaching) detach_dev(t40);
    			if (detaching) detach_dev(p7);
    			if (detaching) detach_dev(t42);
    			if (detaching) detach_dev(pre5);
    			if (detaching) detach_dev(t43);
    			if (detaching) detach_dev(p8);
    			if (detaching) detach_dev(t49);
    			if (detaching) detach_dev(blockquote0);
    			if (detaching) detach_dev(t57);
    			if (detaching) detach_dev(pre6);
    			if (detaching) detach_dev(t58);
    			if (detaching) detach_dev(p10);
    			if (detaching) detach_dev(t64);
    			if (detaching) detach_dev(pre7);
    			if (detaching) detach_dev(t65);
    			if (detaching) detach_dev(p11);
    			if (detaching) detach_dev(t69);
    			if (detaching) detach_dev(blockquote1);
    			if (detaching) detach_dev(t74);
    			if (detaching) detach_dev(p13);
    			if (detaching) detach_dev(t82);
    			if (detaching) detach_dev(pre8);
    			if (detaching) detach_dev(t83);
    			if (detaching) detach_dev(p14);
    			if (detaching) detach_dev(t85);
    			if (detaching) detach_dev(p15);
    			if (detaching) detach_dev(t87);
    			if (detaching) detach_dev(pre9);
    			if (detaching) detach_dev(t88);
    			if (detaching) detach_dev(p16);
    			if (detaching) detach_dev(t96);
    			if (detaching) detach_dev(pre10);
    			if (detaching) detach_dev(t97);
    			if (detaching) detach_dev(p17);
    			if (detaching) detach_dev(t101);
    			if (detaching) detach_dev(pre11);
    			if (detaching) detach_dev(t102);
    			if (detaching) detach_dev(h31);
    			if (detaching) detach_dev(t104);
    			if (detaching) detach_dev(p18);
    			if (detaching) detach_dev(t106);
    			if (detaching) detach_dev(pre12);
    			if (detaching) detach_dev(t107);
    			if (detaching) detach_dev(h32);
    			if (detaching) detach_dev(t109);
    			if (detaching) detach_dev(p19);
    			if (detaching) detach_dev(t111);
    			if (detaching) detach_dev(pre13);
    			if (detaching) detach_dev(t112);
    			if (detaching) detach_dev(hr1);
    			if (detaching) detach_dev(t113);
    			if (detaching) detach_dev(h22);
    			if (detaching) detach_dev(t115);
    			if (detaching) detach_dev(p20);
    			if (detaching) detach_dev(t121);
    			if (detaching) detach_dev(p21);
    			if (detaching) detach_dev(t127);
    			if (detaching) detach_dev(pre14);
    			if (detaching) detach_dev(t128);
    			if (detaching) detach_dev(p22);
    			if (detaching) detach_dev(t134);
    			if (detaching) detach_dev(p23);
    			if (detaching) detach_dev(t144);
    			if (detaching) detach_dev(pre15);
    			if (detaching) detach_dev(t145);
    			if (detaching) detach_dev(p24);
    			if (detaching) detach_dev(t147);
    			if (detaching) detach_dev(pre16);
    			if (detaching) detach_dev(t148);
    			if (detaching) detach_dev(p25);
    			if (detaching) detach_dev(t150);
    			if (detaching) detach_dev(p26);
    			if (detaching) detach_dev(t152);
    			if (detaching) detach_dev(pre17);
    			if (detaching) detach_dev(t153);
    			if (detaching) detach_dev(hr2);
    			if (detaching) detach_dev(t154);
    			if (detaching) detach_dev(h23);
    			if (detaching) detach_dev(t156);
    			if (detaching) detach_dev(p27);
    			if (detaching) detach_dev(t158);
    			if (detaching) detach_dev(p28);
    			if (detaching) detach_dev(t160);
    			if (detaching) detach_dev(pre18);
    			if (detaching) detach_dev(t161);
    			if (detaching) detach_dev(p29);
    			if (detaching) detach_dev(t165);
    			if (detaching) detach_dev(pre19);
    			if (detaching) detach_dev(t166);
    			if (detaching) detach_dev(hr3);
    			if (detaching) detach_dev(t167);
    			if (detaching) detach_dev(h24);
    			if (detaching) detach_dev(t169);
    			if (detaching) detach_dev(p30);
    			if (detaching) detach_dev(t173);
    			if (detaching) detach_dev(pre20);
    			if (detaching) detach_dev(t174);
    			if (detaching) detach_dev(hr4);
    			if (detaching) detach_dev(t175);
    			if (detaching) detach_dev(h25);
    			if (detaching) detach_dev(t177);
    			if (detaching) detach_dev(p31);
    			if (detaching) detach_dev(t183);
    			if (detaching) detach_dev(pre21);
    			if (detaching) detach_dev(t184);
    			if (detaching) detach_dev(p32);
    			if (detaching) detach_dev(t188);
    			if (detaching) detach_dev(pre22);
    			if (detaching) detach_dev(t189);
    			if (detaching) detach_dev(hr5);
    			if (detaching) detach_dev(t190);
    			if (detaching) detach_dev(h26);
    			if (detaching) detach_dev(t192);
    			if (detaching) detach_dev(p33);
    			if (detaching) detach_dev(t196);
    			if (detaching) detach_dev(p34);
    			if (detaching) detach_dev(t200);
    			if (detaching) detach_dev(pre23);
    			if (detaching) detach_dev(t201);
    			if (detaching) detach_dev(p35);
    			if (detaching) detach_dev(t205);
    			if (detaching) detach_dev(pre24);
    			if (detaching) detach_dev(t206);
    			if (detaching) detach_dev(hr6);
    			if (detaching) detach_dev(t207);
    			if (detaching) detach_dev(h27);
    			if (detaching) detach_dev(t209);
    			if (detaching) detach_dev(p36);
    			if (detaching) detach_dev(t217);
    			if (detaching) detach_dev(pre25);
    			if (detaching) detach_dev(t218);
    			if (detaching) detach_dev(p37);
    			if (detaching) detach_dev(t222);
    			if (detaching) detach_dev(blockquote2);
    			if (detaching) detach_dev(t232);
    			if (detaching) detach_dev(pre26);
    			if (detaching) detach_dev(t233);
    			if (detaching) detach_dev(h33);
    			if (detaching) detach_dev(t235);
    			if (detaching) detach_dev(p39);
    			if (detaching) detach_dev(t239);
    			if (detaching) detach_dev(p40);
    			if (detaching) detach_dev(t248);
    			if (detaching) detach_dev(p41);
    			if (detaching) detach_dev(t258);
    			if (detaching) detach_dev(p42);
    			if (detaching) detach_dev(t264);
    			if (detaching) detach_dev(pre27);
    			if (detaching) detach_dev(t265);
    			if (detaching) detach_dev(p43);
    			if (detaching) detach_dev(t269);
    			if (detaching) detach_dev(pre28);
    			if (detaching) detach_dev(t270);
    			if (detaching) detach_dev(p44);
    			if (detaching) detach_dev(t272);
    			if (detaching) detach_dev(pre29);
    			if (detaching) detach_dev(t273);
    			if (detaching) detach_dev(p45);
    			if (detaching) detach_dev(t277);
    			if (detaching) detach_dev(pre30);
    			if (detaching) detach_dev(t278);
    			if (detaching) detach_dev(p46);
    			if (detaching) detach_dev(t282);
    			if (detaching) detach_dev(pre31);
    			if (detaching) detach_dev(t283);
    			if (detaching) detach_dev(p47);
    			if (detaching) detach_dev(t285);
    			if (detaching) detach_dev(pre32);
    			if (detaching) detach_dev(t286);
    			if (detaching) detach_dev(p48);
    			if (detaching) detach_dev(t288);
    			if (detaching) detach_dev(pre33);
    			if (detaching) detach_dev(t289);
    			if (detaching) detach_dev(h34);
    			if (detaching) detach_dev(t291);
    			if (detaching) detach_dev(p49);
    			if (detaching) detach_dev(t297);
    			if (detaching) detach_dev(p50);
    			if (detaching) detach_dev(t299);
    			if (detaching) detach_dev(pre34);
    			if (detaching) detach_dev(t300);
    			if (detaching) detach_dev(pre35);
    			if (detaching) detach_dev(t301);
    			if (detaching) detach_dev(p51);
    			if (detaching) detach_dev(t307);
    			if (detaching) detach_dev(p52);
    			if (detaching) detach_dev(t313);
    			if (detaching) detach_dev(pre36);
    			if (detaching) detach_dev(t314);
    			if (detaching) detach_dev(p53);
    			if (detaching) detach_dev(t319);
    			if (detaching) detach_dev(pre37);
    			if (detaching) detach_dev(t320);
    			if (detaching) detach_dev(hr7);
    			if (detaching) detach_dev(t321);
    			if (detaching) detach_dev(h28);
    			if (detaching) detach_dev(t323);
    			if (detaching) detach_dev(pre38);
    			if (detaching) detach_dev(t324);
    			if (detaching) detach_dev(p54);
    			if (detaching) detach_dev(t326);
    			if (detaching) detach_dev(pre39);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("README", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<README> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class README extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "README",
    			options,
    			id: create_fragment$3.name
    		});
    	}
    }

    /* src\documentation.svx generated by Svelte v3.31.0 */
    const file$2 = "src\\documentation.svx";

    function create_fragment$4(ctx) {
    	let div;
    	let doc;
    	let current;
    	doc = new README({ $$inline: true });

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(doc.$$.fragment);
    			attr_dev(div, "class", "markdown svelte-128odzu");
    			add_location(div, file$2, 17, 0, 285);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(doc, div, null);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(doc.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(doc.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(doc);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Documentation", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Documentation> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ Doc: README });
    	return [];
    }

    class Documentation extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Documentation",
    			options,
    			id: create_fragment$4.name
    		});
    	}
    }

    /* README.md generated by Svelte v3.31.0 */

    const file$3 = "README.md";

    function create_fragment$5(ctx) {
    	let h1;
    	let t1;
    	let p0;
    	let t3;
    	let h30;
    	let a0;
    	let t5;
    	let p1;
    	let t7;
    	let pre0;
    	let raw0_value = `<code class="language-js">npm i <span class="token operator">-</span><span class="token constant">D</span> svelte<span class="token operator">-</span>standalone<span class="token operator">-</span>router</code>` + "";
    	let t8;
    	let h31;
    	let a1;
    	let t10;
    	let p2;
    	let t12;
    	let pre1;

    	let raw1_value = `<code class="language-html"><span class="token comment">&lt;!-- component.svelte --></span>
<span class="token tag"><span class="token tag"><span class="token punctuation">&lt;</span>script</span><span class="token punctuation">></span></span><span class="token script"><span class="token language-javascript">
  <span class="token keyword">import</span> RouterComponent<span class="token punctuation">,</span> <span class="token punctuation">&#123;</span> context <span class="token punctuation">&#125;</span> <span class="token keyword">from</span> <span class="token string">'svelte-standalone-router'</span><span class="token punctuation">;</span>

  <span class="token comment">// pages</span>
  <span class="token keyword">import</span> Index <span class="token keyword">from</span> <span class="token string">'./pages/index.svelte'</span><span class="token punctuation">;</span>
  <span class="token keyword">import</span> About <span class="token keyword">from</span> <span class="token string">'./pages/about.svelte'</span><span class="token punctuation">;</span>
  <span class="token keyword">import</span> Contact <span class="token keyword">from</span> <span class="token string">'./pages/contact.svelte'</span><span class="token punctuation">;</span>
  <span class="token keyword">import</span> Error <span class="token keyword">from</span> <span class="token string">'./pages/error.svelte'</span><span class="token punctuation">;</span>

  <span class="token comment">// implementaiton</span>
  <span class="token keyword">const</span> app <span class="token operator">=</span> <span class="token function">context</span><span class="token punctuation">(</span><span class="token punctuation">&#123;</span> initial<span class="token operator">:</span> location<span class="token punctuation">.</span>pathname <span class="token punctuation">&#125;</span><span class="token punctuation">)</span><span class="token punctuation">;</span>

  <span class="token comment">// catch fallbacks</span>
  app<span class="token punctuation">.</span><span class="token function">catch</span><span class="token punctuation">(</span><span class="token punctuation">(</span><span class="token parameter">req<span class="token punctuation">,</span> res<span class="token punctuation">,</span> props</span><span class="token punctuation">)</span> <span class="token operator">=></span> res<span class="token punctuation">.</span><span class="token function">send</span><span class="token punctuation">(</span>Error<span class="token punctuation">)</span><span class="token punctuation">)</span><span class="token punctuation">;</span>

  <span class="token comment">// routes</span>
  app<span class="token punctuation">.</span><span class="token function">get</span><span class="token punctuation">(</span><span class="token string">'/'</span><span class="token punctuation">,</span> <span class="token punctuation">(</span><span class="token parameter">req<span class="token punctuation">,</span> res</span><span class="token punctuation">)</span> <span class="token operator">=></span> res<span class="token punctuation">.</span><span class="token function">send</span><span class="token punctuation">(</span>Index<span class="token punctuation">)</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
  app<span class="token punctuation">.</span><span class="token function">get</span><span class="token punctuation">(</span><span class="token string">'/about'</span><span class="token punctuation">,</span> <span class="token punctuation">(</span><span class="token parameter">req<span class="token punctuation">,</span> res</span><span class="token punctuation">)</span> <span class="token operator">=></span> res<span class="token punctuation">.</span><span class="token function">send</span><span class="token punctuation">(</span>About<span class="token punctuation">)</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
  app<span class="token punctuation">.</span><span class="token function">get</span><span class="token punctuation">(</span><span class="token string">'/contact'</span><span class="token punctuation">,</span> <span class="token punctuation">(</span><span class="token parameter">req<span class="token punctuation">,</span> res</span><span class="token punctuation">)</span> <span class="token operator">=></span> res<span class="token punctuation">.</span><span class="token function">send</span><span class="token punctuation">(</span>Contact<span class="token punctuation">)</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
</span></span><span class="token tag"><span class="token tag"><span class="token punctuation">&lt;/</span>script</span><span class="token punctuation">></span></span>

<span class="token tag"><span class="token tag"><span class="token punctuation">&lt;</span>main</span><span class="token punctuation">></span></span>
  <span class="token tag"><span class="token tag"><span class="token punctuation">&lt;</span>RouterComponent</span> <span class="token punctuation">/></span></span>
<span class="token tag"><span class="token tag"><span class="token punctuation">&lt;/</span>main</span><span class="token punctuation">></span></span></code>` + "";

    	let t13;
    	let h32;
    	let a2;
    	let t15;
    	let p3;
    	let t16;
    	let code;
    	let t18;
    	let t19;
    	let pre2;

    	let raw2_value = `<code class="language-html"><span class="token comment">&lt;!-- component.svelte --></span>
<span class="token tag"><span class="token tag"><span class="token punctuation">&lt;</span>script</span><span class="token punctuation">></span></span><span class="token script"><span class="token language-javascript">
  <span class="token keyword">import</span> <span class="token punctuation">&#123;</span> fade <span class="token punctuation">&#125;</span> <span class="token keyword">from</span> <span class="token string">'svelte/transition'</span><span class="token punctuation">;</span>
  <span class="token keyword">import</span> RouterComponent<span class="token punctuation">,</span> <span class="token punctuation">&#123;</span> context<span class="token punctuation">,</span> link <span class="token punctuation">&#125;</span> <span class="token keyword">from</span> <span class="token string">'svelte-standalone-router'</span><span class="token punctuation">;</span>

  <span class="token comment">// pages</span>
  <span class="token keyword">import</span> Index <span class="token keyword">from</span> <span class="token string">'./pages/index.svelte'</span><span class="token punctuation">;</span>
  <span class="token keyword">import</span> DataPage <span class="token keyword">from</span> <span class="token string">'./pages/datapage.svelte'</span><span class="token punctuation">;</span>
  <span class="token keyword">import</span> ErrorPage <span class="token keyword">from</span> <span class="token string">'./pages/error.svelte'</span><span class="token punctuation">;</span>

  <span class="token comment">// implementaiton</span>
  <span class="token keyword">const</span> app <span class="token operator">=</span> <span class="token function">context</span><span class="token punctuation">(</span><span class="token punctuation">&#123;</span> initial<span class="token operator">:</span> location<span class="token punctuation">.</span>pathname <span class="token punctuation">&#125;</span><span class="token punctuation">)</span><span class="token punctuation">;</span>

  <span class="token comment">// catch fallbacks</span>
  app<span class="token punctuation">.</span><span class="token function">catch</span><span class="token punctuation">(</span><span class="token punctuation">(</span><span class="token parameter">req<span class="token punctuation">,</span> res<span class="token punctuation">,</span> props</span><span class="token punctuation">)</span> <span class="token operator">=></span> res<span class="token punctuation">.</span><span class="token function">send</span><span class="token punctuation">(</span>ErrorPage<span class="token punctuation">,</span> <span class="token punctuation">&#123;</span> message<span class="token operator">:</span> props<span class="token punctuation">.</span>message <span class="token operator">||</span> <span class="token string">'unknown error'</span> <span class="token punctuation">&#125;</span><span class="token punctuation">)</span><span class="token punctuation">)</span><span class="token punctuation">;</span>

  <span class="token comment">// routes</span>
  app<span class="token punctuation">.</span><span class="token function">get</span><span class="token punctuation">(</span><span class="token string">'/'</span><span class="token punctuation">,</span> <span class="token punctuation">(</span><span class="token parameter">req<span class="token punctuation">,</span> res</span><span class="token punctuation">)</span> <span class="token operator">=></span> res<span class="token punctuation">.</span><span class="token function">send</span><span class="token punctuation">(</span>Index<span class="token punctuation">)</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
  app<span class="token punctuation">.</span><span class="token function">get</span><span class="token punctuation">(</span><span class="token string">'/:endpoint'</span><span class="token punctuation">,</span> <span class="token keyword">async</span> <span class="token punctuation">(</span><span class="token parameter">req<span class="token punctuation">,</span> res</span><span class="token punctuation">)</span> <span class="token operator">=></span> <span class="token punctuation">&#123;</span>
    <span class="token keyword">try</span><span class="token punctuation">&#123;</span>
      <span class="token comment">// in a real world you would make sure the endpoint is of desired format and valid, but for the sake of simplify things lets use it as is</span>
      <span class="token keyword">const</span> endpoint <span class="token operator">=</span> <span class="token template-string"><span class="token template-punctuation string">&#96;</span><span class="token string">https://jsonplaceholder.typicode.com/</span><span class="token interpolation"><span class="token interpolation-punctuation punctuation">$&#123;</span>req<span class="token punctuation">.</span>params<span class="token punctuation">.</span>endpoint<span class="token interpolation-punctuation punctuation">&#125;</span></span><span class="token string">/1</span><span class="token template-punctuation string">&#96;</span></span><span class="token punctuation">;</span>
      <span class="token comment">// try fetching data</span>
      <span class="token keyword">const</span> response <span class="token operator">=</span> <span class="token keyword">await</span> <span class="token function">fetch</span><span class="token punctuation">(</span>endpoint<span class="token punctuation">)</span><span class="token punctuation">;</span>
      <span class="token keyword">if</span><span class="token punctuation">(</span>response<span class="token punctuation">.</span>status <span class="token operator">!=</span> <span class="token number">200</span><span class="token punctuation">)</span><span class="token punctuation">&#123;</span>
        <span class="token keyword">throw</span> <span class="token keyword">new</span> <span class="token class-name">Error</span><span class="token punctuation">(</span><span class="token template-string"><span class="token template-punctuation string">&#96;</span><span class="token string">Invalid api request</span><span class="token template-punctuation string">&#96;</span></span><span class="token punctuation">)</span><span class="token punctuation">;</span>
      <span class="token punctuation">&#125;</span>
      <span class="token keyword">const</span> data <span class="token operator">=</span> <span class="token keyword">await</span> response<span class="token punctuation">.</span><span class="token function">json</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
      <span class="token comment">// send response as props to DataPage</span>
      res<span class="token punctuation">.</span><span class="token function">send</span><span class="token punctuation">(</span>DataPage<span class="token punctuation">,</span> <span class="token punctuation">&#123;</span> data <span class="token punctuation">&#125;</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token punctuation">&#125;</span><span class="token keyword">catch</span><span class="token punctuation">(</span>error<span class="token punctuation">)</span><span class="token punctuation">&#123;</span>
      <span class="token comment">// trigger error and send along some custom props</span>
      res<span class="token punctuation">.</span><span class="token function">error</span><span class="token punctuation">(</span><span class="token punctuation">&#123;</span> message<span class="token operator">:</span> error<span class="token punctuation">.</span>message <span class="token punctuation">&#125;</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token punctuation">&#125;</span>
  <span class="token punctuation">&#125;</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
</span></span><span class="token tag"><span class="token tag"><span class="token punctuation">&lt;/</span>script</span><span class="token punctuation">></span></span>

<span class="token tag"><span class="token tag"><span class="token punctuation">&lt;</span>nav</span><span class="token punctuation">></span></span>
  <span class="token tag"><span class="token tag"><span class="token punctuation">&lt;</span>a</span> <span class="token attr-name">href</span><span class="token attr-value"><span class="token punctuation attr-equals">=</span><span class="token punctuation">"</span>/<span class="token punctuation">"</span></span> <span class="token attr-name"><span class="token namespace">use:</span>link</span><span class="token punctuation">></span></span>Index<span class="token tag"><span class="token tag"><span class="token punctuation">&lt;/</span>a</span><span class="token punctuation">></span></span>
  <span class="token tag"><span class="token tag"><span class="token punctuation">&lt;</span>a</span> <span class="token attr-name">href</span><span class="token attr-value"><span class="token punctuation attr-equals">=</span><span class="token punctuation">"</span>/todos<span class="token punctuation">"</span></span> <span class="token attr-name"><span class="token namespace">use:</span>link</span><span class="token punctuation">></span></span>Todos<span class="token tag"><span class="token tag"><span class="token punctuation">&lt;/</span>a</span><span class="token punctuation">></span></span>
  <span class="token tag"><span class="token tag"><span class="token punctuation">&lt;</span>a</span> <span class="token attr-name">href</span><span class="token attr-value"><span class="token punctuation attr-equals">=</span><span class="token punctuation">"</span>/users<span class="token punctuation">"</span></span> <span class="token attr-name"><span class="token namespace">use:</span>link</span><span class="token punctuation">></span></span>Users<span class="token tag"><span class="token tag"><span class="token punctuation">&lt;/</span>a</span><span class="token punctuation">></span></span>
  <span class="token tag"><span class="token tag"><span class="token punctuation">&lt;</span>a</span> <span class="token attr-name">href</span><span class="token attr-value"><span class="token punctuation attr-equals">=</span><span class="token punctuation">"</span>/posts<span class="token punctuation">"</span></span> <span class="token attr-name"><span class="token namespace">use:</span>link</span><span class="token punctuation">></span></span>Posts<span class="token tag"><span class="token tag"><span class="token punctuation">&lt;/</span>a</span><span class="token punctuation">></span></span>
  <span class="token tag"><span class="token tag"><span class="token punctuation">&lt;</span>a</span> <span class="token attr-name">href</span><span class="token attr-value"><span class="token punctuation attr-equals">=</span><span class="token punctuation">"</span>/invalid-endpoint<span class="token punctuation">"</span></span> <span class="token attr-name"><span class="token namespace">use:</span>link</span><span class="token punctuation">></span></span>invalid endpoint<span class="token tag"><span class="token tag"><span class="token punctuation">&lt;/</span>a</span><span class="token punctuation">></span></span>
<span class="token tag"><span class="token tag"><span class="token punctuation">&lt;/</span>nav</span><span class="token punctuation">></span></span>

<span class="token tag"><span class="token tag"><span class="token punctuation">&lt;</span>main</span><span class="token punctuation">></span></span>
  <span class="token tag"><span class="token tag"><span class="token punctuation">&lt;</span>RouterComponent</span> <span class="token attr-name"><span class="token namespace">let:</span>component</span> <span class="token attr-name"><span class="token namespace">let:</span>props</span><span class="token punctuation">></span></span>
    &#123;#key component&#125;
      <span class="token tag"><span class="token tag"><span class="token punctuation">&lt;</span>div</span> <span class="token attr-name">class</span><span class="token attr-value"><span class="token punctuation attr-equals">=</span><span class="token punctuation">"</span>router<span class="token punctuation">"</span></span> <span class="token attr-name"><span class="token namespace">in:</span>fade</span><span class="token punctuation">></span></span>
        <span class="token tag"><span class="token tag"><span class="token punctuation">&lt;</span><span class="token namespace">svelte:</span>component</span> <span class="token attr-name">this</span><span class="token attr-value"><span class="token punctuation attr-equals">=</span>&#123;component&#125;</span> <span class="token attr-name">&#123;...props&#125;</span> <span class="token punctuation">/></span></span>
      <span class="token tag"><span class="token tag"><span class="token punctuation">&lt;/</span>div</span><span class="token punctuation">></span></span>
    &#123;/key&#125;
  <span class="token tag"><span class="token tag"><span class="token punctuation">&lt;/</span>RouterComponent</span><span class="token punctuation">></span></span>
<span class="token tag"><span class="token tag"><span class="token punctuation">&lt;/</span>main</span><span class="token punctuation">></span></span></code>` + "";

    	const block = {
    		c: function create() {
    			h1 = element("h1");
    			h1.textContent = "Usage examples";
    			t1 = space();
    			p0 = element("p");
    			p0.textContent = "Boilerplate examples to quickly get you started with implementing svelte-standalone-router in your project.";
    			t3 = space();
    			h30 = element("h3");
    			a0 = element("a");
    			a0.textContent = "Installation";
    			t5 = space();
    			p1 = element("p");
    			p1.textContent = "Start by installing the library in your svelte project.";
    			t7 = space();
    			pre0 = element("pre");
    			t8 = space();
    			h31 = element("h3");
    			a1 = element("a");
    			a1.textContent = "Basic";
    			t10 = space();
    			p2 = element("p");
    			p2.textContent = "Minimal example with static routes";
    			t12 = space();
    			pre1 = element("pre");
    			t13 = space();
    			h32 = element("h3");
    			a2 = element("a");
    			a2.textContent = "Advanced example";
    			t15 = space();
    			p3 = element("p");
    			t16 = text("A more complex example showing how to preload data and decoupling business logic from the component and how to add a transition on route change by utilizing sveltes ");
    			code = element("code");
    			code.textContent = "#key";
    			t18 = text(" along with slotted parameters.");
    			t19 = space();
    			pre2 = element("pre");
    			add_location(h1, file$3, 1, 0, 1);
    			add_location(p0, file$3, 2, 0, 25);
    			attr_dev(a0, "name", "installation");
    			attr_dev(a0, "href", "usage#installation");
    			add_location(a0, file$3, 3, 4, 144);
    			add_location(h30, file$3, 3, 0, 140);
    			add_location(p1, file$3, 4, 0, 215);
    			attr_dev(pre0, "class", "language-js");
    			add_location(pre0, file$3, 5, 0, 278);
    			attr_dev(a1, "name", "basic");
    			attr_dev(a1, "href", "usage#basic");
    			add_location(a1, file$3, 6, 4, 534);
    			add_location(h31, file$3, 6, 0, 530);
    			add_location(p2, file$3, 7, 0, 584);
    			attr_dev(pre1, "class", "language-html");
    			add_location(pre1, file$3, 8, 0, 626);
    			attr_dev(a2, "name", "advanced");
    			attr_dev(a2, "href", "usage#advanced");
    			add_location(a2, file$3, 33, 4, 5972);
    			add_location(h32, file$3, 33, 0, 5968);
    			add_location(code, file$3, 34, 168, 6207);
    			add_location(p3, file$3, 34, 0, 6039);
    			attr_dev(pre2, "class", "language-html");
    			add_location(pre2, file$3, 35, 0, 6260);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h1, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, p0, anchor);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, h30, anchor);
    			append_dev(h30, a0);
    			insert_dev(target, t5, anchor);
    			insert_dev(target, p1, anchor);
    			insert_dev(target, t7, anchor);
    			insert_dev(target, pre0, anchor);
    			pre0.innerHTML = raw0_value;
    			insert_dev(target, t8, anchor);
    			insert_dev(target, h31, anchor);
    			append_dev(h31, a1);
    			insert_dev(target, t10, anchor);
    			insert_dev(target, p2, anchor);
    			insert_dev(target, t12, anchor);
    			insert_dev(target, pre1, anchor);
    			pre1.innerHTML = raw1_value;
    			insert_dev(target, t13, anchor);
    			insert_dev(target, h32, anchor);
    			append_dev(h32, a2);
    			insert_dev(target, t15, anchor);
    			insert_dev(target, p3, anchor);
    			append_dev(p3, t16);
    			append_dev(p3, code);
    			append_dev(p3, t18);
    			insert_dev(target, t19, anchor);
    			insert_dev(target, pre2, anchor);
    			pre2.innerHTML = raw2_value;
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h1);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(p0);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(h30);
    			if (detaching) detach_dev(t5);
    			if (detaching) detach_dev(p1);
    			if (detaching) detach_dev(t7);
    			if (detaching) detach_dev(pre0);
    			if (detaching) detach_dev(t8);
    			if (detaching) detach_dev(h31);
    			if (detaching) detach_dev(t10);
    			if (detaching) detach_dev(p2);
    			if (detaching) detach_dev(t12);
    			if (detaching) detach_dev(pre1);
    			if (detaching) detach_dev(t13);
    			if (detaching) detach_dev(h32);
    			if (detaching) detach_dev(t15);
    			if (detaching) detach_dev(p3);
    			if (detaching) detach_dev(t19);
    			if (detaching) detach_dev(pre2);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("README", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<README> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class README$1 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "README",
    			options,
    			id: create_fragment$5.name
    		});
    	}
    }

    /* src\pages\usage.svx generated by Svelte v3.31.0 */
    const file$4 = "src\\pages\\usage.svx";

    function create_fragment$6(ctx) {
    	let div;
    	let doc;
    	let current;
    	doc = new README$1({ $$inline: true });

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(doc.$$.fragment);
    			attr_dev(div, "class", "markdown svelte-128odzu");
    			add_location(div, file$4, 17, 0, 285);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(doc, div, null);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(doc.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(doc.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(doc);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$6($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Usage", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Usage> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ Doc: README$1 });
    	return [];
    }

    class Usage extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Usage",
    			options,
    			id: create_fragment$6.name
    		});
    	}
    }

    /* src\pages\contact.svelte generated by Svelte v3.31.0 */

    const file$5 = "src\\pages\\contact.svelte";

    function create_fragment$7(ctx) {
    	let h1;

    	const block = {
    		c: function create() {
    			h1 = element("h1");
    			h1.textContent = "Contact";
    			add_location(h1, file$5, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h1, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$7.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$7($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Contact", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Contact> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class Contact extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Contact",
    			options,
    			id: create_fragment$7.name
    		});
    	}
    }

    /* src\pages\error.svelte generated by Svelte v3.31.0 */

    const { Error: Error_1$1 } = globals;
    const file$6 = "src\\pages\\error.svelte";

    // (20:0) {#if !time}
    function create_if_block$1(ctx) {
    	let redirect;
    	let current;

    	redirect = new Redirect({
    			props: { to: "/", state: { type: "redirect" } },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(redirect.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(redirect, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(redirect.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(redirect.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(redirect, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(20:0) {#if !time}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$8(ctx) {
    	let h1;
    	let t1;
    	let p;
    	let t3;
    	let button;
    	let t4;
    	let t5;
    	let t6;
    	let link_action;
    	let t7;
    	let if_block_anchor;
    	let current;
    	let mounted;
    	let dispose;
    	let if_block = !/*time*/ ctx[0] && create_if_block$1(ctx);

    	const block = {
    		c: function create() {
    			h1 = element("h1");
    			h1.textContent = "Page not found";
    			t1 = space();
    			p = element("p");
    			p.textContent = "This is a page which demonstrates how to catch and handle routing errors.";
    			t3 = space();
    			button = element("button");
    			t4 = text("Go back home (");
    			t5 = text(/*time*/ ctx[0]);
    			t6 = text(")");
    			t7 = space();
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    			add_location(h1, file$6, 15, 0, 342);
    			add_location(p, file$6, 16, 0, 367);
    			attr_dev(button, "href", "/");
    			add_location(button, file$6, 17, 0, 449);
    		},
    		l: function claim(nodes) {
    			throw new Error_1$1("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h1, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, p, anchor);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, button, anchor);
    			append_dev(button, t4);
    			append_dev(button, t5);
    			append_dev(button, t6);
    			insert_dev(target, t7, anchor);
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;

    			if (!mounted) {
    				dispose = action_destroyer(link_action = link.call(null, button, { state: { type: "click" } }));
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (!current || dirty & /*time*/ 1) set_data_dev(t5, /*time*/ ctx[0]);

    			if (!/*time*/ ctx[0]) {
    				if (if_block) {
    					if (dirty & /*time*/ 1) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block$1(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h1);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(p);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(button);
    			if (detaching) detach_dev(t7);
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$8.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$8($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Error", slots, []);
    	let { time = 10 } = $$props;

    	const interval = setInterval(
    		() => {
    			$$invalidate(0, time--, time);

    			if (!time) {
    				clearInterval(interval);
    			}
    		},
    		1000
    	);

    	// clear the interval
    	onDestroy(() => clearInterval(interval));

    	const writable_props = ["time"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Error> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("time" in $$props) $$invalidate(0, time = $$props.time);
    	};

    	$$self.$capture_state = () => ({
    		onDestroy,
    		link,
    		Redirect,
    		time,
    		interval
    	});

    	$$self.$inject_state = $$props => {
    		if ("time" in $$props) $$invalidate(0, time = $$props.time);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [time];
    }

    class Error$1 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$8, create_fragment$8, safe_not_equal, { time: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Error",
    			options,
    			id: create_fragment$8.name
    		});
    	}

    	get time() {
    		throw new Error_1$1("<Error>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set time(value) {
    		throw new Error_1$1("<Error>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\router.svelte generated by Svelte v3.31.0 */

    const { Error: Error_1$2, console: console_1 } = globals;
    const file$7 = "src\\router.svelte";

    // (56:2) {#key component}
    function create_key_block(ctx) {
    	let div;
    	let switch_instance;
    	let div_intro;
    	let current;
    	const switch_instance_spread_levels = [/*props*/ ctx[4]];
    	var switch_value = /*component*/ ctx[3];

    	function switch_props(ctx) {
    		let switch_instance_props = {};

    		for (let i = 0; i < switch_instance_spread_levels.length; i += 1) {
    			switch_instance_props = assign(switch_instance_props, switch_instance_spread_levels[i]);
    		}

    		return {
    			props: switch_instance_props,
    			$$inline: true
    		};
    	}

    	if (switch_value) {
    		switch_instance = new switch_value(switch_props());
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (switch_instance) create_component(switch_instance.$$.fragment);
    			attr_dev(div, "class", "router svelte-7j304i");
    			add_location(div, file$7, 56, 4, 1624);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			if (switch_instance) {
    				mount_component(switch_instance, div, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const switch_instance_changes = (dirty & /*props*/ 16)
    			? get_spread_update(switch_instance_spread_levels, [get_spread_object(/*props*/ ctx[4])])
    			: {};

    			if (switch_value !== (switch_value = /*component*/ ctx[3])) {
    				if (switch_instance) {
    					group_outros();
    					const old_component = switch_instance;

    					transition_out(old_component.$$.fragment, 1, 0, () => {
    						destroy_component(old_component, 1);
    					});

    					check_outros();
    				}

    				if (switch_value) {
    					switch_instance = new switch_value(switch_props());
    					create_component(switch_instance.$$.fragment);
    					transition_in(switch_instance.$$.fragment, 1);
    					mount_component(switch_instance, div, null);
    				} else {
    					switch_instance = null;
    				}
    			} else if (switch_value) {
    				switch_instance.$set(switch_instance_changes);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			if (switch_instance) transition_in(switch_instance.$$.fragment, local);

    			if (!div_intro) {
    				add_render_callback(() => {
    					div_intro = create_in_transition(div, fade, { duration: 300 });
    					div_intro.start();
    				});
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (switch_instance) destroy_component(switch_instance);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_key_block.name,
    		type: "key",
    		source: "(56:2) {#key component}",
    		ctx
    	});

    	return block;
    }

    // (55:0) <RouterComponent let:component let:props>
    function create_default_slot(ctx) {
    	let previous_key = /*component*/ ctx[3];
    	let key_block_anchor;
    	let current;
    	let key_block = create_key_block(ctx);

    	const block = {
    		c: function create() {
    			key_block.c();
    			key_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			key_block.m(target, anchor);
    			insert_dev(target, key_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*component*/ 8 && safe_not_equal(previous_key, previous_key = /*component*/ ctx[3])) {
    				group_outros();
    				transition_out(key_block, 1, 1, noop);
    				check_outros();
    				key_block = create_key_block(ctx);
    				key_block.c();
    				transition_in(key_block);
    				key_block.m(key_block_anchor.parentNode, key_block_anchor);
    			} else {
    				key_block.p(ctx, dirty);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(key_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(key_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(key_block_anchor);
    			key_block.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot.name,
    		type: "slot",
    		source: "(55:0) <RouterComponent let:component let:props>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$9(ctx) {
    	let routercomponent;
    	let current;

    	routercomponent = new Router_1({
    			props: {
    				$$slots: {
    					default: [
    						create_default_slot,
    						({ component, props }) => ({ 3: component, 4: props }),
    						({ component, props }) => (component ? 8 : 0) | (props ? 16 : 0)
    					]
    				},
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(routercomponent.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error_1$2("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(routercomponent, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const routercomponent_changes = {};

    			if (dirty & /*$$scope, component, props*/ 56) {
    				routercomponent_changes.$$scope = { dirty, ctx };
    			}

    			routercomponent.$set(routercomponent_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(routercomponent.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(routercomponent.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(routercomponent, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$9.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$9($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Router", slots, []);
    	const pages = { Index: Pages, Documentation, Usage, Contact };

    	// get the href attribute from <Base> element.
    	// we use getAttribute('href') so we don't get the absolute url
    	SvelteRouter.linkBase = document.querySelector("base").getAttribute("href");

    	// implementaiton
    	const app = context({
    		initial: location.pathname,
    		base: SvelteRouter.linkBase,
    		state: { what: "is state" }
    	});

    	// catch fallbacks
    	app.catch((req, res, props) => res.send(Error$1, { time: 5 }));

    	// middlewares
    	app.use((req, res, next) => {
    		console.log("Middleware logging the Request object.");
    		console.log(req);
    		console.log("--------------------------------------");
    		console.log("");
    		next();
    	});

    	// routes
    	app.get(["/", "/:page"], async (req, res) => {
    		// simulate an api request
    		// await new Promise((resolve) => {
    		//   setTimeout(() => {
    		//     resolve();
    		//   }, 1000);
    		// });
    		const string = req.params.page;

    		const p = pages[string && string.charAt(0).toUpperCase() + string.slice(1) || "Index"];

    		if (!p) {
    			return res.error();
    		}

    		res.send(p);
    	});

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1.warn(`<Router> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		fade,
    		RouterComponent: Router_1,
    		context,
    		Router: SvelteRouter,
    		Index: Pages,
    		Documentation,
    		Usage,
    		Contact,
    		Error: Error$1,
    		pages,
    		app
    	});

    	return [];
    }

    class Router_1$1 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$9, create_fragment$9, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Router_1",
    			options,
    			id: create_fragment$9.name
    		});
    	}
    }

    /* src\branding.svelte generated by Svelte v3.31.0 */

    const file$8 = "src\\branding.svelte";

    function create_fragment$a(ctx) {
    	let svg;
    	let path0;
    	let path1;
    	let path2;
    	let path3;
    	let path4;
    	let path5;
    	let path6;
    	let path7;
    	let path8;
    	let path9;
    	let path10;
    	let path11;
    	let path12;
    	let path13;
    	let path14;
    	let path15;
    	let path16;
    	let path17;
    	let path18;
    	let path19;
    	let path20;
    	let path21;

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			path0 = svg_element("path");
    			path1 = svg_element("path");
    			path2 = svg_element("path");
    			path3 = svg_element("path");
    			path4 = svg_element("path");
    			path5 = svg_element("path");
    			path6 = svg_element("path");
    			path7 = svg_element("path");
    			path8 = svg_element("path");
    			path9 = svg_element("path");
    			path10 = svg_element("path");
    			path11 = svg_element("path");
    			path12 = svg_element("path");
    			path13 = svg_element("path");
    			path14 = svg_element("path");
    			path15 = svg_element("path");
    			path16 = svg_element("path");
    			path17 = svg_element("path");
    			path18 = svg_element("path");
    			path19 = svg_element("path");
    			path20 = svg_element("path");
    			path21 = svg_element("path");
    			attr_dev(path0, "d", "M10.25,36.813c0.328,2.33,0.974,4.072,1.936,5.226c1.76,2.1,4.774,3.149,9.045,3.149c2.557,0,4.634-0.276,6.229-0.831\r\n\tC30.486,43.294,32,41.32,32,38.434c0-1.686-0.74-2.99-2.22-3.914c-1.48-0.9-3.832-1.697-7.057-2.392l-5.507-1.214\r\n\tc-5.414-1.203-9.146-2.509-11.196-3.919C2.548,24.64,0.813,20.954,0.813,15.94c0-4.574,1.681-8.374,5.042-11.4S14.152,0,20.666,0\r\n\tc5.439,0,10.079,1.426,13.919,4.276s5.853,6.987,6.04,12.411H30.438c-0.189-3.064-1.563-5.242-4.12-6.533\r\n\tc-1.705-0.853-3.825-1.279-6.358-1.279c-2.818,0-5.068,0.554-6.75,1.661s-2.521,2.653-2.521,4.638c0,1.822,0.828,3.184,2.486,4.084\r\n\tc1.065,0.6,3.323,1.305,6.774,2.114l8.943,2.116c3.92,0.926,6.856,2.162,8.81,3.709c3.032,2.402,4.549,5.879,4.549,10.429\r\n\tc0,4.666-1.8,8.54-5.399,11.624s-8.685,4.625-15.254,4.625c-6.71,0-11.987-1.517-15.831-4.551S0,42.119,0,36.813H10.25z");
    			add_location(path0, file$8, 4, 0, 180);
    			attr_dev(path1, "d", "M72.336,14.813h10.59l-13.627,37.75H58.903L45.37,14.813h11.075l7.859,27.845L72.336,14.813z");
    			add_location(path1, file$8, 11, 0, 1017);
    			attr_dev(path2, "d", "M112.967,15.58c2.628,1.178,4.798,3.037,6.511,5.578c1.543,2.24,2.544,4.839,3.003,7.795\r\n\tc0.265,1.732,0.373,4.228,0.324,7.484H95.378c0.153,3.783,1.47,6.436,3.948,7.957c1.508,0.945,3.322,1.418,5.443,1.418\r\n\tc2.248,0,4.075-0.574,5.481-1.725c0.766-0.621,1.443-1.483,2.031-2.588h10.033c-0.266,2.236-1.484,4.508-3.655,6.813\r\n\tc-3.377,3.666-8.105,5.499-14.186,5.499c-5.018,0-9.444-1.547-13.28-4.641s-5.754-8.127-5.754-15.1c0-6.533,1.729-11.544,5.19-15.03\r\n\tc3.46-3.486,7.951-5.229,13.474-5.229C107.384,13.813,110.338,14.402,112.967,15.58z M98.256,24.123\r\n\tc-1.395,1.416-2.271,3.333-2.628,5.752h17c-0.18-2.579-1.056-4.536-2.629-5.872c-1.573-1.335-3.523-2.003-5.852-2.003\r\n\tC101.615,22,99.651,22.708,98.256,24.123z");
    			add_location(path2, file$8, 12, 0, 1120);
    			attr_dev(path3, "d", "M137.921,52.563h-9.875V1.625h9.875V52.563z");
    			add_location(path3, file$8, 19, 0, 1839);
    			attr_dev(path4, "d", "M143.675,22.125v-6.938h5.25V4.563h9.75v10.625h6.125v6.938h-6.125v19.971c0,1.549,0.195,2.514,0.588,2.895\r\n\tc0.393,0.382,1.592,0.572,3.6,0.572c0.299,0,0.617-0.01,0.951-0.031c0.334-0.021,0.664-0.052,0.986-0.094v7.375l-4.668,0.25\r\n\tc-4.658,0.161-7.84-0.647-9.547-2.428c-1.107-1.133-1.66-2.878-1.66-5.237V22.125H143.675z");
    			add_location(path4, file$8, 20, 0, 1895);
    			attr_dev(path5, "d", "M195.679,15.58c2.628,1.178,4.798,3.037,6.511,5.578c1.543,2.24,2.544,4.839,3.003,7.795\r\n\tc0.265,1.732,0.373,4.228,0.324,7.484h-27.427c0.153,3.783,1.47,6.436,3.949,7.957c1.508,0.945,3.322,1.418,5.443,1.418\r\n\tc2.248,0,4.075-0.574,5.481-1.725c0.766-0.621,1.443-1.483,2.031-2.588h10.033c-0.266,2.236-1.484,4.508-3.655,6.813\r\n\tc-3.377,3.666-8.105,5.499-14.186,5.499c-5.018,0-9.445-1.547-13.281-4.641s-5.754-8.127-5.754-15.1\r\n\tc0-6.533,1.729-11.544,5.19-15.03c3.46-3.486,7.951-5.229,13.474-5.229C190.096,13.813,193.05,14.402,195.679,15.58z\r\n\t M180.967,24.123c-1.395,1.416-2.271,3.333-2.628,5.752h17c-0.18-2.579-1.056-4.536-2.629-5.872\r\n\tc-1.573-1.335-3.523-2.003-5.852-2.003C184.326,22,182.362,22.708,180.967,24.123z");
    			add_location(path5, file$8, 23, 0, 2224);
    			attr_dev(path6, "d", "M10.25,94.813c0.328,2.33,0.974,4.072,1.936,5.226c1.76,2.1,4.774,3.149,9.045,3.149c2.557,0,4.634-0.276,6.229-0.831\r\n\tc3.026-1.063,4.54-3.036,4.54-5.923c0-1.686-0.74-2.99-2.22-3.914c-1.48-0.9-3.832-1.697-7.057-2.392l-5.507-1.214\r\n\tc-5.414-1.203-9.146-2.509-11.196-3.919C2.548,82.64,0.813,78.954,0.813,73.94c0-4.574,1.681-8.374,5.042-11.4S14.152,58,20.666,58\r\n\tc5.439,0,10.079,1.426,13.919,4.276s5.853,6.987,6.04,12.411H30.438c-0.189-3.064-1.563-5.242-4.12-6.533\r\n\tc-1.705-0.853-3.825-1.279-6.358-1.279c-2.818,0-5.068,0.554-6.75,1.661s-2.521,2.653-2.521,4.638c0,1.822,0.828,3.184,2.486,4.084\r\n\tc1.065,0.6,3.323,1.305,6.774,2.114l8.943,2.116c3.92,0.926,6.856,2.162,8.81,3.709c3.032,2.402,4.549,5.879,4.549,10.429\r\n\tc0,4.666-1.8,8.54-5.399,11.624s-8.685,4.625-15.254,4.625c-6.71,0-11.987-1.517-15.831-4.551S0,100.119,0,94.813H10.25z");
    			add_location(path6, file$8, 30, 0, 2947);
    			attr_dev(path7, "d", "M45.148,80.125v-6.938h5.25V62.563h9.75v10.625h6.125v6.938h-6.125v19.971c0,1.549,0.195,2.514,0.588,2.895\r\n\tc0.393,0.382,1.592,0.572,3.6,0.572c0.299,0,0.616-0.01,0.951-0.031c0.334-0.021,0.663-0.052,0.986-0.094v7.375l-4.669,0.25\r\n\tc-4.658,0.161-7.84-0.647-9.546-2.428c-1.107-1.133-1.66-2.878-1.66-5.237V80.125H45.148z");
    			add_location(path7, file$8, 37, 0, 3788);
    			attr_dev(path8, "d", "M87.561,87.643c1.835-0.23,3.147-0.52,3.938-0.867c1.417-0.601,2.126-1.537,2.126-2.809c0-1.549-0.546-2.617-1.636-3.207\r\n\tc-1.091-0.59-2.691-0.885-4.802-0.885c-2.369,0-4.046,0.577-5.03,1.729c-0.704,0.854-1.173,2.006-1.407,3.458h-9.5\r\n\tc0.209-3.301,1.137-6.014,2.783-8.139c2.621-3.324,7.12-4.986,13.498-4.986c4.151,0,7.839,0.821,11.063,2.464\r\n\tc3.224,1.644,4.836,4.735,4.836,9.274v17.281c0,1.199,0.022,2.65,0.069,4.355c0.069,1.307,0.268,2.192,0.594,2.658\r\n\tc0.326,0.467,0.816,0.852,1.469,1.154v1.438H94.835c-0.299-0.755-0.506-1.464-0.621-2.128c-0.115-0.663-0.208-1.418-0.276-2.265\r\n\tc-1.371,1.486-2.951,2.752-4.74,3.797c-2.138,1.23-4.555,1.846-7.25,1.846c-3.439,0-6.279-0.978-8.521-2.93\r\n\tc-2.242-1.953-3.363-4.722-3.363-8.306c0-4.646,1.801-8.01,5.402-10.091c1.975-1.133,4.88-1.941,8.714-2.428L87.561,87.643z\r\n\t M93.59,92.242c-0.634,0.394-1.273,0.712-1.918,0.954c-0.645,0.243-1.53,0.469-2.655,0.677l-2.251,0.416\r\n\tc-2.111,0.37-3.62,0.821-4.526,1.353c-1.535,0.902-2.302,2.301-2.302,4.197c0,1.688,0.474,2.907,1.421,3.659s2.1,1.127,3.457,1.127\r\n\tc2.152,0,4.136-0.624,5.949-1.873c1.813-1.248,2.755-3.526,2.825-6.833V92.242z");
    			add_location(path8, file$8, 40, 0, 4116);
    			attr_dev(path9, "d", "M142.357,75c2.457,2.041,3.686,5.427,3.686,10.157v25.405h-10.125V87.604c0-1.984-0.261-3.508-0.782-4.57\r\n\tc-0.952-1.939-2.765-2.909-5.438-2.909c-3.287,0-5.542,1.42-6.765,4.259c-0.635,1.501-0.952,3.417-0.952,5.748v20.431h-9.875V72.938\r\n\th9.563v5.468c1.257-1.937,2.445-3.331,3.565-4.185c2.011-1.521,4.559-2.283,7.645-2.283C136.74,71.938,139.9,72.959,142.357,75z");
    			add_location(path9, file$8, 50, 0, 5245);
    			attr_dev(path10, "d", "M175.323,73.444c1.776,1.005,3.219,2.396,4.326,4.174V59.625h10v50.938h-9.563v-5.177c-1.408,2.247-3.014,3.88-4.814,4.898\r\n\ts-4.041,1.528-6.719,1.528c-4.41,0-8.122-1.785-11.135-5.356c-3.014-3.571-4.52-8.154-4.52-13.749\r\n\tc0-6.449,1.481-11.522,4.446-15.222c2.965-3.698,6.927-5.548,11.888-5.548C171.516,71.938,173.546,72.44,175.323,73.444z\r\n\t M177.787,100.377c1.449-2.082,2.175-4.776,2.175-8.085c0-4.627-1.172-7.935-3.516-9.925c-1.424-1.203-3.078-1.805-4.961-1.805\r\n\tc-2.871,0-4.978,1.094-6.321,3.279c-1.344,2.187-2.015,4.899-2.015,8.138c0,3.493,0.685,6.286,2.054,8.38s3.446,3.141,6.231,3.141\r\n\tS176.336,102.459,177.787,100.377z");
    			add_location(path10, file$8, 53, 0, 5616);
    			attr_dev(path11, "d", "M213.565,87.643c1.835-0.23,3.147-0.52,3.938-0.867c1.417-0.601,2.126-1.537,2.126-2.809c0-1.549-0.546-2.617-1.636-3.207\r\n\tc-1.091-0.59-2.691-0.885-4.802-0.885c-2.369,0-4.046,0.577-5.03,1.729c-0.704,0.854-1.173,2.006-1.407,3.458h-9.5\r\n\tc0.209-3.301,1.137-6.014,2.783-8.139c2.621-3.324,7.12-4.986,13.498-4.986c4.151,0,7.839,0.821,11.063,2.464\r\n\tc3.224,1.644,4.836,4.735,4.836,9.274v17.281c0,1.199,0.022,2.65,0.069,4.355c0.069,1.307,0.268,2.192,0.594,2.658\r\n\tc0.326,0.467,0.816,0.852,1.469,1.154v1.438H220.84c-0.299-0.755-0.506-1.464-0.621-2.128c-0.115-0.663-0.208-1.418-0.276-2.265\r\n\tc-1.371,1.486-2.951,2.752-4.74,3.797c-2.138,1.23-4.555,1.846-7.25,1.846c-3.439,0-6.279-0.978-8.521-2.93\r\n\tc-2.242-1.953-3.363-4.722-3.363-8.306c0-4.646,1.801-8.01,5.402-10.091c1.975-1.133,4.88-1.941,8.714-2.428L213.565,87.643z\r\n\t M219.595,92.242c-0.634,0.394-1.273,0.712-1.918,0.954c-0.645,0.243-1.53,0.469-2.655,0.677l-2.251,0.416\r\n\tc-2.111,0.37-3.62,0.821-4.526,1.353c-1.535,0.902-2.302,2.301-2.302,4.197c0,1.688,0.474,2.907,1.421,3.659s2.1,1.127,3.457,1.127\r\n\tc2.152,0,4.136-0.624,5.949-1.873c1.813-1.248,2.755-3.526,2.825-6.833V92.242z");
    			add_location(path11, file$8, 59, 0, 6253);
    			attr_dev(path12, "d", "M248.11,110.563h-9.875V59.625h9.875V110.563z");
    			add_location(path12, file$8, 69, 0, 7386);
    			attr_dev(path13, "d", "M289.212,105.921c-3.185,3.928-8.02,5.892-14.504,5.892c-6.485,0-11.32-1.964-14.505-5.892s-4.776-8.655-4.776-14.185\r\n\tc0-5.437,1.592-10.147,4.776-14.133s8.02-5.979,14.505-5.979c6.484,0,11.319,1.993,14.504,5.979s4.777,8.696,4.777,14.133\r\n\tC293.989,97.266,292.396,101.993,289.212,105.921z M281.299,100.539c1.543-2.058,2.315-4.982,2.315-8.775\r\n\tc0-3.791-0.772-6.71-2.315-8.757c-1.544-2.046-3.756-3.069-6.636-3.069c-2.881,0-5.099,1.023-6.653,3.069\r\n\tc-1.556,2.047-2.333,4.966-2.333,8.757c0,3.793,0.777,6.718,2.333,8.775c1.555,2.058,3.772,3.086,6.653,3.086\r\n\tC277.543,103.625,279.755,102.597,281.299,100.539z");
    			add_location(path13, file$8, 70, 0, 7444);
    			attr_dev(path14, "d", "M331.347,75c2.457,2.041,3.686,5.427,3.686,10.157v25.405h-10.125V87.604c0-1.984-0.261-3.508-0.782-4.57\r\n\tc-0.952-1.939-2.765-2.909-5.438-2.909c-3.287,0-5.542,1.42-6.765,4.259c-0.635,1.501-0.952,3.417-0.952,5.748v20.431h-9.875V72.938\r\n\th9.563v5.468c1.257-1.937,2.445-3.331,3.565-4.185c2.011-1.521,4.559-2.283,7.645-2.283C325.729,71.938,328.89,72.959,331.347,75z");
    			add_location(path14, file$8, 76, 0, 8059);
    			attr_dev(path15, "d", "M368.853,73.58c2.628,1.178,4.798,3.037,6.511,5.578c1.543,2.24,2.544,4.839,3.003,7.795\r\n\tc0.265,1.732,0.373,4.228,0.324,7.484h-27.427c0.153,3.783,1.47,6.436,3.948,7.957c1.508,0.945,3.322,1.418,5.443,1.418\r\n\tc2.248,0,4.075-0.574,5.481-1.725c0.766-0.621,1.443-1.483,2.031-2.588h10.033c-0.266,2.236-1.484,4.508-3.655,6.813\r\n\tc-3.377,3.666-8.105,5.499-14.186,5.499c-5.018,0-9.444-1.547-13.28-4.641s-5.754-8.127-5.754-15.1c0-6.533,1.729-11.544,5.19-15.03\r\n\tc3.46-3.486,7.951-5.229,13.474-5.229C363.27,71.813,366.224,72.402,368.853,73.58z M354.142,82.123\r\n\tc-1.395,1.416-2.271,3.333-2.628,5.752h17c-0.18-2.579-1.056-4.536-2.629-5.872c-1.573-1.335-3.523-2.003-5.852-2.003\r\n\tC357.5,80,355.536,80.708,354.142,82.123z");
    			add_location(path15, file$8, 80, 0, 8435);
    			attr_dev(path16, "d", "M35.211,118.877c1.879,0.808,3.472,1.996,4.778,3.564c1.08,1.292,1.935,2.723,2.565,4.291\r\n\tc0.63,1.568,0.945,3.356,0.945,5.362c0,2.422-0.612,4.804-1.835,7.146s-3.242,3.996-6.057,4.965c2.347,0.945,4.009,2.289,4.987,4.03\r\n\tc0.978,1.741,1.467,4.399,1.467,7.975v3.425c0,2.33,0.094,3.911,0.281,4.741c0.281,1.314,0.938,2.283,1.969,2.906v1.28H32.573\r\n\tc-0.32-1.13-0.548-2.041-0.685-2.733c-0.274-1.43-0.423-2.895-0.445-4.395l-0.068-4.74c-0.044-3.252-0.606-5.421-1.688-6.505\r\n\tc-1.082-1.084-3.108-1.627-6.079-1.627H13.188v20H2.75v-51h24.409C30.647,117.632,33.332,118.071,35.211,118.877z M13.188,126.438\r\n\tv13.688H24.66c2.279,0,3.988-0.276,5.128-0.829c2.016-0.968,3.024-2.881,3.024-5.738c0-3.088-0.976-5.161-2.926-6.222\r\n\tc-1.096-0.599-2.739-0.898-4.931-0.898H13.188z");
    			add_location(path16, file$8, 87, 0, 9155);
    			attr_dev(path17, "d", "M84.407,163.921c-3.185,3.928-8.02,5.892-14.504,5.892c-6.485,0-11.32-1.964-14.505-5.892s-4.776-8.655-4.776-14.185\r\n\tc0-5.437,1.592-10.147,4.776-14.133s8.02-5.979,14.505-5.979c6.484,0,11.319,1.993,14.504,5.979s4.777,8.696,4.777,14.133\r\n\tC89.184,155.266,87.591,159.994,84.407,163.921z M76.494,158.54c1.543-2.058,2.315-4.982,2.315-8.775\r\n\tc0-3.791-0.772-6.71-2.315-8.757c-1.544-2.046-3.756-3.069-6.636-3.069c-2.881,0-5.099,1.023-6.653,3.069\r\n\tc-1.556,2.047-2.333,4.966-2.333,8.757c0,3.793,0.777,6.718,2.333,8.775c1.555,2.058,3.772,3.086,6.653,3.086\r\n\tC72.738,161.625,74.95,160.597,76.494,158.54z");
    			add_location(path17, file$8, 94, 0, 9924);
    			attr_dev(path18, "d", "M106.04,130.813v22.725c0,2.145,0.251,3.759,0.754,4.842c0.891,1.914,2.639,2.871,5.244,2.871\r\n\tc3.336,0,5.62-1.36,6.854-4.081c0.64-1.476,0.96-3.424,0.96-5.846v-20.511h10v37.75h-9.563v-5.362\r\n\tc-0.092,0.116-0.322,0.463-0.689,1.041c-0.368,0.578-0.805,1.087-1.311,1.526c-1.54,1.388-3.028,2.336-4.465,2.845\r\n\tc-1.437,0.508-3.12,0.763-5.051,0.763c-5.563,0-9.309-2.012-11.239-6.036c-1.08-2.215-1.62-5.479-1.62-9.793v-22.733H106.04z");
    			add_location(path18, file$8, 100, 0, 10529);
    			attr_dev(path19, "d", "M135.646,138.125v-6.938h5.25v-10.625h9.75v10.625h6.125v6.938h-6.125v19.971c0,1.549,0.195,2.514,0.588,2.895\r\n\tc0.393,0.382,1.592,0.572,3.6,0.572c0.299,0,0.616-0.01,0.951-0.031c0.334-0.021,0.663-0.052,0.986-0.094v7.375l-4.669,0.25\r\n\tc-4.658,0.161-7.84-0.647-9.546-2.428c-1.107-1.133-1.66-2.878-1.66-5.237v-23.272H135.646z");
    			add_location(path19, file$8, 104, 0, 10966);
    			attr_dev(path20, "d", "M187.649,131.581c2.628,1.178,4.798,3.037,6.511,5.578c1.543,2.24,2.544,4.839,3.003,7.795\r\n\tc0.265,1.732,0.373,4.228,0.324,7.484H170.06c0.153,3.783,1.47,6.436,3.948,7.957c1.508,0.945,3.322,1.418,5.443,1.418\r\n\tc2.248,0,4.076-0.574,5.482-1.725c0.766-0.621,1.443-1.483,2.031-2.588h10.033c-0.266,2.236-1.484,4.508-3.655,6.813\r\n\tc-3.377,3.666-8.105,5.499-14.186,5.499c-5.018,0-9.444-1.547-13.28-4.641s-5.754-8.127-5.754-15.1c0-6.533,1.729-11.544,5.19-15.03\r\n\tc3.46-3.486,7.951-5.229,13.474-5.229C182.066,129.813,185.021,130.403,187.649,131.581z M172.938,140.124\r\n\tc-1.395,1.416-2.271,3.333-2.628,5.752h17c-0.18-2.579-1.056-4.536-2.629-5.872c-1.573-1.335-3.524-2.003-5.852-2.003\r\n\tC176.296,138,174.333,138.708,172.938,140.124z");
    			add_location(path20, file$8, 107, 0, 11299);
    			attr_dev(path21, "d", "M223.442,129.954c0.127,0.011,0.409,0.026,0.849,0.047v10.125c-0.625-0.074-1.18-0.124-1.665-0.149\r\n\ts-0.878-0.038-1.179-0.038c-3.978,0-6.648,1.293-8.012,3.877c-0.764,1.454-1.145,3.692-1.145,6.715v18.033h-9.875v-37.75h9.375\r\n\tv6.592c1.523-2.512,2.851-4.229,3.982-5.15c1.846-1.544,4.247-2.316,7.202-2.316C223.159,129.938,223.315,129.944,223.442,129.954z");
    			add_location(path21, file$8, 114, 0, 12031);
    			set_style(svg, "--fill", /*fill*/ ctx[0]);
    			attr_dev(svg, "viewBox", "-0.256 -0.428 379 171");
    			attr_dev(svg, "enable-background", "new -0.256 -0.428 379 171");
    			attr_dev(svg, "xml:space", "preserve");
    			attr_dev(svg, "class", "svelte-w4eign");
    			add_location(svg, file$8, 3, 0, 50);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg, anchor);
    			append_dev(svg, path0);
    			append_dev(svg, path1);
    			append_dev(svg, path2);
    			append_dev(svg, path3);
    			append_dev(svg, path4);
    			append_dev(svg, path5);
    			append_dev(svg, path6);
    			append_dev(svg, path7);
    			append_dev(svg, path8);
    			append_dev(svg, path9);
    			append_dev(svg, path10);
    			append_dev(svg, path11);
    			append_dev(svg, path12);
    			append_dev(svg, path13);
    			append_dev(svg, path14);
    			append_dev(svg, path15);
    			append_dev(svg, path16);
    			append_dev(svg, path17);
    			append_dev(svg, path18);
    			append_dev(svg, path19);
    			append_dev(svg, path20);
    			append_dev(svg, path21);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*fill*/ 1) {
    				set_style(svg, "--fill", /*fill*/ ctx[0]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svg);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$a.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$a($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Branding", slots, []);
    	let { fill = "#000" } = $$props;
    	const writable_props = ["fill"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Branding> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("fill" in $$props) $$invalidate(0, fill = $$props.fill);
    	};

    	$$self.$capture_state = () => ({ fill });

    	$$self.$inject_state = $$props => {
    		if ("fill" in $$props) $$invalidate(0, fill = $$props.fill);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [fill];
    }

    class Branding extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$a, create_fragment$a, safe_not_equal, { fill: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Branding",
    			options,
    			id: create_fragment$a.name
    		});
    	}

    	get fill() {
    		throw new Error("<Branding>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set fill(value) {
    		throw new Error("<Branding>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\app.svelte generated by Svelte v3.31.0 */
    const file$9 = "src\\app.svelte";

    function create_fragment$b(ctx) {
    	let header;
    	let div;
    	let a0;
    	let branding;
    	let link_action;
    	let t0;
    	let nav;
    	let a1;
    	let link_action_1;
    	let t2;
    	let a2;
    	let link_action_2;
    	let t4;
    	let a3;
    	let link_action_3;
    	let t6;
    	let a4;
    	let link_action_4;
    	let t8;
    	let a5;
    	let svg;
    	let path;
    	let t9;
    	let main;
    	let router;
    	let current;
    	let mounted;
    	let dispose;
    	branding = new Branding({ props: { fill: "white" }, $$inline: true });
    	router = new Router_1$1({ $$inline: true });

    	const block = {
    		c: function create() {
    			header = element("header");
    			div = element("div");
    			a0 = element("a");
    			create_component(branding.$$.fragment);
    			t0 = space();
    			nav = element("nav");
    			a1 = element("a");
    			a1.textContent = "Home";
    			t2 = space();
    			a2 = element("a");
    			a2.textContent = "Documentation";
    			t4 = space();
    			a3 = element("a");
    			a3.textContent = "Usage";
    			t6 = space();
    			a4 = element("a");
    			a4.textContent = "Fallback route";
    			t8 = space();
    			a5 = element("a");
    			svg = svg_element("svg");
    			path = svg_element("path");
    			t9 = space();
    			main = element("main");
    			create_component(router.$$.fragment);
    			attr_dev(a0, "href", "/");
    			attr_dev(a0, "class", "svelte-4sq5x5");
    			add_location(a0, file$9, 8, 4, 208);
    			attr_dev(a1, "href", "/");
    			attr_dev(a1, "class", "svelte-4sq5x5");
    			toggle_class(a1, "active", /*$location*/ ctx[0] == "/");
    			add_location(a1, file$9, 12, 6, 291);
    			attr_dev(a2, "href", "/documentation");
    			attr_dev(a2, "class", "svelte-4sq5x5");
    			toggle_class(a2, "active", /*$location*/ ctx[0] == "/documentation");
    			add_location(a2, file$9, 13, 6, 360);
    			attr_dev(a3, "href", "/usage");
    			attr_dev(a3, "class", "svelte-4sq5x5");
    			toggle_class(a3, "active", /*$location*/ ctx[0] == "/usage");
    			add_location(a3, file$9, 14, 6, 464);
    			attr_dev(a4, "href", "/invalid-route");
    			attr_dev(a4, "class", "svelte-4sq5x5");
    			toggle_class(a4, "active", /*$location*/ ctx[0] == "/invalid-route");
    			add_location(a4, file$9, 15, 6, 544);
    			attr_dev(path, "d", "M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z");
    			add_location(path, file$9, 17, 91, 804);
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "width", "32");
    			attr_dev(svg, "height", "32");
    			attr_dev(svg, "viewBox", "0 0 24 24");
    			add_location(svg, file$9, 17, 8, 721);
    			attr_dev(a5, "href", "https://github.com/hjalmar/svelte-standalone-router");
    			attr_dev(a5, "class", "svelte-4sq5x5");
    			add_location(a5, file$9, 16, 6, 649);
    			attr_dev(nav, "class", "svelte-4sq5x5");
    			add_location(nav, file$9, 11, 4, 278);
    			attr_dev(div, "class", "inner svelte-4sq5x5");
    			add_location(div, file$9, 7, 2, 183);
    			attr_dev(header, "class", "svelte-4sq5x5");
    			add_location(header, file$9, 6, 0, 171);
    			attr_dev(main, "class", "svelte-4sq5x5");
    			add_location(main, file$9, 23, 0, 1584);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, header, anchor);
    			append_dev(header, div);
    			append_dev(div, a0);
    			mount_component(branding, a0, null);
    			append_dev(div, t0);
    			append_dev(div, nav);
    			append_dev(nav, a1);
    			append_dev(nav, t2);
    			append_dev(nav, a2);
    			append_dev(nav, t4);
    			append_dev(nav, a3);
    			append_dev(nav, t6);
    			append_dev(nav, a4);
    			append_dev(nav, t8);
    			append_dev(nav, a5);
    			append_dev(a5, svg);
    			append_dev(svg, path);
    			insert_dev(target, t9, anchor);
    			insert_dev(target, main, anchor);
    			mount_component(router, main, null);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					action_destroyer(link_action = link.call(null, a0)),
    					action_destroyer(link_action_1 = link.call(null, a1)),
    					action_destroyer(link_action_2 = link.call(null, a2)),
    					action_destroyer(link_action_3 = link.call(null, a3)),
    					action_destroyer(link_action_4 = link.call(null, a4))
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*$location*/ 1) {
    				toggle_class(a1, "active", /*$location*/ ctx[0] == "/");
    			}

    			if (dirty & /*$location*/ 1) {
    				toggle_class(a2, "active", /*$location*/ ctx[0] == "/documentation");
    			}

    			if (dirty & /*$location*/ 1) {
    				toggle_class(a3, "active", /*$location*/ ctx[0] == "/usage");
    			}

    			if (dirty & /*$location*/ 1) {
    				toggle_class(a4, "active", /*$location*/ ctx[0] == "/invalid-route");
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(branding.$$.fragment, local);
    			transition_in(router.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(branding.$$.fragment, local);
    			transition_out(router.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(header);
    			destroy_component(branding);
    			if (detaching) detach_dev(t9);
    			if (detaching) detach_dev(main);
    			destroy_component(router);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$b.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$b($$self, $$props, $$invalidate) {
    	let $location;
    	validate_store(location$1, "location");
    	component_subscribe($$self, location$1, $$value => $$invalidate(0, $location = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("App", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		link,
    		location: location$1,
    		Router: Router_1$1,
    		Branding,
    		$location
    	});

    	return [$location];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$b, create_fragment$b, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$b.name
    		});
    	}
    }

    var main = new App({ target: document.body });

    return main;

}());
//# sourceMappingURL=bundle.js.map
