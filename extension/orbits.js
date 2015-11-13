/*
    Copyright 2015 Brooks Mershon

    This is a visualizaiton that runs while the client searches for gists.

    It is designed to entertain at the expense of CPU cycles.
*/


// passed in a D3 selection and a list of objects to visualize
function Visualization(container, hooks) {

    var RETURN_VALUE = false;

    this.stop = function() {
        RETURN_VALUE = true;

    }

    this.error = function() {
        error();
    }

    //check dimensions given in css
    var width = parseInt(d3.select(container.node()).style('width'), 10),
        height = parseInt(d3.select(container.node()).style('height'), 10);


    var data = hooks.map(function(d) {
        return {xloc: 0, yloc: 0, a: Math.random(), b: Math.random(),
            xOffset: Math.random(), yOffset: Math.random(), theta: Math.random() * Math.PI,
            rotation: Math.random() * Math.PI,
            angularVelocity: Math.random() * 8,
            width: size(d) + Math.random()*size(d),
            height: size(d) + Math.random() * size(d),
            hook: d};
    });


    var x = d3.scale.linear()
            .domain([-1.2, 1.2])
            .range([0, height]);

    var y = d3.scale.linear()
            .domain([-1.2, 1.2])
            .range([0, height]);

    var svg = container
            .append("g")
            .attr("transform", function(d) { return "translate(" + 0 + "," + 0 + ")"; })


    var hookGroups = svg.selectAll("rect")
        .data(data)
        .enter().append("g").attr("class", "circle-group")

    hookGroups.append("rect")
        .attr("width", function(d) {return d.width})
        .attr("height", function(d) {return d.height})
        .attr("class", function(d,i) {return d.hook.property})
        .attr("transform", function(d) {return "translate(" + -d.width/2 + "," + -d.height/2 + ")"});

    var rect = svg.selectAll("rect");
    var hookGroups = svg.selectAll(".circle-group");


    d3.timer(function() {

        data.forEach(function(d) {
            d.xloc = d.a*Math.cos(d.theta + d.xOffset*Math.PI*2);
            d.yloc = d.b*Math.sin(d.theta + d.yOffset*Math.PI*2);
            d.theta += 0.02;
            d.rotation += d.angularVelocity;
        });

        hookGroups
            .attr("transform", function(d) {return "translate(" + x(d.xloc) + "," + y(d.yloc) + ") "
                                             + "rotate(" + d.rotation + ")"
                                            + "scale("+ (Math.cos(d.theta)) + "," + (Math.sin(d.theta)) + ")"});
        
        return RETURN_VALUE; // true stops timer
    });

    function error() {
        rect.attr("class", "error");
    }

    function size(hook) {
        var assigned = {title: 16, aliases: 12, see_also: 8, categories: 10}

        return assigned[hook.property];
    }

}
