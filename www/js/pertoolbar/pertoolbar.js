/**
 *  This file is part of PerSE. PerSE is a visual analytics app for
 *  event periodicity detection and analysis.
 *  Copyright (C) 2015  Brian Swedberg
 */

define([
    'jquery',
    // no namespace
    'bootstrap'
], function ($) {

    var pertoolbar = {};

    pertoolbar.PerToolbar = function () {
        this.container = $('<div>');
        this.listeners = [];
        this.calendarButtons = {'gregorian': undefined, 'islamic': undefined};
        this.filterButton = undefined;
    };

    pertoolbar.PerToolbar.prototype.render = function (parent) {
        // dark background
        var title = $('<p>')
                .attr({'class': 'perse-header-title'})
                .text('All Views'),
            panelHeader = $('<div>')
                .attr({'class': 'panel-heading perse-panel-heading'})
                .append($('<div>').attr({'class': 'panel-title'}).append(title, this.createControls())),
            panel = $('<div>')
                .attr({'class': 'panel panel-default perse-pertoolbar'})
                .append(panelHeader, this.container);

        /* // plain background
        var title = $('<p>')
                .attr({'class': 'perse-header-title'})
                .text('All Views'),
            panelHeader = $('<div>').attr({'class': 'panel-title perse-panel-heading'}).append(title, this.createControls()),
            panel = $('<div>')
                .attr({'class': 'panel panel-default perse-pertoolbar'})
                .append(panelHeader, this.container);
        */

        $(parent).append(panel);
        return this;
    };

    pertoolbar.PerToolbar.prototype.createControls = function () {
        var cal = this.createCalendarButtonGroup(),
            filterC = this.createFilterButtonGroup();
        return $('<div>')
            .attr({'class': 'btn-toolbar perse-header-toolbar', 'role': 'toolbar'})
            .append(cal, filterC);
    };

    pertoolbar.PerToolbar.prototype.createFilterButtonGroup = function () {
        var filterIcon = $('<span>')
                .attr({'class': 'glyphicon glyphicon-filter', 'aria-hidden': 'true'}),
            filterButton = $('<button>')
                .attr({'class': 'btn btn-default btn-xs', 'type': 'button', 'title': 'Reset All Filters'})
                .append(filterIcon);

        filterButton.on('mouseup', $.proxy(function () {
            $(filterButton).blur();
            this.onReset();
        }, this));

        this.filterButton = filterButton;

        return $('<div>').attr({'class': 'btn-group', 'role': 'group'}).append(filterButton);
    };

    pertoolbar.PerToolbar.prototype.createCalendarButtonGroup = function () {
        var // menu
            calendarHeader = $('<li>').attr({'class': 'dropdown-header', 'role': 'presentation'}).text('Calendar'),
            gregorian = $('<a>')
            .attr({'role': 'menuitem'})
            .text('Gregorian '),
            //.append($('<span>').attr({'class': 'glyphicon glyphicon-ok-sign', 'aria-hidden': 'true'})),
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
            .attr({
                'class': 'btn btn-default btn-xs dropdown-toggle',
                'type': 'button',
                'data-toggle': 'dropdown',
                'title': 'Change All Calendars'
            })
            .append(calendarIcon, ' ', $('<span>').attr({'class': 'caret'}));

        // add events here
        gregorian.on('mouseup', $.proxy(function () {
            this.calendarChanged('gregorian');
        }, this));

        islamic.on('mouseup', $.proxy(function () {
            this.calendarChanged('islamic');
        }, this));

        this.calendarButtons.gregorian = gregorian;
        this.calendarButtons.islamic = islamic;

        return $('<div>').attr({'class': 'btn-group', 'role': 'group'}).append(calendarButton, menu);
    };

    pertoolbar.PerToolbar.prototype.onReset = function () {
        this.notifyListeners('onReset', {'context': this});
    };

    pertoolbar.PerToolbar.prototype.calendarChanged = function (calendarName) {
        /* // adds a glyph icon to show that calendar is selected --> doesn't work here
        [this.calendarButtons.islamic, this.calendarButtons.gregorian].forEach(function (b) {
            b.find('.glyphicon').remove();
        });
        this.calendarButtons[calendarName].append(
            $('<span>').attr({'class': 'glyphicon glyphicon-ok-sign', 'aria-hidden': 'true'})
        );
        */
        this.notifyListeners('onCalendarChanged', {'context': this, 'calendarName': calendarName});
    };

    pertoolbar.PerToolbar.prototype.notifyListeners = function (callbackStr, event) {
        this.listeners.forEach(function (listenerObj) {
            listenerObj[callbackStr].call(listenerObj.context, event);
        }, this);
    };

    pertoolbar.PerToolbar.prototype.registerListener = function (callbackObj) {
        this.listeners.push(callbackObj);
        return this;
    };

    return pertoolbar;

});