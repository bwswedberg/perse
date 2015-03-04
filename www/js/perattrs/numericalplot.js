/**
 *  This file is part of PerSE. PerSE is a visual analytics app for
 *  event periodicity detection and analysis.
 *  Copyright (C) 2015  Brian Swedberg
 */

define([
    'jquery',
    'd3',
    'perattrs/numericalplotdatasetbuilder',
    // no namespace
    'bootstrap'
], function ($, d3, numericalplotdatasetbuilder) {

    var numericalplot = {};

    numericalplot.NumericalPlot = function (attribute) {
        this.attribute = attribute;
        this.contentAttribute = undefined;
        this.container = $('<div>').attr({'class': 'perse-perattr-numericalplot'});
        this.listeners = [];
        this.svg = undefined;
        this.margin = {top: 14, right: 7, bottom: 15, left: 25};
        this.viewBox = {width: 150, height: 174};
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
        var xExtent = this.getXExtent(data);

        this.svg = d3.select(this.container.get(0)).append('svg')
            //.attr('viewBox', [0, 0, this.viewBox.width, this.viewBox.height].join(' '))
            .attr('width', this.viewBox.width)
            .attr('height', this.viewBox.height)
            .append('g')
            .attr('transform', 'translate(' + this.margin.left + ',' + this.margin.top + ')');

        this.xScale = d3.scale.linear()
            .domain([xExtent.min, xExtent.max])
            .range([0, this.size.width]);

        this.update(data);
        this.buildBrush();

    };

    numericalplot.NumericalPlot.prototype.update = function (data) {
        var that = this,
            yExtent = this.getYExtent(data),
            xExtent = this.getXExtent(data),
            bars;
        this.xScale = d3.scale.linear()
            .domain([xExtent.min, xExtent.max])
            .range([0, this.size.width]);

        this.yScale = d3.scale.linear()
            .domain([yExtent.min, yExtent.max])
            .range([this.size.height, 0]);

        if (this.brush !== undefined) {
            this.brush.x(this.xScale);
            this.svg.select('.brush').call(this.brush.clear());
        }

        bars = this.svg.selectAll('.numericalplot-bin')
            .data(data);

        bars.enter().append('g')
            .attr('class', 'numericalplot-bin selected');

        bars.each(function () {
            var g = d3.select(this),
                gData = g.datum(),
                rects,
                barWidth = (gData.dx === 0) ? that.size.width : that.xScale(gData.x + gData.dx) - that.xScale(gData.x);

            rects = g.selectAll('rect')
                .data(gData.events);

            rects.enter().append('rect');

            rects
                .transition()
                .duration(500)
                .attr('fill', function (d) {
                    return d.color;
                })
                .attr('x', 0)
                .attr('y', function (d) {
                    return that.yScale(d.count.end);
                })
                .attr('width', barWidth)
                .attr('height', function (d) {
                    return that.yScale(d.count.begin) - that.yScale(d.count.end);
                });

            rects.exit().remove();

        });

        bars.attr('transform', function (d) {
            return 'translate(' + that.xScale(d.x) + ',0)';
        });

        bars.exit().remove();

        this.updateAxis();
    };

    numericalplot.NumericalPlot.prototype.updateAxis = function () {
        var xAxisBuilder, yAxisBuilder;
        xAxisBuilder = d3.svg.axis()
            .scale(this.xScale)
            .ticks(5)
            .innerTickSize(3)
            .outerTickSize(0)
            .tickPadding(3)
            .orient('bottom');

        yAxisBuilder = d3.svg.axis()
            .scale(this.yScale)
            .innerTickSize(3)
            .outerTickSize(0)
            .tickPadding(3)
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
            .attr('transform', 'translate(-2,0)')
            .call(yAxisBuilder);
    };

    numericalplot.NumericalPlot.prototype.buildBrush = function () {
        var that = this, brushMove, brushEnd, brushG;

        this.svg
            .on('mousemove', function () {
                var x = d3.mouse(that.svg.node())[0];
                if (x >= 0) {
                    that.updateLabel('Frequency: ' + Math.round(that.xScale.invert(d3.mouse(that.svg.node())[0])));
                } else {
                    that.updateLabel('');
                }
            })
            .on('mouseout', function () {
                that.updateLabel('');
            });

        brushMove = function () {
            var bExtent = that.brush.extent();
            that.updateLabel('Frequency: ' + Math.round(bExtent[0]) + ' to ' + Math.round(bExtent[1]));
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

    numericalplot.NumericalPlot.prototype.clearBrush = function () {
        this.svg.selectAll('.brush').call(this.brush.clear());
    };

    numericalplot.NumericalPlot.prototype.getXExtent = function (data) {
        if (data.length === 0) {
            return {min: 0, max: 0};
        }
        return {
            min: data[0].x,
            max: data[data.length - 1].x + data[data.length - 1].dx
        };
    };

    numericalplot.NumericalPlot.prototype.getYExtent = function (data) {
        var firstValue = (data.length === 0) ? 0 : data[0].events[data[0].events.length - 1].count.end,
            extent = {min: 0, max: firstValue};
        return data.reduce(function (p, c) {
            var aggMax = c.events[c.events.length - 1].count.end;
            p.max = Math.max(extent.max, aggMax);
            return p;
        }, extent);
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

    numericalplot.NumericalPlot.prototype.processData = function (data) {
        return new numericalplotdatasetbuilder.NumericalPlotDataSetBuilder()
            .setMetadata(this.metadata)
            .setData(data)
            .setContentAttribute(this.contentAttribute)
            .setAttribute(this.attribute)
            .build();
    };

    numericalplot.NumericalPlot.prototype.setContentAttribute = function (contentAttr) {
        this.contentAttribute = contentAttr;
    };

    numericalplot.NumericalPlot.prototype.onReset = function () {
        this.clearBrush();
    };

    numericalplot.NumericalPlot.prototype.onSelectionChanged = function (data) {
        this.update(this.processData(data));
    };

    numericalplot.NumericalPlot.prototype.onDataSetChanged = function (data, metadata) {
        this.metadata = metadata;
        this.build(this.processData(data));
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