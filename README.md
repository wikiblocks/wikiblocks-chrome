wikiblocks-chrome
=================

Copyright 2015, Brooks Mershon

The extension uses information from a Wikipedia article to produce a list of relevant GitHub Gists (known as blocks) in the form of Mike Bostock's [many code examples](http://bl.ocks.org).

*This project is in the early stages of development and may improve dramatically without warning.*

Drag the packed extension *wikiblocks.crx* into the Chrome extensions window that you can access by visiting **chrome://extensions** or by going to **Settings** in your Chrome browser.

Check out [wikiblocks-search](https://github.com/bmershon/wikiblocks-search) for more information about how the extension gets relevant blocks.


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
