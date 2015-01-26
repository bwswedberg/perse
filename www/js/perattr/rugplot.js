/**
 *  This file is part of PerSE. PerSE is a visual analytics app for
 *  event periodicity detection and analysis.
 *  Copyright (C) 2015  Brian Swedberg
 */

define([
    'jquery',
    'd3'
], function ($, d3) {
    var rugplot = {};

    rugplot.RugPlot = function (attribute) {
        this.attribute = attribute;
        this.container = $('<div>').attr({'class': 'perse-perattr-rugplot'});
        this.listeners = [];
        this.svg = undefined;
        this.margin = {top: 3, right: 5, bottom: 10, left: 5};
        this.viewBox = {width: 100, height: 20};
        this.offset = 1;
        this.size = {
            width: this.viewBox.width - this.margin.left - this.margin.right,
            height: this.viewBox.height - this.margin.top - this.margin.bottom
        };
        this.brush = undefined;
        this.toInput = undefined;
        this.fromInput = undefined;
        this.metadata = undefined;
        this.xScale = undefined;
    };

    rugplot.RugPlot.prototype.render = function (parent) {
        $(parent).append(this.container);
        return this;
    };

    rugplot.RugPlot.prototype.build = function (data) {
        var that = this,
            dataExtent = d3.extent(data.map(function (d) {return d.value; })),
            color = this.metadata.getMetadata().attribute.attributes[this.attribute].color,
            min = dataExtent[0],
            max = dataExtent[1],
            xAxisBuilder,
            yScale,
            yAxisGroup,
            yAxisBuilder,
            lines,
            backgroundLines,
            brushg,
            brushstart,
            brushmove,
            brushend;

        this.xScale = d3.scale.linear()
            .domain([min, max])
            .range([0, this.size.width]);

        xAxisBuilder = d3.svg.axis()
            .scale(this.xScale)
            .innerTickSize(2)
            .outerTickSize(2)
            .tickPadding(2)
            .orient("bottom");

        yScale = d3.scale.linear()
            .domain([0, 1])
            .range([0, this.size.height]);

        yAxisBuilder = d3.svg.axis()
            .scale(yScale)
            .tickPadding(0)
            .innerTickSize(2)
            .outerTickSize(2)
            .ticks(0)
            .tickFormat('')
            .orient("left");

        this.svg = d3.select(this.container.get(0)).append('svg')
            .attr('viewBox', [0, 0, this.viewBox.width, this.viewBox.height].join(' '))
            .append('g')
            .attr("transform", "translate(" + (this.margin.left) + "," + this.margin.top + ")");

        backgroundLines = this.svg.append('g')
            .attr('class', 'rugplot-background')
            .selectAll('.rugplot-background')
            .data(data).enter().append('path')
            .classed("selected", true)
            .attr('d', function (d) {
                var x = that.xScale(d.value);
                return ['M', x, 0 + that.offset, 'L', x, that.size.height - that.offset].join(' ');
            });

        lines = this.svg.append('g')
            .attr('class', 'rugplot-select')
            .selectAll('.rugplot-select')
            .data(data).enter().append('path')
            .classed("selected", true)
            .attr('d', function (d) {
                var x = that.xScale(d.value);
                return ['M', x, that.offset, 'L', x, that.size.height - that.offset].join(' ');
            })
            .style('stroke', color);

        brushstart = function () {
            that.svg.classed("selecting", true);
        };

        brushmove = function () {
            var extent = that.brush.extent();

            lines.classed("selected", function (d) { return extent[0] <= d.value && d.value <= extent[1]; });
            backgroundLines.classed("selected", function (d) { return extent[0] <= d.value && d.value <= extent[1]; });
            that.toInput.value = extent[0];
            that.fromInput.value = extent[1];

        };

        brushend = function () {
            var extent = that.brush.extent();
            that.svg.classed("selecting", !d3.event.target.empty());
            if (extent[0] === extent[1]) {
                that.toInput.value = that.toInput.min;
                that.fromInput.value = that.fromInput.max;
                lines.classed("selected", true);
            }
            that.notifyListeners('onRugPlotSelectionChanged', {context: that});
        };

        this.brush = d3.svg.brush()
            .x(this.xScale)
            .on("brushstart", brushstart)
            .on("brush", brushmove)
            .on("brushend", brushend);

        brushg = this.svg.insert("g", '.rugplot-background')
            .attr("class", "brush")
            .call(this.brush);

        brushg.selectAll("rect")
            .attr("height", this.size.height);

        this.svg.append("g")
            .attr("class", "rugplot-axis")
            .attr("transform", "translate(0," + (this.size.height + 1) + ")")
            .call(xAxisBuilder);
        /*
         yAxisGroup = this.svg.append("g")
         .attr("class", "histogram-barchart-axis-g")
         .attr("transform", "translate(-1,0)")
         .call(yAxisBuilder);*/

    };

    rugplot.RugPlot.prototype.createRangeInput = function (min, max) {
        var min = this.xScale.domain()[0],
            max = this.xScale.domain()[1],
            space = $('<span>').text('to');

        this.toInput = $('<input>').attr({
                'type': 'number',
                'value': min.toString(),
                'min': min.toString(),
                'max': max.toString(),
                'title': 'Minimum'
            });
        this.fromInput = $('<input>').attr({
                'type': 'number',
                'value': max.toString(),
                'min': min.toString(),
                'max': max.toString(),
                'title': 'Minimum'
            });

        this.toInput.change($.proxy(function () {
            this.validateRangeInput();
        }, this));

        this.fromInput.change($.proxy(function () {
            this.validateRangeInput();
        }, this));

        return $('<div>')
            .attr({'class': 'rugplot-range'})
            .append(this.toInput, space, this.fromInput);
    };

    rugplot.RugPlot.prototype.validateRangeInput = function () {
        console.log([this.toInput.value, this.fromInput.value]);
        this.brush.extent([this.toInput.val(), this.fromInput.val()]);
        this.svg.selectAll(".brush").call(this.brush);
        this.brush.event(this.svg.selectAll(".brush"));
    };

    rugplot.RugPlot.prototype.update = function (data) {
        var that = this,
            color = this.metadata.getMetadata().attribute.attributes[this.attribute].color;
        this.svg.selectAll('.rugplot-select').remove();
        this.svg.append('g')
            .attr('class', 'rugplot-select')
            .selectAll('.rugplot-select')
            .data(data).enter().append('path')
            .classed("selected", true)
            .attr('d', function (d) {
                var x = that.xScale(d.value);
                return ['M', x, that.offset, 'L', x, that.size.height - that.offset].join(' ');
            })
            .style('stroke', color);
    };

    rugplot.RugPlot.prototype.getFilter = function () {
        var brushExtent = this.brush.extent();
        if (brushExtent[0] === brushExtent[1]) {
            return function (d) {return true; };
        }
        return function (d) {
            return (d >= brushExtent[0] && d <= brushExtent[1]);
        };
    };

    rugplot.RugPlot.prototype.simplifyDataStructure = function (data) {
        return data.map(function (d) {
            return {value: d[this.attribute]};
        }, this);
    };

    rugplot.RugPlot.prototype.onSelectionChanged = function (data) {
        this.update(this.simplifyDataStructure(data));

    };

    rugplot.RugPlot.prototype.onDataSetChanged = function (data, metadata) {
        this.metadata = metadata;
        this.build(this.simplifyDataStructure(data));
    };

    rugplot.RugPlot.prototype.registerListener = function (listenerObj) {
        this.listeners.push(listenerObj);
        return this;
    };

    rugplot.RugPlot.prototype.notifyListeners = function (callbackStr, event) {
        this.listeners.forEach(function (listenerObj) {
            listenerObj[callbackStr].call(listenerObj.context, event);
        });
    };

    return rugplot;
});