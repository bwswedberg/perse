/**
 *  This file is part of PerSE. PerSE is a visual analytics app for
 *  event periodicity detection and analysis.
 *  Copyright (C) 2015  Brian Swedberg
 */

define([
    'jquery',
    'd3',
    // no namespace
    'bootstrap'
], function ($, d3) {

    var categoricalplot = {};

    categoricalplot.CategoricalPlot = function (attribute) {
        this.attribute = attribute;
        this.container = $('<div>').attr({'class': 'perse-perattr-categoricalplot'});
        this.listeners = [];
        this.svg = undefined;
        this.svgXAxis = undefined;
        this.margin = {top: 1, right: 3, bottom: 1, left: 3};
        this.xScale = undefined;
        this.size = {
            width: 150 - this.margin.left - this.margin.right,
            height: 170 - this.margin.top - this.margin.bottom
        };
        this.buttons = {'none': undefined, 'filter': undefined};
        this.metadata = undefined;
        this.deselected = [];
    };

    categoricalplot.CategoricalPlot.prototype.render = function (parent) {
        $(parent).append(this.container);
        return this;
    };

    categoricalplot.CategoricalPlot.prototype.createToolbar = function () {
        var none = this.createNoneButton(),
            filterDiv = this.createFilterButton(),
            g = $('<div>')
                .attr({'class': 'btn-group', 'role': 'group'})
                .append(none, filterDiv);
        return $('<div>')
            .attr({'class': 'btn-toolbar perse-header-toolbar', 'role': 'toolbar'})
            .append(g);
    };

    categoricalplot.CategoricalPlot.prototype.createFilterButton = function () {
        var filterIcon = $('<span>')
                .attr({'class': 'glyphicon glyphicon-filter', 'aria-hidden': 'true'}),
            filterButton = $('<button>')
                .attr({'class': 'btn btn-default btn-xs', 'type': 'button', 'title': 'Reset Filter'})
                .append(filterIcon);

        filterButton.on('mouseup', $.proxy(function () {
            $(filterButton).blur();
            this.onReset();

            this.notifyListeners('onPlotSelectionChanged', {context: this});
        }, this));

        this.buttons.filter = filterButton;

        return filterButton;
    };

    categoricalplot.CategoricalPlot.prototype.createNoneButton = function () {
        var noneIcon = $('<span>')
                .attr({'class': 'glyphicon glyphicon-ban-circle', 'aria-hidden': 'true'}),
            noneButton = $('<button>')
                .attr({'class': 'btn btn-default btn-xs', 'type': 'button', 'title': 'Clear All'})
                .append(noneIcon);

        noneButton.on('mouseup', $.proxy(function () {
            $(noneButton).blur();
            this.onClear();

            this.notifyListeners('onPlotSelectionChanged', {context: this});
        }, this));

        this.buttons.none = noneButton;

        return noneButton;
    };

    categoricalplot.CategoricalPlot.prototype.build = function (data) {
        var chartContainer = $('<div>').attr({'class': 'categoricalplot-chart'}),
            axisContainer = $('<div>').attr({'class': 'categoricalplot-axis'});
        this.buildChart(chartContainer.get(0), data);
        this.buildAxis(axisContainer.get(0));
        this.container.append(chartContainer, axisContainer);
    };

    categoricalplot.CategoricalPlot.prototype.buildAxis = function (container) {
        this.svgXAxis = d3.select(container).append('svg')
            .attr('height', '35px')
            .attr('width', this.size.width + this.margin.left + this.margin.right + 'px')
            .append('g')
            .attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")");

        this.updateAxis();
    };

    categoricalplot.CategoricalPlot.prototype.updateAxis = function () {
        var that = this,
            xAxisBuilder = d3.svg.axis()
                .scale(that.xScale)
                .ticks(4)
                .innerTickSize(5)
                .outerTickSize(5)
                .tickPadding(5)
                .orient('bottom');

        this.svgXAxis.selectAll('.categoricalplot-axis').remove();

        this.svgXAxis.append('g')
            .attr('transform', 'translate(0, 0)')
            .attr('class', 'categoricalplot-axis')
            .call(xAxisBuilder)
            .append('text')
            .attr('class', 'categoricalplot-axis-label')
            .attr('transform', 'translate(' + (this.size.width / 2) + ',' + 23 + ')')
            .attr('dy', '.71em')
            .style('text-anchor', 'middle')
            .text('Frequency');
    };

    categoricalplot.CategoricalPlot.prototype.buildChart = function (container, data) {
        var that = this,
            yScale,
            offset = 1,
            height = 20,
            bars,
            yAxisBuilder,
            dataExtent = d3.extent(data, function (d) {return d.count; });
        this.size.height = this.margin.top + this.margin.bottom + height * data.length;

        data = data.sort(function (a, b) {return a.count - b.count; });

        this.xScale = d3.scale.linear()
            .domain([0, dataExtent[1]])
            .range([0, this.size.width]);

        yScale = d3.scale.linear()
            .domain([0, data.length])
            .range([this.size.height, 0]);


        this.svg = d3.select(container).append('svg')
            .attr('height', this.size.height + 'px')
            .attr('width', this.size.width + this.margin.left + this.margin.right + 'px')
            .append('g')
            .attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")");

        this.svg.append('rect')
            .attr('x', 0)
            .attr('y', 0)
            .attr('width', this.size.width + 'px')
            .attr('height', this.size.height + 'px')
            .attr('opacity', '0');

        bars = this.svg.selectAll('.categoricalplot-category')
            .data(data, function (d) {return d.name; })
            .enter().append('g')
            .attr('class', 'categoricalplot-category')
            .attr("transform", function (d, i) { return "translate(0," + yScale(i + 1) + ")"; })
            .on('mouseup', function () {
                var name = d3.select(this).datum().name;
                if (that.deselected.indexOf(name) < 0) {
                    that.deselected.push(d3.select(this).datum().name);
                } else {
                    that.deselected.splice(that.deselected.indexOf(name), 1);
                }
                that.validateButtons();
                that.notifyListeners('onPlotSelectionChanged', {context: that});

            });

        bars.append('rect')
            .attr('class', 'categoricalplot-bar')
            .attr('x', 0)
            .attr('y', offset)
            .attr('rx', 1)
            .attr('ry', 1)
            .attr('width', function (d) {return that.xScale(d.count); })
            .attr('height', height - (offset * 2))
            .attr('fill', function (d) {return d.color; })
            .attr('fill-opacity', '1')
            .attr('stroke-opacity', '0');

        bars.append('text')
            .text(function (d) {
                var shortName = d.name.substring(25, 0);
                shortName = (d.name.length > 25) ? shortName + '...' : shortName;
                return shortName;
            })
            .attr('x', '1em')
            .attr('y', (height - (offset * 2)) / 2 + 1)
            .attr('text-anchor', 'start')
            .attr('dominant-baseline', 'central');

        bars.append('rect')
            .attr('class', 'categoricalplot-category-background')
            .attr('x', 0)
            .attr('y', offset)
            .attr('width', this.size.width + 'px')
            .attr('height', height - (offset * 2) + 'px');

        yAxisBuilder = d3.svg.axis()
            .scale(yScale)
            .tickFormat('')
            .ticks(0)
            .innerTickSize(0)
            .outerTickSize(0)
            .orient("left");

        this.svg.append("g")
            .attr('class', 'categoricalplot-axis')
            .attr("transform", "translate(-2, 0)")
            .call(yAxisBuilder);

    };

    categoricalplot.CategoricalPlot.prototype.update = function (data) {
        var that = this,
            dataExtent = d3.extent(data, function (d) {return d.count; });
        this.xScale = d3.scale.linear()
            .domain([0, dataExtent[1]])
            .range([0, this.size.width]);
        this.svg.selectAll('.categoricalplot-category')
            .data(data, function (d) {return d.name; })
            .select('.categoricalplot-bar')
            .transition()
            .attr('width', function (d) {return that.xScale(d.count); });
        this.updateAxis();
    };

    categoricalplot.CategoricalPlot.prototype.getFilter = function () {
        var that = this;
        return function (d) {
            return that.deselected.indexOf(d) < 0;
        };
    };

    categoricalplot.CategoricalPlot.prototype.validateButtons = function () {
        this.validateFilterButton();
        this.validateNoneButton();
    };

    categoricalplot.CategoricalPlot.prototype.validateFilterButton = function () {
        this.buttons.filter.toggleClass('disabled', this.deselected.length === 0);
    };

    categoricalplot.CategoricalPlot.prototype.validateNoneButton = function () {
        var allValuesLength = Object.keys(this.metadata.attribute.attributes[this.attribute].uniqueValues).length,
            deselectedLength = this.deselected.length;
        this.buttons.none.toggleClass('disabled', allValuesLength === deselectedLength);
    };

    categoricalplot.CategoricalPlot.prototype.onClear = function () {
        // deselect all categories
        this.deselected = Object.keys(this.metadata.attribute.attributes[this.attribute].uniqueValues);
        this.validateButtons();
    };

    categoricalplot.CategoricalPlot.prototype.setContentAttribute = function (contentAttribute) {
        return this;
    };

    categoricalplot.CategoricalPlot.prototype.onReset = function () {
        // select all categories
        this.deselected = [];
        this.validateButtons();
    };

    categoricalplot.CategoricalPlot.prototype.onSelectionChanged = function (data) {
        var that = this,
            nestData = d3.nest().key(function (d) {return d[that.attribute]; }).map(data),
            newData = Object.keys(nestData).map(function (key) {
                return {name: key, count: nestData[key].length};
            }),
            md = this.metadata.attribute.attributes[this.attribute];
        Object.keys(md.uniqueValues).forEach(function (key) {
            if (!nestData[key]) {
                newData.push({name: key, count: 0});
            }
        });
        this.update(newData);
    };

    categoricalplot.CategoricalPlot.prototype.onDataSetChanged = function (data, metadata) {
        this.metadata = metadata;
        var md = this.metadata.attribute.attributes[this.attribute];
        this.build(Object.keys(md.uniqueValues).map(function (key) {
            return {
                name: md.uniqueValues[key].name,
                color: md.uniqueValues[key].color,
                count: md.uniqueValues[key].count,
                selected: true
            };
        }));
        this.validateButtons();
    };

    categoricalplot.CategoricalPlot.prototype.registerListener = function (listenerObj) {
        this.listeners.push(listenerObj);
        return this;
    };

    categoricalplot.CategoricalPlot.prototype.notifyListeners = function (callbackStr, event) {
        this.listeners.forEach(function (listenerObj) {
            listenerObj[callbackStr].call(listenerObj.context, event);
        });
    };

    return categoricalplot;
});