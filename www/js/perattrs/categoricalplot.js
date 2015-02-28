/**
 *  This file is part of PerSE. PerSE is a visual analytics app for
 *  event periodicity detection and analysis.
 *  Copyright (C) 2015  Brian Swedberg
 */

define([
    'jquery',
    'd3',
    'perattrs/categoricalplotdatasetbuilder',
    // no namespace
    'bootstrap'
], function ($, d3, categoricalplotdatasetbuilder) {

    var categoricalplot = {};

    categoricalplot.CategoricalPlot = function (attribute) {
        this.attribute = attribute;
        this.contentAttribute = undefined;
        this.container = $('<div>').attr({'class': 'perse-perattr-categoricalplot'});
        this.listeners = [];
        this.svgChart = undefined;
        this.svgXAxis = undefined;
        this.margin = {top: 1, right: 3, bottom: 1, left: 3};
        this.xScale = undefined;
        this.size = {
            width: 150 - this.margin.left - this.margin.right,
            height: 170 - this.margin.top - this.margin.bottom
        };
        this.barSize = {height: 20, offset: 1};
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
            axisContainer = $('<div>').attr({'class': 'categoricalplot-axis'}),
            xExtent = this.getXExtent(data);

        this.xScale = d3.scale.linear()
            .domain([xExtent.min, xExtent.max])
            .range([0, this.size.width]);

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
        var yScale,
            yAxisBuilder;

        this.size.height = this.margin.top + this.margin.bottom + this.barSize.height * data.length;

        this.svgChart = d3.select(container).append('svg')
            .attr('height', this.size.height + 'px')
            .attr('width', this.size.width + this.margin.left + this.margin.right + 'px')
            .append('g')
            .attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")");

        this.svgChart.append('rect')
            .attr('x', 0)
            .attr('y', 0)
            .attr('width', this.size.width + 'px')
            .attr('height', this.size.height + 'px')
            .attr('opacity', '0');

        yScale = d3.scale.linear()
            .domain([0, data.length])
            .range([0, this.size.height]);

        yAxisBuilder = d3.svg.axis()
            .scale(yScale)
            .tickFormat('')
            .ticks(0)
            .innerTickSize(0)
            .outerTickSize(0)
            .orient("left");

        this.svgChart.append("g")
            .attr('class', 'categoricalplot-axis')
            .attr("transform", "translate(-2, 0)")
            .call(yAxisBuilder);

        this.updateChart(data);
    };

    categoricalplot.CategoricalPlot.prototype.updateChart = function (data) {
        var that = this,
            yScale = d3.scale.linear()
                .domain([0, data.length])
                .range([0, this.size.height]),
            bars;


        bars = this.svgChart.selectAll('.categoricalplot-category')
            .data(data, function (d) {return d.name; });

        bars.enter().append('g')
            .attr('class', 'categoricalplot-category')
            .on('mouseup', function () {
                var name = d3.select(this).datum().name;
                if (that.deselected.indexOf(name) < 0) {
                    that.deselected.push(d3.select(this).datum().name);
                } else {
                    that.deselected.splice(that.deselected.indexOf(name), 1);
                }
                that.validateButtons();
                that.notifyListeners('onPlotSelectionChanged', {context: that});

            })
            .call(function (selection) {
                selection.append('g')
                    .attr('class', 'categoricalplot-bar');
                selection.append('text')
                    .text(function (d) {
                        var shortName = d.name.substring(25, 0);
                        shortName = (d.name.length > 25) ? shortName + '...' : shortName;
                        return shortName;
                    })
                    .attr('x', '1em')
                    .attr('y', (that.barSize.height - (that.barSize.offset * 2)) / 2 + 1)
                    .attr('text-anchor', 'start')
                    .attr('dominant-baseline', 'central');
                selection.append('rect')
                    .attr('class', 'categoricalplot-category-background')
                    .attr('x', 0)
                    .attr('y', that.barSize.offset)
                    .attr('width', that.size.width + 'px')
                    .attr('height', that.barSize.height - (that.barSize.offset * 2) + 'px');
            });

        bars.select('g.categoricalplot-bar')
            .each(function () {
                var g = d3.select(this),
                    segData = g.datum().events,
                    segments;


                // bind new data
                segments = g.selectAll('rect')
                    .data(segData);

                // add new if needed
                segments.enter()
                    .append('rect')
                    .attr('y', that.barSize.offset)
                    .attr('height', that.barSize.height - (that.barSize.offset * 2));

                // update all
                segments
                    .transition()
                    .duration(500)
                    .attr('x', function (d) {return that.xScale(d.count.begin); })
                    .attr('width', function (d) {return that.xScale(d.count.end) - that.xScale(d.count.begin); })
                    .attr('fill', function (d) {return d.color; });

                // remove any extra
                segments.exit().remove();

            });

        bars.attr("transform", function (d, i) { return "translate(0," + yScale(i) + ")"; });

        bars.exit().remove();
    };

    categoricalplot.CategoricalPlot.prototype.update = function (data) {
        console.log(data);
        var xExtent = this.getXExtent(data);
        this.xScale = d3.scale.linear()
            .domain([xExtent.min, xExtent.max])
            .range([0, this.size.width]);
        this.updateChart(data);
        this.updateAxis();
    };

    categoricalplot.CategoricalPlot.prototype.update_dep = function (data) {
        var that = this,
            dataExtent = d3.extent(data, function (d) {return d.count; });

        this.xScale = d3.scale.linear()
            .domain([0, dataExtent[1]])
            .range([0, this.size.width]);

        this.svgChart.selectAll('.categoricalplot-category')
            .data(data, function (d) {return d.name; })
            .select('.categoricalplot-bar')
            .transition()
            .duration(500)
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

    categoricalplot.CategoricalPlot.prototype.processData = function (data) {
        return new categoricalplotdatasetbuilder.CategoricalPlotDataSetBuilder()
            .setMetadata(this.metadata)
            .setAttribute(this.attribute)
            .setContentAttribute(this.contentAttribute)
            .setData(data)
            .build();
    };

    categoricalplot.CategoricalPlot.prototype.setContentAttribute = function (contentAttr) {
        this.contentAttribute = contentAttr;
    };

    categoricalplot.CategoricalPlot.prototype.onReset = function () {
        // select all categories
        this.deselected = [];
        this.validateButtons();
    };

    categoricalplot.CategoricalPlot.prototype.getXExtent = function (data) {
        var firstValue = data[0].events[data[0].events.length - 1].count.end,
            extent = {max: firstValue, min: 0};
        data.forEach(function (agg) {
            var aggMax = agg.events[agg.events.length - 1].count.end;
            extent.max = Math.max(extent.max, aggMax);
        });
        return extent;
    };

    categoricalplot.CategoricalPlot.prototype.onSelectionChanged = function (data) {
        this.update(this.processData(data));
    };

    categoricalplot.CategoricalPlot.prototype.onDataSetChanged = function (data, metadata) {
        this.metadata = metadata;
        this.build(this.processData(data));
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