# Changelog

## <a name="1.0.24" href="#1.0.24">1.0.24</a>
* ***Change:*** Don't make a unique instance for every new route match. If a new instance is required to force a reload of the same route currently on the author can implement it themselves by extending the component in the send callback. 
* ***Fix:*** Avoid remounting decorator component on route 


## <a name="1.0.23" href="#1.0.23">1.0.23</a>
* ***Feature:*** decorator props
* ***Fix:*** decorator chaining