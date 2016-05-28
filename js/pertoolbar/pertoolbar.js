/**
 *  This file is part of PerSE. PerSE is a visual analytics app for
 *  event periodicity detection and analysis.
 *  Copyright (C) 2015  Brian Swedberg
 */

define([
    'jquery',
    'data/metadata/builtinmetadata',
    // no namespace
    'bootstrap'
], function ($, builtinmetadata) {

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
                .text('Main'),
            panelHeader = $('<div>')
                .attr({'class': 'panel-heading perse-panel-heading'})
                .append($('<div>').attr({'class': 'panel-title'}).append(title, this.createControls())),
            panel = $('<div>')
                .attr({'class': 'panel panel-default perse-pertoolbar'})
                .append(panelHeader, this.container);

        $(parent).append(panel);
        return this;
    };

    pertoolbar.PerToolbar.prototype.createControls = function () {
        var changeData = this.createChangeDataSetButtonGroup(),
            cal = this.createCalendarButtonGroup(),
            filterC = this.createFilterButtonGroup();
        return $('<div>')
            .attr({'class': 'btn-toolbar perse-header-toolbar', 'role': 'toolbar'})
            .append(changeData, cal, filterC);
    };

    pertoolbar.PerToolbar.prototype.createChangeDataSetButtonGroup = function () {
        var // menu
            dataSetHeader = $('<li>').attr({'class': 'dropdown-header', 'role': 'presentation'}).text('Data Sets'),
            nigeria = $('<a>')
                .attr({'role': 'menuitem'})
                .text('Nigeria 2008 - 2014 ')
                .append($('<span>').attr({'class': 'glyphicon glyphicon-ok-sign', 'aria-hidden': 'true'})),
            somalia = $('<a>')
                .attr({'role': 'menuitem'})
                .text('Somalia 2000 - 2014 '),
            egypt = $('<a>')
                .attr({'role': 'menuitem'})
                .text('Egypt 1997 - 2014 '),
            sudan = $('<a>')
                .attr({'role': 'menuitem'})
                .text('Sudan 2000 - 2014 '),
            car = $('<a>')
                .attr({'role': 'menuitem'})
                .text('C.A.R. 2000 - 2014 '),
            drc = $('<a>')
                .attr({'role': 'menuitem'})
                .text('D.R.C. 2000 - 2014 '),
            menu = $('<ul>')
            .attr({'class': 'dropdown-menu', 'role': 'menu'})
            .append([
                dataSetHeader,
                $('<li>').attr({'role': 'presentation'}).append(car),
                $('<li>').attr({'role': 'presentation'}).append(drc),
                $('<li>').attr({'role': 'presentation'}).append(egypt),
                $('<li>').attr({'role': 'presentation'}).append(nigeria),
                $('<li>').attr({'role': 'presentation'}).append(somalia),
                $('<li>').attr({'role': 'presentation'}).append(sudan)
            ]),
            // button
            dataSetIcon = $('<span>').attr({'class': 'glyphicon glyphicon-import', 'aria-hidden': 'true'}),
            dataSetButton = $('<button>')
                .attr({
                    'class': 'btn btn-default btn-xs dropdown-toggle',
                    'type': 'button',
                    'data-toggle': 'dropdown',
                    'title': 'Change Data Set'
                })
                .append(dataSetIcon, ' ', $('<span>').attr({'class': 'caret'}));

        // add events here
        nigeria.on('mouseup', $.proxy(function () {
            if (nigeria.find('.glyphicon').length === 0) {
                [somalia, egypt, sudan, car, drc].forEach(this.removeGlyphIcon);
                this.addGlyphIcon(nigeria);
                this.notifyListeners('onDataSetChanged', {context: this, builtInDataSetMetadata: builtinmetadata.nigeria0814});
            }
        }, this));

        somalia.on('mouseup', $.proxy(function () {
            if (somalia.find('.glyphicon').length === 0) {
                [nigeria, egypt, sudan, car, drc].forEach(this.removeGlyphIcon);
                this.addGlyphIcon(somalia);
                this.notifyListeners('onDataSetChanged', {context: this, builtInDataSetMetadata: builtinmetadata.somalia0014});
            }
        }, this));

        egypt.on('mouseup', $.proxy(function () {
            if (egypt.find('.glyphicon').length === 0) {
                [nigeria, sudan, car, drc, somalia].forEach(this.removeGlyphIcon);
                this.addGlyphIcon(egypt);
                this.notifyListeners('onDataSetChanged', {context: this, builtInDataSetMetadata: builtinmetadata.egypt9714});
            }
        }, this));

        sudan.on('mouseup', $.proxy(function () {
            if (sudan.find('.glyphicon').length === 0) {
                [nigeria, egypt, car, drc, somalia].forEach(this.removeGlyphIcon);
                this.addGlyphIcon(sudan);
                this.notifyListeners('onDataSetChanged', {context: this, builtInDataSetMetadata: builtinmetadata.allSudan0014});
            }
        }, this));

        car.on('mouseup', $.proxy(function () {
            if (car.find('.glyphicon').length === 0) {
                [nigeria, egypt, sudan, drc, somalia].forEach(this.removeGlyphIcon);
                this.addGlyphIcon(car);
                this.notifyListeners('onDataSetChanged', {context: this, builtInDataSetMetadata: builtinmetadata.car0014});
            }
        }, this));

        drc.on('mouseup', $.proxy(function () {
            if (drc.find('.glyphicon').length === 0) {
                [nigeria, egypt, sudan, car, somalia].forEach(this.removeGlyphIcon);
                this.addGlyphIcon(drc);
                this.notifyListeners('onDataSetChanged', {context: this, builtInDataSetMetadata: builtinmetadata.drc9714});
            }
        }, this));


        return $('<div>').attr({'class': 'btn-group', 'role': 'group'}).append(dataSetButton, menu);
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

    pertoolbar.PerToolbar.prototype.addGlyphIcon = function (container) {
        container.append(
            $('<span>').attr({'class': 'glyphicon glyphicon-ok-sign', 'aria-hidden': 'true'})
        );
    };

    pertoolbar.PerToolbar.prototype.removeGlyphIcon = function (container) {
        container.find('.glyphicon').remove();
    };

    pertoolbar.PerToolbar.prototype.onReset = function () {
        this.notifyListeners('onReset', {'context': this});
    };

    pertoolbar.PerToolbar.prototype.calendarChanged = function (calendarName) {
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
