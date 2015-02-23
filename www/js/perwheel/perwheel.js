/**
 *  This file is part of PerSE. PerSE is a visual analytics app for
 *  event periodicity detection and analysis.
 *  Copyright (C) 2015  Brian Swedberg
 */

define([
    'jquery',
    'data/filter',
    'perwheel/timewheel',
    'general/combobutton',
    // no namespace
    '$.calendars',
    'bootstrap'
], function ($, filter, timewheel, combobutton) {
    
    var perwheel = {};

    perwheel.PerWheel = function () {
        this.container = $('<div>').attr({'class': 'panel-body perse-panel-body'});
        this.calendarName = 'Gregorian';
        this.listeners = [];
        this.timeWheel = undefined;
        this.filterButton = undefined;
        this.filter = new filter.Filter({
            uniqueId: 'perse-perwheel',
            property: 'julianDate',
            filterOn: function (d) {return true; }
        });
    };

    perwheel.PerWheel.prototype.render = function (parent) {
        var title = $('<p>')
                .attr({'class': 'perse-header-title'})
                .text('Time-Wheel'),
            panelHeader = $('<div>')
                .attr({'class': 'panel-heading perse-panel-heading'})
                .append($('<div>').attr({'class': 'panel-title'}).append(title, this.createControls())),
            panel = $('<div>')
                .attr({'class': 'panel panel-default perse-perwheel'})
                .append(panelHeader, this.container);

        $(parent).append(panel);
        this.container.append(this.createTimeWheel());
        return this;
    };

    perwheel.PerWheel.prototype.createControls = function () {
        var cal = this.createCalendarButtonGroup(),
            filter = this.createFilterControlButtonGroup();
        return $('<div>')
            .attr({'class': 'btn-toolbar perse-header-toolbar', 'role': 'toolbar'})
            .append(cal, filter);
    };

    perwheel.PerWheel.prototype.createFilterControlButtonGroup = function () {
        var filterIcon = $('<span>')
                .attr({'class': 'glyphicon glyphicon-filter', 'aria-hidden': 'true'}),
            filterButton = $('<button>')
                .attr({'class': 'btn btn-default btn-xs', 'type': 'button', 'title': 'Reset Filter'})
                .append(filterIcon);

        filterButton.on('mouseup', $.proxy(function () {
            $(filterButton).blur();
            this.onReset();
            this.notifyListeners('onFilterChanged', {context: this, filter: this.getFilter()});
        }, this));

        this.filterButton = filterButton;

        return $('<div>').attr({'class': 'btn-group', 'role': 'group'}).append(filterButton);
    };

    perwheel.PerWheel.prototype.createCalendarButtonGroup = function () {
        var // menu
            calendarHeader = $('<li>').attr({'class': 'dropdown-header', 'role': 'presentation'}).text('Calendar'),
            gregorian = $('<a>').attr({'role': 'menuitem'}).text('Gregorian ').append($('<span>').attr({'class': 'glyphicon glyphicon-ok-sign', 'aria-hidden': 'true'})),
            islamic = $('<a>').attr({'role': 'menuitem'}).text('Islamic '),
            menu = $('<ul>')
            .attr({'class': 'dropdown-menu', 'role': 'menu'})
            .append([
                calendarHeader,
                $('<li>').attr({'role': 'presentation'}).append(gregorian),
                $('<li>').attr({'role': 'presentation'}).append(islamic)
            ]),
        // button
            calendarIcon = $('<span>').attr({'class': 'glyphicon glyphicon-calendar', 'aria-hidden': 'true'}),
            calendarButton = $('<button>')
                .attr({'class': 'btn btn-default btn-xs dropdown-toggle', 'type': 'button', 'data-toggle': 'dropdown', 'title': 'Change Calendar System'})
                .append(calendarIcon, ' ', $('<span>').attr({'class': 'caret'}));

        // add events here
        gregorian.on('mouseup', $.proxy(function () {
            this.calendarName = 'Gregorian';
            this.calendarChanged('Gregorian');
            menu.find('li a span').remove();
            gregorian.append($('<span>').attr({'class': 'glyphicon glyphicon-ok-sign', 'aria-hidden': 'true'}));
        }, this));

        islamic.on('mouseup', $.proxy(function () {
            this.calendarName = 'Islamic';
            this.calendarChanged('Islamic');
            menu.find('li a span').remove();
            islamic.append($('<span>').attr({'class': 'glyphicon glyphicon-ok-sign', 'aria-hidden': 'true'}));
        }, this));

        return $('<div>').attr({'class': 'btn-group', 'role': 'group'}).append(calendarButton, menu);
    };

    perwheel.PerWheel.prototype.calendarChanged = function (newCalendar) {
        this.calendarName = newCalendar;
        this.timeWheel.setCalendarName(this.calendarName);
        this.filter.filterOn = function () {return true; };
        this.notifyListeners('onFilterChanged', {context: this, filter: this.filter});
    };

    perwheel.PerWheel.prototype.createTimeWheel = function () {
        var timeWheelDiv = $('<div>');

        this.timeWheel = new timewheel.TimeWheel(this.calendarName, timeWheelDiv.get(0));

        this.timeWheel.registerListener({
            context: this,
            onTimeWheelSelectionChanged: function (event) {
                this.validateFilterButton();
                this.notifyListeners('onFilterChanged', {context: this, filter: this.getFilter()});
            }
        });
        return $('<div>')
            .attr({'class': 'perse-perwheel-timewheel'})
            .append(timeWheelDiv);
    };

    perwheel.PerWheel.prototype.validateFilterButton = function () {
        var twData = this.getData(),
            shouldEnable = Object.keys(twData.periodicity).every(function (key) {
                return twData.periodicity[key].data.every(function (cycle) {
                    return cycle.enabled;
                });
            });
        this.filterButton.toggleClass('disabled', shouldEnable);
    };

    perwheel.PerWheel.prototype.getData = function () {
        return {
            calendarName: this.calendarName,
            periodicity: this.timeWheel.getData()
        };
    };

    perwheel.PerWheel.prototype.getFilter = function () {
        var data = this.getData(),
            cal = $.calendars.instance(data.calendarName);
        this.filter.filterOn = function (julianDate) {
            var date = cal.fromJD(julianDate);
            if (!data.periodicity.dayOfWeek.data[date.dayOfWeek()].enabled) {
                return false;
            }
            if (!data.periodicity.dayOfMonth.data[date.day() - 1].enabled) {
                return false;
            }
            if (!data.periodicity.monthOfYear.data[date.month() - 1].enabled) {
                return false;
            }
            return true;
        };
        return this.filter;
    };

    perwheel.PerWheel.prototype.onReset = function () {
        this.filterButton.toggleClass('disabled', true);
        this.filter.filterOn = function () {return true; };
        this.timeWheel.setAllEnabled();
    };

    perwheel.PerWheel.prototype.notifyListeners = function (callbackStr, event) {
        this.listeners.forEach(function (listenerObj) {
            listenerObj[callbackStr].call(listenerObj.context, event);
        }, this);
    };

    perwheel.PerWheel.prototype.registerListener = function (callbackObj) {
        this.listeners.push(callbackObj);
        return this;
    };

    perwheel.PerWheel.prototype.onSelectionChanged = function (data) {
        this.timeWheel.onSelectionChanged(data);
    };

    perwheel.PerWheel.prototype.onDataSetChanged = function (data, metadata) {
        this.metadata = metadata;
        this.timeWheel.onDataSetChanged(data, metadata);
        this.filterButton.toggleClass('disabled', true);
    };

    return perwheel;

});
