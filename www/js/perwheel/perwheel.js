/**
 *  This file is part of PerSE. PerSE is a visual analytics app for
 *  exploring spatiotemporal periodicity.
 *  Copyright (C) 2014  Brian Swedberg
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

define([
    'jquery',
    'data/filter',
    'perwheel/timewheel',
    // no namespace
    '$.calendars',
    'bootstrap'
], function ($, filter, timewheel) {
    
    var perwheel = {};

    perwheel.PerWheel = function () {
        this.container = $('<div>').attr({'class': 'container-fluid perse-perwheel'});
        this.calendarName = 'Gregorian';
        this.listeners = [];
        this.rangePicker = undefined;
        this.timeWheel = undefined;
        this.timeWheelDescriptionMajor = undefined;
        this.timeWheelDescriptionMinor = undefined;
        this.calendarButton = undefined;
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
            .append(this.createRange())
            .append(this.createTimeWheel());
        return this;
    };

    perwheel.PerWheel.prototype.createHeader = function () {
        var h = $('<h3>').attr({'class': 'perse-perwheel-header'}).text('Time Selection');
        return $('<div>').attr({'class': 'row'}).append(h);
    };

    perwheel.PerWheel.prototype.createCalendar = function () {
        var availableCalendars = [
                {'alias': 'Gregorian', 'name': 'gregorian'},
                {'alias': 'Islamic', 'name': 'islamic'}
            ],
            b = $('<button>')
                .attr({'class': 'btn btn-default dropdown-toggle btn-xs perse-btn', 'data-toggle':'dropdown'})
                .text(this.calendarName + ' ')
                .append($('<span>').attr({'class': 'caret'})),
            menu = $('<ul>')
                .attr({'class': 'dropdown-menu', 'role': 'menu'}),
            dropdown = $('<span>')
                .attr({'class': 'dropdown span3'})
                .append(b)
                .append(menu),
            label = $('<span>').attr({'class': 'span3'}).text('Calendar:');

        this.calendarButton = b;

        availableCalendars.forEach(function (d) {
            var button = $('<a>').attr({'role': 'menuitem'}).text(d.alias),
                li = $('<li>').attr({'role': 'presentation'}).append(button);
            button.click($.proxy(function () {
                var newCalendar = $(button).text();
                this.calendarChanged(newCalendar);
            }, this));
            menu.append(li);
        }, this);

        return $('<div>').attr({'class': 'row perse-row perse-perwheel-calendar'}).append(label).append(dropdown);
    };

    perwheel.PerWheel.prototype.calendarChanged = function (newCalendar) {
        this.calendarName = newCalendar;
        this.calendarButton.text(newCalendar+ ' ' ).append($('<span>').attr({'class': 'caret'}));
        this.timeWheel.setCalendarName(this.calendarName);
        this.updateRange();
        this.filter.filterOn = function () {return true; }
        this.notifyListeners('onFilterChanged', {context: this, filter: this.filter });
    };

    perwheel.PerWheel.prototype.createRange = function () {
        var labelSpan = $('<span>').text('Range:'),
            pickerSpan = $('<span>');

        this.rangePicker = $('<input>').attr({'type': 'text'});
        this.rangePicker.calendarsPicker({
            calendar: $.calendars.instance(this.calendarName),
            rangeSelect: true,
            showOtherMonths: true,
            selectOtherMonths: true
        });
        pickerSpan.append(this.rangePicker);
        /*
        var calendarIcon = $('<img>').attr({'class': 'perse-icon', 'src': './img/calendar.png'});
        calendarIcon.click($.proxy(function () {
            this.rangePicker.calendarsPicker('show');
        }, this));
        */
        return $('<div>').attr({'class': 'row perse-row perse-perwheel-range'}).append(labelSpan).append(pickerSpan);
    };

    perwheel.PerWheel.prototype.updateRange = function () {
        var oldestDate = $.calendars.instance(this.calendarName).fromJD(this.metadata.getMetadata().temporal.beginJulianDate),
            youngestDate = $.calendars.instance(this.calendarName).fromJD(this.metadata.getMetadata().temporal.endJulianDate);
        this.rangePicker.calendarsPicker('option', 'calendar', $.calendars.instance(this.calendarName));
        this.rangePicker.calendarsPicker('setDate', oldestDate, youngestDate);
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

        var cdates = $(this.rangePicker).calendarsPicker('getDate'),
            data = {
                calendarName: this.calendarName,
                range: {
                    begin: cdates[0].toJD(),
                    end: cdates[1].toJD()
                },
                periodicity: this.timeWheel.getData()
            };
        return data;
    };

    perwheel.PerWheel.prototype.getFilter = function () {
        var data = this.getData(),
            cal = $.calendars.instance(data.calendarName);
        this.filter.filterOn = function (julianDate) {
            var date = cal.fromJD(julianDate);
            if (julianDate > data.range.end || julianDate <  data.range.begin) {
                return false;
            }
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
        this.updateRange();
    };

    return perwheel;

});
