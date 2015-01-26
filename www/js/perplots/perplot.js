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
        this.container = $('<div>').attr({'class': 'container-fluid perse-perplot col-sm-6', 'id': id});
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
            title: "Month of Year",
            description: "Event Count",
            chart_type: 'missing-data',
            width: 400,
            height: 250,
            target: this.container
        });
        return this;
    };

    perplot.PerPlot.prototype.update = function (data) {
        var fullData = new perplotsdatasetbuilder.PerPlotsDataSetBuilder()
            .setCalendarName(this.calendarName)
            .setCycleName(this.cycleName)
            .setData(data)
            .build();
        console.log(fullData);
        var legendData = fullData.map(function (d) {return d.label; });
        var chartData =  fullData.map(function (d) {return d.partitions; })
            .map(function (d) {
                return d.map(function (p) {return {x: p.value, y: p.events.length}; });
            });
        var cal = $.calendars.instance(this.calendarName);
        this.plot = MG.data_graphic({
            title: "Month of Year",
            description: "Event Count",
            data: chartData,
            chart_type: 'line',
            width: 400,
            height: 250,
            target: this.container,
            x_accessor: 'x',
            y_accessor: 'y',
            xax_format: function (d) {return cal.local.monthNamesShort[d]; },
            interpolate: "monotone",
            legend: legendData
        });
    };

    perplot.PerPlot.prototype.setCalendarName = function (calendarName) {
        this.calendarName = calendarName;
    };

    perplot.PerPlot.prototype.setCycleName = function (cycleName) {
        this.cycleName = cycleName;
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
        this.update(data);
    };

    perplot.PerPlot.prototype.onDataSetChanged = function (data, metadata) {
        this.metadata = metadata;
        this.update(data);
    };

    return perplot;

});