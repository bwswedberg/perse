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
        this.container = $('<div>').attr({'class': 'container-fluid perse-perwheel'});
        this.calendarName = 'gregorian';
        this.listeners = [];
        this.timeWheel = undefined;
        this.timeWheelDescriptionMajor = undefined;
        this.timeWheelDescriptionMinor = undefined;
        this.filter = new filter.Filter({
            uniqueId: 'perse-perwheel',
            property: 'julianDate',
            filterOn: function (d) {return true; }
        });
    };

    perwheel.PerWheel.prototype.render = function (parent) {
        $(parent).append(this.container);
        this.container
            .append(this.createHeader())
            .append(this.createCalendar())
            .append(this.createTimeWheel());
        return this;
    };

    perwheel.PerWheel.prototype.createHeader = function () {
        var h = $('<h3>').attr({'class': 'perse-perwheel-header'}).text('Time-Wheel');
        return $('<div>').attr({'class': 'row'}).append(h);
    };

    perwheel.PerWheel.prototype.createCalendar = function () {
        var row = $('<div>').attr({'class': 'row perse-row perse-perwheel-calendar'}),
            calendarDropdown = new combobutton.ComboButton({
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
                this.calendarChanged(event.active);
            }
        });
        calendarDropdown.render(row);
        return row;
    };

    perwheel.PerWheel.prototype.calendarChanged = function (newCalendar) {
        this.calendarName = newCalendar;
        this.timeWheel.setCalendarName(this.calendarName);
        this.filter.filterOn = function () {return true; }
        this.notifyListeners('onFilterChanged', {context: this, filter: this.filter });
    };

    perwheel.PerWheel.prototype.createTimeWheel = function () {
        var label = $('<span>').text('Periodicity:'),
            timeWheelDiv = $('<div>').attr({'class': 'col-sm-12'});
        this.timeWheelDescriptionMajor = $('<span>').attr({'class': 'perse-perwheel-timewheel-mjrlabel'});
        this.timeWheelDescriptionMinor = $('<span>').attr({'class': 'perse-perwheel-timewheel-mnrlabel'});

        this.timeWheel = new timewheel.TimeWheel(this.calendarName, timeWheelDiv.get(0));

        this.timeWheel.registerListener({
            context: this,
            onTimeWheelLabelChanged: function (event) {
                //console.log('onLabelChanged', event);
                this.timeWheelDescriptionMajor.text(event.ringLabel + '');
                this.timeWheelDescriptionMinor.text(event.arcLabel);
            },
            onTimeWheelSelectionChanged: function (event) {
                this.notifyListeners('onFilterChanged', {context: this, filter: this.getFilter()});
            }
        });
        return $('<div>')
            .attr({'class': 'row perse-row perse-perwheel-timewheel'})
            .append(label)
            .append(timeWheelDiv)
            .append(this.timeWheelDescriptionMajor)
            .append(this.timeWheelDescriptionMinor);
    };

    perwheel.PerWheel.prototype.getData = function () {
        var data = {
                calendarName: this.calendarName,
                periodicity: this.timeWheel.getData()
            };
        return data;
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
    };

    return perwheel;

});
