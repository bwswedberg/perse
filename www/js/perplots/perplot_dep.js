/**
 *  This file is part of PerSE. PerSE is a visual analytics app for
 *  event periodicity detection and analysis.
 *  Copyright (C) 2015  Brian Swedberg
 */

define([
    'jquery',
    'd3',
    'metricsgraphics',
    'data/filter',
    // no namespace
    '$.calendars',
    'bootstrap'
], function ($, d3, MG, filter) {

    var perplot = {};

    perplot.PerPlot = function (uniqueId) {
        this.id = uniqueId;
        this.container = $('<div>').attr({'class': 'perse-perplot', 'id': 'perse-perplot-' + uniqueId});
        this.listeners = [];
        //this.metadata = undefined;
        this.filter = new filter.Filter({
            uniqueId: 'perse-perplot-' + uniqueId,
            property: 'coord',
            filterOn: function (d) {return true; }
        });
        this.plot = undefined;
        this.calendarName = 'Gregorian';
        this.cycleName = 'MonthOfYear';
    };

    perplot.PerPlot.prototype.render = function (parent) {
        $(parent).append(this.container);
        return this;
    };

    perplot.PerPlot.prototype.update = function (data, extent) {
        console.log(data);
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
            /*full_width: true,*/
            top: 15,
            left: 20,
            right: 0,
            chart_type: 'line',
            max_y: extent.max,
            min_y: extent.min,
            target: '#perse-perplot-' + this.id,//this.container.get(0),
            x_accessor: 'x',
            y_accessor: 'y',
            linked: true,
            xax_format: function (d) {return xLabels[d]; },
            interpolate: 'monotone',
            mouseover: function (d, i) {
                console.log(this);

                $(this.target).find('svg .mg-active-datapoint').text(xLabels[d.x] + ', Frequency: ' + d.y);
            }
            //legend: legendData
        });

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