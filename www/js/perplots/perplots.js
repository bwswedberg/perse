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
    'perplots/perplotsdatasetbuilder',
    // no namespace
    'bootstrap'
], function ($, calendarbutton, combobutton, perplot, perplotsdatasetbuilder) {

    var perplots = {};

    perplots.PerPlots = function () {
        this.container = $('<div>').attr({'class': 'perse-perplots container-fluid'});
        this.listeners = [];
        this.metadata = undefined;
        this.calendarName = 'islamic';
        this.cycleName = 'MonthOfYear';
        this.plots = [];
    };

    perplots.PerPlots.prototype.render = function (parent) {
        $(parent).append(this.container);
        return this;
    };

    perplots.PerPlots.prototype.build = function (data) {
        var calendarButtonRow = $('<div>').attr({'class': 'row perse-row'}),
            calendarComboButton = this.createCalendarDropdown(),
            cycleComboButton = this.createCycleComboButton(),
            row;
        calendarComboButton.render(calendarButtonRow);
        cycleComboButton.render(calendarButtonRow);

        this.container.append(calendarButtonRow);

        // make this more dynamic
        [ [], [], [], [], [], []].forEach(function (d, i) {
            var plotContainer = $('<div>').attr({'class': 'col-sm-6'}),
                plot = new perplot.PerPlot('0')
                    .render(plotContainer)
                    .registerListener(this.createPerPlotListener())
                    .setCalendarName(this.calendarName)
                    .setCycleName(this.cycleName),
                initData = new perplotsdatasetbuilder.PerPlotsDataSetBuilder(this.metadata)
                    .setCalendarName(this.calendarName)
                    .setCycleName(this.cycleName)
                    .setData(data)
                    .build();


            if (i % 2 === 0) {
                row = $('<div>').attr({'class': 'row'});
                row.append(plotContainer);
            } else {
                row.append(plotContainer);
                this.container.append(row);
            }
            plot.onDataSetChanged(initData, this.metadata);
            this.plots.push(plot);
        }, this);
    };

    perplots.PerPlots.prototype.createCalendarDropdown = function () {
        var calendarDropdown = new combobutton.ComboButton({
            'label': 'Calendar:',
            'values': [
                {'alias': 'Gregorian', id: 'gregorian'},
                {'alias': 'Islamic', id: 'islamic'}
            ],
            'active': this.calendarName
        });
        calendarDropdown.registerListener({
            context: this,
            onComboChanged: function (event) {
                this.calendarName = event.active;
                this.plots.forEach(function (p) {
                    p.setCalendarName(event.active);
                });
                this.notifyListeners('onRefresh', {context: this, view: this});
            }
        });
        return calendarDropdown;
    };

    perplots.PerPlots.prototype.createCycleComboButton = function () {
        var cycleDropdown = new combobutton.ComboButton({
            'label': 'Cycle:',
            'values': [
                {'alias': 'Month of Year', 'id': 'MonthOfYear'},
                {'alias': 'Day of Week', 'id': 'DayOfWeek'},
                {'alias': 'Day of Month', 'id': 'DayOfMonth'},
                {'alias': 'Week of Year', 'id': 'WeekOfYear'}
            ],
            'active': this.cycleName
        });
        cycleDropdown.registerListener({
            context: this,
            onComboChanged: function (event) {
                this.cycleName = event.active;
                this.plots.forEach(function (p) {
                    p.setCycleName(event.active);
                });
                this.notifyListeners('onRefresh', {context: this, view: this});
            }
        });
        return cycleDropdown;
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
        // blank because perplots updates from permap data
    };

    perplots.PerPlots.prototype.getExtent = function (data) {
        var extent = {
            max: data[0].partitions[0].events.length,
            min: data[0].partitions[0].events.length
        };
        data.forEach(function (part) {
            part.partitions.forEach(function (member) {
                extent.max = Math.max(extent.max, member.events.length);
                extent.min = Math.min(extent.min, member.events.length);
            });
        });
        return extent;
    };

    perplots.PerPlots.prototype.onVoronoiChanged = function (data) {
        var newData = data.map(function (d) {
            return new perplotsdatasetbuilder.PerPlotsDataSetBuilder(this.metadata)
                .setCalendarName(this.calendarName)
                .setCycleName(this.cycleName)
                .setData(d)
                .build();
        }, this);

        var yExtent = newData
            .map(this.getExtent)
            .reduce(function (prev, cur) {
                prev.max = Math.max(prev.max, cur.max);
                prev.min = Math.min(prev.min, cur.min);
                return prev;
            });

        newData.forEach(function (d, i) {
            if (this.plots[i]) {
                this.plots[i].update(newData[i], yExtent);
            }
        }, this);
    };

    perplots.PerPlots.prototype.createFilterChangedListener = function () {
        return {
            context: this,
            onFilterChanged: function (event) {
                this.notifyListeners('onFilterChanged', {context: this, filter: event.filter });
            }
        };
    };

    perplots.PerPlots.prototype.onDataSetChanged = function (data, metadata) {
        this.metadata = metadata;
        this.build(data);
    };

    return perplots;

});