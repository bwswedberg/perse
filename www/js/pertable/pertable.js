/**
 *  This file is part of PerSE. PerSE is a visual analytics app for
 *  event periodicity detection and analysis.
 *  Copyright (C) 2015  Brian Swedberg
 */

define([
    'jquery',
    // no namespace
    '$.calendars',
    'bootstrap'
], function ($) {

    var pertable = {};

    pertable.PerTable = function () {
        this.container = $('<div>').attr({'class': 'panel-body perse-panel-body'});
        this.metadata = undefined;
        this.listeners = [];
        this.calendarName = 'gregorian';
        this.calendarButtons = {gregorian: undefined, islamic: undefined};

    };

    pertable.PerTable.prototype.render = function (parent) {
        var title = $('<p>')
                .attr({'class': 'perse-header-title'})
                .text('Selection Data'),
            panelHeader = $('<div>')
                .attr({'class': 'panel-heading perse-panel-heading'})
                .append($('<div>').attr({'class': 'panel-title'}).append(title, this.createControls())),
            panel = $('<div>')
                .attr({'class': 'panel panel-default perse-pertable'})
                .append(panelHeader, this.container);

        $(parent).append(panel);
        return this;
    };

    pertable.PerTable.prototype.createControls = function () {
        var cal = this.createCalendarButtonGroup();
        return $('<div>')
            .attr({'class': 'btn-toolbar perse-header-toolbar', 'role': 'toolbar'})
            .append(cal);
    };

    pertable.PerTable.prototype.createCalendarButtonGroup = function () {
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
            this.calendarChanged('gregorian');
            //menu.find('li a span').remove();
            //gregorian.append($('<span>').attr({'class': 'glyphicon glyphicon-ok-sign', 'aria-hidden': 'true'}));
        }, this));

        islamic.on('mouseup', $.proxy(function () {
            this.calendarChanged('islamic');
            //menu.find('li a span').remove();
            //islamic.append($('<span>').attr({'class': 'glyphicon glyphicon-ok-sign', 'aria-hidden': 'true'}));
        }, this));

        this.calendarButtons.islamic = islamic;
        this.calendarButtons.gregorian = gregorian;

        return $('<div>').attr({'class': 'btn-group', 'role': 'group'}).append(calendarButton, menu);
    };

    pertable.PerTable.prototype.calendarChanged = function (calendarName) {
        this.setCalendar(calendarName);
        this.notifyListeners('onDataSetRequested', {
            context: this,
            callback: function (data) {
                this.onSelectionChanged(data);
            }
        });
    };

    pertable.PerTable.prototype.build = function (data) {
        var headers = $('<tr>'),
            tbody = $('<tbody>').append(headers),
            table = $('<table>').attr({'class': 'table table-condensed'}).append(tbody),
            attrMetadata = this.metadata.attribute;

        headers.append($('<th>').text('Date'));

        attrMetadata.attributeKeys.forEach(function (key) {
            headers.append($('<th>').text(attrMetadata.attributes[key].label));
        }, this);

        headers.append($('<th>').text(attrMetadata.description.label));

        this.container.append(table);

        this.update(data);
    };

    pertable.PerTable.prototype.update = function (data) {
        var cal = $.calendars.instance(this.calendarName),
            months = cal.local.monthNamesShort,
            attrMetadata = this.metadata.attribute,
            tbody = this.container.find('table tbody');

        tbody.find('.pertable-datarow').remove();

        // TODO: update rows rather than delete and add

        // TODO: add paging so that people can see more than top 50 events

        data.splice(0, 50).forEach(function (d) {
            var row = $('<tr>').attr({'class': 'pertable-datarow'}),
                date = cal.fromJD(d.julianDate);
            row.append($('<td>').text([date.day(), months[date.month() - 1], date.year()].join(' ')));
            attrMetadata.attributeKeys.forEach(function (key) {
                row.append($('<td>').text(d[key]));
            }, this);
            row.append($('<td>').text(d.description));
            tbody.append(row);
        });
    };

    pertable.PerTable.prototype.setContentAttribute = function (contentAttribute) {

    };

    pertable.PerTable.prototype.onReset = function () {
    };

    pertable.PerTable.prototype.setCalendar = function (calendarName) {
        if (this.calendarButtons.hasOwnProperty(calendarName)) {
            this.calendarName = calendarName;
            [this.calendarButtons.islamic, this.calendarButtons.gregorian].forEach(function (b) {
                b.find('.glyphicon').remove();
            });
            this.calendarButtons[calendarName].append(
                $('<span>').attr({'class': 'glyphicon glyphicon-ok-sign', 'aria-hidden': 'true'})
            );
        }
    };

    pertable.PerTable.prototype.notifyListeners = function (callbackStr, event) {
        this.listeners.forEach(function (listenerObj) {
            listenerObj[callbackStr].call(listenerObj.context, event);
        }, this);
    };

    pertable.PerTable.prototype.registerListener = function (callbackObj) {
        this.listeners.push(callbackObj);
        return this;
    };

    pertable.PerTable.prototype.onSelectionChanged = function (data) {
        this.update(data);
    };

    pertable.PerTable.prototype.onDataSetChanged = function (data, metadata) {
        this.metadata = metadata;
        this.build(data);
    };

    return pertable;

});