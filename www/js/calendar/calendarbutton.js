/**
 *  This file is part of PerSE. PerSE is a visual analytics app for
 *  event periodicity detection and analysis.
 *  Copyright (C) 2015  Brian Swedberg
 */

define([
    'jquery',
    // no namespace
    'bootstrap'
],function ($) {

    var calendarbutton = {};

    calendarbutton.CalendarButton = function (calendarName) {
        this.calendarName = calendarName || 'Gregorian';
        this.listeners = [];
    };

    calendarbutton.CalendarButton.prototype.render = function (parent) {
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
                .attr({'class': 'dropdown col-sm-3'})
                .append(b)
                .append(menu),
            label = $('<span>').attr({'class': 'col-sm-3'}).text('Calendar:');

        this.calendarButton = b;

        availableCalendars.forEach(function (d) {
            var button = $('<a>').attr({'role': 'menuitem'}).text(d.alias),
                li = $('<li>').attr({'role': 'presentation'}).append(button);
            button.click($.proxy(function () {
                this.calendarName = $(button).text();
                this.notifyListeners('onCalendarChanged', {'context': this, 'calendar': this.calendarName});
            }, this));
            menu.append(li);
        }, this);

        $(parent).append(label, dropdown);

        return this;
    };

    calendarbutton.CalendarButton.getCalendarName = function () {
        return this.calendarName;
    };

    calendarbutton.CalendarButton.prototype.notifyListeners = function (callbackStr, event) {
        this.listeners.forEach(function (listenerObj) {
            listenerObj[callbackStr].call(listenerObj.context, event);
        }, this);
    };

    calendarbutton.CalendarButton.prototype.registerListener = function (callbackObj) {
        this.listeners.push(callbackObj);
        return this;
    };

    return calendarbutton;

});