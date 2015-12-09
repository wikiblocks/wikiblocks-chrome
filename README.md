wikiblocks-chrome
=================

Copyright 2015, Brooks Mershon

The extension uses information from a Wikipedia article to produce a list of relevant GitHub Gists (known as blocks) in the form of Mike Bostock's [many code examples](http://bl.ocks.org).

*Note: The packed extension currently points at localhost:3000. The extension will be updated when the current search code is deployed again.*

Check out [wikiblocks-search](https://github.com/bmershon/wikiblocks-search) for more information about how the extension gets relevant blocks.


# Update

- Hooks in the article (e.g. "Problem of Apollonius" and "geometry") produce SQL queries that are executed in parallel; results load much quicker than before.
- CSS changes, such as a pulsing page title that makes color transitions during the short loading periods. The old "orbits" animation has been removed. It is time.
- Content scripts for en.wikipedia.org (searching for gists) and bl.ocks.org (recording/updating gists). 

![https://en.wikipedia.org/wiki/peano_curve](/images/peano-curve.png)

# Prototypes

Here are some older protypes, including a fancy loading animation which is dynamically created based on the number and types of hooks to search for on the Wikipedia page.

![Rrim's algorithm recording](/images/prim_algorithm_recording.gif)

![Map projections recording](/images/map_projections_recording.gif)


Searching:

![https://en.wikipedia.org/wiki/L-system](/images/L_system_loading.png)

Returned results:

![https://en.wikipedia.org/wiki/L-system](/images/L_system.png)

Results might be relevant to the title as well as the categories of an article:

Search for https://en.wikipedia.org/wiki/Merge_sort
![https://en.wikipedia.org/wiki/Merge_sort](/images/merge_sort.png)

Relvant examples based on categories:

Search for https://en.wikipedia.org/wiki/Simplicial_complex
![https://en.wikipedia.org/wiki/Simplicial_complex](/images/simplicial_complex.png)

