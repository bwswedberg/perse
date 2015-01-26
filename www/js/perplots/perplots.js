/**
 *  This file is part of PerSE. PerSE is a visual analytics app for
 *  event periodicity detection and analysis.
 *  Copyright (C) 2015  Brian Swedberg
 */

define([
    'jquery',
    'calendar/calendarbutton',
    'general/combobutton',
    'perplots/perplot',
    // no namespace
    'bootstrap'
], function (
    $,
    calendarbutton,
    combobutton,
    perplot
) {

    var perplots = {};

    perplots.PerPlots = function () {
        this.container = $('<div>').attr({'class': 'container-fluid perse-perplots'});;
        this.listeners = [];
        this.metadata = undefined;
        this.calendarName = 'Islamic';
        this.cycleName = 'MonthOfYear';
        this.plots = [];
    };

    perplots.PerPlots.prototype.render = function (parent) {
        $(parent).append(this.container);
        return this;
    };

    perplots.PerPlots.prototype.build = function (data) {
        var calendarButtonRow = $('<div>').attr({'class': 'row perse-row'}),
            calendarButton = new calendarbutton.CalendarButton(this.calendarName)
                .render(calendarButtonRow)
                .registerListener(this.createCalendarChangedListener);

        this.container.append(calendarButtonRow);


        // should be in a forEach loop
        var plot = new perplot.PerPlot('0')
            .render(this.container)
            .registerListener(this.createPerPlotListener())
            .setCalendarName(this.calendarName)
            .setCycleName(this.cycleName);
        plot.onDataSetChanged(data, this.metadata);
        this.plots.push(plot);

    };

    perplots.PerPlots.prototype.createCalendarChangedListener = function () {
        return {
            context: this,
            onCalendarChanged: function (event) {
                this.calendarName = event.calendar
                this.plots.forEach(function (p) {
                    p.setCalendarName(event.calendar);
                });
            }
        };
    };

    perplots.PerPlots.prototype.createPerPlotListener = function () {
        return {
            context: this,
            onFilterChanged: function (event) {
                console.log('filter changed');
            }
        };
    };

    perplots.PerPlots.prototype.notifyListeners = function (callbackStr, event) {
        this.listeners.forEach(function (listenerObj) {
            listenerObj[callbackStr].call(listenerObj.context, event);
        }, this);
    };

    perplots.PerPlots.prototype.registerListener = function (callbackObj) {
        this.listeners.push(callbackObj);
        return this;
    };

    perplots.PerPlots.prototype.onSelectionChanged = function (data) {
        this.plots.forEach(function (plot) {
            plot.onSelectionChanged(data);
        });
    };

    perplots.PerPlots.prototype.createFilterChangedListener = function () {
        return {
            context: this,
            onFilterChanged: function (event) {
                this.notifyListeners('onFilterChanged', {context: this, filter: event.filter });
            }
        }
    };

    perplots.PerPlots.prototype.onDataSetChanged = function (data, metadata) {
        this.metadata = metadata;
        this.build(data);
    };

    return perplots;

});