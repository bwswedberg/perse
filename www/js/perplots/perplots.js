/**
 *  This file is part of PerSE. PerSE is a visual analytics app for
 *  event periodicity detection and analysis.
 *  Copyright (C) 2015  Brian Swedberg
 */

define([
    'jquery',
    'general/combobutton',
    'perplots/perplot',
    'perplots/perplotsdatasetbuilder',
    'perplots/perplotspositioncalculator',
    // no namespace
    'bootstrap'
], function ($, combobutton, perplot, perplotsdatasetbuilder, perplotspositioncalculator) {

    var perplots = {};

    perplots.PerPlots = function () {
        this.container = $('<div>').attr({'class': 'perse-perplots'});
        this.listeners = [];
        this.metadata = undefined;
        this.calendarName = 'islamic';
        this.cycleName = 'MonthOfYear';
        this.plots = {};
    };

    perplots.PerPlots.prototype.render = function (parent) {
        $(parent).append(this.container);
        return this;
    };

    perplots.PerPlots.prototype.build = function (data) {
        data.forEach(function (d, i) {
            var plot = new perplot.PerPlot(i)
                    .render(this.container)
                    .registerListener(this.createPerPlotListener())
                    .setCalendarName(this.calendarName)
                    .setCycleName(this.cycleName);
            plot.build();
            this.plots[d.id] = plot;
        }, this);
        this.update(data);
    };

    perplots.PerPlots.prototype.update = function (data) {
        var builder = new perplotsdatasetbuilder.PerPlotsDataSetBuilder(this.metadata)
                .setCalendarName(this.calendarName)
                .setCycleName(this.cycleName),
            positionedData = new perplotspositioncalculator.PerPlotsPositionCalculator()
                .setData(data)
                .calculate()
                .map(function (elem) {
                    elem.data = builder.setData(elem.data).build();
                    return elem;
                }),
            yExtent = positionedData
                .map(this.getYExtent)
                .reduce(function (prev, cur) {
                    prev.max = Math.max(prev.max, cur.max);
                    prev.min = Math.min(prev.min, cur.min);
                    return prev;
                }),
            xExtent = this.getXExtent(positionedData[0]),
            extent = {'x': xExtent, 'y': yExtent};

        positionedData.forEach(function (elem) {
            this.plots[elem.id].update(elem.data, extent);
            this.plots[elem.id].setPosition(elem.position);
        }, this);
    };

    perplots.PerPlots.prototype.createPerPlotListener = function () {
        return {
            context: this,
            onFilterChanged: function (event) {
                console.log('filter changed');
            },
            onHoverEvent: function (event) {
                Object.keys(this.plots).forEach(function (k) {
                    this.plots[k].onHover(event);
                }, this);
            }
        };
    };

    perplots.PerPlots.prototype.getYExtent = function (dataObj) {
        var extent = {
            max: dataObj.data[0].partitions[0].events.length,
            min: dataObj.data[0].partitions[0].events.length
        };
        dataObj.data.forEach(function (part) {
            part.partitions.forEach(function (member) {
                extent.max = Math.max(extent.max, member.events.length);
                extent.min = Math.min(extent.min, member.events.length);
            });
        });
        return extent;
    };

    perplots.PerPlots.prototype.getXExtent = function (dataObj) {
        var extent = {min: dataObj.data[0].partitions[0].value, max: dataObj.data[0].partitions[0].value};
        dataObj.data.forEach(function (d) {
            d.partitions.forEach(function (p) {
                extent.min = Math.min(extent.min, p.value);
                extent.max = Math.max(extent.max, p.value);
            });
        });
        return extent;
    };

    perplots.PerPlots.prototype.createFilterChangedListener = function () {
        return {
            context: this,
            onFilterChanged: function (event) {
                this.notifyListeners('onFilterChanged', {context: this, filter: event.filter });
            }
        };
    };

    perplots.PerPlots.prototype.createToolbarListener = function () {
        return {
            context: this,
            onCalendarChanged: function (event) {
                this.calendarName = event.calendarName;
                Object.keys(this.plots).forEach(function (k) {
                    this.plots[k].setCalendarName(event.calendarName);
                }, this);
                this.notifyListeners('onDataSetRequested', {context: this});
            },
            onCycleChanged: function (event) {
                this.cycleName = event.cycleName;
                Object.keys(this.plots).forEach(function (k) {
                    this.plots[k].setCycleName(event.cycleName);
                }, this);
                this.notifyListeners('onDataSetRequested', {context: this});
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
        // blank because perplots updates from permap data
    };

    perplots.PerPlots.prototype.onDataSetChanged = function (data, metadata) {
        this.metadata = metadata;
        this.build(data);
    };

    return perplots;

});