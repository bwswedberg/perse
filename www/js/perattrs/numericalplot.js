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

    var numericalplot = {};

    numericalplot.NumericalPlot = function (attribute) {
        this.attribute = attribute;
        this.container = $('<div>').attr({'class': 'perse-perattr-numericalplot'});
        this.listeners = [];
        this.svg = undefined;
        this.margin = {top: 10, right: 5, bottom: 10, left: 15};
        this.viewBox = {width: 100, height: 140};
        this.xScale = undefined;
        this.yScale = undefined;
        this.brush = undefined;
        this.size = {
            width: this.viewBox.width - this.margin.left - this.margin.right,
            height: this.viewBox.height - this.margin.top - this.margin.bottom
        };
        this.metadata = undefined;
    };

    numericalplot.NumericalPlot.prototype.render = function (parent) {
        $(parent).append(this.container);
        return this;
    };

    numericalplot.NumericalPlot.prototype.createToolbar = function () {
        var filterDiv = $('<div>')
            .attr({'class': 'btn-group', 'role': 'group'})
            .append(this.createFilterButton());
        return $('<div>')
            .attr({'class': 'btn-toolbar perse-header-toolbar', 'role': 'toolbar'})
            .append(filterDiv);
    };

    numericalplot.NumericalPlot.prototype.createFilterButton = function () {
        var filterIcon = $('<span>')
                .attr({'class': 'glyphicon glyphicon-filter', 'aria-hidden': 'true'}),
            filterButton = $('<button>')
                .attr({'class': 'btn btn-default btn-xs', 'type': 'button', 'title': 'Reset Filter'})
                .append(filterIcon);

        filterButton.on('mouseup', $.proxy(function () {
            $(filterButton).blur();
            this.onReset();
            this.notifyListeners('onPlotSelectionChanged', {context: this, filter: this.getFilter()});
        }, this));

        return filterButton;
    };

    numericalplot.NumericalPlot.prototype.build = function (data) {
        var dataExtent = d3.extent(data.map(function (d) {return d.value; }));
        this.svg = d3.select(this.container.get(0)).append('svg')
            .attr('viewBox', [0, 0, this.viewBox.width, this.viewBox.height].join(' '))
            .append('g')
            .attr('transform', 'translate(' + this.margin.left + ',' + this.margin.top + ')');

        this.xScale = d3.scale.linear()
            .domain([dataExtent[0], dataExtent[1]])
            .range([0, this.size.width]);

        this.update(data);
        this.buildBrush();
    };

    numericalplot.NumericalPlot.prototype.update = function (data) {
        var that = this,
            binnedData,
            bars,
            color = this.metadata.getMetadata().attribute.attributes[this.attribute].color;

        binnedData = d3.layout.histogram()
            .value(function (d) {return d.value; })
            (data);

        this.yScale = d3.scale.linear()
            .domain([0, d3.max(binnedData, function (d) {return d.y; })])
            .range([this.size.height, 0]);

        bars = this.svg.selectAll('.numericalplot-bin')
            .data(binnedData);

        bars.enter().append('g')
            .attr('class', 'numericalplot-bin selected')
            .append('rect');

        bars.attr('transform', function (d) {
            return 'translate(' + that.xScale(d.x) + ',' + that.yScale(d.y) + ')';
        });

        bars.select('rect')
            .attr('x', 0)
            .attr('y', 0)
            .attr('width', that.xScale(binnedData[0].dx))
            .attr('height', function (d) {
                return that.size.height - that.yScale(d.y);
            })
            .attr('fill', color);

        bars.exit().remove();

        this.updateAxis();
    };

    numericalplot.NumericalPlot.prototype.updateAxis = function () {
        var xAxisBuilder, yAxisBuilder;
        xAxisBuilder = d3.svg.axis()
            .scale(this.xScale)
            .innerTickSize(2)
            .outerTickSize(2)
            .tickPadding(2)
            .orient('bottom');

        yAxisBuilder = d3.svg.axis()
            .scale(this.yScale)
            .innerTickSize(2)
            .outerTickSize(2)
            .tickPadding(2)
            .tickFormat(function (d) {
                var prefix = d3.formatPrefix(d);
                return (d >= 1000) ? prefix.scale(d) + prefix.symbol : d;
            })
            .orient('left');

        this.svg.selectAll('.numericalplot-axis').remove();
        this.svg.append('g')
            .attr('class', 'numericalplot-axis')
            .attr('transform', 'translate(0,' + (this.size.height + 1) + ')')
            .call(xAxisBuilder);

        this.svg.append('g')
            .attr('class', 'numericalplot-axis')
            .attr('transform', 'translate(-1,0)')
            .call(yAxisBuilder);
        /*
            .append('text')
            .attr('class', 'numericalplot-axis-label')
            .attr('transform', 'translate(-' + (this.margin.left * 0.95) + ',' + (this.size.height / 2) + ') rotate(-90)')
            .attr('dy', '.71em')
            .style('text-anchor', 'middle')
            .text('Frequency');*/
    };

    numericalplot.NumericalPlot.prototype.buildBrush = function () {
        var that = this, brushMove, brushEnd, brushG;

        this.svg
            .on('mousemove', function () {
                var x = d3.mouse(that.svg.node())[0];
                if (x >= 0) {
                    that.updateLabel('Count: ' + Math.round(that.xScale.invert(d3.mouse(that.svg.node())[0])));
                } else {
                    that.updateLabel('');
                }
            })
            .on('mouseout', function () {
                that.updateLabel('');
            });

        brushMove = function () {
            var bExtent = that.brush.extent();
            that.updateLabel('Count: ' + Math.round(bExtent[0]) + ' to ' + Math.round(bExtent[1]));
        };

        brushEnd = function () {
            that.notifyListeners('onPlotSelectionChanged', {context: that});
        };

        this.brush = d3.svg.brush()
            .x(this.xScale)
            .on('brush', brushMove)
            .on('brushend', brushEnd);

        brushG = this.svg.insert('g', '.numericalplot-bin')
            .attr('class', 'brush')
            .call(this.brush);

        brushG.selectAll("rect")
            .attr("height", this.size.height);

        this.svg.append('text')
            .attr('id', 'numericalplot-label');
    };

    numericalplot.NumericalPlot.prototype.updateLabel = function (label) {
        var labelNode = this.svg.select('#numericalplot-label')
                .text(label),
            bbox = labelNode.node().getBBox();
        labelNode
            .attr('x', this.size.width - bbox.width)
            .attr('y', -3);

    };

    numericalplot.NumericalPlot.prototype.simplifyDataStructure = function (data) {
        return data.map(function (d) {
            return {value: d[this.attribute]};
        }, this);
    };

    numericalplot.NumericalPlot.prototype.clearBrush = function () {
        this.svg.selectAll('.brush').call(this.brush.clear());
    };

    numericalplot.NumericalPlot.prototype.getFilter = function () {
        var brushExtent = this.brush.extent();
        if (brushExtent[0] === brushExtent[1]) {
            return function () {return true; };
        }
        return function (d) {
            return (d >= brushExtent[0] && d <= brushExtent[1]);
        };
    };

    numericalplot.NumericalPlot.prototype.onReset = function () {
        this.clearBrush();
    };

    numericalplot.NumericalPlot.prototype.onSelectionChanged = function (data) {
        this.update(this.simplifyDataStructure(data));
    };

    numericalplot.NumericalPlot.prototype.onDataSetChanged = function (data, metadata) {
        this.metadata = metadata;
        this.build(this.simplifyDataStructure(data));
    };

    numericalplot.NumericalPlot.prototype.registerListener = function (listenerObj) {
        this.listeners.push(listenerObj);
        return this;
    };

    numericalplot.NumericalPlot.prototype.notifyListeners = function (callbackStr, event) {
        this.listeners.forEach(function (listenerObj) {
            listenerObj[callbackStr].call(listenerObj.context, event);
        });
    };

    return numericalplot;

});