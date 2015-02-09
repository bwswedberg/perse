/**
*  This file is part of PerSE. PerSE is a visual analytics app for
*  event periodicity detection and analysis.
*  Copyright (C) 2015  Brian Swedberg
*/

define([
    'jquery',
    'd3',
    'data/filter',
    // no namespace
    '$.calendars',
    'bootstrap'
], function ($, d3, filter) {

    var perplot = {};

    perplot.PerPlot = function (uniqueId) {
        this.id = uniqueId;
        this.container = $('<div>').attr({'class': 'perse-perplot', 'id': 'perse-perplot-' + uniqueId});
        this.listeners = [];
        this.svg = undefined;
        this.calendarName = 'Gregorian';
        this.cycleName = 'MonthOfYear';
        this.margin = {'top': 0, 'bottom': 10, 'left': 15, 'right': 0};
        this.viewBox = {'width': 150, 'height': 100};
        this.size = {
            'width': this.viewBox.width - this.margin.left - this.margin.right,
            'height': this.viewBox.height - this.margin.top - this.margin.top
        };
        this.filter = new filter.Filter({
            uniqueId: 'perse-perplot-' + uniqueId,
            property: 'coord',
            filterOn: function (d) {
                return true;
            }
        });
    };

    perplot.PerPlot.prototype.render = function (parent) {
        $(parent).append(this.container);
        return this;
    };

    perplot.PerPlot.prototype.build = function () {
        this.svg = d3.select(this.container.get(0))
            .append('svg')
            .attr('viewBox', '0 0 ' + this.viewBox.width + ' ' + this.viewBox.height)
            .append('g')
            .attr('transform', 'translate(' + this.margin.left + ',' + this.margin.top + ')');
    };

    perplot.PerPlot.prototype.update = function (data, extent) {
        var xScale,
            yScale,
            xAxisBuilder,
            yAxisBuilder,
            xLabels = data[0].partitions.map(function (d) {return d.label; }),
            line,
            pathsG,
            tickStep = Math.round(xLabels.length / 6);

        xScale = d3.scale.ordinal()
            .domain(d3.range(extent.x.max + 1))
            .rangePoints([0, this.size.width]);

        yScale = d3.scale.linear()
            .domain([extent.y.min, extent.y.max])
            .range([this.size.height, 0]);

        line = d3.svg.line()
            .interpolate('monotone')
            .x(function (d) { return xScale(d.value); })
            .y(function (d) {return yScale(d.events.length); });

        pathsG = this.svg.selectAll('path.perplot-path')
            .data(data);

        pathsG.enter().append('path');

        pathsG.transition()
            .duration(500)
            .attr('d', function (d) {return line(d.partitions); })
            .attr('class', 'perplot-path');

        pathsG.exit().remove();

        this.svg.selectAll('.perplot-axis').remove();

        xAxisBuilder = d3.svg.axis()
            .scale(xScale)
            .tickFormat(function (v) {
                if (!(v % tickStep)) {
                    return xLabels[v];
                }
            })
            .innerTickSize(2)
            .outerTickSize(2)
            .orient('bottom');

        this.svg.append("g")
            .attr('class', 'perplot-axis')
            .attr('transform', 'translate(0,' + (this.size.height - 1) + ')')
            .call(xAxisBuilder);

        yAxisBuilder = d3.svg.axis()
            .scale(yScale)
            .innerTickSize(2)
            .outerTickSize(2)
            .orient('left');

        this.svg.append("g")
            .attr('class', 'perplot-axis')
            .attr('transform', 'translate(-1, 0)')
            .call(yAxisBuilder);

    };

    perplot.PerPlot.prototype.getId = function () {
        return this.id;
    };

    perplot.PerPlot.prototype.setCalendarName = function (calendarName) {
        this.calendarName = calendarName;
        return this;
    };

    perplot.PerPlot.prototype.setCycleName = function (cycleName) {
        this.cycleName = cycleName;
        return this;
    };

    perplot.PerPlot.prototype.setPosition = function (positionObj) {
        this.container.animate(positionObj, 'slow');
        return this;
    };

    perplot.PerPlot.prototype.getFilter = function () {
        return this.filter;
    };

    perplot.PerPlot.prototype.notifyListeners = function (callbackStr, event) {
        this.listeners.forEach(function (listenerObj) {
            listenerObj[callbackStr].call(listenerObj.context, event);
        }, this);
    };

    perplot.PerPlot.prototype.registerListener = function (callbackObj) {
        this.listeners.push(callbackObj);
        return this;
    };

    perplot.PerPlot.prototype.onSelectionChanged = function (data) {
        //this.update(data);
    };

    perplot.PerPlot.prototype.onDataSetChanged = function (data, metadata) {
        //this.metadata = metadata;
        //this.update(data);
    };

    return perplot;

});