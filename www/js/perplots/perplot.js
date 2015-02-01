/**
 *  This file is part of PerSE. PerSE is a visual analytics app for
 *  event periodicity detection and analysis.
 *  Copyright (C) 2015  Brian Swedberg
 */

define([
    'jquery',
    'metricsgraphics',
    'perplots/perplotsdatasetbuilder',
    'data/filter',
    // no namespace
    '$.calendars',
    'bootstrap'
], function ($, MG, perplotsdatasetbuilder, filter) {

    var perplot = {};

    perplot.PerPlot = function (uniqueId) {
        var id = 'perse-perplot-' + uniqueId;
        this.container = $('<div>').attr({'class': 'perse-perplot', 'id': id});
        this.listeners = [];
        this.metadata = undefined;
        this.filter = new filter.Filter({
            uniqueId: id,
            property: 'coord',
            filterOn: function (d) {return true; }
        });
        this.plot = undefined;
        this.calendarName = 'Gregorian';
        this.cycleName = 'MonthOfYear';
    };

    perplot.PerPlot.prototype.render = function (parent) {
        $(parent).append(this.container);
        this.plot = MG.data_graphic({
            chart_type: 'missing-data',
            show_missing_background: true,
            target: this.container.get(0)
        });
        return this;
    };

    perplot.PerPlot.prototype.update = function (data, extent) {
        var legendData = data.map(function (d) {return d.label; });
        var xLabels = data[0].partitions.map(function (d) {return d.label; });
        var chartData =  data.map(function (d) {return d.partitions; })
            .map(function (d) {
                return d.map(function (p) {return {x: p.value, y: p.events.length}; });
            });
        var cal = $.calendars.instance(this.calendarName);
        this.plot = MG.data_graphic({
            data: chartData,
            full_height: true,
            full_width: true,
            chart_type: 'line',
            buffer: 0,
            max_y: extent.max,
            min_y: extent.min,
            width: 200,
            height: 150,
            left: 20,
            top: 15,
            target: this.container.get(0),
            x_accessor: 'x',
            y_accessor: 'y',
            xax_format: function (d) {return xLabels[d]; },
            interpolate: "monotone",
            legend: legendData
        });
    };

    perplot.PerPlot.prototype.setCalendarName = function (calendarName) {
        this.calendarName = calendarName;
        return this;
    };

    perplot.PerPlot.prototype.setCycleName = function (cycleName) {
        this.cycleName = cycleName;
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
        this.metadata = metadata;
        //this.update(data);
    };

    return perplot;

});