# Changelog

## <a name="1.0.24" href="#1.0.24">1.0.24</a>
* ***Feature:*** Ability to wrap a route callback function in a decorator to decorate that function. Useful for catch routes.
* ***Fix:*** Doesn't clear decorator props on route change anymore. 
* ***Change:*** Does not make a unique instance for every route send anymore. Now it is instead up to the author if they want that behavior and force a remount if they want to remount the current route.
* ***Fix:*** Avoid remounting decorator component on route change. 


## <a name="1.0.23" href="#1.0.23">1.0.23</a>
* ***Feature:*** decorator props
* ***Fix:*** decorator chaining