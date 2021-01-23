
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
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
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
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
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
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
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
    class SvelteRouter extends Router{}

    // setting a singleton class with properties for 'global' access
    let Router$1 = new class RouterProperties{
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
    };

    // handle the linkBase in pathname
    const getPathname = (path) => {
      const re = new RegExp(`^${Router$1.linkBase}`, 'i');
      path = `/${path}/`.replace(/[\/]+/g, '/').replace(re, '').replace(/^\/|\/$/g, '');
      return '/' + path;
    };

    // dispatch custom event
    const dispatch$1 = ({ state }) => {
      dispatchEvent(new CustomEvent('popstate', { 
        detail: {
          ...state
        } 
      }));
    };

    // navigate to a new page and pushing it to the History object
    const navigate = (url, state = {}) => {
      url = cleanURL(url);
      history.pushState(state, '', url);
      dispatch$1({ url, state }); 
    };

    // redirect to a new page and replacing it on the History object
    const redirect = (url, state = {}) => {
      url = cleanURL(url);
      history.replaceState(state, '', url);
      dispatch$1({ url, state });
    };

    // change url without route change and add it to the History
    const replace = (url, state = {}) => {
      history.pushState(state, '', cleanURL(url));
    };

    // change url without route change and DON'T add it to the History
    const alter = (url, state = {}) => {
      history.replaceState(state, '', cleanURL(url));
    };

    // replace all duplicate '/' that might be going on
    const cleanURL = (url) => `/${Router$1.linkBase}/${url}`.replace(/[\/]+/g, '/');

    // internal goto helper 
    const internalGoTo = (path, e) => {
      replace(getPathname(path));
      const hash = window.location.hash.slice(1);
      if(hash){
        if(e){
          e.preventDefault();
        }
        const element = document.querySelector(`a[name="${hash}"], #${hash}`);
        if(element){
          const topPos = element.getBoundingClientRect().top + window.pageYOffset - Router$1.scrollOffset;
          window.scrollTo({ top: topPos });
        }
      }
    };

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

    // handle internal # links
    const internalLinksHandler = (e) => {
      const target = e.target;
      if(target.tagName == 'A'){
        const href = target.getAttribute('href');
        const isHashLink = href.indexOf('#') > -1;
        if(!(/^[a-zA-Z]+\:\/\/(.*)/.test(href)) && isHashLink){
          // go to position
          internalGoTo(href.startsWith('#') ? window.location.pathname + href : href, e);
          // update the prev data
          prev.location = { ...window.location };
        }
      }
    };

    // the popstate callback handler
    const popstateHandler = async e => {
      let endEarly = false;
      const sameURL = cleanURL(window.location.pathname + '/') == cleanURL(prev.location.pathname + '/') && prev.location.search == window.location.search;
      // don't continue if we are doing internal hash linking
      if(window.location.hash != '' && sameURL && prev.firstLoad){
        endEarly = true;
      }

      // if the hash is empty and not the same as the previous and it's on the same url we 
      // don't want to load a new page, then we simply end early and scroll to the top.
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
        window.addEventListener('click', internalLinksHandler);
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
    	props: dirty & /*$component*/ 1,
    	decorator: dirty & /*$component*/ 1,
    	decoratorProps: dirty & /*$component*/ 1
    });

    const get_default_slot_context = ctx => ({
    	component: /*$component*/ ctx[0].context,
    	props: /*$component*/ ctx[0].props,
    	decorator: /*$component*/ ctx[0].decorator,
    	decoratorProps: /*$component*/ ctx[0].decoratorProps
    });

    // (54:0) {#if $component}
    function create_if_block(ctx) {
    	let current;
    	const default_slot_template = /*#slots*/ ctx[3].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[4], get_default_slot_context);
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
    				if (default_slot.p && dirty & /*$$scope, $component*/ 17) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[4], dirty, get_default_slot_changes, get_default_slot_context);
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
    		source: "(54:0) {#if $component}",
    		ctx
    	});

    	return block;
    }

    // (60:4) {:else}
    function create_else_block(ctx) {
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
    		id: create_else_block.name,
    		type: "else",
    		source: "(60:4) {:else}",
    		ctx
    	});

    	return block;
    }

    // (56:4) {#if $component.decorator}
    function create_if_block_1(ctx) {
    	let switch_instance;
    	let switch_instance_anchor;
    	let current;

    	const switch_instance_spread_levels = [
    		/*$component*/ ctx[0].decoratorProps
    		? /*$component*/ ctx[0].decoratorProps
    		: {}
    	];

    	var switch_value = /*$component*/ ctx[0].decorator;

    	function switch_props(ctx) {
    		let switch_instance_props = {
    			$$slots: { default: [create_default_slot] },
    			$$scope: { ctx }
    		};

    		for (let i = 0; i < switch_instance_spread_levels.length; i += 1) {
    			switch_instance_props = assign(switch_instance_props, switch_instance_spread_levels[i]);
    		}

    		return {
    			props: switch_instance_props,
    			$$inline: true
    		};
    	}

    	if (switch_value) {
    		switch_instance = new switch_value(switch_props(ctx));
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
    			? get_spread_update(switch_instance_spread_levels, [
    					get_spread_object(/*$component*/ ctx[0].decoratorProps
    					? /*$component*/ ctx[0].decoratorProps
    					: {})
    				])
    			: {};

    			if (dirty & /*$$scope, $component*/ 17) {
    				switch_instance_changes.$$scope = { dirty, ctx };
    			}

    			if (switch_value !== (switch_value = /*$component*/ ctx[0].decorator)) {
    				if (switch_instance) {
    					group_outros();
    					const old_component = switch_instance;

    					transition_out(old_component.$$.fragment, 1, 0, () => {
    						destroy_component(old_component, 1);
    					});

    					check_outros();
    				}

    				if (switch_value) {
    					switch_instance = new switch_value(switch_props(ctx));
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
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(56:4) {#if $component.decorator}",
    		ctx
    	});

    	return block;
    }

    // (57:6) <svelte:component this={$component.decorator} {...($component.decoratorProps ? $component.decoratorProps : {})}>
    function create_default_slot(ctx) {
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
    		id: create_default_slot.name,
    		type: "slot",
    		source: "(57:6) <svelte:component this={$component.decorator} {...($component.decoratorProps ? $component.decoratorProps : {})}>",
    		ctx
    	});

    	return block;
    }

    // (55:140)       
    function fallback_block(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block_1, create_else_block];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*$component*/ ctx[0].decorator) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				} else {
    					if_block.p(ctx, dirty);
    				}

    				transition_in(if_block, 1);
    				if_block.m(if_block_anchor.parentNode, if_block_anchor);
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
    			if_blocks[current_block_type_index].d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: fallback_block.name,
    		type: "fallback",
    		source: "(55:140)       ",
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

    	context.subscribe(async (callback, props = {}, decorator = {}) => {
    		// a dirty check to see it is a "component". Since there is not way to check if it is a svelte component
    		// this would atleast force it to be a function and will catch most errors where a svelte component isn't passed
    		if (typeof callback != "function") {
    			throw new SvelteStandaloneRouterError(`Unable to load component. Did you pass a valid svelte component to the 'send' response?`);
    		}

    		// reset the scroll position depending on the static scrollReset value
    		if (Router$1.scrollReset) {
    			// always start from the top of the page
    			window.scrollTo({ top: 0 });
    		}

    		// update the writable store
    		component.set({
    			context: decorator
    			? callback
    			: class extends callback {
    					
    				},
    			decorator: !decorator.component
    			? undefined
    			: class extends decorator.component {
    					
    				},
    			decoratorProps: decorator.props || undefined,
    			props
    		});

    		// if we have visited a a url with a hash in it
    		// we need to await a tick so the component is loaded
    		// before we can scroll to that place in the dom
    		if (window.location.hash) {
    			await tick();

    			// but we also have this weird behaviour where the location pathname is
    			// not accessible so we need to pass it manually.
    			setTimeout(
    				() => {
    					internalGoTo(window.location.pathname + window.location.hash);
    				},
    				0
    			);
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
    		if ("$$scope" in $$props) $$invalidate(4, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		tick,
    		RouterContext: SvelteRouter,
    		Router: Router$1,
    		SvelteStandaloneRouterError,
    		contexts,
    		prev,
    		internalGoTo,
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

    	return [$component, component, context, slots, $$scope];
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

    var link = (element, props) => {
      props = {
        type: 'navigate',
        state: {},
        title: '',
        ...props
      };

      if(Router$1.linkBase){
        // first we need to clean the url and add the linkbase. Thats so one can right click and
        // open the page in a new tab or window and go to the right url
        const clean = cleanURL(element.getAttribute('href') || '');
        element.setAttribute('href', clean);
      }
      
      const clickHandler = (e) => {
        // make the check before preventing default behaviour since we should not block 
        // the default behaviour if we don't supply the required url string
        let url = props.to || props.href || e.currentTarget.getAttribute('href') || e.currentTarget.getAttribute('data-href');
        if(!url){
          return;
        }
        // here we need to only get the pathname without any linkbase
        // because that is handled in the navigational helpers
        url = getPathname(url);
        e.preventDefault();
        if(props.type == 'navigate'){
          navigate(url, props.state, props.title);
        }else if(props.type == 'redirect'){
          redirect(url, props.state, props.title);
        }else if(props.type == 'replace'){
          replace(url, props.state, props.title);
        }else if(props.type == 'alter'){
          alter(url, props.state, props.title);
        }else {
          console.warn(`Invalid 'use:link' type. Expecting 'navigate'(default), 'redirect', 'replace' or 'alter'`);
          return;
        }
      };
      element.addEventListener('click', clickHandler);
      return {
        update(parameters){
          props = {
            ...props,
            ...parameters
          };
        },
        destroy(){element.removeEventListener('click', clickHandler);}
      }
    };

    var decorator = (context, ...middleware) => {
      let decorator;
      // if no context is provided
      if(!(context instanceof SvelteRouter)){
        // then the context is actually the decorator
        decorator = context;
        // and so we get the first context from the context Map
        context = contexts.keys().next().value;
      }else {
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
        const callback = fns.pop();
        context.get(url, ...[...middleware, ...fns], (req, res) => {
          callback(req, {
            send: (component, props) => {
              res.send(component, props, { component: decorator, props: decoratorProps });
            },
            error: res.error
          }, decoratorPropsCallback);
        });
        return {
          get: (_url, ...args) => wrappedCall(`${root}/${_url}`, ...args)
        };
      };
      return wrappedCall;
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

    /* src\branding.svelte generated by Svelte v3.31.0 */

    const file = "src\\branding.svelte";

    function create_fragment$2(ctx) {
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
    			add_location(path0, file, 4, 0, 180);
    			attr_dev(path1, "d", "M72.336,14.813h10.59l-13.627,37.75H58.903L45.37,14.813h11.075l7.859,27.845L72.336,14.813z");
    			add_location(path1, file, 11, 0, 1017);
    			attr_dev(path2, "d", "M112.967,15.58c2.628,1.178,4.798,3.037,6.511,5.578c1.543,2.24,2.544,4.839,3.003,7.795\r\n\tc0.265,1.732,0.373,4.228,0.324,7.484H95.378c0.153,3.783,1.47,6.436,3.948,7.957c1.508,0.945,3.322,1.418,5.443,1.418\r\n\tc2.248,0,4.075-0.574,5.481-1.725c0.766-0.621,1.443-1.483,2.031-2.588h10.033c-0.266,2.236-1.484,4.508-3.655,6.813\r\n\tc-3.377,3.666-8.105,5.499-14.186,5.499c-5.018,0-9.444-1.547-13.28-4.641s-5.754-8.127-5.754-15.1c0-6.533,1.729-11.544,5.19-15.03\r\n\tc3.46-3.486,7.951-5.229,13.474-5.229C107.384,13.813,110.338,14.402,112.967,15.58z M98.256,24.123\r\n\tc-1.395,1.416-2.271,3.333-2.628,5.752h17c-0.18-2.579-1.056-4.536-2.629-5.872c-1.573-1.335-3.523-2.003-5.852-2.003\r\n\tC101.615,22,99.651,22.708,98.256,24.123z");
    			add_location(path2, file, 12, 0, 1120);
    			attr_dev(path3, "d", "M137.921,52.563h-9.875V1.625h9.875V52.563z");
    			add_location(path3, file, 19, 0, 1839);
    			attr_dev(path4, "d", "M143.675,22.125v-6.938h5.25V4.563h9.75v10.625h6.125v6.938h-6.125v19.971c0,1.549,0.195,2.514,0.588,2.895\r\n\tc0.393,0.382,1.592,0.572,3.6,0.572c0.299,0,0.617-0.01,0.951-0.031c0.334-0.021,0.664-0.052,0.986-0.094v7.375l-4.668,0.25\r\n\tc-4.658,0.161-7.84-0.647-9.547-2.428c-1.107-1.133-1.66-2.878-1.66-5.237V22.125H143.675z");
    			add_location(path4, file, 20, 0, 1895);
    			attr_dev(path5, "d", "M195.679,15.58c2.628,1.178,4.798,3.037,6.511,5.578c1.543,2.24,2.544,4.839,3.003,7.795\r\n\tc0.265,1.732,0.373,4.228,0.324,7.484h-27.427c0.153,3.783,1.47,6.436,3.949,7.957c1.508,0.945,3.322,1.418,5.443,1.418\r\n\tc2.248,0,4.075-0.574,5.481-1.725c0.766-0.621,1.443-1.483,2.031-2.588h10.033c-0.266,2.236-1.484,4.508-3.655,6.813\r\n\tc-3.377,3.666-8.105,5.499-14.186,5.499c-5.018,0-9.445-1.547-13.281-4.641s-5.754-8.127-5.754-15.1\r\n\tc0-6.533,1.729-11.544,5.19-15.03c3.46-3.486,7.951-5.229,13.474-5.229C190.096,13.813,193.05,14.402,195.679,15.58z\r\n\t M180.967,24.123c-1.395,1.416-2.271,3.333-2.628,5.752h17c-0.18-2.579-1.056-4.536-2.629-5.872\r\n\tc-1.573-1.335-3.523-2.003-5.852-2.003C184.326,22,182.362,22.708,180.967,24.123z");
    			add_location(path5, file, 23, 0, 2224);
    			attr_dev(path6, "d", "M10.25,94.813c0.328,2.33,0.974,4.072,1.936,5.226c1.76,2.1,4.774,3.149,9.045,3.149c2.557,0,4.634-0.276,6.229-0.831\r\n\tc3.026-1.063,4.54-3.036,4.54-5.923c0-1.686-0.74-2.99-2.22-3.914c-1.48-0.9-3.832-1.697-7.057-2.392l-5.507-1.214\r\n\tc-5.414-1.203-9.146-2.509-11.196-3.919C2.548,82.64,0.813,78.954,0.813,73.94c0-4.574,1.681-8.374,5.042-11.4S14.152,58,20.666,58\r\n\tc5.439,0,10.079,1.426,13.919,4.276s5.853,6.987,6.04,12.411H30.438c-0.189-3.064-1.563-5.242-4.12-6.533\r\n\tc-1.705-0.853-3.825-1.279-6.358-1.279c-2.818,0-5.068,0.554-6.75,1.661s-2.521,2.653-2.521,4.638c0,1.822,0.828,3.184,2.486,4.084\r\n\tc1.065,0.6,3.323,1.305,6.774,2.114l8.943,2.116c3.92,0.926,6.856,2.162,8.81,3.709c3.032,2.402,4.549,5.879,4.549,10.429\r\n\tc0,4.666-1.8,8.54-5.399,11.624s-8.685,4.625-15.254,4.625c-6.71,0-11.987-1.517-15.831-4.551S0,100.119,0,94.813H10.25z");
    			add_location(path6, file, 30, 0, 2947);
    			attr_dev(path7, "d", "M45.148,80.125v-6.938h5.25V62.563h9.75v10.625h6.125v6.938h-6.125v19.971c0,1.549,0.195,2.514,0.588,2.895\r\n\tc0.393,0.382,1.592,0.572,3.6,0.572c0.299,0,0.616-0.01,0.951-0.031c0.334-0.021,0.663-0.052,0.986-0.094v7.375l-4.669,0.25\r\n\tc-4.658,0.161-7.84-0.647-9.546-2.428c-1.107-1.133-1.66-2.878-1.66-5.237V80.125H45.148z");
    			add_location(path7, file, 37, 0, 3788);
    			attr_dev(path8, "d", "M87.561,87.643c1.835-0.23,3.147-0.52,3.938-0.867c1.417-0.601,2.126-1.537,2.126-2.809c0-1.549-0.546-2.617-1.636-3.207\r\n\tc-1.091-0.59-2.691-0.885-4.802-0.885c-2.369,0-4.046,0.577-5.03,1.729c-0.704,0.854-1.173,2.006-1.407,3.458h-9.5\r\n\tc0.209-3.301,1.137-6.014,2.783-8.139c2.621-3.324,7.12-4.986,13.498-4.986c4.151,0,7.839,0.821,11.063,2.464\r\n\tc3.224,1.644,4.836,4.735,4.836,9.274v17.281c0,1.199,0.022,2.65,0.069,4.355c0.069,1.307,0.268,2.192,0.594,2.658\r\n\tc0.326,0.467,0.816,0.852,1.469,1.154v1.438H94.835c-0.299-0.755-0.506-1.464-0.621-2.128c-0.115-0.663-0.208-1.418-0.276-2.265\r\n\tc-1.371,1.486-2.951,2.752-4.74,3.797c-2.138,1.23-4.555,1.846-7.25,1.846c-3.439,0-6.279-0.978-8.521-2.93\r\n\tc-2.242-1.953-3.363-4.722-3.363-8.306c0-4.646,1.801-8.01,5.402-10.091c1.975-1.133,4.88-1.941,8.714-2.428L87.561,87.643z\r\n\t M93.59,92.242c-0.634,0.394-1.273,0.712-1.918,0.954c-0.645,0.243-1.53,0.469-2.655,0.677l-2.251,0.416\r\n\tc-2.111,0.37-3.62,0.821-4.526,1.353c-1.535,0.902-2.302,2.301-2.302,4.197c0,1.688,0.474,2.907,1.421,3.659s2.1,1.127,3.457,1.127\r\n\tc2.152,0,4.136-0.624,5.949-1.873c1.813-1.248,2.755-3.526,2.825-6.833V92.242z");
    			add_location(path8, file, 40, 0, 4116);
    			attr_dev(path9, "d", "M142.357,75c2.457,2.041,3.686,5.427,3.686,10.157v25.405h-10.125V87.604c0-1.984-0.261-3.508-0.782-4.57\r\n\tc-0.952-1.939-2.765-2.909-5.438-2.909c-3.287,0-5.542,1.42-6.765,4.259c-0.635,1.501-0.952,3.417-0.952,5.748v20.431h-9.875V72.938\r\n\th9.563v5.468c1.257-1.937,2.445-3.331,3.565-4.185c2.011-1.521,4.559-2.283,7.645-2.283C136.74,71.938,139.9,72.959,142.357,75z");
    			add_location(path9, file, 50, 0, 5245);
    			attr_dev(path10, "d", "M175.323,73.444c1.776,1.005,3.219,2.396,4.326,4.174V59.625h10v50.938h-9.563v-5.177c-1.408,2.247-3.014,3.88-4.814,4.898\r\n\ts-4.041,1.528-6.719,1.528c-4.41,0-8.122-1.785-11.135-5.356c-3.014-3.571-4.52-8.154-4.52-13.749\r\n\tc0-6.449,1.481-11.522,4.446-15.222c2.965-3.698,6.927-5.548,11.888-5.548C171.516,71.938,173.546,72.44,175.323,73.444z\r\n\t M177.787,100.377c1.449-2.082,2.175-4.776,2.175-8.085c0-4.627-1.172-7.935-3.516-9.925c-1.424-1.203-3.078-1.805-4.961-1.805\r\n\tc-2.871,0-4.978,1.094-6.321,3.279c-1.344,2.187-2.015,4.899-2.015,8.138c0,3.493,0.685,6.286,2.054,8.38s3.446,3.141,6.231,3.141\r\n\tS176.336,102.459,177.787,100.377z");
    			add_location(path10, file, 53, 0, 5616);
    			attr_dev(path11, "d", "M213.565,87.643c1.835-0.23,3.147-0.52,3.938-0.867c1.417-0.601,2.126-1.537,2.126-2.809c0-1.549-0.546-2.617-1.636-3.207\r\n\tc-1.091-0.59-2.691-0.885-4.802-0.885c-2.369,0-4.046,0.577-5.03,1.729c-0.704,0.854-1.173,2.006-1.407,3.458h-9.5\r\n\tc0.209-3.301,1.137-6.014,2.783-8.139c2.621-3.324,7.12-4.986,13.498-4.986c4.151,0,7.839,0.821,11.063,2.464\r\n\tc3.224,1.644,4.836,4.735,4.836,9.274v17.281c0,1.199,0.022,2.65,0.069,4.355c0.069,1.307,0.268,2.192,0.594,2.658\r\n\tc0.326,0.467,0.816,0.852,1.469,1.154v1.438H220.84c-0.299-0.755-0.506-1.464-0.621-2.128c-0.115-0.663-0.208-1.418-0.276-2.265\r\n\tc-1.371,1.486-2.951,2.752-4.74,3.797c-2.138,1.23-4.555,1.846-7.25,1.846c-3.439,0-6.279-0.978-8.521-2.93\r\n\tc-2.242-1.953-3.363-4.722-3.363-8.306c0-4.646,1.801-8.01,5.402-10.091c1.975-1.133,4.88-1.941,8.714-2.428L213.565,87.643z\r\n\t M219.595,92.242c-0.634,0.394-1.273,0.712-1.918,0.954c-0.645,0.243-1.53,0.469-2.655,0.677l-2.251,0.416\r\n\tc-2.111,0.37-3.62,0.821-4.526,1.353c-1.535,0.902-2.302,2.301-2.302,4.197c0,1.688,0.474,2.907,1.421,3.659s2.1,1.127,3.457,1.127\r\n\tc2.152,0,4.136-0.624,5.949-1.873c1.813-1.248,2.755-3.526,2.825-6.833V92.242z");
    			add_location(path11, file, 59, 0, 6253);
    			attr_dev(path12, "d", "M248.11,110.563h-9.875V59.625h9.875V110.563z");
    			add_location(path12, file, 69, 0, 7386);
    			attr_dev(path13, "d", "M289.212,105.921c-3.185,3.928-8.02,5.892-14.504,5.892c-6.485,0-11.32-1.964-14.505-5.892s-4.776-8.655-4.776-14.185\r\n\tc0-5.437,1.592-10.147,4.776-14.133s8.02-5.979,14.505-5.979c6.484,0,11.319,1.993,14.504,5.979s4.777,8.696,4.777,14.133\r\n\tC293.989,97.266,292.396,101.993,289.212,105.921z M281.299,100.539c1.543-2.058,2.315-4.982,2.315-8.775\r\n\tc0-3.791-0.772-6.71-2.315-8.757c-1.544-2.046-3.756-3.069-6.636-3.069c-2.881,0-5.099,1.023-6.653,3.069\r\n\tc-1.556,2.047-2.333,4.966-2.333,8.757c0,3.793,0.777,6.718,2.333,8.775c1.555,2.058,3.772,3.086,6.653,3.086\r\n\tC277.543,103.625,279.755,102.597,281.299,100.539z");
    			add_location(path13, file, 70, 0, 7444);
    			attr_dev(path14, "d", "M331.347,75c2.457,2.041,3.686,5.427,3.686,10.157v25.405h-10.125V87.604c0-1.984-0.261-3.508-0.782-4.57\r\n\tc-0.952-1.939-2.765-2.909-5.438-2.909c-3.287,0-5.542,1.42-6.765,4.259c-0.635,1.501-0.952,3.417-0.952,5.748v20.431h-9.875V72.938\r\n\th9.563v5.468c1.257-1.937,2.445-3.331,3.565-4.185c2.011-1.521,4.559-2.283,7.645-2.283C325.729,71.938,328.89,72.959,331.347,75z");
    			add_location(path14, file, 76, 0, 8059);
    			attr_dev(path15, "d", "M368.853,73.58c2.628,1.178,4.798,3.037,6.511,5.578c1.543,2.24,2.544,4.839,3.003,7.795\r\n\tc0.265,1.732,0.373,4.228,0.324,7.484h-27.427c0.153,3.783,1.47,6.436,3.948,7.957c1.508,0.945,3.322,1.418,5.443,1.418\r\n\tc2.248,0,4.075-0.574,5.481-1.725c0.766-0.621,1.443-1.483,2.031-2.588h10.033c-0.266,2.236-1.484,4.508-3.655,6.813\r\n\tc-3.377,3.666-8.105,5.499-14.186,5.499c-5.018,0-9.444-1.547-13.28-4.641s-5.754-8.127-5.754-15.1c0-6.533,1.729-11.544,5.19-15.03\r\n\tc3.46-3.486,7.951-5.229,13.474-5.229C363.27,71.813,366.224,72.402,368.853,73.58z M354.142,82.123\r\n\tc-1.395,1.416-2.271,3.333-2.628,5.752h17c-0.18-2.579-1.056-4.536-2.629-5.872c-1.573-1.335-3.523-2.003-5.852-2.003\r\n\tC357.5,80,355.536,80.708,354.142,82.123z");
    			add_location(path15, file, 80, 0, 8435);
    			attr_dev(path16, "d", "M35.211,118.877c1.879,0.808,3.472,1.996,4.778,3.564c1.08,1.292,1.935,2.723,2.565,4.291\r\n\tc0.63,1.568,0.945,3.356,0.945,5.362c0,2.422-0.612,4.804-1.835,7.146s-3.242,3.996-6.057,4.965c2.347,0.945,4.009,2.289,4.987,4.03\r\n\tc0.978,1.741,1.467,4.399,1.467,7.975v3.425c0,2.33,0.094,3.911,0.281,4.741c0.281,1.314,0.938,2.283,1.969,2.906v1.28H32.573\r\n\tc-0.32-1.13-0.548-2.041-0.685-2.733c-0.274-1.43-0.423-2.895-0.445-4.395l-0.068-4.74c-0.044-3.252-0.606-5.421-1.688-6.505\r\n\tc-1.082-1.084-3.108-1.627-6.079-1.627H13.188v20H2.75v-51h24.409C30.647,117.632,33.332,118.071,35.211,118.877z M13.188,126.438\r\n\tv13.688H24.66c2.279,0,3.988-0.276,5.128-0.829c2.016-0.968,3.024-2.881,3.024-5.738c0-3.088-0.976-5.161-2.926-6.222\r\n\tc-1.096-0.599-2.739-0.898-4.931-0.898H13.188z");
    			add_location(path16, file, 87, 0, 9155);
    			attr_dev(path17, "d", "M84.407,163.921c-3.185,3.928-8.02,5.892-14.504,5.892c-6.485,0-11.32-1.964-14.505-5.892s-4.776-8.655-4.776-14.185\r\n\tc0-5.437,1.592-10.147,4.776-14.133s8.02-5.979,14.505-5.979c6.484,0,11.319,1.993,14.504,5.979s4.777,8.696,4.777,14.133\r\n\tC89.184,155.266,87.591,159.994,84.407,163.921z M76.494,158.54c1.543-2.058,2.315-4.982,2.315-8.775\r\n\tc0-3.791-0.772-6.71-2.315-8.757c-1.544-2.046-3.756-3.069-6.636-3.069c-2.881,0-5.099,1.023-6.653,3.069\r\n\tc-1.556,2.047-2.333,4.966-2.333,8.757c0,3.793,0.777,6.718,2.333,8.775c1.555,2.058,3.772,3.086,6.653,3.086\r\n\tC72.738,161.625,74.95,160.597,76.494,158.54z");
    			add_location(path17, file, 94, 0, 9924);
    			attr_dev(path18, "d", "M106.04,130.813v22.725c0,2.145,0.251,3.759,0.754,4.842c0.891,1.914,2.639,2.871,5.244,2.871\r\n\tc3.336,0,5.62-1.36,6.854-4.081c0.64-1.476,0.96-3.424,0.96-5.846v-20.511h10v37.75h-9.563v-5.362\r\n\tc-0.092,0.116-0.322,0.463-0.689,1.041c-0.368,0.578-0.805,1.087-1.311,1.526c-1.54,1.388-3.028,2.336-4.465,2.845\r\n\tc-1.437,0.508-3.12,0.763-5.051,0.763c-5.563,0-9.309-2.012-11.239-6.036c-1.08-2.215-1.62-5.479-1.62-9.793v-22.733H106.04z");
    			add_location(path18, file, 100, 0, 10529);
    			attr_dev(path19, "d", "M135.646,138.125v-6.938h5.25v-10.625h9.75v10.625h6.125v6.938h-6.125v19.971c0,1.549,0.195,2.514,0.588,2.895\r\n\tc0.393,0.382,1.592,0.572,3.6,0.572c0.299,0,0.616-0.01,0.951-0.031c0.334-0.021,0.663-0.052,0.986-0.094v7.375l-4.669,0.25\r\n\tc-4.658,0.161-7.84-0.647-9.546-2.428c-1.107-1.133-1.66-2.878-1.66-5.237v-23.272H135.646z");
    			add_location(path19, file, 104, 0, 10966);
    			attr_dev(path20, "d", "M187.649,131.581c2.628,1.178,4.798,3.037,6.511,5.578c1.543,2.24,2.544,4.839,3.003,7.795\r\n\tc0.265,1.732,0.373,4.228,0.324,7.484H170.06c0.153,3.783,1.47,6.436,3.948,7.957c1.508,0.945,3.322,1.418,5.443,1.418\r\n\tc2.248,0,4.076-0.574,5.482-1.725c0.766-0.621,1.443-1.483,2.031-2.588h10.033c-0.266,2.236-1.484,4.508-3.655,6.813\r\n\tc-3.377,3.666-8.105,5.499-14.186,5.499c-5.018,0-9.444-1.547-13.28-4.641s-5.754-8.127-5.754-15.1c0-6.533,1.729-11.544,5.19-15.03\r\n\tc3.46-3.486,7.951-5.229,13.474-5.229C182.066,129.813,185.021,130.403,187.649,131.581z M172.938,140.124\r\n\tc-1.395,1.416-2.271,3.333-2.628,5.752h17c-0.18-2.579-1.056-4.536-2.629-5.872c-1.573-1.335-3.524-2.003-5.852-2.003\r\n\tC176.296,138,174.333,138.708,172.938,140.124z");
    			add_location(path20, file, 107, 0, 11299);
    			attr_dev(path21, "d", "M223.442,129.954c0.127,0.011,0.409,0.026,0.849,0.047v10.125c-0.625-0.074-1.18-0.124-1.665-0.149\r\n\ts-0.878-0.038-1.179-0.038c-3.978,0-6.648,1.293-8.012,3.877c-0.764,1.454-1.145,3.692-1.145,6.715v18.033h-9.875v-37.75h9.375\r\n\tv6.592c1.523-2.512,2.851-4.229,3.982-5.15c1.846-1.544,4.247-2.316,7.202-2.316C223.159,129.938,223.315,129.944,223.442,129.954z");
    			add_location(path21, file, 114, 0, 12031);
    			set_style(svg, "--fill", /*fill*/ ctx[0]);
    			attr_dev(svg, "viewBox", "-0.256 -0.428 379 171");
    			attr_dev(svg, "enable-background", "new -0.256 -0.428 379 171");
    			attr_dev(svg, "xml:space", "preserve");
    			attr_dev(svg, "class", "svelte-1kco48u");
    			add_location(svg, file, 3, 0, 50);
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
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
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
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { fill: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Branding",
    			options,
    			id: create_fragment$2.name
    		});
    	}

    	get fill() {
    		throw new Error("<Branding>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set fill(value) {
    		throw new Error("<Branding>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\masthead.svelte generated by Svelte v3.31.0 */
    const file$1 = "src\\masthead.svelte";

    function create_fragment$3(ctx) {
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
    	let span;
    	let current;
    	let mounted;
    	let dispose;

    	branding = new Branding({
    			props: { fill: "var(--color-red)" },
    			$$inline: true
    		});

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
    			a3.textContent = "Guides";
    			t6 = space();
    			a4 = element("a");
    			a4.textContent = "Changelog";
    			t8 = space();
    			a5 = element("a");
    			svg = svg_element("svg");
    			path = svg_element("path");
    			t9 = space();
    			span = element("span");
    			span.textContent = "Github";
    			attr_dev(a0, "href", "/");
    			attr_dev(a0, "class", "svelte-8w6d0q");
    			add_location(a0, file$1, 7, 4, 167);
    			attr_dev(a1, "href", "/");
    			attr_dev(a1, "class", "svelte-8w6d0q");
    			toggle_class(a1, "active", /*$location*/ ctx[0] == "/");
    			add_location(a1, file$1, 11, 6, 261);
    			attr_dev(a2, "href", "/how-to/documentation");
    			attr_dev(a2, "class", "svelte-8w6d0q");
    			toggle_class(a2, "active", /*$location*/ ctx[0] == "/how-to/documentation");
    			add_location(a2, file$1, 12, 6, 330);
    			attr_dev(a3, "href", "/how-to/guides");
    			attr_dev(a3, "class", "svelte-8w6d0q");
    			toggle_class(a3, "active", /*$location*/ ctx[0] == "/how-to/guides");
    			add_location(a3, file$1, 13, 6, 448);
    			attr_dev(a4, "href", "/changelog");
    			attr_dev(a4, "class", "svelte-8w6d0q");
    			toggle_class(a4, "active", /*$location*/ ctx[0] == "/changelog");
    			add_location(a4, file$1, 14, 6, 545);
    			attr_dev(path, "d", "M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z");
    			add_location(path, file$1, 16, 91, 814);
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "width", "22");
    			attr_dev(svg, "height", "22");
    			attr_dev(svg, "viewBox", "0 0 24 24");
    			attr_dev(svg, "class", "svelte-8w6d0q");
    			add_location(svg, file$1, 16, 8, 731);
    			attr_dev(span, "class", "svelte-8w6d0q");
    			add_location(span, file$1, 17, 8, 1555);
    			attr_dev(a5, "href", "https://github.com/hjalmar/svelte-standalone-router");
    			attr_dev(a5, "class", "button github svelte-8w6d0q");
    			add_location(a5, file$1, 15, 6, 637);
    			attr_dev(nav, "class", "svelte-8w6d0q");
    			add_location(nav, file$1, 10, 4, 248);
    			attr_dev(div, "class", "inner svelte-8w6d0q");
    			add_location(div, file$1, 6, 2, 142);
    			attr_dev(header, "class", "svelte-8w6d0q");
    			add_location(header, file$1, 5, 0, 130);
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
    			append_dev(a5, t9);
    			append_dev(a5, span);
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
    				toggle_class(a2, "active", /*$location*/ ctx[0] == "/how-to/documentation");
    			}

    			if (dirty & /*$location*/ 1) {
    				toggle_class(a3, "active", /*$location*/ ctx[0] == "/how-to/guides");
    			}

    			if (dirty & /*$location*/ 1) {
    				toggle_class(a4, "active", /*$location*/ ctx[0] == "/changelog");
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(branding.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(branding.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(header);
    			destroy_component(branding);
    			mounted = false;
    			run_all(dispose);
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

    function instance$3($$self, $$props, $$invalidate) {
    	let $location;
    	validate_store(location$1, "location");
    	component_subscribe($$self, location$1, $$value => $$invalidate(0, $location = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Masthead", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Masthead> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ link, location: location$1, Branding, $location });
    	return [$location];
    }

    class Masthead extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Masthead",
    			options,
    			id: create_fragment$3.name
    		});
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

    /* src\_layout\_error.svelte generated by Svelte v3.31.0 */

    const { Error: Error_1$1 } = globals;
    const file$2 = "src\\_layout\\_error.svelte";

    function create_fragment$4(ctx) {
    	let main;
    	let current;
    	const default_slot_template = /*#slots*/ ctx[1].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[0], null);

    	const block = {
    		c: function create() {
    			main = element("main");
    			if (default_slot) default_slot.c();
    			attr_dev(main, "class", "svelte-1y39ejr");
    			add_location(main, file$2, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error_1$1("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);

    			if (default_slot) {
    				default_slot.m(main, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 1) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[0], dirty, null, null);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			if (default_slot) default_slot.d(detaching);
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
    	validate_slots("Error", slots, ['default']);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Error> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("$$scope" in $$props) $$invalidate(0, $$scope = $$props.$$scope);
    	};

    	return [$$scope, slots];
    }

    class Error$1 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Error",
    			options,
    			id: create_fragment$4.name
    		});
    	}
    }

    /* src\_layout\_main.svelte generated by Svelte v3.31.0 */

    const file$3 = "src\\_layout\\_main.svelte";

    function create_fragment$5(ctx) {
    	let main;
    	let current;
    	const default_slot_template = /*#slots*/ ctx[1].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[0], null);

    	const block = {
    		c: function create() {
    			main = element("main");
    			if (default_slot) default_slot.c();
    			attr_dev(main, "class", "svelte-vcw169");
    			add_location(main, file$3, 1, 0, 2);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);

    			if (default_slot) {
    				default_slot.m(main, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 1) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[0], dirty, null, null);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			if (default_slot) default_slot.d(detaching);
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

    function instance$5($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Main", slots, ['default']);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Main> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("$$scope" in $$props) $$invalidate(0, $$scope = $$props.$$scope);
    	};

    	return [$$scope, slots];
    }

    class Main extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Main",
    			options,
    			id: create_fragment$5.name
    		});
    	}
    }

    /* src\_layout\_documentation.svelte generated by Svelte v3.31.0 */
    const file$4 = "src\\_layout\\_documentation.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[7] = list[i];
    	return child_ctx;
    }

    // (43:6) {#each aside as item}
    function create_each_block(ctx) {
    	let li;
    	let a;
    	let t_value = /*item*/ ctx[7].label + "";
    	let t;
    	let a_href_value;
    	let li_data_name_value;

    	const block = {
    		c: function create() {
    			li = element("li");
    			a = element("a");
    			t = text(t_value);
    			attr_dev(a, "href", a_href_value = /*item*/ ctx[7].href);
    			attr_dev(a, "class", "svelte-1jfc4fi");
    			add_location(a, file$4, 43, 57, 1389);
    			attr_dev(li, "data-name", li_data_name_value = /*item*/ ctx[7].name);
    			attr_dev(li, "class", "svelte-1jfc4fi");
    			toggle_class(li, "inview", false);
    			add_location(li, file$4, 43, 8, 1340);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    			append_dev(li, a);
    			append_dev(a, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*aside*/ 1 && t_value !== (t_value = /*item*/ ctx[7].label + "")) set_data_dev(t, t_value);

    			if (dirty & /*aside*/ 1 && a_href_value !== (a_href_value = /*item*/ ctx[7].href)) {
    				attr_dev(a, "href", a_href_value);
    			}

    			if (dirty & /*aside*/ 1 && li_data_name_value !== (li_data_name_value = /*item*/ ctx[7].name)) {
    				attr_dev(li, "data-name", li_data_name_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(43:6) {#each aside as item}",
    		ctx
    	});

    	return block;
    }

    // (50:12) hej
    function fallback_block$1(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("hej");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: fallback_block$1.name,
    		type: "fallback",
    		source: "(50:12) hej",
    		ctx
    	});

    	return block;
    }

    function create_fragment$6(ctx) {
    	let main;
    	let aside_1;
    	let ul;
    	let t;
    	let section;
    	let article_1;
    	let current;
    	let each_value = /*aside*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const default_slot_template = /*#slots*/ ctx[4].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[3], null);
    	const default_slot_or_fallback = default_slot || fallback_block$1(ctx);

    	const block = {
    		c: function create() {
    			main = element("main");
    			aside_1 = element("aside");
    			ul = element("ul");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t = space();
    			section = element("section");
    			article_1 = element("article");
    			if (default_slot_or_fallback) default_slot_or_fallback.c();
    			attr_dev(ul, "id", "nav");
    			attr_dev(ul, "class", "svelte-1jfc4fi");
    			add_location(ul, file$4, 41, 4, 1272);
    			attr_dev(aside_1, "class", "svelte-1jfc4fi");
    			add_location(aside_1, file$4, 40, 2, 1259);
    			attr_dev(article_1, "class", "svelte-1jfc4fi");
    			add_location(article_1, file$4, 48, 4, 1489);
    			attr_dev(section, "class", "svelte-1jfc4fi");
    			add_location(section, file$4, 47, 2, 1474);
    			attr_dev(main, "class", "svelte-1jfc4fi");
    			add_location(main, file$4, 39, 0, 1249);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, aside_1);
    			append_dev(aside_1, ul);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(ul, null);
    			}

    			/*ul_binding*/ ctx[5](ul);
    			append_dev(main, t);
    			append_dev(main, section);
    			append_dev(section, article_1);

    			if (default_slot_or_fallback) {
    				default_slot_or_fallback.m(article_1, null);
    			}

    			/*article_1_binding*/ ctx[6](article_1);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*aside*/ 1) {
    				each_value = /*aside*/ ctx[0];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(ul, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 8) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[3], dirty, null, null);
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
    			if (detaching) detach_dev(main);
    			destroy_each(each_blocks, detaching);
    			/*ul_binding*/ ctx[5](null);
    			if (default_slot_or_fallback) default_slot_or_fallback.d(detaching);
    			/*article_1_binding*/ ctx[6](null);
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
    	validate_slots("Documentation", slots, ['default']);
    	let aside = [];
    	let article;
    	let nav;

    	onMount(async () => {
    		const anchors = Array.from(article.querySelectorAll("a[name][href]"));

    		$$invalidate(0, aside = anchors.map(node => {
    			return {
    				label: node.textContent,
    				href: node.getAttribute("href"),
    				name: node.name
    			};
    		}));

    		const sections = {};
    		const offset = 0;
    		const update = _ => anchors.forEach(e => sections[e.name] = e.offsetTop - window.innerHeight / 2 + offset);
    		window.addEventListener("resize", update);
    		update();

    		const scroll = e => {
    			var scrollPosition = document.documentElement.scrollTop || document.body.scrollTop;

    			for (let name in sections) {
    				if (sections[name] <= scrollPosition || sections[name] < 100) {
    					nav?.querySelectorAll("aside .inview")?.forEach(_ => _.classList.remove("inview"));
    					nav?.querySelector(`aside [data-name="${name}"]`)?.classList.add("inview");
    				}
    			}
    		};

    		window.addEventListener("scroll", scroll);
    		await tick();
    		scroll();

    		return () => {
    			window.removeEventListener("resize", update);
    			window.removeEventListener("scroll", scroll);
    		};
    	});

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Documentation> was created with unknown prop '${key}'`);
    	});

    	function ul_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			nav = $$value;
    			$$invalidate(2, nav);
    		});
    	}

    	function article_1_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			article = $$value;
    			$$invalidate(1, article);
    		});
    	}

    	$$self.$$set = $$props => {
    		if ("$$scope" in $$props) $$invalidate(3, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({ onMount, tick, aside, article, nav });

    	$$self.$inject_state = $$props => {
    		if ("aside" in $$props) $$invalidate(0, aside = $$props.aside);
    		if ("article" in $$props) $$invalidate(1, article = $$props.article);
    		if ("nav" in $$props) $$invalidate(2, nav = $$props.nav);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [aside, article, nav, $$scope, slots, ul_binding, article_1_binding];
    }

    class Documentation extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Documentation",
    			options,
    			id: create_fragment$6.name
    		});
    	}
    }

    /* src\pages\index.svelte generated by Svelte v3.31.0 */
    const file$5 = "src\\pages\\index.svelte";

    function create_fragment$7(ctx) {
    	let div3;
    	let h1;
    	let t1;
    	let section;
    	let div0;
    	let span0;
    	let svg0;
    	let path0;
    	let t2;
    	let h30;
    	let t4;
    	let p0;
    	let t6;
    	let button0;
    	let link_action;
    	let t8;
    	let div1;
    	let span1;
    	let svg1;
    	let path1;
    	let t9;
    	let h31;
    	let t11;
    	let p1;
    	let t12;
    	let strong;
    	let t14;
    	let t15;
    	let button1;
    	let link_action_1;
    	let t17;
    	let div2;
    	let span2;
    	let svg2;
    	let path2;
    	let t18;
    	let h32;
    	let t20;
    	let p2;
    	let t22;
    	let a0;
    	let button2;
    	let t24;
    	let p3;
    	let a1;
    	let svg3;
    	let path3;
    	let t25;
    	let span3;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div3 = element("div");
    			h1 = element("h1");
    			h1.textContent = "Welcome to svelte standalone router library";
    			t1 = space();
    			section = element("section");
    			div0 = element("div");
    			span0 = element("span");
    			svg0 = svg_element("svg");
    			path0 = svg_element("path");
    			t2 = space();
    			h30 = element("h3");
    			h30.textContent = "Read the documentation";
    			t4 = space();
    			p0 = element("p");
    			p0.textContent = "Learn the inner workings of the library on the documentation page.";
    			t6 = space();
    			button0 = element("button");
    			button0.textContent = "Documentation";
    			t8 = space();
    			div1 = element("div");
    			span1 = element("span");
    			svg1 = svg_element("svg");
    			path1 = svg_element("path");
    			t9 = space();
    			h31 = element("h3");
    			h31.textContent = "Usage in your projects";
    			t11 = space();
    			p1 = element("p");
    			t12 = text("Implementation guide on how to implement ");
    			strong = element("strong");
    			strong.textContent = "svelte standalone router";
    			t14 = text(" in your projects.");
    			t15 = space();
    			button1 = element("button");
    			button1.textContent = "Usage examples";
    			t17 = space();
    			div2 = element("div");
    			span2 = element("span");
    			svg2 = svg_element("svg");
    			path2 = svg_element("path");
    			t18 = space();
    			h32 = element("h3");
    			h32.textContent = "Support";
    			t20 = space();
    			p2 = element("p");
    			p2.textContent = "Do you like this project and feel it's beneficial to you and your work? A small coffee tip is always appreciated, but not required.";
    			t22 = space();
    			a0 = element("a");
    			button2 = element("button");
    			button2.textContent = "Tip on paypal";
    			t24 = space();
    			p3 = element("p");
    			a1 = element("a");
    			svg3 = svg_element("svg");
    			path3 = svg_element("path");
    			t25 = space();
    			span3 = element("span");
    			span3.textContent = "Jens Hjalmarsson";
    			attr_dev(h1, "class", "svelte-j6h5us");
    			add_location(h1, file$5, 5, 2, 94);
    			attr_dev(path0, "d", "M19 1l-5 5v11l5-4.5V1m2 4v13.5c-1.1-.35-2.3-.5-3.5-.5c-1.7 0-4.15.65-5.5 1.5V6c-1.45-1.1-3.55-1.5-5.5-1.5c-1.95 0-4.05.4-5.5 1.5v14.65c0 .25.25.5.5.5c.1 0 .15-.05.25-.05C3.1 20.45 5.05 20 6.5 20c1.95 0 4.05.4 5.5 1.5c1.35-.85 3.8-1.5 5.5-1.5c1.65 0 3.35.3 4.75 1.05c.1.05.15.05.25.05c.25 0 .5-.25.5-.5V6c-.6-.45-1.25-.75-2-1M10 18.41C8.75 18.09 7.5 18 6.5 18c-1.06 0-2.32.19-3.5.5V7.13c.91-.4 2.14-.63 3.5-.63c1.36 0 2.59.23 3.5.63v11.28z");
    			attr_dev(path0, "fill", "currentColor");
    			add_location(path0, file$5, 9, 177, 376);
    			attr_dev(svg0, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg0, "xmlns:xlink", "http://www.w3.org/1999/xlink");
    			attr_dev(svg0, "aria-hidden", "true");
    			attr_dev(svg0, "role", "img");
    			attr_dev(svg0, "preserveAspectRatio", "xMidYMid meet");
    			attr_dev(svg0, "viewBox", "0 0 24 24");
    			attr_dev(svg0, "class", "svelte-j6h5us");
    			add_location(svg0, file$5, 9, 8, 207);
    			attr_dev(span0, "class", "icon svelte-j6h5us");
    			add_location(span0, file$5, 8, 6, 178);
    			add_location(h30, file$5, 11, 6, 881);
    			add_location(p0, file$5, 12, 6, 920);
    			add_location(button0, file$5, 13, 6, 1001);
    			attr_dev(div0, "class", "svelte-j6h5us");
    			add_location(div0, file$5, 7, 4, 165);
    			attr_dev(path1, "d", "M3 3h18v18H3V3m4.73 15.04c.4.85 1.19 1.55 2.54 1.55c1.5 0 2.53-.8 2.53-2.55v-5.78h-1.7V17c0 .86-.35 1.08-.9 1.08c-.58 0-.82-.4-1.09-.87l-1.38.83m5.98-.18c.5.98 1.51 1.73 3.09 1.73c1.6 0 2.8-.83 2.8-2.36c0-1.41-.81-2.04-2.25-2.66l-.42-.18c-.73-.31-1.04-.52-1.04-1.02c0-.41.31-.73.81-.73c.48 0 .8.21 1.09.73l1.31-.87c-.55-.96-1.33-1.33-2.4-1.33c-1.51 0-2.48.96-2.48 2.23c0 1.38.81 2.03 2.03 2.55l.42.18c.78.34 1.24.55 1.24 1.13c0 .48-.45.83-1.15.83c-.83 0-1.31-.43-1.67-1.03l-1.38.8z");
    			attr_dev(path1, "fill", "currentColor");
    			add_location(path1, file$5, 18, 177, 1307);
    			attr_dev(svg1, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg1, "xmlns:xlink", "http://www.w3.org/1999/xlink");
    			attr_dev(svg1, "aria-hidden", "true");
    			attr_dev(svg1, "role", "img");
    			attr_dev(svg1, "preserveAspectRatio", "xMidYMid meet");
    			attr_dev(svg1, "viewBox", "0 0 24 24");
    			attr_dev(svg1, "class", "svelte-j6h5us");
    			add_location(svg1, file$5, 18, 8, 1138);
    			attr_dev(span1, "class", "icon svelte-j6h5us");
    			add_location(span1, file$5, 17, 6, 1109);
    			add_location(h31, file$5, 20, 6, 1855);
    			add_location(strong, file$5, 21, 50, 1938);
    			add_location(p1, file$5, 21, 6, 1894);
    			add_location(button1, file$5, 22, 6, 2009);
    			attr_dev(div1, "class", "svelte-j6h5us");
    			add_location(div1, file$5, 16, 4, 1096);
    			attr_dev(path2, "d", "M8.32 21.97a.546.546 0 0 1-.26-.32c-.03-.15-.06.11.6-4.09c.6-3.8.59-3.74.67-3.85c.13-.17.11-.17 1.61-.18c1.32-.03 1.6-.03 2.19-.12c3.25-.45 5.26-2.36 5.96-5.66c.04-.22.08-.41.09-.41c0-.01.07.04.15.1c1.03.78 1.38 2.22.99 4.14c-.46 2.29-1.68 3.81-3.58 4.46c-.81.28-1.49.39-2.69.42c-.8.04-.82.04-1.05.19c-.17.17-.16.14-.55 2.55c-.27 1.7-.37 2.25-.41 2.35c-.07.16-.21.3-.37.38l-.11.07H10c-1.29 0-1.62 0-1.68-.03m-4.5-2.23c-.19-.1-.32-.27-.32-.47C3.5 19 6.11 2.68 6.18 2.5c.09-.18.32-.37.5-.44L6.83 2h3.53c3.91 0 3.76 0 4.64.2c2.62.55 3.82 2.3 3.37 4.93c-.5 2.93-1.98 4.67-4.5 5.3c-.87.21-1.48.27-3.14.27c-1.31 0-1.41.01-1.67.15c-.26.15-.47.42-.56.75c-.04.07-.27 1.47-.53 3.1a241.3 241.3 0 0 0-.47 3.02l-.03.06H5.69c-1.58 0-1.8 0-1.87-.04z");
    			attr_dev(path2, "fill", "currentColor");
    			add_location(path2, file$5, 27, 206, 2337);
    			attr_dev(svg2, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg2, "xmlns:xlink", "http://www.w3.org/1999/xlink");
    			attr_dev(svg2, "aria-hidden", "true");
    			attr_dev(svg2, "role", "img");
    			attr_dev(svg2, "class", "iconify iconify--mdi svelte-j6h5us");
    			attr_dev(svg2, "preserveAspectRatio", "xMidYMid meet");
    			attr_dev(svg2, "viewBox", "0 0 24 24");
    			add_location(svg2, file$5, 27, 8, 2139);
    			attr_dev(span2, "class", "icon svelte-j6h5us");
    			add_location(span2, file$5, 26, 6, 2110);
    			add_location(h32, file$5, 29, 6, 3138);
    			add_location(p2, file$5, 30, 6, 3162);
    			add_location(button2, file$5, 31, 54, 3356);
    			attr_dev(a0, "href", "https://www.paypal.me/jenshjalmarsson");
    			add_location(a0, file$5, 31, 6, 3308);
    			attr_dev(div2, "class", "svelte-j6h5us");
    			add_location(div2, file$5, 25, 4, 2097);
    			attr_dev(section, "class", "svelte-j6h5us");
    			add_location(section, file$5, 6, 2, 150);
    			attr_dev(path3, "d", "M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z");
    			add_location(path3, file$5, 37, 89, 3584);
    			attr_dev(svg3, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg3, "width", "24");
    			attr_dev(svg3, "height", "24");
    			attr_dev(svg3, "viewBox", "0 0 24 24");
    			attr_dev(svg3, "class", "svelte-j6h5us");
    			add_location(svg3, file$5, 37, 6, 3501);
    			attr_dev(span3, "class", "svelte-j6h5us");
    			add_location(span3, file$5, 38, 6, 4323);
    			attr_dev(a1, "href", "https://github.com/hjalmar/");
    			attr_dev(a1, "class", "button github svelte-j6h5us");
    			add_location(a1, file$5, 36, 4, 3433);
    			add_location(p3, file$5, 35, 2, 3424);
    			attr_dev(div3, "id", "home");
    			attr_dev(div3, "class", "svelte-j6h5us");
    			add_location(div3, file$5, 4, 0, 75);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div3, anchor);
    			append_dev(div3, h1);
    			append_dev(div3, t1);
    			append_dev(div3, section);
    			append_dev(section, div0);
    			append_dev(div0, span0);
    			append_dev(span0, svg0);
    			append_dev(svg0, path0);
    			append_dev(div0, t2);
    			append_dev(div0, h30);
    			append_dev(div0, t4);
    			append_dev(div0, p0);
    			append_dev(div0, t6);
    			append_dev(div0, button0);
    			append_dev(section, t8);
    			append_dev(section, div1);
    			append_dev(div1, span1);
    			append_dev(span1, svg1);
    			append_dev(svg1, path1);
    			append_dev(div1, t9);
    			append_dev(div1, h31);
    			append_dev(div1, t11);
    			append_dev(div1, p1);
    			append_dev(p1, t12);
    			append_dev(p1, strong);
    			append_dev(p1, t14);
    			append_dev(div1, t15);
    			append_dev(div1, button1);
    			append_dev(section, t17);
    			append_dev(section, div2);
    			append_dev(div2, span2);
    			append_dev(span2, svg2);
    			append_dev(svg2, path2);
    			append_dev(div2, t18);
    			append_dev(div2, h32);
    			append_dev(div2, t20);
    			append_dev(div2, p2);
    			append_dev(div2, t22);
    			append_dev(div2, a0);
    			append_dev(a0, button2);
    			append_dev(div3, t24);
    			append_dev(div3, p3);
    			append_dev(p3, a1);
    			append_dev(a1, svg3);
    			append_dev(svg3, path3);
    			append_dev(a1, t25);
    			append_dev(a1, span3);

    			if (!mounted) {
    				dispose = [
    					action_destroyer(link_action = link.call(null, button0, { to: "/how-to/documentation" })),
    					action_destroyer(link_action_1 = link.call(null, button1, { to: "/how-to/usage" }))
    				];

    				mounted = true;
    			}
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div3);
    			mounted = false;
    			run_all(dispose);
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

    function instance$7($$self, $$props, $$invalidate) {
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
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Pages",
    			options,
    			id: create_fragment$7.name
    		});
    	}
    }

    /* ..\README.md generated by Svelte v3.31.0 */

    const file$6 = "..\\README.md";

    function create_fragment$8(ctx) {
    	let h1;
    	let t1;
    	let p0;
    	let t2;
    	let a0;
    	let t4;
    	let pre0;
    	let raw0_value = `<code class="language-js">npm i <span class="token operator">-</span><span class="token constant">D</span> svelte<span class="token operator">-</span>standalone<span class="token operator">-</span>router</code>` + "";
    	let t5;
    	let p1;
    	let t6;
    	let a1;
    	let t8;
    	let t9;
    	let hr0;
    	let t10;
    	let h20;
    	let a2;
    	let t12;
    	let p2;
    	let t14;
    	let pre1;
    	let raw1_value = `<code class="language-js"><span class="token keyword">import</span> RouterComponent<span class="token punctuation">,</span> <span class="token punctuation">&#123;</span> context<span class="token punctuation">,</span> decorator<span class="token punctuation">,</span> link<span class="token punctuation">,</span> navigate<span class="token punctuation">,</span> redirect<span class="token punctuation">,</span> replace<span class="token punctuation">,</span> alter<span class="token punctuation">,</span> location<span class="token punctuation">,</span> mount<span class="token punctuation">,</span> destroy Router<span class="token punctuation">,</span> Navigate<span class="token punctuation">,</span> Redirect<span class="token punctuation">,</span> Replace<span class="token punctuation">,</span> Alter <span class="token punctuation">&#125;</span> <span class="token keyword">from</span> <span class="token string">'svelte-standalone-router'</span><span class="token punctuation">;</span></code>` + "";
    	let t15;
    	let pre2;

    	let raw2_value = `<code class="language-null">svelte-standalone-router &#123;
  RouterComponent : svelte-component
  context : Function // creates a new router context
  decorator : Funcion // decorator creator 
  link : svelte-action // Action directive used on &#39;a&#39; tags.
  navigate(path : String, state : Object ) : // push to History 
  redirect(path : String, state : Object ) : // replace History
  replace(path : String, state : Object ) : // change url push To History 
  alter(path : String, state : Object ) : // replace url replace History
  location : svelte-store
  mount() : Function // add popstate listener (it has to have been destroyed before being able to be added again)
  destroy() : Function //destroy current listener for popstate event
  Router : class SvelteStandaloneRouter (inherited from standalone-router library) 
  Navigate : svelte-component // to navigate to a route
  Redirect : svelte-component // to redirect to a route
  Replace : svelte-component // to replace a route
  Alter : svelte-component // to alter a route
&#125;</code>` + "";

    	let t16;
    	let hr1;
    	let t17;
    	let h21;
    	let a3;
    	let t19;
    	let p3;
    	let t21;
    	let pre3;

    	let raw3_value = `<code class="language-js"><span class="token comment">// import context from library</span>
<span class="token keyword">import</span> <span class="token punctuation">&#123;</span> context <span class="token punctuation">&#125;</span> <span class="token keyword">from</span> <span class="token string">'svelte-standalone-router'</span><span class="token punctuation">;</span>

<span class="token comment">// main app context</span>
<span class="token keyword">const</span> app <span class="token operator">=</span> <span class="token function">context</span><span class="token punctuation">(</span><span class="token punctuation">&#123;</span>
  <span class="token comment">// optional initial route. Here we set it to be the current pathname of the url</span>
  initial<span class="token operator">:</span> location<span class="token punctuation">.</span>pathname
<span class="token punctuation">&#125;</span><span class="token punctuation">)</span><span class="token punctuation">;</span></code>` + "";

    	let t22;
    	let hr2;
    	let t23;
    	let h22;
    	let a4;
    	let t25;
    	let p4;
    	let t26;
    	let code0;
    	let t28;
    	let code1;
    	let t30;
    	let t31;
    	let p5;
    	let t33;
    	let pre4;

    	let raw4_value = `<code class="language-js">app<span class="token punctuation">.</span><span class="token function">get</span><span class="token punctuation">(</span><span class="token string">'/'</span><span class="token punctuation">,</span> <span class="token punctuation">(</span><span class="token parameter">req<span class="token punctuation">,</span> res</span><span class="token punctuation">)</span> <span class="token operator">=></span> <span class="token punctuation">&#123;</span>
  <span class="token comment">// code</span>
<span class="token punctuation">&#125;</span><span class="token punctuation">)</span><span class="token punctuation">;</span></code>` + "";

    	let t34;
    	let p6;
    	let t35;
    	let code2;
    	let t37;
    	let code3;
    	let t39;
    	let code4;
    	let t41;
    	let t42;
    	let p7;
    	let t44;
    	let pre5;

    	let raw5_value = `<code class="language-js">app<span class="token punctuation">.</span><span class="token function">get</span><span class="token punctuation">(</span><span class="token string">'/'</span><span class="token punctuation">,</span> <span class="token punctuation">(</span><span class="token parameter">req<span class="token punctuation">,</span> res</span><span class="token punctuation">)</span> <span class="token operator">=></span> <span class="token punctuation">&#123;</span>
  <span class="token comment">// to catch the props in a svelte component you simply do it like normal svelte props: </span>
  <span class="token comment">// export let myprop = 'default string'; // will become 'custom prop'</span>
  res<span class="token punctuation">.</span><span class="token function">send</span><span class="token punctuation">(</span>SvelteComponent<span class="token punctuation">,</span> <span class="token punctuation">&#123;</span> myprop<span class="token operator">:</span> <span class="token string">'custom prop'</span> <span class="token punctuation">&#125;</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
<span class="token punctuation">&#125;</span><span class="token punctuation">)</span></code>` + "";

    	let t45;
    	let p8;
    	let t46;
    	let code5;
    	let t48;
    	let code6;
    	let t50;
    	let t51;
    	let blockquote0;
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
    	let p12;
    	let code12;
    	let t71;
    	let t72;
    	let p13;
    	let t73;
    	let code13;
    	let t75;
    	let code14;
    	let t77;
    	let code15;
    	let t79;
    	let t80;
    	let pre8;

    	let raw8_value = `<code class="language-js">app<span class="token punctuation">.</span><span class="token function">get</span><span class="token punctuation">(</span><span class="token string">'/articles/:id/*'</span><span class="token punctuation">,</span> <span class="token punctuation">(</span><span class="token parameter">req<span class="token punctuation">,</span> res</span><span class="token punctuation">)</span> <span class="token operator">=></span> <span class="token punctuation">&#123;</span>
  res<span class="token punctuation">.</span><span class="token function">send</span><span class="token punctuation">(</span>SvelteComponent<span class="token punctuation">,</span> <span class="token punctuation">&#123;</span> <span class="token operator">...</span>req<span class="token punctuation">.</span>params <span class="token punctuation">&#125;</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
<span class="token punctuation">&#125;</span><span class="token punctuation">)</span><span class="token punctuation">;</span></code>` + "";

    	let t81;
    	let p14;
    	let t83;
    	let p15;
    	let t85;
    	let pre9;

    	let raw9_value = `<code class="language-js">app<span class="token punctuation">.</span><span class="token function">get</span><span class="token punctuation">(</span><span class="token punctuation">[</span><span class="token string">'/'</span><span class="token punctuation">,</span> <span class="token string">'home'</span><span class="token punctuation">,</span> <span class="token string">'index'</span><span class="token punctuation">]</span><span class="token punctuation">,</span> <span class="token punctuation">(</span><span class="token parameter">req<span class="token punctuation">,</span> res</span><span class="token punctuation">)</span> <span class="token operator">=></span> <span class="token punctuation">&#123;</span>
  res<span class="token punctuation">.</span><span class="token function">send</span><span class="token punctuation">(</span>SvelteComponent<span class="token punctuation">,</span> <span class="token punctuation">&#123;</span> <span class="token operator">...</span>req<span class="token punctuation">.</span>params <span class="token punctuation">&#125;</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
<span class="token punctuation">&#125;</span><span class="token punctuation">)</span><span class="token punctuation">;</span></code>` + "";

    	let t86;
    	let p16;
    	let t87;
    	let code16;
    	let t89;
    	let code17;
    	let t91;
    	let code18;
    	let t93;
    	let t94;
    	let pre10;

    	let raw10_value = `<code class="language-js">app<span class="token punctuation">.</span><span class="token function">get</span><span class="token punctuation">(</span><span class="token string">'/pages'</span><span class="token punctuation">,</span> <span class="token punctuation">(</span><span class="token parameter">req<span class="token punctuation">,</span> res</span><span class="token punctuation">)</span> <span class="token operator">=></span> <span class="token punctuation">&#123;</span>
  res<span class="token punctuation">.</span><span class="token function">send</span><span class="token punctuation">(</span>SvelteComponent<span class="token punctuation">,</span> <span class="token punctuation">&#123;</span> <span class="token operator">...</span>req<span class="token punctuation">.</span>params <span class="token punctuation">&#125;</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
<span class="token punctuation">&#125;</span><span class="token punctuation">)</span>
<span class="token punctuation">.</span><span class="token function">get</span><span class="token punctuation">(</span><span class="token string">'about'</span><span class="token punctuation">,</span> <span class="token punctuation">(</span><span class="token parameter">req<span class="token punctuation">,</span> res</span><span class="token punctuation">)</span> <span class="token operator">=></span> <span class="token punctuation">&#123;</span> <span class="token comment">/* do something */</span> <span class="token punctuation">&#125;</span><span class="token punctuation">)</span>
<span class="token punctuation">.</span><span class="token function">get</span><span class="token punctuation">(</span><span class="token string">'contact'</span><span class="token punctuation">,</span> <span class="token punctuation">(</span><span class="token parameter">req<span class="token punctuation">,</span> res</span><span class="token punctuation">)</span> <span class="token operator">=></span> <span class="token punctuation">&#123;</span> <span class="token comment">/* do something */</span> <span class="token punctuation">&#125;</span><span class="token punctuation">)</span><span class="token punctuation">;</span></code>` + "";

    	let t95;
    	let p17;
    	let t96;
    	let code19;
    	let t98;
    	let t99;
    	let pre11;

    	let raw11_value = `<code class="language-js">app<span class="token punctuation">.</span><span class="token function">get</span><span class="token punctuation">(</span><span class="token punctuation">(</span><span class="token parameter">req<span class="token punctuation">,</span> res</span><span class="token punctuation">)</span> <span class="token operator">=></span> <span class="token punctuation">&#123;</span>
  res<span class="token punctuation">.</span><span class="token function">send</span><span class="token punctuation">(</span>SvelteComponent<span class="token punctuation">)</span><span class="token punctuation">;</span>
<span class="token punctuation">&#125;</span><span class="token punctuation">)</span><span class="token punctuation">;</span></code>` + "";

    	let t100;
    	let hr3;
    	let t101;
    	let h23;
    	let a5;
    	let t103;
    	let p18;
    	let t105;
    	let pre12;

    	let raw12_value = `<code class="language-js"><span class="token comment">// first we need to import the decorator helper function</span>
<span class="token keyword">import</span> <span class="token punctuation">&#123;</span> decorator <span class="token punctuation">&#125;</span> <span class="token keyword">from</span> <span class="token string">'svelte-standalone-router'</span><span class="token punctuation">;</span>
<span class="token comment">// creating a general layout wrapper</span>
<span class="token keyword">const</span> layout <span class="token operator">=</span> <span class="token function">decorator</span><span class="token punctuation">(</span>_layout<span class="token punctuation">)</span><span class="token punctuation">;</span>
<span class="token comment">// we can now use that decorator to create our routes</span>
<span class="token function">layout</span><span class="token punctuation">(</span><span class="token string">'/'</span><span class="token punctuation">,</span> <span class="token punctuation">(</span><span class="token parameter">req<span class="token punctuation">,</span> res</span><span class="token punctuation">)</span> <span class="token operator">=></span> res<span class="token punctuation">.</span><span class="token function">send</span><span class="token punctuation">(</span>Index<span class="token punctuation">)</span><span class="token punctuation">)</span><span class="token punctuation">;</span></code>` + "";

    	let t106;
    	let p19;
    	let t108;
    	let pre13;

    	let raw13_value = `<code class="language-js"><span class="token function">layout</span><span class="token punctuation">(</span><span class="token string">'/'</span><span class="token punctuation">,</span> <span class="token punctuation">(</span><span class="token parameter">req<span class="token punctuation">,</span> res<span class="token punctuation">,</span> props</span><span class="token punctuation">)</span> <span class="token operator">=></span> <span class="token punctuation">&#123;</span>
  <span class="token comment">// define props on the decorator. this has to be defined before </span>
  <span class="token comment">// responding with send and a component gets send to be rendered.</span>
  <span class="token function">props</span><span class="token punctuation">(</span><span class="token punctuation">&#123;</span>
    props<span class="token operator">:</span> <span class="token string">'prop defined on the decorator component'</span>
  <span class="token punctuation">&#125;</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token comment">// send our component to be rendered</span>
  res<span class="token punctuation">.</span><span class="token function">send</span><span class="token punctuation">(</span>Index<span class="token punctuation">,</span> <span class="token punctuation">&#123;</span> props<span class="token operator">:</span> <span class="token string">'props on the inner component'</span> <span class="token punctuation">&#125;</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
<span class="token punctuation">&#125;</span><span class="token punctuation">)</span><span class="token punctuation">;</span></code>` + "";

    	let t109;
    	let p20;
    	let t110;
    	let code20;
    	let t112;
    	let t113;
    	let p21;
    	let t115;
    	let pre14;

    	let raw14_value = `<code class="language-js"><span class="token comment">// the first argument needs to be a context if not wanting to default back to the first one defined</span>
<span class="token comment">// otherwise the first argument is the decorator component. and lastly all the rest arguments are</span>
<span class="token comment">// middlewares executed for every route under this decorator</span>
<span class="token keyword">const</span> layout <span class="token operator">=</span> <span class="token function">decorator</span><span class="token punctuation">(</span>app<span class="token punctuation">,</span> _layout<span class="token punctuation">,</span> loggerMiddleware<span class="token punctuation">,</span> hasAuthMiddleware<span class="token punctuation">,</span> <span class="token operator">...</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
<span class="token comment">// without the first argument being the context</span>
<span class="token keyword">const</span> layout <span class="token operator">=</span> <span class="token function">decorator</span><span class="token punctuation">(</span>_layout<span class="token punctuation">,</span> loggerMiddleware<span class="token punctuation">)</span><span class="token punctuation">;</span>
<span class="token comment">// without middlewares</span>
<span class="token keyword">const</span> layout <span class="token operator">=</span> <span class="token function">decorator</span><span class="token punctuation">(</span>_layout<span class="token punctuation">)</span><span class="token punctuation">;</span></code>` + "";

    	let t116;
    	let p22;
    	let t118;
    	let pre15;

    	let raw15_value = `<code class="language-js"><span class="token comment">// apply inline middlewares</span>
<span class="token function">layout</span><span class="token punctuation">(</span><span class="token string">'/user'</span><span class="token punctuation">,</span> hasAuth<span class="token punctuation">,</span> log<span class="token punctuation">,</span> <span class="token punctuation">(</span><span class="token parameter">req<span class="token punctuation">,</span> res</span><span class="token punctuation">)</span> <span class="token operator">=></span> res<span class="token punctuation">.</span><span class="token function">send</span><span class="token punctuation">(</span>Index<span class="token punctuation">)</span><span class="token punctuation">)</span><span class="token punctuation">;</span></code>` + "";

    	let t119;
    	let p23;
    	let t121;
    	let pre16;

    	let raw16_value = `<code class="language-js"><span class="token keyword">const</span> user <span class="token operator">=</span> <span class="token function">layout</span><span class="token punctuation">(</span><span class="token string">'/user'</span><span class="token punctuation">,</span> hasAuth<span class="token punctuation">,</span> log<span class="token punctuation">,</span> <span class="token punctuation">(</span><span class="token parameter">req<span class="token punctuation">,</span> res</span><span class="token punctuation">)</span> <span class="token operator">=></span> res<span class="token punctuation">.</span><span class="token function">send</span><span class="token punctuation">(</span>Index<span class="token punctuation">)</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
<span class="token comment">// becomes '/user/profile' that is decorated with the '_layout' component</span>
user<span class="token punctuation">.</span><span class="token function">get</span><span class="token punctuation">(</span><span class="token string">'/profile'</span><span class="token punctuation">,</span> <span class="token operator">...</span><span class="token punctuation">)</span>
<span class="token comment">// '/user/settings'</span>
user<span class="token punctuation">.</span><span class="token function">get</span><span class="token punctuation">(</span><span class="token string">'/settings'</span><span class="token punctuation">,</span> <span class="token operator">...</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
</code>` + "";

    	let t122;
    	let blockquote2;
    	let p24;
    	let t123;
    	let code21;
    	let t125;
    	let code22;
    	let t127;
    	let code23;
    	let t129;
    	let t130;
    	let hr4;
    	let t131;
    	let h24;
    	let a6;
    	let t133;
    	let p25;
    	let t135;
    	let pre17;

    	let raw17_value = `<code class="language-js">Request<span class="token punctuation">&#123;</span>
  base <span class="token operator">:</span> String <span class="token comment">// current base</span>
  params <span class="token operator">:</span> Object <span class="token comment">// params from the request</span>
  path <span class="token operator">:</span> String <span class="token comment">// current pathname</span>
  route <span class="token operator">:</span> String <span class="token comment">// what route that got triggered, for instance: "/route/:param"</span>
  <span class="token comment">// defined with the use:link action or with the navigate or redirect helper functions</span>
  state <span class="token operator">:</span> Object <span class="token comment">// the state object. unlike the get params that is the arguments attached to the route/pathname, this is the custom data you sent along with the request</span>
  query <span class="token operator">:</span> Object <span class="token comment">// query parameters for the request. i.e ?query=search&amp;parameters=search string. Same keys will group values as an Array.</span>
<span class="token punctuation">&#125;</span></code>` + "";

    	let t136;
    	let hr5;
    	let t137;
    	let h25;
    	let a7;
    	let t139;
    	let p26;
    	let t141;
    	let pre18;

    	let raw18_value = `<code class="language-js">Response<span class="token punctuation">&#123;</span>
  send <span class="token operator">:</span> <span class="token function">Function</span><span class="token punctuation">(</span>Component <span class="token operator">:</span> svelte<span class="token operator">-</span>component<span class="token punctuation">,</span> props <span class="token operator">:</span> Object<span class="token punctuation">)</span>
  error <span class="token operator">:</span> <span class="token function">Function</span><span class="token punctuation">(</span>props <span class="token operator">:</span> Object<span class="token punctuation">)</span>
<span class="token punctuation">&#125;</span></code>` + "";

    	let t142;
    	let hr6;
    	let t143;
    	let h26;
    	let a8;
    	let t145;
    	let p27;
    	let t146;
    	let code24;
    	let t148;
    	let code25;
    	let t150;
    	let t151;
    	let p28;
    	let t152;
    	let code26;
    	let t154;
    	let code27;
    	let t156;
    	let t157;
    	let pre19;

    	let raw19_value = `<code class="language-js"><span class="token keyword">const</span> app <span class="token operator">=</span> <span class="token function">context</span><span class="token punctuation">(</span><span class="token punctuation">&#123;</span>
  initial<span class="token operator">:</span> location<span class="token punctuation">.</span>pathname<span class="token punctuation">,</span>
  base<span class="token operator">:</span> <span class="token string">'/project'</span>
<span class="token punctuation">&#125;</span><span class="token punctuation">)</span><span class="token punctuation">;</span></code>` + "";

    	let t158;
    	let p29;
    	let t159;
    	let code28;
    	let t161;
    	let code29;
    	let t163;
    	let t164;
    	let p30;
    	let t165;
    	let code30;
    	let t167;
    	let code31;
    	let t169;
    	let code32;
    	let t171;
    	let code33;
    	let t173;
    	let t174;
    	let pre20;
    	let raw20_value = `<code class="language-js">Router<span class="token punctuation">.</span>linkBase <span class="token operator">=</span> <span class="token string">'/project'</span><span class="token punctuation">;</span></code>` + "";
    	let t175;
    	let p31;
    	let t177;
    	let pre21;

    	let raw21_value = `<code class="language-js"><span class="token keyword">const</span> app <span class="token operator">=</span> <span class="token function">context</span><span class="token punctuation">(</span><span class="token punctuation">&#123;</span>
  initial<span class="token operator">:</span> location<span class="token punctuation">.</span>pathname<span class="token punctuation">,</span>
  base<span class="token operator">:</span> Router<span class="token punctuation">.</span>linkBase <span class="token operator">=</span> <span class="token string">'/project'</span><span class="token punctuation">;</span>
<span class="token punctuation">&#125;</span><span class="token punctuation">)</span><span class="token punctuation">;</span></code>` + "";

    	let t178;
    	let p32;
    	let t180;
    	let p33;
    	let t182;
    	let pre22;

    	let raw22_value = `<code class="language-js"><span class="token comment">// get the href attribute from &lt;Base> element.</span>
<span class="token comment">// we use getAttribute('href') so we don't get the absolute url</span>
Router<span class="token punctuation">.</span>linkBase <span class="token operator">=</span> document<span class="token punctuation">.</span><span class="token function">querySelector</span><span class="token punctuation">(</span><span class="token string">'base'</span><span class="token punctuation">)</span><span class="token punctuation">.</span><span class="token function">getAttribute</span><span class="token punctuation">(</span><span class="token string">'href'</span><span class="token punctuation">)</span><span class="token punctuation">;</span> 

<span class="token comment">// add the linkBase as base to the context</span>
<span class="token keyword">const</span> app <span class="token operator">=</span> <span class="token function">context</span><span class="token punctuation">(</span><span class="token punctuation">&#123;</span>
  initial<span class="token operator">:</span> location<span class="token punctuation">.</span>pathname<span class="token punctuation">,</span>
  base<span class="token operator">:</span> Router<span class="token punctuation">.</span>linkBase
<span class="token punctuation">&#125;</span><span class="token punctuation">)</span><span class="token punctuation">;</span></code>` + "";

    	let t183;
    	let hr7;
    	let t184;
    	let h27;
    	let a9;
    	let t186;
    	let p34;
    	let t188;
    	let p35;
    	let t190;
    	let pre23;
    	let raw23_value = `<code class="language-js">Router<span class="token punctuation">.</span>scrollReset <span class="token operator">=</span> <span class="token boolean">false</span><span class="token punctuation">;</span></code>` + "";
    	let t191;
    	let p36;
    	let t192;
    	let code34;
    	let t194;
    	let t195;
    	let pre24;
    	let raw24_value = `<code class="language-js">Router<span class="token punctuation">.</span><span class="token function">setScrollReset</span><span class="token punctuation">(</span><span class="token boolean">false</span><span class="token punctuation">)</span><span class="token punctuation">;</span></code>` + "";
    	let t196;
    	let hr8;
    	let t197;
    	let h28;
    	let a10;
    	let t199;
    	let p37;
    	let t200;
    	let code35;
    	let t202;
    	let code36;
    	let t204;
    	let t205;
    	let pre25;
    	let raw25_value = `<code class="language-js">Router<span class="token punctuation">.</span>scrollOffset <span class="token operator">=</span> <span class="token number">100</span><span class="token punctuation">;</span></code>` + "";
    	let t206;
    	let p38;
    	let t207;
    	let code37;
    	let t209;
    	let t210;
    	let pre26;
    	let raw26_value = `<code class="language-js">Router<span class="token punctuation">.</span><span class="token function">setScrollOffset</span><span class="token punctuation">(</span><span class="token number">100</span><span class="token punctuation">)</span><span class="token punctuation">;</span></code>` + "";
    	let t211;
    	let hr9;
    	let t212;
    	let h29;
    	let a11;
    	let t214;
    	let p39;
    	let t215;
    	let code38;
    	let t217;
    	let t218;
    	let pre27;

    	let raw27_value = `<code class="language-js"><span class="token comment">// add custom state on the initial request</span>
<span class="token keyword">const</span> app <span class="token operator">=</span> <span class="token function">context</span><span class="token punctuation">(</span><span class="token punctuation">&#123;</span>
  initial<span class="token operator">:</span> location<span class="token punctuation">.</span>pathname<span class="token punctuation">,</span>
  state<span class="token operator">:</span> <span class="token punctuation">&#123;</span> custom<span class="token operator">:</span> <span class="token string">'initial state'</span> <span class="token punctuation">&#125;</span>
<span class="token punctuation">&#125;</span><span class="token punctuation">)</span><span class="token punctuation">;</span></code>` + "";

    	let t219;
    	let hr10;
    	let t220;
    	let h210;
    	let a12;
    	let t222;
    	let blockquote3;
    	let p40;
    	let t224;
    	let p41;
    	let t225;
    	let code39;
    	let t227;
    	let code40;
    	let t229;
    	let t230;
    	let pre28;

    	let raw28_value = `<code class="language-js"><span class="token comment">// catch all errors with the shorthand syntax.</span>
app<span class="token punctuation">.</span><span class="token function">catch</span><span class="token punctuation">(</span><span class="token punctuation">(</span>req<span class="token punctuation">,</span> res<span class="token punctuation">,</span> props<span class="token punctuation">)</span><span class="token punctuation">)</span><span class="token punctuation">&#123;</span>
  res<span class="token punctuation">.</span><span class="token function">send</span><span class="token punctuation">(</span>ErrorComponent<span class="token punctuation">)</span><span class="token punctuation">;</span>
<span class="token punctuation">&#125;</span></code>` + "";

    	let t231;
    	let p42;
    	let t232;
    	let code41;
    	let t234;
    	let t235;
    	let pre29;

    	let raw29_value = `<code class="language-js">app<span class="token punctuation">.</span><span class="token function">get</span><span class="token punctuation">(</span><span class="token string">'/'</span><span class="token punctuation">,</span> <span class="token punctuation">(</span>req<span class="token punctuation">,</span> res<span class="token punctuation">)</span><span class="token punctuation">)</span><span class="token punctuation">&#123;</span>
  <span class="token keyword">if</span><span class="token punctuation">(</span>expression <span class="token operator">!=</span> <span class="token boolean">true</span><span class="token punctuation">)</span><span class="token punctuation">&#123;</span>
    res<span class="token punctuation">.</span><span class="token function">error</span><span class="token punctuation">(</span><span class="token punctuation">&#123;</span> custom<span class="token operator">:</span> <span class="token string">'props'</span> <span class="token punctuation">&#125;</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token keyword">return</span><span class="token punctuation">;</span>
  <span class="token punctuation">&#125;</span>
  res<span class="token punctuation">.</span><span class="token function">send</span><span class="token punctuation">(</span>ErrorComponent<span class="token punctuation">)</span><span class="token punctuation">;</span>
<span class="token punctuation">&#125;</span></code>` + "";

    	let t236;
    	let hr11;
    	let t237;
    	let h211;
    	let a13;
    	let t239;
    	let p43;
    	let t240;
    	let code42;
    	let t242;
    	let t243;
    	let p44;
    	let t244;
    	let code43;
    	let t246;
    	let t247;
    	let pre30;

    	let raw30_value = `<code class="language-js"><span class="token comment">// logger</span>
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

    	let t248;
    	let p45;
    	let t249;
    	let code44;
    	let t251;
    	let t252;
    	let pre31;

    	let raw31_value = `<code class="language-js"><span class="token comment">// a hasAuth middleware</span>
<span class="token keyword">const</span> <span class="token function-variable function">hasAuth</span> <span class="token operator">=</span> <span class="token punctuation">(</span><span class="token parameter">req<span class="token punctuation">,</span> res<span class="token punctuation">,</span> next</span><span class="token punctuation">)</span> <span class="token operator">=></span> <span class="token punctuation">&#123;</span>
  <span class="token keyword">if</span><span class="token punctuation">(</span>auth<span class="token punctuation">)</span><span class="token punctuation">&#123;</span>
    <span class="token keyword">return</span> <span class="token function">next</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">&#125;</span>
  res<span class="token punctuation">.</span><span class="token function">error</span><span class="token punctuation">(</span><span class="token punctuation">&#123;</span> message<span class="token operator">:</span> <span class="token string">'Unauthorized'</span> <span class="token punctuation">&#125;</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
<span class="token punctuation">&#125;</span>

<span class="token comment">// applying the middleware to a route</span>
app<span class="token punctuation">.</span><span class="token function">get</span><span class="token punctuation">(</span><span class="token string">'/user'</span><span class="token punctuation">,</span> hasAuth<span class="token punctuation">,</span> <span class="token punctuation">(</span><span class="token parameter">req<span class="token punctuation">,</span> res</span><span class="token punctuation">)</span> <span class="token operator">=></span> <span class="token punctuation">&#123;</span>
  res<span class="token punctuation">.</span><span class="token function">send</span><span class="token punctuation">(</span>Component<span class="token punctuation">)</span>
<span class="token punctuation">&#125;</span><span class="token punctuation">)</span><span class="token punctuation">;</span></code>` + "";

    	let t253;
    	let hr12;
    	let t254;
    	let h212;
    	let a14;
    	let t256;
    	let p46;
    	let t257;
    	let code45;
    	let t259;
    	let code46;
    	let t261;
    	let code47;
    	let t263;
    	let code48;
    	let t265;
    	let t266;
    	let pre32;

    	let raw32_value = `<code class="language-svelte"><span class="token tag"><span class="token tag"><span class="token punctuation">&lt;</span>script</span><span class="token punctuation">></span></span><span class="token script"><span class="token language-javascript">
  <span class="token keyword">import</span> RouterComponent <span class="token keyword">from</span> <span class="token string">'svelte-standalone-router'</span><span class="token punctuation">;</span>
</span></span><span class="token tag"><span class="token tag"><span class="token punctuation">&lt;/</span>script</span><span class="token punctuation">></span></span>

<span class="token tag"><span class="token tag"><span class="token punctuation">&lt;</span>RouterComponent</span> <span class="token punctuation">/></span></span></code>` + "";

    	let t267;
    	let p47;
    	let t268;
    	let code49;
    	let t270;
    	let t271;
    	let blockquote4;
    	let p48;
    	let t272;
    	let code50;
    	let t274;
    	let code51;
    	let t276;
    	let code52;
    	let t278;
    	let t279;
    	let pre33;

    	let raw33_value = `<code class="language-svelte"><span class="token tag"><span class="token tag"><span class="token punctuation">&lt;</span>script</span><span class="token punctuation">></span></span><span class="token script"><span class="token language-javascript">
  <span class="token keyword">import</span> RouterComponent <span class="token keyword">from</span> <span class="token string">'svelte-standalone-router'</span><span class="token punctuation">;</span>
</span></span><span class="token tag"><span class="token tag"><span class="token punctuation">&lt;/</span>script</span><span class="token punctuation">></span></span>

<span class="token tag"><span class="token tag"><span class="token punctuation">&lt;</span>RouterComponent</span> <span class="token attr-name"><span class="token namespace">let:</span>decorator</span> <span class="token attr-name"><span class="token namespace">let:</span>decoratorProps</span> <span class="token attr-name"><span class="token namespace">let:</span>component</span> <span class="token attr-name"><span class="token namespace">let:</span>props</span><span class="token punctuation">></span></span>
  <span class="token language-javascript"><span class="token punctuation">&#123;</span>#key component<span class="token punctuation">&#125;</span></span>
    <span class="token language-javascript"><span class="token punctuation">&#123;</span>#<span class="token keyword">if</span> decorator<span class="token punctuation">&#125;</span></span>
      <span class="token tag"><span class="token tag"><span class="token punctuation">&lt;</span><span class="token namespace">svelte:</span>component</span> <span class="token attr-name">this=</span><span class="token language-javascript"><span class="token punctuation">&#123;</span>decorator<span class="token punctuation">&#125;</span></span> <span class="token language-javascript"><span class="token punctuation">&#123;</span><span class="token operator">...</span>decoratorProps<span class="token punctuation">&#125;</span></span><span class="token punctuation">></span></span>
        <span class="token tag"><span class="token tag"><span class="token punctuation">&lt;</span>div</span> <span class="token attr-name"><span class="token namespace">in:</span>fade</span><span class="token punctuation">></span></span><span class="token tag"><span class="token tag"><span class="token punctuation">&lt;</span><span class="token namespace">svelte:</span>component</span> <span class="token attr-name">this=</span><span class="token language-javascript"><span class="token punctuation">&#123;</span>component<span class="token punctuation">&#125;</span></span> <span class="token language-javascript"><span class="token punctuation">&#123;</span><span class="token operator">...</span>props<span class="token punctuation">&#125;</span></span> <span class="token punctuation">/></span></span><span class="token tag"><span class="token tag"><span class="token punctuation">&lt;/</span>div</span><span class="token punctuation">></span></span>
      <span class="token tag"><span class="token tag"><span class="token punctuation">&lt;/</span><span class="token namespace">svelte:</span>component</span><span class="token punctuation">></span></span>
    <span class="token language-javascript"><span class="token punctuation">&#123;</span><span class="token operator">:</span><span class="token keyword">else</span><span class="token punctuation">&#125;</span></span>
      <span class="token tag"><span class="token tag"><span class="token punctuation">&lt;</span>div</span> <span class="token attr-name"><span class="token namespace">in:</span>fade</span><span class="token punctuation">></span></span><span class="token tag"><span class="token tag"><span class="token punctuation">&lt;</span><span class="token namespace">svelte:</span>component</span> <span class="token attr-name">this=</span><span class="token language-javascript"><span class="token punctuation">&#123;</span>component<span class="token punctuation">&#125;</span></span> <span class="token language-javascript"><span class="token punctuation">&#123;</span><span class="token operator">...</span>props<span class="token punctuation">&#125;</span></span> <span class="token punctuation">/></span></span><span class="token tag"><span class="token tag"><span class="token punctuation">&lt;/</span>div</span><span class="token punctuation">></span></span>
    <span class="token language-javascript"><span class="token punctuation">&#123;</span><span class="token operator">/</span><span class="token keyword">if</span><span class="token punctuation">&#125;</span></span>
  <span class="token language-javascript"><span class="token punctuation">&#123;</span><span class="token operator">/</span>key<span class="token punctuation">&#125;</span></span>
<span class="token tag"><span class="token tag"><span class="token punctuation">&lt;/</span>RouterComponent</span><span class="token punctuation">></span></span></code>` + "";

    	let t280;
    	let hr13;
    	let t281;
    	let h213;
    	let a15;
    	let t283;
    	let p49;
    	let t284;
    	let code53;
    	let t286;
    	let t287;
    	let p50;
    	let t288;
    	let code54;
    	let t290;
    	let code55;
    	let t292;
    	let code56;
    	let t294;
    	let code57;
    	let t296;
    	let p51;
    	let t297;
    	let code58;
    	let t299;
    	let code59;
    	let t301;
    	let code60;
    	let t303;
    	let code61;
    	let t305;
    	let t306;
    	let p52;
    	let t307;
    	let code62;
    	let t309;
    	let code63;
    	let t311;
    	let t312;
    	let pre34;

    	let raw34_value = `<code class="language-svelte"><span class="token tag"><span class="token tag"><span class="token punctuation">&lt;</span>script</span><span class="token punctuation">></span></span><span class="token script"><span class="token language-javascript">
  <span class="token keyword">import</span> <span class="token punctuation">&#123;</span> link <span class="token punctuation">&#125;</span> <span class="token keyword">from</span> <span class="token string">'svelte-standalone-router'</span><span class="token punctuation">;</span>
</span></span><span class="token tag"><span class="token tag"><span class="token punctuation">&lt;/</span>script</span><span class="token punctuation">></span></span>
<span class="token tag"><span class="token tag"><span class="token punctuation">&lt;</span>a</span> <span class="token attr-name">href</span><span class="token attr-value"><span class="token punctuation">=</span><span class="token punctuation">"</span>/about<span class="token punctuation">"</span></span> <span class="token attr-name"><span class="token namespace">use:</span>link</span><span class="token punctuation">></span></span>about<span class="token tag"><span class="token tag"><span class="token punctuation">&lt;/</span>a</span><span class="token punctuation">></span></span></code>` + "";

    	let t313;
    	let p53;
    	let t314;
    	let code64;
    	let t316;
    	let t317;
    	let pre35;

    	let raw35_value = `<code class="language-svelte"><span class="token tag"><span class="token tag"><span class="token punctuation">&lt;</span>script</span><span class="token punctuation">></span></span><span class="token script"><span class="token language-javascript">
  <span class="token keyword">import</span> <span class="token punctuation">&#123;</span> link <span class="token punctuation">&#125;</span> <span class="token keyword">from</span> <span class="token string">'svelte-standalone-router'</span><span class="token punctuation">;</span>
</span></span><span class="token tag"><span class="token tag"><span class="token punctuation">&lt;/</span>script</span><span class="token punctuation">></span></span>
<span class="token tag"><span class="token tag"><span class="token punctuation">&lt;</span>a</span> <span class="token attr-name">href</span><span class="token attr-value"><span class="token punctuation">=</span><span class="token punctuation">"</span>/about<span class="token punctuation">"</span></span> <span class="token attr-name"><span class="token namespace">use:</span>link=</span><span class="token language-javascript"><span class="token punctuation">&#123;</span><span class="token punctuation">&#123;</span>to<span class="token operator">:</span> <span class="token string">'/contact'</span><span class="token punctuation">&#125;</span><span class="token punctuation">&#125;</span></span><span class="token punctuation">></span></span>about<span class="token tag"><span class="token tag"><span class="token punctuation">&lt;/</span>a</span><span class="token punctuation">></span></span></code>` + "";

    	let t318;
    	let p54;
    	let t320;
    	let pre36;

    	let raw36_value = `<code class="language-svelte"><span class="token tag"><span class="token tag"><span class="token punctuation">&lt;</span>script</span><span class="token punctuation">></span></span><span class="token script"><span class="token language-javascript">
  <span class="token keyword">import</span> <span class="token punctuation">&#123;</span> link<span class="token punctuation">,</span> navigate <span class="token punctuation">&#125;</span> <span class="token keyword">from</span> <span class="token string">'svelte-standalone-router'</span><span class="token punctuation">;</span>
</span></span><span class="token tag"><span class="token tag"><span class="token punctuation">&lt;/</span>script</span><span class="token punctuation">></span></span>

<span class="token tag"><span class="token tag"><span class="token punctuation">&lt;</span>button</span> <span class="token attr-name">href</span><span class="token attr-value"><span class="token punctuation">=</span><span class="token punctuation">"</span>/about<span class="token punctuation">"</span></span> <span class="token attr-name"><span class="token namespace">use:</span>link</span><span class="token punctuation">></span></span>about<span class="token tag"><span class="token tag"><span class="token punctuation">&lt;/</span>button</span><span class="token punctuation">></span></span>
<span class="token tag"><span class="token tag"><span class="token punctuation">&lt;</span>button</span> <span class="token attr-name">data-href</span><span class="token attr-value"><span class="token punctuation">=</span><span class="token punctuation">"</span>/about<span class="token punctuation">"</span></span> <span class="token attr-name"><span class="token namespace">use:</span>link</span><span class="token punctuation">></span></span>about<span class="token tag"><span class="token tag"><span class="token punctuation">&lt;/</span>button</span><span class="token punctuation">></span></span>
<span class="token tag"><span class="token tag"><span class="token punctuation">&lt;</span>button</span> <span class="token attr-name"><span class="token namespace">use:</span>link=</span><span class="token language-javascript"><span class="token punctuation">&#123;</span><span class="token punctuation">&#123;</span>to<span class="token operator">:</span> <span class="token string">'/about'</span><span class="token punctuation">&#125;</span><span class="token punctuation">&#125;</span></span><span class="token punctuation">></span></span>about<span class="token tag"><span class="token tag"><span class="token punctuation">&lt;/</span>button</span><span class="token punctuation">></span></span>
<span class="token tag"><span class="token tag"><span class="token punctuation">&lt;</span>button</span> <span class="token attr-name"><span class="token namespace">on:</span>click=</span><span class="token language-javascript"><span class="token punctuation">&#123;</span><span class="token parameter">_</span> <span class="token operator">=></span> <span class="token function">navigate</span><span class="token punctuation">(</span><span class="token string">'/about'</span><span class="token punctuation">)</span><span class="token punctuation">&#125;</span></span><span class="token punctuation">></span></span>about<span class="token tag"><span class="token tag"><span class="token punctuation">&lt;/</span>button</span><span class="token punctuation">></span></span></code>` + "";

    	let t321;
    	let p55;
    	let t322;
    	let code65;
    	let t324;
    	let t325;
    	let pre37;

    	let raw37_value = `<code class="language-svelte"><span class="token tag"><span class="token tag"><span class="token punctuation">&lt;</span>script</span><span class="token punctuation">></span></span><span class="token script"><span class="token language-javascript">
  <span class="token keyword">import</span> <span class="token punctuation">&#123;</span> link <span class="token punctuation">&#125;</span> <span class="token keyword">from</span> <span class="token string">'svelte-standalone-router'</span><span class="token punctuation">;</span>
</span></span><span class="token tag"><span class="token tag"><span class="token punctuation">&lt;/</span>script</span><span class="token punctuation">></span></span>

<span class="token tag"><span class="token tag"><span class="token punctuation">&lt;</span>button</span> <span class="token attr-name"><span class="token namespace">use:</span>link=</span><span class="token language-javascript"><span class="token punctuation">&#123;</span><span class="token punctuation">&#123;</span>to<span class="token operator">:</span> <span class="token string">'/article'</span><span class="token punctuation">,</span> state<span class="token operator">:</span> <span class="token punctuation">&#123;</span> id<span class="token operator">:</span> <span class="token number">33</span> <span class="token punctuation">&#125;</span><span class="token punctuation">&#125;</span><span class="token punctuation">&#125;</span></span><span class="token punctuation">></span></span>article<span class="token tag"><span class="token tag"><span class="token punctuation">&lt;/</span>button</span><span class="token punctuation">></span></span></code>` + "";

    	let t326;
    	let p56;
    	let t327;
    	let code66;
    	let t329;
    	let t330;
    	let pre38;

    	let raw38_value = `<code class="language-js">app<span class="token punctuation">.</span><span class="token function">get</span><span class="token punctuation">(</span><span class="token string">'/article'</span><span class="token punctuation">,</span> <span class="token punctuation">(</span><span class="token parameter">req<span class="token punctuation">,</span> res</span><span class="token punctuation">)</span> <span class="token operator">=></span> <span class="token punctuation">&#123;</span>
  res<span class="token punctuation">.</span><span class="token function">send</span><span class="token punctuation">(</span>ArticleComponent<span class="token punctuation">,</span> <span class="token punctuation">&#123;</span> id<span class="token operator">:</span> req<span class="token punctuation">.</span>state<span class="token punctuation">.</span>id <span class="token punctuation">&#125;</span><span class="token punctuation">)</span>
<span class="token punctuation">&#125;</span><span class="token punctuation">)</span><span class="token punctuation">;</span></code>` + "";

    	let t331;
    	let p57;
    	let t333;
    	let pre39;

    	let raw39_value = `<code class="language-js">LinkOptions <span class="token punctuation">&#123;</span>
  type <span class="token operator">:</span> <span class="token function">String</span><span class="token punctuation">(</span><span class="token string">'navigate(default)|redirect|replace|alter'</span><span class="token punctuation">)</span>
  state <span class="token operator">:</span> Object
  to <span class="token operator">:</span> String
  href <span class="token operator">:</span> String
<span class="token punctuation">&#125;</span></code>` + "";

    	let t334;
    	let p58;
    	let t336;
    	let pre40;

    	let raw40_value = `<code class="language-svelte"><span class="token tag"><span class="token tag"><span class="token punctuation">&lt;</span>script</span><span class="token punctuation">></span></span><span class="token script"><span class="token language-javascript">
  <span class="token keyword">import</span> <span class="token punctuation">&#123;</span> location <span class="token punctuation">&#125;</span> <span class="token keyword">from</span> <span class="token string">'svelte-standalone-router'</span><span class="token punctuation">;</span>
</span></span><span class="token tag"><span class="token tag"><span class="token punctuation">&lt;/</span>script</span><span class="token punctuation">></span></span>

<span class="token tag"><span class="token tag"><span class="token punctuation">&lt;</span>a</span> <span class="token attr-name">href</span><span class="token attr-value"><span class="token punctuation">=</span><span class="token punctuation">"</span>/<span class="token punctuation">"</span></span> <span class="token attr-name"><span class="token namespace">use:</span>link</span> <span class="token attr-name"><span class="token namespace">class:</span>active=</span><span class="token language-javascript"><span class="token punctuation">&#123;</span>$location <span class="token operator">==</span> <span class="token string">'/'</span><span class="token punctuation">&#125;</span></span><span class="token punctuation">></span></span>home<span class="token tag"><span class="token tag"><span class="token punctuation">&lt;/</span>a</span><span class="token punctuation">></span></span>
<span class="token tag"><span class="token tag"><span class="token punctuation">&lt;</span>a</span> <span class="token attr-name">href</span><span class="token attr-value"><span class="token punctuation">=</span><span class="token punctuation">"</span>/user<span class="token punctuation">"</span></span> <span class="token attr-name"><span class="token namespace">use:</span>link</span> <span class="token attr-name"><span class="token namespace">class:</span>active=</span><span class="token language-javascript"><span class="token punctuation">&#123;</span>$location<span class="token punctuation">.</span><span class="token function">startsWith</span><span class="token punctuation">(</span><span class="token string">'/user'</span><span class="token punctuation">)</span><span class="token punctuation">&#125;</span></span><span class="token punctuation">></span></span>user<span class="token tag"><span class="token tag"><span class="token punctuation">&lt;/</span>a</span><span class="token punctuation">></span></span></code>` + "";

    	let t337;
    	let hr14;
    	let t338;
    	let h214;
    	let a16;
    	let t340;
    	let p59;
    	let t341;
    	let code67;
    	let t343;
    	let code68;
    	let t345;
    	let code69;
    	let t347;
    	let t348;
    	let p60;
    	let t349;
    	let code70;
    	let t351;
    	let code71;
    	let t353;
    	let code72;
    	let t355;
    	let code73;
    	let t357;
    	let t358;
    	let p61;
    	let t360;
    	let pre41;

    	let raw41_value = `<code class="language-js"><span class="token function">navigate</span><span class="token punctuation">(</span>url <span class="token operator">:</span> String<span class="token punctuation">,</span> state <span class="token operator">:</span> Object<span class="token punctuation">)</span><span class="token punctuation">;</span>
<span class="token function">redirect</span><span class="token punctuation">(</span>url <span class="token operator">:</span> String<span class="token punctuation">,</span> state <span class="token operator">:</span> Object<span class="token punctuation">)</span><span class="token punctuation">;</span>
<span class="token function">replace</span><span class="token punctuation">(</span>url <span class="token operator">:</span> String<span class="token punctuation">,</span> state <span class="token operator">:</span> Object<span class="token punctuation">)</span><span class="token punctuation">;</span>
<span class="token function">alter</span><span class="token punctuation">(</span>url <span class="token operator">:</span> String<span class="token punctuation">,</span> state <span class="token operator">:</span> Object<span class="token punctuation">)</span><span class="token punctuation">;</span></code>` + "";

    	let t361;
    	let pre42;

    	let raw42_value = `<code class="language-js"><span class="token keyword">import</span> <span class="token punctuation">&#123;</span> navigate<span class="token punctuation">,</span> redirect<span class="token punctuation">,</span> replace<span class="token punctuation">,</span> alter <span class="token punctuation">&#125;</span> <span class="token keyword">from</span> <span class="token string">'svelte-standalone-router'</span><span class="token punctuation">;</span>
<span class="token function">navigate</span><span class="token punctuation">(</span><span class="token string">'/subpage'</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
<span class="token function">redirect</span><span class="token punctuation">(</span><span class="token string">'/subpage'</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
<span class="token function">replace</span><span class="token punctuation">(</span><span class="token string">'/subpage'</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
<span class="token function">alter</span><span class="token punctuation">(</span><span class="token string">'/subpage'</span><span class="token punctuation">)</span><span class="token punctuation">;</span></code>` + "";

    	let t362;
    	let p62;
    	let t363;
    	let code74;
    	let t365;
    	let code75;
    	let t367;
    	let code76;
    	let t369;
    	let code77;
    	let t371;
    	let t372;
    	let p63;
    	let t373;
    	let code78;
    	let t375;
    	let code79;
    	let t377;
    	let code80;
    	let t379;
    	let t380;
    	let pre43;

    	let raw43_value = `<code class="language-svelte"><span class="token tag"><span class="token tag"><span class="token punctuation">&lt;</span>script</span><span class="token punctuation">></span></span><span class="token script"><span class="token language-javascript">
  <span class="token keyword">import</span> <span class="token punctuation">&#123;</span> Navigate<span class="token punctuation">,</span> Redirect<span class="token punctuation">,</span> Replace<span class="token punctuation">,</span> Alter <span class="token punctuation">&#125;</span> <span class="token keyword">from</span> <span class="token string">'svelte-standalone-router'</span><span class="token punctuation">;</span>
</span></span><span class="token tag"><span class="token tag"><span class="token punctuation">&lt;/</span>script</span><span class="token punctuation">></span></span>

<span class="token language-javascript"><span class="token punctuation">&#123;</span>#<span class="token keyword">if</span> <span class="token operator">!</span>expression<span class="token punctuation">&#125;</span></span>
  <span class="token tag"><span class="token tag"><span class="token punctuation">&lt;</span>Navigate</span> <span class="token attr-name">to</span><span class="token attr-value"><span class="token punctuation">=</span><span class="token punctuation">"</span>/subpage<span class="token punctuation">"</span></span> <span class="token attr-name">state=</span><span class="token language-javascript"><span class="token punctuation">&#123;</span><span class="token punctuation">&#123;</span> custom<span class="token operator">:</span> <span class="token string">'state'</span> <span class="token punctuation">&#125;</span><span class="token punctuation">&#125;</span></span> <span class="token punctuation">/></span></span>
<span class="token language-javascript"><span class="token punctuation">&#123;</span><span class="token operator">/</span><span class="token keyword">if</span><span class="token punctuation">&#125;</span></span></code>` + "";

    	let t381;
    	let p64;
    	let code81;
    	let t383;
    	let code82;
    	let t385;
    	let t386;
    	let pre44;

    	let raw44_value = `<code class="language-js"><span class="token keyword">import</span> <span class="token punctuation">&#123;</span> mount<span class="token punctuation">,</span> destroy <span class="token punctuation">&#125;</span> <span class="token keyword">from</span> <span class="token string">'svelte-standalone-router'</span><span class="token punctuation">;</span>
<span class="token comment">// mount and destroy functions</span>
<span class="token function">mount</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
<span class="token function">destroy</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span></code>` + "";

    	let t387;
    	let hr15;
    	let t388;
    	let h215;
    	let a17;
    	let t390;
    	let pre45;

    	let raw45_value = `<code class="language-svelte"><span class="token tag"><span class="token tag"><span class="token punctuation">&lt;</span>script</span><span class="token punctuation">></span></span><span class="token script"><span class="token language-javascript">
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

<span class="token tag"><span class="token tag"><span class="token punctuation">&lt;</span>RouterComponent</span> <span class="token punctuation">/></span></span></code>` + "";

    	let t391;
    	let p65;
    	let t393;
    	let pre46;
    	let raw46_value = `<code class="language-js"><span class="token string">"start"</span><span class="token operator">:</span> <span class="token string">"sirv public --single"</span></code>` + "";

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
    			hr0 = element("hr");
    			t10 = space();
    			h20 = element("h2");
    			a2 = element("a");
    			a2.textContent = "Library implementation";
    			t12 = space();
    			p2 = element("p");
    			p2.textContent = "Components and utilities the library exposes. As per the svelte specs all svelte components are Capitalized.";
    			t14 = space();
    			pre1 = element("pre");
    			t15 = space();
    			pre2 = element("pre");
    			t16 = space();
    			hr1 = element("hr");
    			t17 = space();
    			h21 = element("h2");
    			a3 = element("a");
    			a3.textContent = "Creating a router context";
    			t19 = space();
    			p3 = element("p");
    			p3.textContent = "Most of the time you will only ever need one context, tho the ability to have several router contexts on the page at the same time is a possibility";
    			t21 = space();
    			pre3 = element("pre");
    			t22 = space();
    			hr2 = element("hr");
    			t23 = space();
    			h22 = element("h2");
    			a4 = element("a");
    			a4.textContent = "Adding routes";
    			t25 = space();
    			p4 = element("p");
    			t26 = text("Add get routes to your created context with the ");
    			code0 = element("code");
    			code0.textContent = "get";
    			t28 = text(" method. The get method takes an argument ");
    			code1 = element("code");
    			code1.textContent = "String";
    			t30 = text(" for the route, a undefined number of middlewares and lastly a callback for when the route matches.");
    			t31 = space();
    			p5 = element("p");
    			p5.textContent = "A simple route that matches the root";
    			t33 = space();
    			pre4 = element("pre");
    			t34 = space();
    			p6 = element("p");
    			t35 = text("The callback function exposes two functions. The first argument is the Request object, this will contain data regarding the route request and the second argument will be the response object which exposes two functions ");
    			code2 = element("code");
    			code2.textContent = "send";
    			t37 = text(" or ");
    			code3 = element("code");
    			code3.textContent = "error";
    			t39 = text(", which will either send the component and props to the ");
    			code4 = element("code");
    			code4.textContent = "RouterComponent";
    			t41 = text(" or handle the error, which is documented a bit further down.");
    			t42 = space();
    			p7 = element("p");
    			p7.textContent = "To pass along component properties, which is done by adding an Object literal as the second argument with the data that should be passed on to the component.";
    			t44 = space();
    			pre5 = element("pre");
    			t45 = space();
    			p8 = element("p");
    			t46 = text("Let’s try a more advanced route with dynamic parameters. The route is separated in sections by ");
    			code5 = element("code");
    			code5.textContent = "/";
    			t48 = text(", like a directory structure. Each part can use a dynamic parameter which gets exposed on the ");
    			code6 = element("code");
    			code6.textContent = "req.params";
    			t50 = text(" object.");
    			t51 = space();
    			blockquote0 = element("blockquote");
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
    			p12 = element("p");
    			code12 = element("code");
    			code12.textContent = "*";
    			t71 = text(" is not a wildcard you can place in the middle of the string. It is placed at the end to mark where it match up until and then anything else after that. So it’s important in what order the routes are defined due to no ranking system in place in the library");
    			t72 = space();
    			p13 = element("p");
    			t73 = text("This will match a route like ");
    			code13 = element("code");
    			code13.textContent = "/articles/10";
    			t75 = text(" and ");
    			code14 = element("code");
    			code14.textContent = "/articles/20/what-is-up-with-2020";
    			t77 = text(". It will explicitly match up until the ");
    			code15 = element("code");
    			code15.textContent = ":id";
    			t79 = text(" and then everything else.");
    			t80 = space();
    			pre8 = element("pre");
    			t81 = space();
    			p14 = element("p");
    			p14.textContent = "There is a few small things about routes that gets rid of some redundancy in some instances. For instance you can provide an array of routes, chain the get calls and discard the route completly.";
    			t83 = space();
    			p15 = element("p");
    			p15.textContent = "Multiple routes with the sample implementation";
    			t85 = space();
    			pre9 = element("pre");
    			t86 = space();
    			p16 = element("p");
    			t87 = text("Chain routes as sub routes. Here about and contact will actually become ");
    			code16 = element("code");
    			code16.textContent = "/pages/about";
    			t89 = text(" and ");
    			code17 = element("code");
    			code17.textContent = "/pages/contact";
    			t91 = text(" as they are chained under the pages route. A sub route is not a special case, it’s simply a way to group code together and remove some redundancy. If you’d rather do ");
    			code18 = element("code");
    			code18.textContent = "app.get('/pages/about', ...)";
    			t93 = text(" it would be the same thing.");
    			t94 = space();
    			pre10 = element("pre");
    			t95 = space();
    			p17 = element("p");
    			t96 = text("Or to catch all requests. the route is actually ’*’ so it catches everything. It is nothing more than a shorthand implementation for ");
    			code19 = element("code");
    			code19.textContent = "app.get('/*', (req, res) => ...)";
    			t98 = text(".");
    			t99 = space();
    			pre11 = element("pre");
    			t100 = space();
    			hr3 = element("hr");
    			t101 = space();
    			h23 = element("h2");
    			a5 = element("a");
    			a5.textContent = "Decorators";
    			t103 = space();
    			p18 = element("p");
    			p18.textContent = "Decorators are routes that are wrapped inside a parent component. The interface for creating a decorator is almost identical to creating get routes.\nLet’s start with a simple decorator route.";
    			t105 = space();
    			pre12 = element("pre");
    			t106 = space();
    			p19 = element("p");
    			p19.textContent = "The decorator callback function exposes an additional third argument which is a function call that accepts properties. This is so we can pass props to the decorator at run time where props might change depending on conditions not yet known.";
    			t108 = space();
    			pre13 = element("pre");
    			t109 = space();
    			p20 = element("p");
    			t110 = text("There is some overloading going on behind the scenes due to the fact that we might need to register the route on the right context.\nWithout the first argument being the context, the context defaults back to the first one defined, the same as it does for the ");
    			code20 = element("code");
    			code20.textContent = "RouterComponent";
    			t112 = text(".");
    			t113 = space();
    			p21 = element("p");
    			p21.textContent = "Let’s take a look at how the overloading is handled internally. You can see the pattern that it shifts the first argument if a context is provided or not.";
    			t115 = space();
    			pre14 = element("pre");
    			t116 = space();
    			p22 = element("p");
    			p22.textContent = "And just as with get routes you can apply middlewares to that as well. So you aren’t limited to only be applying middlewares to the decorator in this case.";
    			t118 = space();
    			pre15 = element("pre");
    			t119 = space();
    			p23 = element("p");
    			p23.textContent = "It’s also possible like get routes to chain them together";
    			t121 = space();
    			pre16 = element("pre");
    			t122 = space();
    			blockquote2 = element("blockquote");
    			p24 = element("p");
    			t123 = text("Note that inline middlewares are only attached to that particular route, however in the case of decorators, middlewares attached to the decorator will be applied to the route as well. And if it isn’t obvious the middleware order is, global ");
    			code21 = element("code");
    			code21.textContent = "app.use";
    			t125 = text(" middlewares executes first in order they are defined, followed by ");
    			code22 = element("code");
    			code22.textContent = "decorator middlewares";
    			t127 = text(" and lastly, the ");
    			code23 = element("code");
    			code23.textContent = "inline middlewares";
    			t129 = text(" attached on the route itself.");
    			t130 = space();
    			hr4 = element("hr");
    			t131 = space();
    			h24 = element("h2");
    			a6 = element("a");
    			a6.textContent = "Request object";
    			t133 = space();
    			p25 = element("p");
    			p25.textContent = "The request object exposes everything related to the request. This you can use to determin if you want to preload data, what component to load or error out when a request does not meet the requirements.";
    			t135 = space();
    			pre17 = element("pre");
    			t136 = space();
    			hr5 = element("hr");
    			t137 = space();
    			h25 = element("h2");
    			a7 = element("a");
    			a7.textContent = "Response object";
    			t139 = space();
    			p26 = element("p");
    			p26.textContent = "The response object is responsible for handling the response. Currently you can send the component and its props to the router or as an error.";
    			t141 = space();
    			pre18 = element("pre");
    			t142 = space();
    			hr6 = element("hr");
    			t143 = space();
    			h26 = element("h2");
    			a8 = element("a");
    			a8.textContent = "Base and linkbase";
    			t145 = space();
    			p27 = element("p");
    			t146 = text("If you are deploying your site to the root no extra configuration has to be done to make it work. But on the occasions where you want to deploy it under a subdirectory you would want to defined the ");
    			code24 = element("code");
    			code24.textContent = "base";
    			t148 = text(" and or perhaps the ");
    			code25 = element("code");
    			code25.textContent = "linkBase";
    			t150 = text(" to cater to that location.");
    			t151 = space();
    			p28 = element("p");
    			t152 = text("Let’s start with base. Lets deploy our app under ");
    			code26 = element("code");
    			code26.textContent = "/project";
    			t154 = text(", so we would access our site under ");
    			code27 = element("code");
    			code27.textContent = "https://example.com/project";
    			t156 = text(".");
    			t157 = space();
    			pre19 = element("pre");
    			t158 = space();
    			p29 = element("p");
    			t159 = text("This does not reflect the ");
    			code28 = element("code");
    			code28.textContent = "linkBase";
    			t161 = text(". It’s implementation is separated due to the instances where you don’t want the ");
    			code29 = element("code");
    			code29.textContent = "use:link";
    			t163 = text(" action directive to reflect that, and the reason why they both aren’t affected by setting the base property.");
    			t164 = space();
    			p30 = element("p");
    			t165 = text("The linkBase is set on the router-settings object. This will make all helpers like ");
    			code30 = element("code");
    			code30.textContent = "navigate";
    			t167 = text(", ");
    			code31 = element("code");
    			code31.textContent = "redirect";
    			t169 = text(" and ");
    			code32 = element("code");
    			code32.textContent = "link";
    			t171 = text(" prefix everything under ");
    			code33 = element("code");
    			code33.textContent = "/project";
    			t173 = text(".");
    			t174 = space();
    			pre20 = element("pre");
    			t175 = space();
    			p31 = element("p");
    			p31.textContent = "Since setting the linkBase returns the just defined string you can combine it with the base property.";
    			t177 = space();
    			pre21 = element("pre");
    			t178 = space();
    			p32 = element("p");
    			p32.textContent = "Or how about dynamically depending on the base of your index.html";
    			t180 = space();
    			p33 = element("p");
    			p33.textContent = "Since setting the linkBase returns the just defined string you can combine it with the base property.";
    			t182 = space();
    			pre22 = element("pre");
    			t183 = space();
    			hr7 = element("hr");
    			t184 = space();
    			h27 = element("h2");
    			a9 = element("a");
    			a9.textContent = "Scroll reset";
    			t186 = space();
    			p34 = element("p");
    			p34.textContent = "By default the router will scroll back top on every route change. You can toggle it off if you want to implement your own scroll behaviour or want to load the component in place, as is.";
    			t188 = space();
    			p35 = element("p");
    			p35.textContent = "Like linkBase, that setting is statically defined on the Router class.";
    			t190 = space();
    			pre23 = element("pre");
    			t191 = space();
    			p36 = element("p");
    			t192 = text("or with the ");
    			code34 = element("code");
    			code34.textContent = "setScrollReset";
    			t194 = text(" function.");
    			t195 = space();
    			pre24 = element("pre");
    			t196 = space();
    			hr8 = element("hr");
    			t197 = space();
    			h28 = element("h2");
    			a10 = element("a");
    			a10.textContent = "Scroll offset";
    			t199 = space();
    			p37 = element("p");
    			t200 = text("Scroll offset is the offset applied after an internal hash-route has taken place. One might have a sticky header or some fixed overlapping element after scrolling which would overlap the content at the hash link destination. The offset value is defined on the ");
    			code35 = element("code");
    			code35.textContent = "Router";
    			t202 = text(" instance and only accepts a ");
    			code36 = element("code");
    			code36.textContent = "Number";
    			t204 = text(" as value.");
    			t205 = space();
    			pre25 = element("pre");
    			t206 = space();
    			p38 = element("p");
    			t207 = text("or with the ");
    			code37 = element("code");
    			code37.textContent = "setScrollOffset";
    			t209 = text(" function.");
    			t210 = space();
    			pre26 = element("pre");
    			t211 = space();
    			hr9 = element("hr");
    			t212 = space();
    			h29 = element("h2");
    			a11 = element("a");
    			a11.textContent = "State object";
    			t214 = space();
    			p39 = element("p");
    			t215 = text("On every request you can pass a states object and so does the initial request by the ");
    			code38 = element("code");
    			code38.textContent = "state";
    			t217 = text(" property passed to the context creation.");
    			t218 = space();
    			pre27 = element("pre");
    			t219 = space();
    			hr10 = element("hr");
    			t220 = space();
    			h210 = element("h2");
    			a12 = element("a");
    			a12.textContent = "Catching errors";
    			t222 = space();
    			blockquote3 = element("blockquote");
    			p40 = element("p");
    			p40.textContent = "At this point decorators only work on get routes. Hoping to add it to catch routes in future updates as well.";
    			t224 = space();
    			p41 = element("p");
    			t225 = text("Like routes you can catch errors with the ");
    			code39 = element("code");
    			code39.textContent = "catch";
    			t227 = text(" method. The underlying implementation is basically the same as ");
    			code40 = element("code");
    			code40.textContent = "get";
    			t229 = text(" routes except it will be used as a fallback if route is not found or manually triggered and that it recieves an additional argument with custom props.");
    			t230 = space();
    			pre28 = element("pre");
    			t231 = space();
    			p42 = element("p");
    			t232 = text("Manually trigger an error for current route ");
    			code41 = element("code");
    			code41.textContent = "/";
    			t234 = text(". The difference of error and send is that error only takes an object of optional custom properties.");
    			t235 = space();
    			pre29 = element("pre");
    			t236 = space();
    			hr11 = element("hr");
    			t237 = space();
    			h211 = element("h2");
    			a13 = element("a");
    			a13.textContent = "Middlewares";
    			t239 = space();
    			p43 = element("p");
    			t240 = text("There are two kinds of middlewares, globals and those attached on to the route itself.\nTo define a global middleware you use the ");
    			code42 = element("code");
    			code42.textContent = "use";
    			t242 = text(" method. Unlike get and catch routes, global middlewares do not take a route. You can define multiple global middlewares and how they are executed is in the order they are defined.");
    			t243 = space();
    			p44 = element("p");
    			t244 = text("To move on to the next middleware you need to call ");
    			code43 = element("code");
    			code43.textContent = "next()";
    			t246 = text(".");
    			t247 = space();
    			pre30 = element("pre");
    			t248 = space();
    			p45 = element("p");
    			t249 = text("Instead of globally on each and every route you can attache the middleware on to the route itself. A middleware is simple a function, the same function used as the callback argument on the ");
    			code44 = element("code");
    			code44.textContent = "use";
    			t251 = text(" method.");
    			t252 = space();
    			pre31 = element("pre");
    			t253 = space();
    			hr12 = element("hr");
    			t254 = space();
    			h212 = element("h2");
    			a14 = element("a");
    			a14.textContent = "Svelte implementation";
    			t256 = space();
    			p46 = element("p");
    			t257 = text("The ");
    			code45 = element("code");
    			code45.textContent = "RouterComponent";
    			t259 = text(" takes optional slot argument and exposes both the ");
    			code46 = element("code");
    			code46.textContent = "decorator";
    			t261 = text(", ");
    			code47 = element("code");
    			code47.textContent = "component";
    			t263 = text(" and ");
    			code48 = element("code");
    			code48.textContent = "props";
    			t265 = text(" as variables.");
    			t266 = space();
    			pre32 = element("pre");
    			t267 = space();
    			p47 = element("p");
    			t268 = text("If you want to customize the implementation and perhaps add transitions or animations you can do so by using the exposed variables and utilizing the ");
    			code49 = element("code");
    			code49.textContent = "svelte:component";
    			t270 = text(" element.");
    			t271 = space();
    			blockquote4 = element("blockquote");
    			p48 = element("p");
    			t272 = text("svelte ");
    			code50 = element("code");
    			code50.textContent = "{#key}";
    			t274 = text(" syntax does not exist in svelte ");
    			code51 = element("code");
    			code51.textContent = "3.0.0";
    			t276 = text(". Install ");
    			code52 = element("code");
    			code52.textContent = "svelte@latest";
    			t278 = text(" to get the latest version and to be able to utilize that functionality.");
    			t279 = space();
    			pre33 = element("pre");
    			t280 = space();
    			hr13 = element("hr");
    			t281 = space();
    			h213 = element("h2");
    			a15 = element("a");
    			a15.textContent = "Changing routes";
    			t283 = space();
    			p49 = element("p");
    			t284 = text("There is a few different ways to make a request to a route. First lets look at the ");
    			code53 = element("code");
    			code53.textContent = "Actions";
    			t286 = text(" directive. The actions directive adds an on:click handler to the element it is used on. To reduce redundant code there are some fallbacks in place and it goes like this.");
    			t287 = space();
    			p50 = element("p");
    			t288 = text("link:property : ");
    			code54 = element("code");
    			code54.textContent = "to: '/first'";
    			t290 = text(" -> ");
    			code55 = element("code");
    			code55.textContent = "href: '/second'";
    			t292 = text(",\nElement:attribute : ");
    			code56 = element("code");
    			code56.textContent = "href=\"/third\"";
    			t294 = text(" -> ");
    			code57 = element("code");
    			code57.textContent = "data-href=\"/fourth\"";
    			t296 = space();
    			p51 = element("p");
    			t297 = text("So it goes from link property ");
    			code58 = element("code");
    			code58.textContent = "to";
    			t299 = text(", then, ");
    			code59 = element("code");
    			code59.textContent = "href";
    			t301 = text(", then element attribute ");
    			code60 = element("code");
    			code60.textContent = "href";
    			t303 = text(" and lastly data-attribute ");
    			code61 = element("code");
    			code61.textContent = "data-href";
    			t305 = text(". Why so complicated? Because on links we want to use the href attribute to reduce code, while on maybe buttons that according to the specs don’t implement a href attribute. Is that such a problem using ‘expando attributes’? for some it might not, but for others arguing for correct semantics it perhaps would, i’m not the judge of that. Use the method that suits your needs.");
    			t306 = space();
    			p52 = element("p");
    			t307 = text("The link ");
    			code62 = element("code");
    			code62.textContent = "Action";
    			t309 = text(" also accepts an object of properties, but as the bare minimum it will fallback and use the ");
    			code63 = element("code");
    			code63.textContent = "href";
    			t311 = text(" attribute to know which page to route to.");
    			t312 = space();
    			pre34 = element("pre");
    			t313 = space();
    			p53 = element("p");
    			t314 = text("The link properties will always have precedence over the elements attributes. In the example below the page will navigate to ");
    			code64 = element("code");
    			code64.textContent = "/contact";
    			t316 = text(".");
    			t317 = space();
    			pre35 = element("pre");
    			t318 = space();
    			p54 = element("p");
    			p54.textContent = "Different ways of navigating with an example using a button.";
    			t320 = space();
    			pre36 = element("pre");
    			t321 = space();
    			p55 = element("p");
    			t322 = text("You can also pass along a state object to the ");
    			code65 = element("code");
    			code65.textContent = "Request";
    			t324 = text(" object.");
    			t325 = space();
    			pre37 = element("pre");
    			t326 = space();
    			p56 = element("p");
    			t327 = text("And to use it in a route it’s available on the ");
    			code66 = element("code");
    			code66.textContent = "Request";
    			t329 = text(" object, like so.");
    			t330 = space();
    			pre38 = element("pre");
    			t331 = space();
    			p57 = element("p");
    			p57.textContent = "The link implementation options.";
    			t333 = space();
    			pre39 = element("pre");
    			t334 = space();
    			p58 = element("p");
    			p58.textContent = "Adding active class on active routes. The current location is stored in a svelte store. Compare that to the route to add an active class on the navigation link.";
    			t336 = space();
    			pre40 = element("pre");
    			t337 = space();
    			hr14 = element("hr");
    			t338 = space();
    			h214 = element("h2");
    			a16 = element("a");
    			a16.textContent = "Programmatically changing routes";
    			t340 = space();
    			p59 = element("p");
    			t341 = text("To programmatically navigate or redirect you have two functions to your exposure. The difference between the two is that ");
    			code67 = element("code");
    			code67.textContent = "navigate";
    			t343 = text(" adds a record to the ");
    			code68 = element("code");
    			code68.textContent = "History";
    			t345 = text(" object which means you can go back and forth in the history, while ");
    			code69 = element("code");
    			code69.textContent = "redirect";
    			t347 = text(" does not add a record, it just changes the current url.");
    			t348 = space();
    			p60 = element("p");
    			t349 = text("Also where one wants to change the url without triggering a route change there is the ");
    			code70 = element("code");
    			code70.textContent = "replace";
    			t351 = text(" and ");
    			code71 = element("code");
    			code71.textContent = "alter";
    			t353 = text(" functions. Where ");
    			code72 = element("code");
    			code72.textContent = "replace";
    			t355 = text(" will change the url and add a record to the History object and ");
    			code73 = element("code");
    			code73.textContent = "alter";
    			t357 = text(" will change the url but don’t add a record on to the History object.");
    			t358 = space();
    			p61 = element("p");
    			p61.textContent = "The helper implementation arguments";
    			t360 = space();
    			pre41 = element("pre");
    			t361 = space();
    			pre42 = element("pre");
    			t362 = space();
    			p62 = element("p");
    			t363 = text("There also exists a ");
    			code74 = element("code");
    			code74.textContent = "Navigate";
    			t365 = text(", ");
    			code75 = element("code");
    			code75.textContent = "Redirect";
    			t367 = text(", ");
    			code76 = element("code");
    			code76.textContent = "Replace";
    			t369 = text(" and ");
    			code77 = element("code");
    			code77.textContent = "Alter";
    			t371 = text(" svelte components that implement the same logic as the link/navigation methods. You can differentiate it by the fact that svelte-components needs to be Capitalized.");
    			t372 = space();
    			p63 = element("p");
    			t373 = text("Like the link action you can use either ");
    			code78 = element("code");
    			code78.textContent = "to";
    			t375 = text(" or ");
    			code79 = element("code");
    			code79.textContent = "href";
    			t377 = text(" with the ");
    			code80 = element("code");
    			code80.textContent = "to";
    			t379 = text(" prop having precedence. The components implement the helper functions so you can optionally pass a state prop.");
    			t380 = space();
    			pre43 = element("pre");
    			t381 = space();
    			p64 = element("p");
    			code81 = element("code");
    			code81.textContent = "mount";
    			t383 = text(" and ");
    			code82 = element("code");
    			code82.textContent = "destroy";
    			t385 = text(" the popstate listener is as easy as calling their respective function.");
    			t386 = space();
    			pre44 = element("pre");
    			t387 = space();
    			hr15 = element("hr");
    			t388 = space();
    			h215 = element("h2");
    			a17 = element("a");
    			a17.textContent = "Quick usage";
    			t390 = space();
    			pre45 = element("pre");
    			t391 = space();
    			p65 = element("p");
    			p65.textContent = "Enable sirv for SPA with the flag ‘—single’";
    			t393 = space();
    			pre46 = element("pre");
    			add_location(h1, file$6, 1, 0, 1);
    			attr_dev(a0, "href", "https://github.com/hjalmar/standalone-router");
    			attr_dev(a0, "rel", "nofollow");
    			add_location(a0, file$6, 2, 32, 67);
    			add_location(p0, file$6, 2, 0, 35);
    			attr_dev(pre0, "class", "language-js");
    			add_location(pre0, file$6, 6, 0, 195);
    			attr_dev(a1, "href", "https://github.com/hjalmar/standalone-router");
    			attr_dev(a1, "rel", "nofollow");
    			add_location(a1, file$6, 7, 139, 586);
    			add_location(p1, file$6, 7, 0, 447);
    			add_location(hr0, file$6, 11, 0, 702);
    			attr_dev(a2, "name", "library-implementation");
    			attr_dev(a2, "href", "#library-implementation");
    			add_location(a2, file$6, 12, 4, 711);
    			add_location(h20, file$6, 12, 0, 707);
    			add_location(p2, file$6, 13, 0, 807);
    			attr_dev(pre1, "class", "language-js");
    			add_location(pre1, file$6, 14, 0, 924);
    			attr_dev(pre2, "class", "language-null");
    			add_location(pre2, file$6, 15, 0, 1966);
    			add_location(hr1, file$6, 33, 0, 3066);
    			attr_dev(a3, "name", "creating-a-router-context");
    			attr_dev(a3, "href", "#creating-a-router-context");
    			add_location(a3, file$6, 34, 4, 3075);
    			add_location(h21, file$6, 34, 0, 3071);
    			add_location(p3, file$6, 35, 0, 3180);
    			attr_dev(pre3, "class", "language-js");
    			add_location(pre3, file$6, 36, 0, 3335);
    			add_location(hr2, file$6, 44, 0, 4373);
    			attr_dev(a4, "name", "adding-routes");
    			attr_dev(a4, "href", "#adding-routes");
    			add_location(a4, file$6, 45, 4, 4382);
    			add_location(h22, file$6, 45, 0, 4378);
    			add_location(code0, file$6, 46, 51, 4502);
    			add_location(code1, file$6, 46, 109, 4560);
    			add_location(p4, file$6, 46, 0, 4451);
    			add_location(p5, file$6, 47, 0, 4684);
    			attr_dev(pre4, "class", "language-js");
    			add_location(pre4, file$6, 48, 0, 4728);
    			add_location(code2, file$6, 51, 221, 5644);
    			add_location(code3, file$6, 51, 242, 5665);
    			add_location(code4, file$6, 51, 316, 5739);
    			add_location(p6, file$6, 51, 0, 5423);
    			add_location(p7, file$6, 52, 0, 5833);
    			attr_dev(pre5, "class", "language-js");
    			add_location(pre5, file$6, 53, 0, 5998);
    			add_location(code5, file$6, 58, 98, 7383);
    			add_location(code6, file$6, 58, 206, 7491);
    			add_location(p8, file$6, 58, 0, 7285);
    			add_location(code7, file$6, 60, 137, 7677);
    			add_location(code8, file$6, 60, 174, 7714);
    			add_location(p9, file$6, 60, 0, 7540);
    			add_location(blockquote0, file$6, 59, 0, 7527);
    			attr_dev(pre6, "class", "language-js");
    			add_location(pre6, file$6, 62, 0, 7807);
    			add_location(code9, file$6, 67, 103, 9247);
    			add_location(code10, file$6, 67, 213, 9357);
    			add_location(p10, file$6, 67, 0, 9144);
    			attr_dev(pre7, "class", "language-js");
    			add_location(pre7, file$6, 68, 0, 9499);
    			add_location(code11, file$6, 71, 125, 10728);
    			add_location(p11, file$6, 71, 0, 10603);
    			add_location(code12, file$6, 73, 3, 10789);
    			add_location(p12, file$6, 73, 0, 10786);
    			add_location(blockquote1, file$6, 72, 0, 10773);
    			add_location(code13, file$6, 75, 32, 11110);
    			add_location(code14, file$6, 75, 62, 11140);
    			add_location(code15, file$6, 75, 148, 11226);
    			add_location(p13, file$6, 75, 0, 11078);
    			attr_dev(pre8, "class", "language-js");
    			add_location(pre8, file$6, 76, 0, 11273);
    			add_location(p14, file$6, 79, 0, 12379);
    			add_location(p15, file$6, 80, 0, 12581);
    			attr_dev(pre9, "class", "language-js");
    			add_location(pre9, file$6, 81, 0, 12635);
    			add_location(code16, file$6, 84, 75, 14045);
    			add_location(code17, file$6, 84, 105, 14075);
    			add_location(code18, file$6, 84, 299, 14269);
    			add_location(p16, file$6, 84, 0, 13970);
    			attr_dev(pre10, "class", "language-js");
    			add_location(pre10, file$6, 85, 0, 14343);
    			add_location(code19, file$6, 90, 136, 16760);
    			add_location(p17, file$6, 90, 0, 16624);
    			attr_dev(pre11, "class", "language-js");
    			add_location(pre11, file$6, 91, 0, 16814);
    			add_location(hr3, file$6, 94, 0, 17607);
    			attr_dev(a5, "name", "decorator");
    			attr_dev(a5, "href", "#decorator");
    			add_location(a5, file$6, 95, 4, 17616);
    			add_location(h23, file$6, 95, 0, 17612);
    			add_location(p18, file$6, 96, 0, 17674);
    			attr_dev(pre12, "class", "language-js");
    			add_location(pre12, file$6, 98, 0, 17873);
    			add_location(p19, file$6, 104, 0, 19357);
    			attr_dev(pre13, "class", "language-js");
    			add_location(pre13, file$6, 105, 0, 19605);
    			add_location(code20, file$6, 115, 126, 21632);
    			add_location(p20, file$6, 114, 0, 21371);
    			add_location(p21, file$6, 116, 0, 21666);
    			attr_dev(pre14, "class", "language-js");
    			add_location(pre14, file$6, 117, 0, 21828);
    			add_location(p22, file$6, 125, 0, 23480);
    			attr_dev(pre15, "class", "language-js");
    			add_location(pre15, file$6, 126, 0, 23643);
    			add_location(p23, file$6, 128, 0, 24489);
    			attr_dev(pre16, "class", "language-js");
    			add_location(pre16, file$6, 129, 0, 24554);
    			add_location(code21, file$6, 136, 243, 26459);
    			add_location(code22, file$6, 136, 330, 26546);
    			add_location(code23, file$6, 136, 381, 26597);
    			add_location(p24, file$6, 136, 0, 26216);
    			add_location(blockquote2, file$6, 135, 0, 26203);
    			add_location(hr4, file$6, 138, 0, 26677);
    			attr_dev(a6, "name", "request-object");
    			attr_dev(a6, "href", "#request-object");
    			add_location(a6, file$6, 139, 4, 26686);
    			add_location(h24, file$6, 139, 0, 26682);
    			add_location(p25, file$6, 140, 0, 26758);
    			attr_dev(pre17, "class", "language-js");
    			add_location(pre17, file$6, 141, 0, 26968);
    			add_location(hr5, file$6, 150, 0, 28197);
    			attr_dev(a7, "name", "response-object");
    			attr_dev(a7, "href", "#response-object");
    			add_location(a7, file$6, 151, 4, 28206);
    			add_location(h25, file$6, 151, 0, 28202);
    			add_location(p26, file$6, 152, 0, 28281);
    			attr_dev(pre18, "class", "language-js");
    			add_location(pre18, file$6, 153, 0, 28431);
    			add_location(hr6, file$6, 157, 0, 29187);
    			attr_dev(a8, "name", "base-and-linkbase");
    			attr_dev(a8, "href", "#base-and-linkbase");
    			add_location(a8, file$6, 158, 4, 29196);
    			add_location(h26, file$6, 158, 0, 29192);
    			add_location(code24, file$6, 159, 201, 29478);
    			add_location(code25, file$6, 159, 238, 29515);
    			add_location(p27, file$6, 159, 0, 29277);
    			add_location(code26, file$6, 160, 52, 29620);
    			add_location(code27, file$6, 160, 109, 29677);
    			add_location(p28, file$6, 160, 0, 29568);
    			attr_dev(pre19, "class", "language-js");
    			add_location(pre19, file$6, 161, 0, 29723);
    			add_location(code28, file$6, 165, 29, 30397);
    			add_location(code29, file$6, 165, 131, 30499);
    			add_location(p29, file$6, 165, 0, 30368);
    			add_location(code30, file$6, 166, 86, 30720);
    			add_location(code31, file$6, 166, 109, 30743);
    			add_location(code32, file$6, 166, 135, 30769);
    			add_location(code33, file$6, 166, 177, 30811);
    			add_location(p30, file$6, 166, 0, 30634);
    			attr_dev(pre20, "class", "language-js");
    			add_location(pre20, file$6, 167, 0, 30839);
    			add_location(p31, file$6, 168, 0, 31091);
    			attr_dev(pre21, "class", "language-js");
    			add_location(pre21, file$6, 169, 0, 31200);
    			add_location(p32, file$6, 173, 0, 31978);
    			add_location(p33, file$6, 174, 0, 32051);
    			attr_dev(pre22, "class", "language-js");
    			add_location(pre22, file$6, 175, 0, 32160);
    			add_location(hr7, file$6, 184, 0, 33638);
    			attr_dev(a9, "name", "scroll-reset");
    			attr_dev(a9, "href", "#scroll-reset");
    			add_location(a9, file$6, 185, 4, 33647);
    			add_location(h27, file$6, 185, 0, 33643);
    			add_location(p34, file$6, 186, 0, 33713);
    			add_location(p35, file$6, 187, 0, 33906);
    			attr_dev(pre23, "class", "language-js");
    			add_location(pre23, file$6, 188, 0, 33984);
    			add_location(code34, file$6, 189, 15, 34250);
    			add_location(p36, file$6, 189, 0, 34235);
    			attr_dev(pre24, "class", "language-js");
    			add_location(pre24, file$6, 190, 0, 34293);
    			add_location(hr8, file$6, 191, 0, 34624);
    			attr_dev(a10, "name", "scroll-offset");
    			attr_dev(a10, "href", "#scroll-offset");
    			add_location(a10, file$6, 192, 4, 34633);
    			add_location(h28, file$6, 192, 0, 34629);
    			add_location(code35, file$6, 193, 263, 34965);
    			add_location(code36, file$6, 193, 311, 35013);
    			add_location(p37, file$6, 193, 0, 34702);
    			attr_dev(pre25, "class", "language-js");
    			add_location(pre25, file$6, 194, 0, 35047);
    			add_location(code37, file$6, 195, 15, 35311);
    			add_location(p38, file$6, 195, 0, 35296);
    			attr_dev(pre26, "class", "language-js");
    			add_location(pre26, file$6, 196, 0, 35355);
    			add_location(hr9, file$6, 197, 0, 35684);
    			attr_dev(a11, "name", "state-object");
    			attr_dev(a11, "href", "#state-object");
    			add_location(a11, file$6, 198, 4, 35693);
    			add_location(h29, file$6, 198, 0, 35689);
    			add_location(code38, file$6, 199, 88, 35847);
    			add_location(p39, file$6, 199, 0, 35759);
    			attr_dev(pre27, "class", "language-js");
    			add_location(pre27, file$6, 200, 0, 35911);
    			add_location(hr10, file$6, 205, 0, 36776);
    			attr_dev(a12, "name", "catching-errors");
    			attr_dev(a12, "href", "#catching-errors");
    			add_location(a12, file$6, 206, 4, 36785);
    			add_location(h210, file$6, 206, 0, 36781);
    			add_location(p40, file$6, 208, 0, 36873);
    			add_location(blockquote3, file$6, 207, 0, 36860);
    			add_location(code39, file$6, 210, 45, 37049);
    			add_location(code40, file$6, 210, 127, 37131);
    			add_location(p41, file$6, 210, 0, 37004);
    			attr_dev(pre28, "class", "language-js");
    			add_location(pre28, file$6, 211, 0, 37303);
    			add_location(code41, file$6, 215, 47, 38155);
    			add_location(p42, file$6, 215, 0, 38108);
    			attr_dev(pre29, "class", "language-js");
    			add_location(pre29, file$6, 216, 0, 38274);
    			add_location(hr11, file$6, 223, 0, 39801);
    			attr_dev(a13, "name", "middlewares");
    			attr_dev(a13, "href", "#middlewares");
    			add_location(a13, file$6, 224, 4, 39810);
    			add_location(h211, file$6, 224, 0, 39806);
    			add_location(code42, file$6, 226, 42, 40005);
    			add_location(p43, file$6, 225, 0, 39873);
    			add_location(code43, file$6, 227, 54, 40261);
    			add_location(p44, file$6, 227, 0, 40207);
    			attr_dev(pre30, "class", "language-js");
    			add_location(pre30, file$6, 228, 0, 40286);
    			add_location(code44, file$6, 241, 192, 43170);
    			add_location(p45, file$6, 241, 0, 42978);
    			attr_dev(pre31, "class", "language-js");
    			add_location(pre31, file$6, 242, 0, 43199);
    			add_location(hr12, file$6, 254, 0, 45507);
    			attr_dev(a14, "name", "svelte-implementation");
    			attr_dev(a14, "href", "#svelte-implementation");
    			add_location(a14, file$6, 255, 4, 45516);
    			add_location(h212, file$6, 255, 0, 45512);
    			add_location(code45, file$6, 256, 7, 45616);
    			add_location(code46, file$6, 256, 86, 45695);
    			add_location(code47, file$6, 256, 110, 45719);
    			add_location(code48, file$6, 256, 137, 45746);
    			add_location(p46, file$6, 256, 0, 45609);
    			attr_dev(pre32, "class", "language-svelte");
    			add_location(pre32, file$6, 257, 0, 45783);
    			add_location(code49, file$6, 262, 152, 46768);
    			add_location(p47, file$6, 262, 0, 46616);
    			add_location(code50, file$6, 264, 10, 46834);
    			add_location(code51, file$6, 264, 72, 46896);
    			add_location(code52, file$6, 264, 100, 46924);
    			add_location(p48, file$6, 264, 0, 46824);
    			add_location(blockquote4, file$6, 263, 0, 46811);
    			attr_dev(pre33, "class", "language-svelte");
    			add_location(pre33, file$6, 266, 0, 47042);
    			add_location(hr13, file$6, 281, 0, 52053);
    			attr_dev(a15, "name", "changing-routes");
    			attr_dev(a15, "href", "#changing-routes");
    			add_location(a15, file$6, 282, 4, 52062);
    			add_location(h213, file$6, 282, 0, 52058);
    			add_location(code53, file$6, 283, 86, 52223);
    			add_location(p49, file$6, 283, 0, 52137);
    			add_location(code54, file$6, 284, 19, 52437);
    			add_location(code55, file$6, 284, 48, 52466);
    			add_location(code56, file$6, 285, 20, 52516);
    			add_location(code57, file$6, 285, 50, 52546);
    			add_location(p50, file$6, 284, 0, 52418);
    			add_location(code58, file$6, 286, 33, 52616);
    			add_location(code59, file$6, 286, 56, 52639);
    			add_location(code60, file$6, 286, 98, 52681);
    			add_location(code61, file$6, 286, 142, 52725);
    			add_location(p51, file$6, 286, 0, 52583);
    			add_location(code62, file$6, 287, 12, 53139);
    			add_location(code63, file$6, 287, 123, 53250);
    			add_location(p52, file$6, 287, 0, 53127);
    			attr_dev(pre34, "class", "language-svelte");
    			add_location(pre34, file$6, 288, 0, 53314);
    			add_location(code64, file$6, 292, 128, 54780);
    			add_location(p53, file$6, 292, 0, 54652);
    			attr_dev(pre35, "class", "language-svelte");
    			add_location(pre35, file$6, 293, 0, 54807);
    			add_location(p54, file$6, 297, 0, 56457);
    			attr_dev(pre36, "class", "language-svelte");
    			add_location(pre36, file$6, 298, 0, 56525);
    			add_location(code65, file$6, 306, 49, 60051);
    			add_location(p55, file$6, 306, 0, 60002);
    			attr_dev(pre37, "class", "language-svelte");
    			add_location(pre37, file$6, 307, 0, 60084);
    			add_location(code66, file$6, 312, 50, 61843);
    			add_location(p56, file$6, 312, 0, 61793);
    			attr_dev(pre38, "class", "language-js");
    			add_location(pre38, file$6, 313, 0, 61885);
    			add_location(p57, file$6, 316, 0, 62987);
    			attr_dev(pre39, "class", "language-js");
    			add_location(pre39, file$6, 317, 0, 63027);
    			add_location(p58, file$6, 323, 0, 63604);
    			attr_dev(pre40, "class", "language-svelte");
    			add_location(pre40, file$6, 324, 0, 63772);
    			add_location(hr14, file$6, 330, 0, 66447);
    			attr_dev(a16, "name", "programmatically-changing-routes");
    			attr_dev(a16, "href", "#programmatically-changing-routes");
    			add_location(a16, file$6, 331, 4, 66456);
    			add_location(h214, file$6, 331, 0, 66452);
    			add_location(code67, file$6, 332, 124, 66706);
    			add_location(code68, file$6, 332, 167, 66749);
    			add_location(code69, file$6, 332, 255, 66837);
    			add_location(p59, file$6, 332, 0, 66582);
    			add_location(code70, file$6, 333, 89, 67009);
    			add_location(code71, file$6, 333, 114, 67034);
    			add_location(code72, file$6, 333, 150, 67070);
    			add_location(code73, file$6, 333, 234, 67154);
    			add_location(p60, file$6, 333, 0, 66920);
    			add_location(p61, file$6, 334, 0, 67246);
    			attr_dev(pre41, "class", "language-js");
    			add_location(pre41, file$6, 335, 0, 67289);
    			attr_dev(pre42, "class", "language-js");
    			add_location(pre42, file$6, 339, 0, 68575);
    			add_location(code74, file$6, 344, 23, 69931);
    			add_location(code75, file$6, 344, 46, 69954);
    			add_location(code76, file$6, 344, 69, 69977);
    			add_location(code77, file$6, 344, 94, 70002);
    			add_location(p62, file$6, 344, 0, 69908);
    			add_location(code78, file$6, 345, 43, 70233);
    			add_location(code79, file$6, 345, 62, 70252);
    			add_location(code80, file$6, 345, 89, 70279);
    			add_location(p63, file$6, 345, 0, 70190);
    			attr_dev(pre43, "class", "language-svelte");
    			add_location(pre43, file$6, 346, 0, 70410);
    			add_location(code81, file$6, 353, 3, 72469);
    			add_location(code82, file$6, 353, 26, 72492);
    			add_location(p64, file$6, 353, 0, 72466);
    			attr_dev(pre44, "class", "language-js");
    			add_location(pre44, file$6, 354, 0, 72588);
    			add_location(hr15, file$6, 358, 0, 73383);
    			attr_dev(a17, "name", "quick-usage");
    			attr_dev(a17, "href", "#quick-usage");
    			add_location(a17, file$6, 359, 4, 73392);
    			add_location(h215, file$6, 359, 0, 73388);
    			attr_dev(pre45, "class", "language-svelte");
    			add_location(pre45, file$6, 360, 0, 73455);
    			add_location(p65, file$6, 395, 0, 79469);
    			attr_dev(pre46, "class", "language-js");
    			add_location(pre46, file$6, 396, 0, 79520);
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
    			insert_dev(target, hr0, anchor);
    			insert_dev(target, t10, anchor);
    			insert_dev(target, h20, anchor);
    			append_dev(h20, a2);
    			insert_dev(target, t12, anchor);
    			insert_dev(target, p2, anchor);
    			insert_dev(target, t14, anchor);
    			insert_dev(target, pre1, anchor);
    			pre1.innerHTML = raw1_value;
    			insert_dev(target, t15, anchor);
    			insert_dev(target, pre2, anchor);
    			pre2.innerHTML = raw2_value;
    			insert_dev(target, t16, anchor);
    			insert_dev(target, hr1, anchor);
    			insert_dev(target, t17, anchor);
    			insert_dev(target, h21, anchor);
    			append_dev(h21, a3);
    			insert_dev(target, t19, anchor);
    			insert_dev(target, p3, anchor);
    			insert_dev(target, t21, anchor);
    			insert_dev(target, pre3, anchor);
    			pre3.innerHTML = raw3_value;
    			insert_dev(target, t22, anchor);
    			insert_dev(target, hr2, anchor);
    			insert_dev(target, t23, anchor);
    			insert_dev(target, h22, anchor);
    			append_dev(h22, a4);
    			insert_dev(target, t25, anchor);
    			insert_dev(target, p4, anchor);
    			append_dev(p4, t26);
    			append_dev(p4, code0);
    			append_dev(p4, t28);
    			append_dev(p4, code1);
    			append_dev(p4, t30);
    			insert_dev(target, t31, anchor);
    			insert_dev(target, p5, anchor);
    			insert_dev(target, t33, anchor);
    			insert_dev(target, pre4, anchor);
    			pre4.innerHTML = raw4_value;
    			insert_dev(target, t34, anchor);
    			insert_dev(target, p6, anchor);
    			append_dev(p6, t35);
    			append_dev(p6, code2);
    			append_dev(p6, t37);
    			append_dev(p6, code3);
    			append_dev(p6, t39);
    			append_dev(p6, code4);
    			append_dev(p6, t41);
    			insert_dev(target, t42, anchor);
    			insert_dev(target, p7, anchor);
    			insert_dev(target, t44, anchor);
    			insert_dev(target, pre5, anchor);
    			pre5.innerHTML = raw5_value;
    			insert_dev(target, t45, anchor);
    			insert_dev(target, p8, anchor);
    			append_dev(p8, t46);
    			append_dev(p8, code5);
    			append_dev(p8, t48);
    			append_dev(p8, code6);
    			append_dev(p8, t50);
    			insert_dev(target, t51, anchor);
    			insert_dev(target, blockquote0, anchor);
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
    			append_dev(blockquote1, p12);
    			append_dev(p12, code12);
    			append_dev(p12, t71);
    			insert_dev(target, t72, anchor);
    			insert_dev(target, p13, anchor);
    			append_dev(p13, t73);
    			append_dev(p13, code13);
    			append_dev(p13, t75);
    			append_dev(p13, code14);
    			append_dev(p13, t77);
    			append_dev(p13, code15);
    			append_dev(p13, t79);
    			insert_dev(target, t80, anchor);
    			insert_dev(target, pre8, anchor);
    			pre8.innerHTML = raw8_value;
    			insert_dev(target, t81, anchor);
    			insert_dev(target, p14, anchor);
    			insert_dev(target, t83, anchor);
    			insert_dev(target, p15, anchor);
    			insert_dev(target, t85, anchor);
    			insert_dev(target, pre9, anchor);
    			pre9.innerHTML = raw9_value;
    			insert_dev(target, t86, anchor);
    			insert_dev(target, p16, anchor);
    			append_dev(p16, t87);
    			append_dev(p16, code16);
    			append_dev(p16, t89);
    			append_dev(p16, code17);
    			append_dev(p16, t91);
    			append_dev(p16, code18);
    			append_dev(p16, t93);
    			insert_dev(target, t94, anchor);
    			insert_dev(target, pre10, anchor);
    			pre10.innerHTML = raw10_value;
    			insert_dev(target, t95, anchor);
    			insert_dev(target, p17, anchor);
    			append_dev(p17, t96);
    			append_dev(p17, code19);
    			append_dev(p17, t98);
    			insert_dev(target, t99, anchor);
    			insert_dev(target, pre11, anchor);
    			pre11.innerHTML = raw11_value;
    			insert_dev(target, t100, anchor);
    			insert_dev(target, hr3, anchor);
    			insert_dev(target, t101, anchor);
    			insert_dev(target, h23, anchor);
    			append_dev(h23, a5);
    			insert_dev(target, t103, anchor);
    			insert_dev(target, p18, anchor);
    			insert_dev(target, t105, anchor);
    			insert_dev(target, pre12, anchor);
    			pre12.innerHTML = raw12_value;
    			insert_dev(target, t106, anchor);
    			insert_dev(target, p19, anchor);
    			insert_dev(target, t108, anchor);
    			insert_dev(target, pre13, anchor);
    			pre13.innerHTML = raw13_value;
    			insert_dev(target, t109, anchor);
    			insert_dev(target, p20, anchor);
    			append_dev(p20, t110);
    			append_dev(p20, code20);
    			append_dev(p20, t112);
    			insert_dev(target, t113, anchor);
    			insert_dev(target, p21, anchor);
    			insert_dev(target, t115, anchor);
    			insert_dev(target, pre14, anchor);
    			pre14.innerHTML = raw14_value;
    			insert_dev(target, t116, anchor);
    			insert_dev(target, p22, anchor);
    			insert_dev(target, t118, anchor);
    			insert_dev(target, pre15, anchor);
    			pre15.innerHTML = raw15_value;
    			insert_dev(target, t119, anchor);
    			insert_dev(target, p23, anchor);
    			insert_dev(target, t121, anchor);
    			insert_dev(target, pre16, anchor);
    			pre16.innerHTML = raw16_value;
    			insert_dev(target, t122, anchor);
    			insert_dev(target, blockquote2, anchor);
    			append_dev(blockquote2, p24);
    			append_dev(p24, t123);
    			append_dev(p24, code21);
    			append_dev(p24, t125);
    			append_dev(p24, code22);
    			append_dev(p24, t127);
    			append_dev(p24, code23);
    			append_dev(p24, t129);
    			insert_dev(target, t130, anchor);
    			insert_dev(target, hr4, anchor);
    			insert_dev(target, t131, anchor);
    			insert_dev(target, h24, anchor);
    			append_dev(h24, a6);
    			insert_dev(target, t133, anchor);
    			insert_dev(target, p25, anchor);
    			insert_dev(target, t135, anchor);
    			insert_dev(target, pre17, anchor);
    			pre17.innerHTML = raw17_value;
    			insert_dev(target, t136, anchor);
    			insert_dev(target, hr5, anchor);
    			insert_dev(target, t137, anchor);
    			insert_dev(target, h25, anchor);
    			append_dev(h25, a7);
    			insert_dev(target, t139, anchor);
    			insert_dev(target, p26, anchor);
    			insert_dev(target, t141, anchor);
    			insert_dev(target, pre18, anchor);
    			pre18.innerHTML = raw18_value;
    			insert_dev(target, t142, anchor);
    			insert_dev(target, hr6, anchor);
    			insert_dev(target, t143, anchor);
    			insert_dev(target, h26, anchor);
    			append_dev(h26, a8);
    			insert_dev(target, t145, anchor);
    			insert_dev(target, p27, anchor);
    			append_dev(p27, t146);
    			append_dev(p27, code24);
    			append_dev(p27, t148);
    			append_dev(p27, code25);
    			append_dev(p27, t150);
    			insert_dev(target, t151, anchor);
    			insert_dev(target, p28, anchor);
    			append_dev(p28, t152);
    			append_dev(p28, code26);
    			append_dev(p28, t154);
    			append_dev(p28, code27);
    			append_dev(p28, t156);
    			insert_dev(target, t157, anchor);
    			insert_dev(target, pre19, anchor);
    			pre19.innerHTML = raw19_value;
    			insert_dev(target, t158, anchor);
    			insert_dev(target, p29, anchor);
    			append_dev(p29, t159);
    			append_dev(p29, code28);
    			append_dev(p29, t161);
    			append_dev(p29, code29);
    			append_dev(p29, t163);
    			insert_dev(target, t164, anchor);
    			insert_dev(target, p30, anchor);
    			append_dev(p30, t165);
    			append_dev(p30, code30);
    			append_dev(p30, t167);
    			append_dev(p30, code31);
    			append_dev(p30, t169);
    			append_dev(p30, code32);
    			append_dev(p30, t171);
    			append_dev(p30, code33);
    			append_dev(p30, t173);
    			insert_dev(target, t174, anchor);
    			insert_dev(target, pre20, anchor);
    			pre20.innerHTML = raw20_value;
    			insert_dev(target, t175, anchor);
    			insert_dev(target, p31, anchor);
    			insert_dev(target, t177, anchor);
    			insert_dev(target, pre21, anchor);
    			pre21.innerHTML = raw21_value;
    			insert_dev(target, t178, anchor);
    			insert_dev(target, p32, anchor);
    			insert_dev(target, t180, anchor);
    			insert_dev(target, p33, anchor);
    			insert_dev(target, t182, anchor);
    			insert_dev(target, pre22, anchor);
    			pre22.innerHTML = raw22_value;
    			insert_dev(target, t183, anchor);
    			insert_dev(target, hr7, anchor);
    			insert_dev(target, t184, anchor);
    			insert_dev(target, h27, anchor);
    			append_dev(h27, a9);
    			insert_dev(target, t186, anchor);
    			insert_dev(target, p34, anchor);
    			insert_dev(target, t188, anchor);
    			insert_dev(target, p35, anchor);
    			insert_dev(target, t190, anchor);
    			insert_dev(target, pre23, anchor);
    			pre23.innerHTML = raw23_value;
    			insert_dev(target, t191, anchor);
    			insert_dev(target, p36, anchor);
    			append_dev(p36, t192);
    			append_dev(p36, code34);
    			append_dev(p36, t194);
    			insert_dev(target, t195, anchor);
    			insert_dev(target, pre24, anchor);
    			pre24.innerHTML = raw24_value;
    			insert_dev(target, t196, anchor);
    			insert_dev(target, hr8, anchor);
    			insert_dev(target, t197, anchor);
    			insert_dev(target, h28, anchor);
    			append_dev(h28, a10);
    			insert_dev(target, t199, anchor);
    			insert_dev(target, p37, anchor);
    			append_dev(p37, t200);
    			append_dev(p37, code35);
    			append_dev(p37, t202);
    			append_dev(p37, code36);
    			append_dev(p37, t204);
    			insert_dev(target, t205, anchor);
    			insert_dev(target, pre25, anchor);
    			pre25.innerHTML = raw25_value;
    			insert_dev(target, t206, anchor);
    			insert_dev(target, p38, anchor);
    			append_dev(p38, t207);
    			append_dev(p38, code37);
    			append_dev(p38, t209);
    			insert_dev(target, t210, anchor);
    			insert_dev(target, pre26, anchor);
    			pre26.innerHTML = raw26_value;
    			insert_dev(target, t211, anchor);
    			insert_dev(target, hr9, anchor);
    			insert_dev(target, t212, anchor);
    			insert_dev(target, h29, anchor);
    			append_dev(h29, a11);
    			insert_dev(target, t214, anchor);
    			insert_dev(target, p39, anchor);
    			append_dev(p39, t215);
    			append_dev(p39, code38);
    			append_dev(p39, t217);
    			insert_dev(target, t218, anchor);
    			insert_dev(target, pre27, anchor);
    			pre27.innerHTML = raw27_value;
    			insert_dev(target, t219, anchor);
    			insert_dev(target, hr10, anchor);
    			insert_dev(target, t220, anchor);
    			insert_dev(target, h210, anchor);
    			append_dev(h210, a12);
    			insert_dev(target, t222, anchor);
    			insert_dev(target, blockquote3, anchor);
    			append_dev(blockquote3, p40);
    			insert_dev(target, t224, anchor);
    			insert_dev(target, p41, anchor);
    			append_dev(p41, t225);
    			append_dev(p41, code39);
    			append_dev(p41, t227);
    			append_dev(p41, code40);
    			append_dev(p41, t229);
    			insert_dev(target, t230, anchor);
    			insert_dev(target, pre28, anchor);
    			pre28.innerHTML = raw28_value;
    			insert_dev(target, t231, anchor);
    			insert_dev(target, p42, anchor);
    			append_dev(p42, t232);
    			append_dev(p42, code41);
    			append_dev(p42, t234);
    			insert_dev(target, t235, anchor);
    			insert_dev(target, pre29, anchor);
    			pre29.innerHTML = raw29_value;
    			insert_dev(target, t236, anchor);
    			insert_dev(target, hr11, anchor);
    			insert_dev(target, t237, anchor);
    			insert_dev(target, h211, anchor);
    			append_dev(h211, a13);
    			insert_dev(target, t239, anchor);
    			insert_dev(target, p43, anchor);
    			append_dev(p43, t240);
    			append_dev(p43, code42);
    			append_dev(p43, t242);
    			insert_dev(target, t243, anchor);
    			insert_dev(target, p44, anchor);
    			append_dev(p44, t244);
    			append_dev(p44, code43);
    			append_dev(p44, t246);
    			insert_dev(target, t247, anchor);
    			insert_dev(target, pre30, anchor);
    			pre30.innerHTML = raw30_value;
    			insert_dev(target, t248, anchor);
    			insert_dev(target, p45, anchor);
    			append_dev(p45, t249);
    			append_dev(p45, code44);
    			append_dev(p45, t251);
    			insert_dev(target, t252, anchor);
    			insert_dev(target, pre31, anchor);
    			pre31.innerHTML = raw31_value;
    			insert_dev(target, t253, anchor);
    			insert_dev(target, hr12, anchor);
    			insert_dev(target, t254, anchor);
    			insert_dev(target, h212, anchor);
    			append_dev(h212, a14);
    			insert_dev(target, t256, anchor);
    			insert_dev(target, p46, anchor);
    			append_dev(p46, t257);
    			append_dev(p46, code45);
    			append_dev(p46, t259);
    			append_dev(p46, code46);
    			append_dev(p46, t261);
    			append_dev(p46, code47);
    			append_dev(p46, t263);
    			append_dev(p46, code48);
    			append_dev(p46, t265);
    			insert_dev(target, t266, anchor);
    			insert_dev(target, pre32, anchor);
    			pre32.innerHTML = raw32_value;
    			insert_dev(target, t267, anchor);
    			insert_dev(target, p47, anchor);
    			append_dev(p47, t268);
    			append_dev(p47, code49);
    			append_dev(p47, t270);
    			insert_dev(target, t271, anchor);
    			insert_dev(target, blockquote4, anchor);
    			append_dev(blockquote4, p48);
    			append_dev(p48, t272);
    			append_dev(p48, code50);
    			append_dev(p48, t274);
    			append_dev(p48, code51);
    			append_dev(p48, t276);
    			append_dev(p48, code52);
    			append_dev(p48, t278);
    			insert_dev(target, t279, anchor);
    			insert_dev(target, pre33, anchor);
    			pre33.innerHTML = raw33_value;
    			insert_dev(target, t280, anchor);
    			insert_dev(target, hr13, anchor);
    			insert_dev(target, t281, anchor);
    			insert_dev(target, h213, anchor);
    			append_dev(h213, a15);
    			insert_dev(target, t283, anchor);
    			insert_dev(target, p49, anchor);
    			append_dev(p49, t284);
    			append_dev(p49, code53);
    			append_dev(p49, t286);
    			insert_dev(target, t287, anchor);
    			insert_dev(target, p50, anchor);
    			append_dev(p50, t288);
    			append_dev(p50, code54);
    			append_dev(p50, t290);
    			append_dev(p50, code55);
    			append_dev(p50, t292);
    			append_dev(p50, code56);
    			append_dev(p50, t294);
    			append_dev(p50, code57);
    			insert_dev(target, t296, anchor);
    			insert_dev(target, p51, anchor);
    			append_dev(p51, t297);
    			append_dev(p51, code58);
    			append_dev(p51, t299);
    			append_dev(p51, code59);
    			append_dev(p51, t301);
    			append_dev(p51, code60);
    			append_dev(p51, t303);
    			append_dev(p51, code61);
    			append_dev(p51, t305);
    			insert_dev(target, t306, anchor);
    			insert_dev(target, p52, anchor);
    			append_dev(p52, t307);
    			append_dev(p52, code62);
    			append_dev(p52, t309);
    			append_dev(p52, code63);
    			append_dev(p52, t311);
    			insert_dev(target, t312, anchor);
    			insert_dev(target, pre34, anchor);
    			pre34.innerHTML = raw34_value;
    			insert_dev(target, t313, anchor);
    			insert_dev(target, p53, anchor);
    			append_dev(p53, t314);
    			append_dev(p53, code64);
    			append_dev(p53, t316);
    			insert_dev(target, t317, anchor);
    			insert_dev(target, pre35, anchor);
    			pre35.innerHTML = raw35_value;
    			insert_dev(target, t318, anchor);
    			insert_dev(target, p54, anchor);
    			insert_dev(target, t320, anchor);
    			insert_dev(target, pre36, anchor);
    			pre36.innerHTML = raw36_value;
    			insert_dev(target, t321, anchor);
    			insert_dev(target, p55, anchor);
    			append_dev(p55, t322);
    			append_dev(p55, code65);
    			append_dev(p55, t324);
    			insert_dev(target, t325, anchor);
    			insert_dev(target, pre37, anchor);
    			pre37.innerHTML = raw37_value;
    			insert_dev(target, t326, anchor);
    			insert_dev(target, p56, anchor);
    			append_dev(p56, t327);
    			append_dev(p56, code66);
    			append_dev(p56, t329);
    			insert_dev(target, t330, anchor);
    			insert_dev(target, pre38, anchor);
    			pre38.innerHTML = raw38_value;
    			insert_dev(target, t331, anchor);
    			insert_dev(target, p57, anchor);
    			insert_dev(target, t333, anchor);
    			insert_dev(target, pre39, anchor);
    			pre39.innerHTML = raw39_value;
    			insert_dev(target, t334, anchor);
    			insert_dev(target, p58, anchor);
    			insert_dev(target, t336, anchor);
    			insert_dev(target, pre40, anchor);
    			pre40.innerHTML = raw40_value;
    			insert_dev(target, t337, anchor);
    			insert_dev(target, hr14, anchor);
    			insert_dev(target, t338, anchor);
    			insert_dev(target, h214, anchor);
    			append_dev(h214, a16);
    			insert_dev(target, t340, anchor);
    			insert_dev(target, p59, anchor);
    			append_dev(p59, t341);
    			append_dev(p59, code67);
    			append_dev(p59, t343);
    			append_dev(p59, code68);
    			append_dev(p59, t345);
    			append_dev(p59, code69);
    			append_dev(p59, t347);
    			insert_dev(target, t348, anchor);
    			insert_dev(target, p60, anchor);
    			append_dev(p60, t349);
    			append_dev(p60, code70);
    			append_dev(p60, t351);
    			append_dev(p60, code71);
    			append_dev(p60, t353);
    			append_dev(p60, code72);
    			append_dev(p60, t355);
    			append_dev(p60, code73);
    			append_dev(p60, t357);
    			insert_dev(target, t358, anchor);
    			insert_dev(target, p61, anchor);
    			insert_dev(target, t360, anchor);
    			insert_dev(target, pre41, anchor);
    			pre41.innerHTML = raw41_value;
    			insert_dev(target, t361, anchor);
    			insert_dev(target, pre42, anchor);
    			pre42.innerHTML = raw42_value;
    			insert_dev(target, t362, anchor);
    			insert_dev(target, p62, anchor);
    			append_dev(p62, t363);
    			append_dev(p62, code74);
    			append_dev(p62, t365);
    			append_dev(p62, code75);
    			append_dev(p62, t367);
    			append_dev(p62, code76);
    			append_dev(p62, t369);
    			append_dev(p62, code77);
    			append_dev(p62, t371);
    			insert_dev(target, t372, anchor);
    			insert_dev(target, p63, anchor);
    			append_dev(p63, t373);
    			append_dev(p63, code78);
    			append_dev(p63, t375);
    			append_dev(p63, code79);
    			append_dev(p63, t377);
    			append_dev(p63, code80);
    			append_dev(p63, t379);
    			insert_dev(target, t380, anchor);
    			insert_dev(target, pre43, anchor);
    			pre43.innerHTML = raw43_value;
    			insert_dev(target, t381, anchor);
    			insert_dev(target, p64, anchor);
    			append_dev(p64, code81);
    			append_dev(p64, t383);
    			append_dev(p64, code82);
    			append_dev(p64, t385);
    			insert_dev(target, t386, anchor);
    			insert_dev(target, pre44, anchor);
    			pre44.innerHTML = raw44_value;
    			insert_dev(target, t387, anchor);
    			insert_dev(target, hr15, anchor);
    			insert_dev(target, t388, anchor);
    			insert_dev(target, h215, anchor);
    			append_dev(h215, a17);
    			insert_dev(target, t390, anchor);
    			insert_dev(target, pre45, anchor);
    			pre45.innerHTML = raw45_value;
    			insert_dev(target, t391, anchor);
    			insert_dev(target, p65, anchor);
    			insert_dev(target, t393, anchor);
    			insert_dev(target, pre46, anchor);
    			pre46.innerHTML = raw46_value;
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
    			if (detaching) detach_dev(hr0);
    			if (detaching) detach_dev(t10);
    			if (detaching) detach_dev(h20);
    			if (detaching) detach_dev(t12);
    			if (detaching) detach_dev(p2);
    			if (detaching) detach_dev(t14);
    			if (detaching) detach_dev(pre1);
    			if (detaching) detach_dev(t15);
    			if (detaching) detach_dev(pre2);
    			if (detaching) detach_dev(t16);
    			if (detaching) detach_dev(hr1);
    			if (detaching) detach_dev(t17);
    			if (detaching) detach_dev(h21);
    			if (detaching) detach_dev(t19);
    			if (detaching) detach_dev(p3);
    			if (detaching) detach_dev(t21);
    			if (detaching) detach_dev(pre3);
    			if (detaching) detach_dev(t22);
    			if (detaching) detach_dev(hr2);
    			if (detaching) detach_dev(t23);
    			if (detaching) detach_dev(h22);
    			if (detaching) detach_dev(t25);
    			if (detaching) detach_dev(p4);
    			if (detaching) detach_dev(t31);
    			if (detaching) detach_dev(p5);
    			if (detaching) detach_dev(t33);
    			if (detaching) detach_dev(pre4);
    			if (detaching) detach_dev(t34);
    			if (detaching) detach_dev(p6);
    			if (detaching) detach_dev(t42);
    			if (detaching) detach_dev(p7);
    			if (detaching) detach_dev(t44);
    			if (detaching) detach_dev(pre5);
    			if (detaching) detach_dev(t45);
    			if (detaching) detach_dev(p8);
    			if (detaching) detach_dev(t51);
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
    			if (detaching) detach_dev(t72);
    			if (detaching) detach_dev(p13);
    			if (detaching) detach_dev(t80);
    			if (detaching) detach_dev(pre8);
    			if (detaching) detach_dev(t81);
    			if (detaching) detach_dev(p14);
    			if (detaching) detach_dev(t83);
    			if (detaching) detach_dev(p15);
    			if (detaching) detach_dev(t85);
    			if (detaching) detach_dev(pre9);
    			if (detaching) detach_dev(t86);
    			if (detaching) detach_dev(p16);
    			if (detaching) detach_dev(t94);
    			if (detaching) detach_dev(pre10);
    			if (detaching) detach_dev(t95);
    			if (detaching) detach_dev(p17);
    			if (detaching) detach_dev(t99);
    			if (detaching) detach_dev(pre11);
    			if (detaching) detach_dev(t100);
    			if (detaching) detach_dev(hr3);
    			if (detaching) detach_dev(t101);
    			if (detaching) detach_dev(h23);
    			if (detaching) detach_dev(t103);
    			if (detaching) detach_dev(p18);
    			if (detaching) detach_dev(t105);
    			if (detaching) detach_dev(pre12);
    			if (detaching) detach_dev(t106);
    			if (detaching) detach_dev(p19);
    			if (detaching) detach_dev(t108);
    			if (detaching) detach_dev(pre13);
    			if (detaching) detach_dev(t109);
    			if (detaching) detach_dev(p20);
    			if (detaching) detach_dev(t113);
    			if (detaching) detach_dev(p21);
    			if (detaching) detach_dev(t115);
    			if (detaching) detach_dev(pre14);
    			if (detaching) detach_dev(t116);
    			if (detaching) detach_dev(p22);
    			if (detaching) detach_dev(t118);
    			if (detaching) detach_dev(pre15);
    			if (detaching) detach_dev(t119);
    			if (detaching) detach_dev(p23);
    			if (detaching) detach_dev(t121);
    			if (detaching) detach_dev(pre16);
    			if (detaching) detach_dev(t122);
    			if (detaching) detach_dev(blockquote2);
    			if (detaching) detach_dev(t130);
    			if (detaching) detach_dev(hr4);
    			if (detaching) detach_dev(t131);
    			if (detaching) detach_dev(h24);
    			if (detaching) detach_dev(t133);
    			if (detaching) detach_dev(p25);
    			if (detaching) detach_dev(t135);
    			if (detaching) detach_dev(pre17);
    			if (detaching) detach_dev(t136);
    			if (detaching) detach_dev(hr5);
    			if (detaching) detach_dev(t137);
    			if (detaching) detach_dev(h25);
    			if (detaching) detach_dev(t139);
    			if (detaching) detach_dev(p26);
    			if (detaching) detach_dev(t141);
    			if (detaching) detach_dev(pre18);
    			if (detaching) detach_dev(t142);
    			if (detaching) detach_dev(hr6);
    			if (detaching) detach_dev(t143);
    			if (detaching) detach_dev(h26);
    			if (detaching) detach_dev(t145);
    			if (detaching) detach_dev(p27);
    			if (detaching) detach_dev(t151);
    			if (detaching) detach_dev(p28);
    			if (detaching) detach_dev(t157);
    			if (detaching) detach_dev(pre19);
    			if (detaching) detach_dev(t158);
    			if (detaching) detach_dev(p29);
    			if (detaching) detach_dev(t164);
    			if (detaching) detach_dev(p30);
    			if (detaching) detach_dev(t174);
    			if (detaching) detach_dev(pre20);
    			if (detaching) detach_dev(t175);
    			if (detaching) detach_dev(p31);
    			if (detaching) detach_dev(t177);
    			if (detaching) detach_dev(pre21);
    			if (detaching) detach_dev(t178);
    			if (detaching) detach_dev(p32);
    			if (detaching) detach_dev(t180);
    			if (detaching) detach_dev(p33);
    			if (detaching) detach_dev(t182);
    			if (detaching) detach_dev(pre22);
    			if (detaching) detach_dev(t183);
    			if (detaching) detach_dev(hr7);
    			if (detaching) detach_dev(t184);
    			if (detaching) detach_dev(h27);
    			if (detaching) detach_dev(t186);
    			if (detaching) detach_dev(p34);
    			if (detaching) detach_dev(t188);
    			if (detaching) detach_dev(p35);
    			if (detaching) detach_dev(t190);
    			if (detaching) detach_dev(pre23);
    			if (detaching) detach_dev(t191);
    			if (detaching) detach_dev(p36);
    			if (detaching) detach_dev(t195);
    			if (detaching) detach_dev(pre24);
    			if (detaching) detach_dev(t196);
    			if (detaching) detach_dev(hr8);
    			if (detaching) detach_dev(t197);
    			if (detaching) detach_dev(h28);
    			if (detaching) detach_dev(t199);
    			if (detaching) detach_dev(p37);
    			if (detaching) detach_dev(t205);
    			if (detaching) detach_dev(pre25);
    			if (detaching) detach_dev(t206);
    			if (detaching) detach_dev(p38);
    			if (detaching) detach_dev(t210);
    			if (detaching) detach_dev(pre26);
    			if (detaching) detach_dev(t211);
    			if (detaching) detach_dev(hr9);
    			if (detaching) detach_dev(t212);
    			if (detaching) detach_dev(h29);
    			if (detaching) detach_dev(t214);
    			if (detaching) detach_dev(p39);
    			if (detaching) detach_dev(t218);
    			if (detaching) detach_dev(pre27);
    			if (detaching) detach_dev(t219);
    			if (detaching) detach_dev(hr10);
    			if (detaching) detach_dev(t220);
    			if (detaching) detach_dev(h210);
    			if (detaching) detach_dev(t222);
    			if (detaching) detach_dev(blockquote3);
    			if (detaching) detach_dev(t224);
    			if (detaching) detach_dev(p41);
    			if (detaching) detach_dev(t230);
    			if (detaching) detach_dev(pre28);
    			if (detaching) detach_dev(t231);
    			if (detaching) detach_dev(p42);
    			if (detaching) detach_dev(t235);
    			if (detaching) detach_dev(pre29);
    			if (detaching) detach_dev(t236);
    			if (detaching) detach_dev(hr11);
    			if (detaching) detach_dev(t237);
    			if (detaching) detach_dev(h211);
    			if (detaching) detach_dev(t239);
    			if (detaching) detach_dev(p43);
    			if (detaching) detach_dev(t243);
    			if (detaching) detach_dev(p44);
    			if (detaching) detach_dev(t247);
    			if (detaching) detach_dev(pre30);
    			if (detaching) detach_dev(t248);
    			if (detaching) detach_dev(p45);
    			if (detaching) detach_dev(t252);
    			if (detaching) detach_dev(pre31);
    			if (detaching) detach_dev(t253);
    			if (detaching) detach_dev(hr12);
    			if (detaching) detach_dev(t254);
    			if (detaching) detach_dev(h212);
    			if (detaching) detach_dev(t256);
    			if (detaching) detach_dev(p46);
    			if (detaching) detach_dev(t266);
    			if (detaching) detach_dev(pre32);
    			if (detaching) detach_dev(t267);
    			if (detaching) detach_dev(p47);
    			if (detaching) detach_dev(t271);
    			if (detaching) detach_dev(blockquote4);
    			if (detaching) detach_dev(t279);
    			if (detaching) detach_dev(pre33);
    			if (detaching) detach_dev(t280);
    			if (detaching) detach_dev(hr13);
    			if (detaching) detach_dev(t281);
    			if (detaching) detach_dev(h213);
    			if (detaching) detach_dev(t283);
    			if (detaching) detach_dev(p49);
    			if (detaching) detach_dev(t287);
    			if (detaching) detach_dev(p50);
    			if (detaching) detach_dev(t296);
    			if (detaching) detach_dev(p51);
    			if (detaching) detach_dev(t306);
    			if (detaching) detach_dev(p52);
    			if (detaching) detach_dev(t312);
    			if (detaching) detach_dev(pre34);
    			if (detaching) detach_dev(t313);
    			if (detaching) detach_dev(p53);
    			if (detaching) detach_dev(t317);
    			if (detaching) detach_dev(pre35);
    			if (detaching) detach_dev(t318);
    			if (detaching) detach_dev(p54);
    			if (detaching) detach_dev(t320);
    			if (detaching) detach_dev(pre36);
    			if (detaching) detach_dev(t321);
    			if (detaching) detach_dev(p55);
    			if (detaching) detach_dev(t325);
    			if (detaching) detach_dev(pre37);
    			if (detaching) detach_dev(t326);
    			if (detaching) detach_dev(p56);
    			if (detaching) detach_dev(t330);
    			if (detaching) detach_dev(pre38);
    			if (detaching) detach_dev(t331);
    			if (detaching) detach_dev(p57);
    			if (detaching) detach_dev(t333);
    			if (detaching) detach_dev(pre39);
    			if (detaching) detach_dev(t334);
    			if (detaching) detach_dev(p58);
    			if (detaching) detach_dev(t336);
    			if (detaching) detach_dev(pre40);
    			if (detaching) detach_dev(t337);
    			if (detaching) detach_dev(hr14);
    			if (detaching) detach_dev(t338);
    			if (detaching) detach_dev(h214);
    			if (detaching) detach_dev(t340);
    			if (detaching) detach_dev(p59);
    			if (detaching) detach_dev(t348);
    			if (detaching) detach_dev(p60);
    			if (detaching) detach_dev(t358);
    			if (detaching) detach_dev(p61);
    			if (detaching) detach_dev(t360);
    			if (detaching) detach_dev(pre41);
    			if (detaching) detach_dev(t361);
    			if (detaching) detach_dev(pre42);
    			if (detaching) detach_dev(t362);
    			if (detaching) detach_dev(p62);
    			if (detaching) detach_dev(t372);
    			if (detaching) detach_dev(p63);
    			if (detaching) detach_dev(t380);
    			if (detaching) detach_dev(pre43);
    			if (detaching) detach_dev(t381);
    			if (detaching) detach_dev(p64);
    			if (detaching) detach_dev(t386);
    			if (detaching) detach_dev(pre44);
    			if (detaching) detach_dev(t387);
    			if (detaching) detach_dev(hr15);
    			if (detaching) detach_dev(t388);
    			if (detaching) detach_dev(h215);
    			if (detaching) detach_dev(t390);
    			if (detaching) detach_dev(pre45);
    			if (detaching) detach_dev(t391);
    			if (detaching) detach_dev(p65);
    			if (detaching) detach_dev(t393);
    			if (detaching) detach_dev(pre46);
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

    function instance$8($$self, $$props) {
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
    		init(this, options, instance$8, create_fragment$8, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "README",
    			options,
    			id: create_fragment$8.name
    		});
    	}
    }

    /* src\pages\documentation.svx generated by Svelte v3.31.0 */

    function create_fragment$9(ctx) {
    	let doc;
    	let current;
    	doc = new README({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(doc.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(doc, target, anchor);
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
    			destroy_component(doc, detaching);
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
    	validate_slots("Documentation", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Documentation> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ Doc: README });
    	return [];
    }

    class Documentation$1 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$9, create_fragment$9, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Documentation",
    			options,
    			id: create_fragment$9.name
    		});
    	}
    }

    /* ..\CHANGELOG.md generated by Svelte v3.31.0 */

    const file$7 = "..\\CHANGELOG.md";

    function create_fragment$a(ctx) {
    	let h1;
    	let t1;
    	let h2;
    	let a;
    	let t3;
    	let ul;
    	let li0;
    	let strong0;
    	let em0;
    	let t5;
    	let t6;
    	let li1;
    	let strong1;
    	let em1;
    	let t8;

    	const block = {
    		c: function create() {
    			h1 = element("h1");
    			h1.textContent = "Changelog";
    			t1 = space();
    			h2 = element("h2");
    			a = element("a");
    			a.textContent = "1.0.23";
    			t3 = space();
    			ul = element("ul");
    			li0 = element("li");
    			strong0 = element("strong");
    			em0 = element("em");
    			em0.textContent = "Feature:";
    			t5 = text(" decorator props");
    			t6 = space();
    			li1 = element("li");
    			strong1 = element("strong");
    			em1 = element("em");
    			em1.textContent = "Fix:";
    			t8 = text(" decorator chaining");
    			add_location(h1, file$7, 1, 0, 1);
    			attr_dev(a, "name", "1.0.23");
    			attr_dev(a, "href", "#1.0.23");
    			add_location(a, file$7, 2, 4, 24);
    			add_location(h2, file$7, 2, 0, 20);
    			add_location(em0, file$7, 4, 12, 89);
    			add_location(strong0, file$7, 4, 4, 81);
    			add_location(li0, file$7, 4, 0, 77);
    			add_location(em1, file$7, 5, 12, 149);
    			add_location(strong1, file$7, 5, 4, 141);
    			add_location(li1, file$7, 5, 0, 137);
    			add_location(ul, file$7, 3, 0, 72);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h1, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, h2, anchor);
    			append_dev(h2, a);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, ul, anchor);
    			append_dev(ul, li0);
    			append_dev(li0, strong0);
    			append_dev(strong0, em0);
    			append_dev(li0, t5);
    			append_dev(ul, t6);
    			append_dev(ul, li1);
    			append_dev(li1, strong1);
    			append_dev(strong1, em1);
    			append_dev(li1, t8);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h1);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(h2);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(ul);
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

    function instance$a($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("CHANGELOG", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<CHANGELOG> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class CHANGELOG extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$a, create_fragment$a, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "CHANGELOG",
    			options,
    			id: create_fragment$a.name
    		});
    	}
    }

    /* README.md generated by Svelte v3.31.0 */

    const file$8 = "README.md";

    function create_fragment$b(ctx) {
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
    	let blockquote;
    	let p2;
    	let t9;
    	let code0;
    	let t11;
    	let code1;
    	let t13;
    	let t14;
    	let h31;
    	let a1;
    	let t16;
    	let p3;
    	let t18;
    	let pre1;

    	let raw1_value = `<code class="language-svelte"><span class="token comment">&lt;!-- component.svelte --></span>
<span class="token tag"><span class="token tag"><span class="token punctuation">&lt;</span>script</span><span class="token punctuation">></span></span><span class="token script"><span class="token language-javascript">
  <span class="token keyword">import</span> RouterComponent<span class="token punctuation">,</span> <span class="token punctuation">&#123;</span> context <span class="token punctuation">&#125;</span> <span class="token keyword">from</span> <span class="token string">'svelte-standalone-router'</span><span class="token punctuation">;</span>

  <span class="token comment">// pages</span>
  <span class="token keyword">import</span> Index <span class="token keyword">from</span> <span class="token string">'./pages/index.svelte'</span><span class="token punctuation">;</span>
  <span class="token keyword">import</span> About <span class="token keyword">from</span> <span class="token string">'./pages/about.svelte'</span><span class="token punctuation">;</span>
  <span class="token keyword">import</span> Contact <span class="token keyword">from</span> <span class="token string">'./pages/contact.svelte'</span><span class="token punctuation">;</span>
  <span class="token keyword">import</span> ErrorPage <span class="token keyword">from</span> <span class="token string">'./pages/error.svelte'</span><span class="token punctuation">;</span>

  <span class="token comment">// implementaiton</span>
  <span class="token keyword">const</span> app <span class="token operator">=</span> <span class="token function">context</span><span class="token punctuation">(</span><span class="token punctuation">&#123;</span> initial<span class="token operator">:</span> location<span class="token punctuation">.</span>pathname <span class="token punctuation">&#125;</span><span class="token punctuation">)</span><span class="token punctuation">;</span>

  <span class="token comment">// catch fallbacks</span>
  app<span class="token punctuation">.</span><span class="token function">catch</span><span class="token punctuation">(</span><span class="token punctuation">(</span><span class="token parameter">req<span class="token punctuation">,</span> res<span class="token punctuation">,</span> props</span><span class="token punctuation">)</span> <span class="token operator">=></span> res<span class="token punctuation">.</span><span class="token function">send</span><span class="token punctuation">(</span>ErrorPage<span class="token punctuation">)</span><span class="token punctuation">)</span><span class="token punctuation">;</span>

  <span class="token comment">// routes</span>
  app<span class="token punctuation">.</span><span class="token function">get</span><span class="token punctuation">(</span><span class="token string">'/'</span><span class="token punctuation">,</span> <span class="token punctuation">(</span><span class="token parameter">req<span class="token punctuation">,</span> res</span><span class="token punctuation">)</span> <span class="token operator">=></span> res<span class="token punctuation">.</span><span class="token function">send</span><span class="token punctuation">(</span>Index<span class="token punctuation">)</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
  app<span class="token punctuation">.</span><span class="token function">get</span><span class="token punctuation">(</span><span class="token string">'/about'</span><span class="token punctuation">,</span> <span class="token punctuation">(</span><span class="token parameter">req<span class="token punctuation">,</span> res</span><span class="token punctuation">)</span> <span class="token operator">=></span> res<span class="token punctuation">.</span><span class="token function">send</span><span class="token punctuation">(</span>About<span class="token punctuation">)</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
  app<span class="token punctuation">.</span><span class="token function">get</span><span class="token punctuation">(</span><span class="token string">'/contact'</span><span class="token punctuation">,</span> <span class="token punctuation">(</span><span class="token parameter">req<span class="token punctuation">,</span> res</span><span class="token punctuation">)</span> <span class="token operator">=></span> res<span class="token punctuation">.</span><span class="token function">send</span><span class="token punctuation">(</span>Contact<span class="token punctuation">)</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
</span></span><span class="token tag"><span class="token tag"><span class="token punctuation">&lt;/</span>script</span><span class="token punctuation">></span></span>

<span class="token tag"><span class="token tag"><span class="token punctuation">&lt;</span>main</span><span class="token punctuation">></span></span>
  <span class="token tag"><span class="token tag"><span class="token punctuation">&lt;</span>RouterComponent</span> <span class="token punctuation">/></span></span>
<span class="token tag"><span class="token tag"><span class="token punctuation">&lt;/</span>main</span><span class="token punctuation">></span></span></code>` + "";

    	let t19;
    	let h32;
    	let a2;
    	let t21;
    	let p4;
    	let t22;
    	let code2;
    	let t24;
    	let t25;
    	let pre2;

    	let raw2_value = `<code class="language-svelte"><span class="token comment">&lt;!-- component.svelte --></span>
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
  <span class="token tag"><span class="token tag"><span class="token punctuation">&lt;</span>a</span> <span class="token attr-name">href</span><span class="token attr-value"><span class="token punctuation">=</span><span class="token punctuation">"</span>/<span class="token punctuation">"</span></span> <span class="token attr-name"><span class="token namespace">use:</span>link</span><span class="token punctuation">></span></span>Index<span class="token tag"><span class="token tag"><span class="token punctuation">&lt;/</span>a</span><span class="token punctuation">></span></span>
  <span class="token tag"><span class="token tag"><span class="token punctuation">&lt;</span>a</span> <span class="token attr-name">href</span><span class="token attr-value"><span class="token punctuation">=</span><span class="token punctuation">"</span>/todos<span class="token punctuation">"</span></span> <span class="token attr-name"><span class="token namespace">use:</span>link</span><span class="token punctuation">></span></span>Todos<span class="token tag"><span class="token tag"><span class="token punctuation">&lt;/</span>a</span><span class="token punctuation">></span></span>
  <span class="token tag"><span class="token tag"><span class="token punctuation">&lt;</span>a</span> <span class="token attr-name">href</span><span class="token attr-value"><span class="token punctuation">=</span><span class="token punctuation">"</span>/users<span class="token punctuation">"</span></span> <span class="token attr-name"><span class="token namespace">use:</span>link</span><span class="token punctuation">></span></span>Users<span class="token tag"><span class="token tag"><span class="token punctuation">&lt;/</span>a</span><span class="token punctuation">></span></span>
  <span class="token tag"><span class="token tag"><span class="token punctuation">&lt;</span>a</span> <span class="token attr-name">href</span><span class="token attr-value"><span class="token punctuation">=</span><span class="token punctuation">"</span>/posts<span class="token punctuation">"</span></span> <span class="token attr-name"><span class="token namespace">use:</span>link</span><span class="token punctuation">></span></span>Posts<span class="token tag"><span class="token tag"><span class="token punctuation">&lt;/</span>a</span><span class="token punctuation">></span></span>
  <span class="token tag"><span class="token tag"><span class="token punctuation">&lt;</span>a</span> <span class="token attr-name">href</span><span class="token attr-value"><span class="token punctuation">=</span><span class="token punctuation">"</span>/invalid-endpoint<span class="token punctuation">"</span></span> <span class="token attr-name"><span class="token namespace">use:</span>link</span><span class="token punctuation">></span></span>invalid endpoint<span class="token tag"><span class="token tag"><span class="token punctuation">&lt;/</span>a</span><span class="token punctuation">></span></span>
<span class="token tag"><span class="token tag"><span class="token punctuation">&lt;/</span>nav</span><span class="token punctuation">></span></span>

<span class="token tag"><span class="token tag"><span class="token punctuation">&lt;</span>main</span><span class="token punctuation">></span></span>
  <span class="token tag"><span class="token tag"><span class="token punctuation">&lt;</span>RouterComponent</span> <span class="token attr-name"><span class="token namespace">let:</span>component</span> <span class="token attr-name"><span class="token namespace">let:</span>props</span><span class="token punctuation">></span></span>
    <span class="token language-javascript"><span class="token punctuation">&#123;</span>#key component<span class="token punctuation">&#125;</span></span>
      <span class="token tag"><span class="token tag"><span class="token punctuation">&lt;</span>div</span> <span class="token attr-name">class</span><span class="token attr-value"><span class="token punctuation">=</span><span class="token punctuation">"</span>router<span class="token punctuation">"</span></span> <span class="token attr-name"><span class="token namespace">in:</span>fade</span><span class="token punctuation">></span></span>
        <span class="token tag"><span class="token tag"><span class="token punctuation">&lt;</span><span class="token namespace">svelte:</span>component</span> <span class="token attr-name">this=</span><span class="token language-javascript"><span class="token punctuation">&#123;</span>component<span class="token punctuation">&#125;</span></span> <span class="token language-javascript"><span class="token punctuation">&#123;</span><span class="token operator">...</span>props<span class="token punctuation">&#125;</span></span> <span class="token punctuation">/></span></span>
      <span class="token tag"><span class="token tag"><span class="token punctuation">&lt;/</span>div</span><span class="token punctuation">></span></span>
    <span class="token language-javascript"><span class="token punctuation">&#123;</span><span class="token operator">/</span>key<span class="token punctuation">&#125;</span></span>
  <span class="token tag"><span class="token tag"><span class="token punctuation">&lt;/</span>RouterComponent</span><span class="token punctuation">></span></span>
<span class="token tag"><span class="token tag"><span class="token punctuation">&lt;/</span>main</span><span class="token punctuation">></span></span></code>` + "";

    	let t26;
    	let h33;
    	let a3;
    	let t28;
    	let p5;
    	let t29;
    	let code3;
    	let t31;
    	let t32;
    	let pre3;

    	let raw3_value = `<code class="language-svelte"><span class="token comment">&lt;!-- component.svelte --></span>
<span class="token tag"><span class="token tag"><span class="token punctuation">&lt;</span>script</span><span class="token punctuation">></span></span><span class="token script"><span class="token language-javascript">
    <span class="token comment">// import the decorator helper function</span>
  <span class="token keyword">import</span> <span class="token punctuation">&#123;</span> decorator <span class="token punctuation">&#125;</span> <span class="token keyword">from</span> <span class="token string">'svelte-standalone-router'</span><span class="token punctuation">;</span>
  <span class="token comment">// create a new decorator with the wrapping component. First argument is the layout(svelte-component)</span>
  <span class="token comment">// and the following arguments are middleware attached to this decorator. so all calls will call </span>
  <span class="token comment">// with said applied middlewares.</span>
  <span class="token keyword">const</span> main <span class="token operator">=</span> <span class="token function">decorator</span><span class="token punctuation">(</span>_layout<span class="token punctuation">,</span> hasAuth<span class="token punctuation">,</span> logger<span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token comment">// create your new views with the decorator. The decorator </span>
  <span class="token comment">// works exactly like how you would use app.get('/', ...); </span>
  <span class="token keyword">const</span> root <span class="token operator">=</span> <span class="token function">main</span><span class="token punctuation">(</span><span class="token string">'/main'</span><span class="token punctuation">,</span> <span class="token punctuation">(</span><span class="token parameter">req<span class="token punctuation">,</span> res</span><span class="token punctuation">)</span> <span class="token operator">=></span> res<span class="token punctuation">.</span><span class="token function">send</span><span class="token punctuation">(</span>Index<span class="token punctuation">)</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token comment">// and just like normal get routes you can chain them together</span>
  <span class="token comment">// they will then use the same decorator and concatenate the </span>
  <span class="token comment">// parent route with it's own route. i.e '/main/contact' in this case</span>
  root<span class="token punctuation">.</span><span class="token function">get</span><span class="token punctuation">(</span><span class="token string">'/contact'</span><span class="token punctuation">,</span> <span class="token punctuation">(</span><span class="token parameter">req<span class="token punctuation">,</span> res</span><span class="token punctuation">)</span> <span class="token operator">=></span> res<span class="token punctuation">.</span><span class="token function">send</span><span class="token punctuation">(</span>Contact<span class="token punctuation">)</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token comment">// however you could also do it like this which yields the same result</span>
  <span class="token function">main</span><span class="token punctuation">(</span><span class="token string">'/main/contact'</span><span class="token punctuation">,</span> <span class="token punctuation">(</span><span class="token parameter">req<span class="token punctuation">,</span> res</span><span class="token punctuation">)</span> <span class="token operator">=></span> res<span class="token punctuation">.</span><span class="token function">send</span><span class="token punctuation">(</span>Contact<span class="token punctuation">)</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
</span></span><span class="token tag"><span class="token tag"><span class="token punctuation">&lt;/</span>script</span><span class="token punctuation">></span></span>

<span class="token tag"><span class="token tag"><span class="token punctuation">&lt;</span>main</span><span class="token punctuation">></span></span>
  <span class="token comment">&lt;!-- Since decorator needs to be wrapped there is another slot property(let:decorator) passed back to the component. --></span>
  <span class="token tag"><span class="token tag"><span class="token punctuation">&lt;</span>RouterComponent</span> <span class="token attr-name"><span class="token namespace">let:</span>decorator</span> <span class="token attr-name"><span class="token namespace">let:</span>component</span> <span class="token attr-name"><span class="token namespace">let:</span>props</span><span class="token punctuation">></span></span>
    <span class="token language-javascript"><span class="token punctuation">&#123;</span>#key component<span class="token punctuation">&#125;</span></span>
      <span class="token language-javascript"><span class="token punctuation">&#123;</span>#<span class="token keyword">if</span> decorator<span class="token punctuation">&#125;</span></span>
        <span class="token tag"><span class="token tag"><span class="token punctuation">&lt;</span><span class="token namespace">svelte:</span>component</span> <span class="token attr-name">this=</span><span class="token language-javascript"><span class="token punctuation">&#123;</span>decorator<span class="token punctuation">&#125;</span></span><span class="token punctuation">></span></span>
          <span class="token tag"><span class="token tag"><span class="token punctuation">&lt;</span>div</span> <span class="token attr-name"><span class="token namespace">in:</span>fade</span><span class="token punctuation">></span></span><span class="token tag"><span class="token tag"><span class="token punctuation">&lt;</span><span class="token namespace">svelte:</span>component</span> <span class="token attr-name">this=</span><span class="token language-javascript"><span class="token punctuation">&#123;</span>component<span class="token punctuation">&#125;</span></span> <span class="token language-javascript"><span class="token punctuation">&#123;</span><span class="token operator">...</span>props<span class="token punctuation">&#125;</span></span><span class="token punctuation">></span></span><span class="token tag"><span class="token tag"><span class="token punctuation">&lt;/</span><span class="token namespace">svelte:</span>component</span><span class="token punctuation">></span></span><span class="token tag"><span class="token tag"><span class="token punctuation">&lt;/</span>div</span><span class="token punctuation">></span></span>
        <span class="token tag"><span class="token tag"><span class="token punctuation">&lt;/</span><span class="token namespace">svelte:</span>component</span><span class="token punctuation">></span></span>
      <span class="token language-javascript"><span class="token punctuation">&#123;</span><span class="token operator">:</span><span class="token keyword">else</span><span class="token punctuation">&#125;</span></span>
        <span class="token tag"><span class="token tag"><span class="token punctuation">&lt;</span>div</span> <span class="token attr-name"><span class="token namespace">in:</span>fade</span><span class="token punctuation">></span></span><span class="token tag"><span class="token tag"><span class="token punctuation">&lt;</span><span class="token namespace">svelte:</span>component</span> <span class="token attr-name">this=</span><span class="token language-javascript"><span class="token punctuation">&#123;</span>component<span class="token punctuation">&#125;</span></span> <span class="token language-javascript"><span class="token punctuation">&#123;</span><span class="token operator">...</span>props<span class="token punctuation">&#125;</span></span><span class="token punctuation">></span></span><span class="token tag"><span class="token tag"><span class="token punctuation">&lt;/</span><span class="token namespace">svelte:</span>component</span><span class="token punctuation">></span></span><span class="token tag"><span class="token tag"><span class="token punctuation">&lt;/</span>div</span><span class="token punctuation">></span></span>
      <span class="token language-javascript"><span class="token punctuation">&#123;</span><span class="token operator">/</span><span class="token keyword">if</span><span class="token punctuation">&#125;</span></span>
    <span class="token language-javascript"><span class="token punctuation">&#123;</span><span class="token operator">/</span>key<span class="token punctuation">&#125;</span></span>
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
    			blockquote = element("blockquote");
    			p2 = element("p");
    			t9 = text("Remember that only if you want to modify the view before it’s rendered is when you have to create your own ");
    			code0 = element("code");
    			code0.textContent = "svelte:component";
    			t11 = text("’s from the returned props.\nOtherwise simply initialize the ");
    			code1 = element("code");
    			code1.textContent = "RouterComponent";
    			t13 = text(" and decorators and components work as is.");
    			t14 = space();
    			h31 = element("h3");
    			a1 = element("a");
    			a1.textContent = "Basic";
    			t16 = space();
    			p3 = element("p");
    			p3.textContent = "Minimal example with static routes";
    			t18 = space();
    			pre1 = element("pre");
    			t19 = space();
    			h32 = element("h3");
    			a2 = element("a");
    			a2.textContent = "Advanced example";
    			t21 = space();
    			p4 = element("p");
    			t22 = text("A more complex example showing how to preload data and decoupling business logic from the component and how to add a transition on route change by utilizing sveltes ");
    			code2 = element("code");
    			code2.textContent = "#key";
    			t24 = text(" along with slotted parameters.");
    			t25 = space();
    			pre2 = element("pre");
    			t26 = space();
    			h33 = element("h3");
    			a3 = element("a");
    			a3.textContent = "Decorators";
    			t28 = space();
    			p5 = element("p");
    			t29 = text("Often times it would be nice to be able to wrap your views in an outer ");
    			code3 = element("code");
    			code3.textContent = "layout";
    			t31 = text(" wrapper. That is what decorators do. You define your\nwrapping component and your view will be loaded inside the default slot. This way you can toggle sidebar navigation or layout structure\ndepending on what content your want to display.");
    			t32 = space();
    			pre3 = element("pre");
    			add_location(h1, file$8, 1, 0, 1);
    			add_location(p0, file$8, 2, 0, 25);
    			attr_dev(a0, "name", "installation");
    			attr_dev(a0, "href", "#installation");
    			add_location(a0, file$8, 3, 4, 144);
    			add_location(h30, file$8, 3, 0, 140);
    			add_location(p1, file$8, 4, 0, 210);
    			attr_dev(pre0, "class", "language-js");
    			add_location(pre0, file$8, 5, 0, 273);
    			add_location(code0, file$8, 7, 110, 648);
    			add_location(code1, file$8, 8, 32, 737);
    			add_location(p2, file$8, 7, 0, 538);
    			add_location(blockquote, file$8, 6, 0, 525);
    			attr_dev(a1, "name", "basic");
    			attr_dev(a1, "href", "#basic");
    			add_location(a1, file$8, 10, 4, 830);
    			add_location(h31, file$8, 10, 0, 826);
    			add_location(p3, file$8, 11, 0, 875);
    			attr_dev(pre1, "class", "language-svelte");
    			add_location(pre1, file$8, 12, 0, 917);
    			attr_dev(a2, "name", "advanced");
    			attr_dev(a2, "href", "#advanced");
    			add_location(a2, file$8, 37, 4, 6275);
    			add_location(h32, file$8, 37, 0, 6271);
    			add_location(code2, file$8, 38, 168, 6505);
    			add_location(p4, file$8, 38, 0, 6337);
    			attr_dev(pre2, "class", "language-svelte");
    			add_location(pre2, file$8, 39, 0, 6558);
    			attr_dev(a3, "name", "decorators");
    			attr_dev(a3, "href", "#decorators");
    			add_location(a3, file$8, 93, 4, 20470);
    			add_location(h33, file$8, 93, 0, 20466);
    			add_location(code3, file$8, 94, 74, 20604);
    			add_location(p5, file$8, 94, 0, 20530);
    			attr_dev(pre3, "class", "language-svelte");
    			add_location(pre3, file$8, 97, 0, 20865);
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
    			insert_dev(target, blockquote, anchor);
    			append_dev(blockquote, p2);
    			append_dev(p2, t9);
    			append_dev(p2, code0);
    			append_dev(p2, t11);
    			append_dev(p2, code1);
    			append_dev(p2, t13);
    			insert_dev(target, t14, anchor);
    			insert_dev(target, h31, anchor);
    			append_dev(h31, a1);
    			insert_dev(target, t16, anchor);
    			insert_dev(target, p3, anchor);
    			insert_dev(target, t18, anchor);
    			insert_dev(target, pre1, anchor);
    			pre1.innerHTML = raw1_value;
    			insert_dev(target, t19, anchor);
    			insert_dev(target, h32, anchor);
    			append_dev(h32, a2);
    			insert_dev(target, t21, anchor);
    			insert_dev(target, p4, anchor);
    			append_dev(p4, t22);
    			append_dev(p4, code2);
    			append_dev(p4, t24);
    			insert_dev(target, t25, anchor);
    			insert_dev(target, pre2, anchor);
    			pre2.innerHTML = raw2_value;
    			insert_dev(target, t26, anchor);
    			insert_dev(target, h33, anchor);
    			append_dev(h33, a3);
    			insert_dev(target, t28, anchor);
    			insert_dev(target, p5, anchor);
    			append_dev(p5, t29);
    			append_dev(p5, code3);
    			append_dev(p5, t31);
    			insert_dev(target, t32, anchor);
    			insert_dev(target, pre3, anchor);
    			pre3.innerHTML = raw3_value;
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
    			if (detaching) detach_dev(blockquote);
    			if (detaching) detach_dev(t14);
    			if (detaching) detach_dev(h31);
    			if (detaching) detach_dev(t16);
    			if (detaching) detach_dev(p3);
    			if (detaching) detach_dev(t18);
    			if (detaching) detach_dev(pre1);
    			if (detaching) detach_dev(t19);
    			if (detaching) detach_dev(h32);
    			if (detaching) detach_dev(t21);
    			if (detaching) detach_dev(p4);
    			if (detaching) detach_dev(t25);
    			if (detaching) detach_dev(pre2);
    			if (detaching) detach_dev(t26);
    			if (detaching) detach_dev(h33);
    			if (detaching) detach_dev(t28);
    			if (detaching) detach_dev(p5);
    			if (detaching) detach_dev(t32);
    			if (detaching) detach_dev(pre3);
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

    function instance$b($$self, $$props) {
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
    		init(this, options, instance$b, create_fragment$b, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "README",
    			options,
    			id: create_fragment$b.name
    		});
    	}
    }

    /* src\pages\usage.svx generated by Svelte v3.31.0 */
    const file$9 = "src\\pages\\usage.svx";

    function create_fragment$c(ctx) {
    	let div;
    	let doc;
    	let current;
    	doc = new README$1({ $$inline: true });

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(doc.$$.fragment);
    			attr_dev(div, "class", "markdown svelte-1x21rke");
    			add_location(div, file$9, 17, 0, 285);
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
    		id: create_fragment$c.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$c($$self, $$props, $$invalidate) {
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
    		init(this, options, instance$c, create_fragment$c, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Usage",
    			options,
    			id: create_fragment$c.name
    		});
    	}
    }

    /* src\pages\error.svelte generated by Svelte v3.31.0 */

    const { Error: Error_1$2 } = globals;
    const file$a = "src\\pages\\error.svelte";

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

    function create_fragment$d(ctx) {
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
    			add_location(h1, file$a, 15, 0, 342);
    			add_location(p, file$a, 16, 0, 367);
    			attr_dev(button, "href", "/");
    			add_location(button, file$a, 17, 0, 449);
    		},
    		l: function claim(nodes) {
    			throw new Error_1$2("options.hydrate only works if the component was compiled with the `hydratable: true` option");
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
    		id: create_fragment$d.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$d($$self, $$props, $$invalidate) {
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

    class Error$2 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$d, create_fragment$d, safe_not_equal, { time: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Error",
    			options,
    			id: create_fragment$d.name
    		});
    	}

    	get time() {
    		throw new Error_1$2("<Error>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set time(value) {
    		throw new Error_1$2("<Error>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\router.svelte generated by Svelte v3.31.0 */

    const { Error: Error_1$3 } = globals;
    const file$b = "src\\router.svelte";

    // (44:4) {:else}
    function create_else_block$1(ctx) {
    	let div;
    	let switch_instance;
    	let div_intro;
    	let current;
    	const switch_instance_spread_levels = [/*props*/ ctx[6]];
    	var switch_value = /*component*/ ctx[5];

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
    			add_location(div, file$b, 44, 6, 1552);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			if (switch_instance) {
    				mount_component(switch_instance, div, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const switch_instance_changes = (dirty & /*props*/ 64)
    			? get_spread_update(switch_instance_spread_levels, [get_spread_object(/*props*/ ctx[6])])
    			: {};

    			if (switch_value !== (switch_value = /*component*/ ctx[5])) {
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
    					div_intro = create_in_transition(div, fade, {});
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
    		id: create_else_block$1.name,
    		type: "else",
    		source: "(44:4) {:else}",
    		ctx
    	});

    	return block;
    }

    // (40:4) {#if decorator}
    function create_if_block$2(ctx) {
    	let switch_instance;
    	let switch_instance_anchor;
    	let current;
    	var switch_value = /*decorator*/ ctx[4];

    	function switch_props(ctx) {
    		return {
    			props: {
    				$$slots: { default: [create_default_slot_1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		};
    	}

    	if (switch_value) {
    		switch_instance = new switch_value(switch_props(ctx));
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
    			const switch_instance_changes = {};

    			if (dirty & /*$$scope, component, props*/ 224) {
    				switch_instance_changes.$$scope = { dirty, ctx };
    			}

    			if (switch_value !== (switch_value = /*decorator*/ ctx[4])) {
    				if (switch_instance) {
    					group_outros();
    					const old_component = switch_instance;

    					transition_out(old_component.$$.fragment, 1, 0, () => {
    						destroy_component(old_component, 1);
    					});

    					check_outros();
    				}

    				if (switch_value) {
    					switch_instance = new switch_value(switch_props(ctx));
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
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(40:4) {#if decorator}",
    		ctx
    	});

    	return block;
    }

    // (41:6) <svelte:component this={decorator}>
    function create_default_slot_1(ctx) {
    	let div;
    	let switch_instance;
    	let div_intro;
    	let current;
    	const switch_instance_spread_levels = [/*props*/ ctx[6]];
    	var switch_value = /*component*/ ctx[5];

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
    			add_location(div, file$b, 41, 8, 1420);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			if (switch_instance) {
    				mount_component(switch_instance, div, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const switch_instance_changes = (dirty & /*props*/ 64)
    			? get_spread_update(switch_instance_spread_levels, [get_spread_object(/*props*/ ctx[6])])
    			: {};

    			if (switch_value !== (switch_value = /*component*/ ctx[5])) {
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
    					div_intro = create_in_transition(div, fade, {});
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
    		id: create_default_slot_1.name,
    		type: "slot",
    		source: "(41:6) <svelte:component this={decorator}>",
    		ctx
    	});

    	return block;
    }

    // (39:2) {#key component}
    function create_key_block(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block$2, create_else_block$1];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*decorator*/ ctx[4]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				} else {
    					if_block.p(ctx, dirty);
    				}

    				transition_in(if_block, 1);
    				if_block.m(if_block_anchor.parentNode, if_block_anchor);
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
    			if_blocks[current_block_type_index].d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_key_block.name,
    		type: "key",
    		source: "(39:2) {#key component}",
    		ctx
    	});

    	return block;
    }

    // (38:0) <RouterComponent let:decorator let:component let:props>
    function create_default_slot$1(ctx) {
    	let previous_key = /*component*/ ctx[5];
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
    			if (dirty & /*component*/ 32 && safe_not_equal(previous_key, previous_key = /*component*/ ctx[5])) {
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
    		id: create_default_slot$1.name,
    		type: "slot",
    		source: "(38:0) <RouterComponent let:decorator let:component let:props>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$e(ctx) {
    	let routercomponent;
    	let current;

    	routercomponent = new Router_1({
    			props: {
    				$$slots: {
    					default: [
    						create_default_slot$1,
    						({ decorator, component, props }) => ({ 4: decorator, 5: component, 6: props }),
    						({ decorator, component, props }) => (decorator ? 16 : 0) | (component ? 32 : 0) | (props ? 64 : 0)
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
    			throw new Error_1$3("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(routercomponent, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const routercomponent_changes = {};

    			if (dirty & /*$$scope, decorator, component, props*/ 240) {
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
    		id: create_fragment$e.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$e($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Router", slots, []);
    	Router$1.scrollOffset = 100;
    	Router$1.linkBase = "/svelte-standalone-router";

    	// implementaiton
    	const app = context({
    		initial: location.pathname,
    		base: Router$1.linkBase
    	});

    	// catch fallbacks
    	app.catch((req, res, props) => res.send(Error$2, { time: 5 }));

    	// decorators
    	const main = decorator(Main);

    	main("/", (req, res) => res.send(Pages));

    	// documentation
    	const documentation = decorator(Documentation);

    	documentation("/how-to/documentation", async (req, res) => res.send(Documentation$1));
    	documentation("/how-to/guides", (req, res) => res.send(Usage));
    	documentation("/changelog", (req, res) => res.send(CHANGELOG));
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Router> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		fade,
    		RouterComponent: Router_1,
    		context,
    		Router: Router$1,
    		decorator,
    		_error: Error$1,
    		_main: Main,
    		_documentation: Documentation,
    		Index: Pages,
    		Documentation: Documentation$1,
    		Changelog: CHANGELOG,
    		Guides: Usage,
    		Error: Error$2,
    		app,
    		main,
    		documentation
    	});

    	return [];
    }

    class Router_1$1 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$e, create_fragment$e, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Router_1",
    			options,
    			id: create_fragment$e.name
    		});
    	}
    }

    /* src\app.svelte generated by Svelte v3.31.0 */

    function create_fragment$f(ctx) {
    	let masthead;
    	let t;
    	let router;
    	let current;
    	masthead = new Masthead({ $$inline: true });
    	router = new Router_1$1({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(masthead.$$.fragment);
    			t = space();
    			create_component(router.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(masthead, target, anchor);
    			insert_dev(target, t, anchor);
    			mount_component(router, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(masthead.$$.fragment, local);
    			transition_in(router.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(masthead.$$.fragment, local);
    			transition_out(router.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(masthead, detaching);
    			if (detaching) detach_dev(t);
    			destroy_component(router, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$f.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$f($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("App", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ Masthead, Router: Router_1$1 });
    	return [];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$f, create_fragment$f, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$f.name
    		});
    	}
    }

    var main = new App({ target: document.body });

    return main;

}());
//# sourceMappingURL=bundle.js.map
