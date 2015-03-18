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
        this.contentAttribute = undefined;
        this.metadata = undefined;
        this.listeners = [];
        this.calendarName = 'gregorian';
        this.calendarButtons = {gregorian: undefined, islamic: undefined};
        this.pagingButtons = {left: undefined, right: undefined};
        this.paging = {page: 0, maxPage: 0, minPage: 0, interval: 25, isPageUpdate: false};
    };

    pertable.PerTable.prototype.render = function (parent) {
        var title = $('<p>')
                .attr({'class': 'perse-header-title'})
                .text('Table'),
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
        var cal = this.createCalendarButtonGroup(),
            paging = this.createPagingControlButtonGroup();
        return $('<div>')
            .attr({'class': 'btn-toolbar perse-header-toolbar', 'role': 'toolbar'})
            .append(cal, paging);
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
        }, this));

        islamic.on('mouseup', $.proxy(function () {
            this.calendarChanged('islamic');
        }, this));

        this.calendarButtons.islamic = islamic;
        this.calendarButtons.gregorian = gregorian;

        return $('<div>').attr({'class': 'btn-group', 'role': 'group'}).append(calendarButton, menu);
    };

    pertable.PerTable.prototype.createPagingControlButtonGroup = function () {
        var pageLeftIcon = $('<span>')
                .attr({'class': 'glyphicon glyphicon-arrow-left', 'aria-hidden': 'true'}),
            pageLeftButton = $('<button>')
                .attr({'class': 'btn btn-default btn-xs', 'type': 'button', 'title': 'Previous ' + this.paging.interval + ' Events'})
                .append(pageLeftIcon),
            pageRightIcon = $('<span>')
                .attr({'class': 'glyphicon glyphicon-arrow-right', 'aria-hidden': 'true', 'title': 'Next ' + this.paging.interval + ' Events'}),
            pageRightButton = $('<button>')
                .attr({'class': 'btn btn-default btn-xs', 'type': 'button'})
                .append(pageRightIcon);

        pageLeftButton.on('mouseup', $.proxy(function () {
            $(pageLeftButton).blur();
            this.pageChanged(this.paging.page - 1);
        }, this));

        pageRightButton.on('mouseup', $.proxy(function () {
            $(pageRightButton).blur();
            this.pageChanged(this.paging.page + 1);
        }, this));

        this.pagingButtons.left = pageLeftButton;
        this.pagingButtons.right = pageRightButton;

        return $('<div>')
            .attr({'class': 'btn-group', 'role': 'group'})
            .append(pageLeftButton, pageRightButton);
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
        var uniqueValues = (this.contentAttribute === undefined) ? {} : this.metadata.attribute.attributes[this.contentAttribute].uniqueValues,
            cal = $.calendars.instance(this.calendarName),
            months = cal.local.monthNamesShort,
            attrMetadata = this.metadata.attribute,
            tbody = this.container.find('table tbody');

        tbody.find('.pertable-datarow').remove();


        if (this.paging.isPageUpdate) {
            // flag to prevent from going back to page 0
            this.paging.isPageUpdate = false;
        } else {
            this.paging.page = 0;
            this.setPageExtent(data.length);
        }

        data.splice(this.paging.page * this.paging.interval, this.paging.interval).forEach(function (d) {
            var hexColor = (this.contentAttribute === undefined) ? '#000000' : uniqueValues[d[this.contentAttribute]].color,
                rgb = this.hexToRGB(hexColor),
                row = $('<tr>').attr({'class': 'pertable-datarow'})
                    .css({'background-color': 'rgba(' + [rgb.r, rgb.g, rgb.b, 0.15].join(',') + ')'}),
                date = cal.fromJD(d.julianDate);
            row.append($('<td>').text([date.day(), months[date.month() - 1], date.year()].join(' ')));
            attrMetadata.attributeKeys.forEach(function (key) {
                row.append($('<td>').text(d[key]));
            }, this);
            row.append($('<td>').text(d.description));
            tbody.append(row);
        }, this);
        this.validatePagingButtons();
    };

    pertable.PerTable.prototype.hexToRGB = function (hex) {
        // http://stackoverflow.com/questions/5623838/rgb-to-hex-and-hex-to-rgb
        // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
        var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i,
            result;

        hex = hex.replace(shorthandRegex, function (m, r, g, b) {
            return r + r + g + g + b + b;
        });

        result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);

        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
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

    pertable.PerTable.prototype.setPageExtent = function (amtEvents) {
        this.paging.maxPage = Math.ceil(amtEvents / this.paging.interval) - 1; // pages start at 0
        this.paging.minPage = 0;
    };

    pertable.PerTable.prototype.isPageNumberValid = function (pageNumber) {
        if (pageNumber < this.paging.minPage || pageNumber > this.paging.maxPage) {
            return false;
        }
        return true;
    };

    pertable.PerTable.prototype.validatePagingButtons = function () {
        if (this.paging.page === this.paging.minPage) {
            this.pagingButtons.left.toggleClass('disabled', true);
        } else {
            this.pagingButtons.left.toggleClass('disabled', false);
        }
        if (this.paging.page === this.paging.maxPage) {
            this.pagingButtons.right.toggleClass('disabled', true);
        } else {
            this.pagingButtons.right.toggleClass('disabled', false);
        }
    };

    pertable.PerTable.prototype.pageChanged = function (pageNumber) {
        if (this.isPageNumberValid(pageNumber)) {
            this.paging.isPageUpdate = true;
            this.paging.page = pageNumber;
            this.validatePagingButtons();
            this.notifyListeners('onDataSetRequested', {
                context: this,
                callback: function (data) {
                    this.onSelectionChanged(data);
                }
            });
        }
    };

    pertable.PerTable.prototype.setContentAttribute = function (contentAttr) {
        this.contentAttribute = contentAttr;
    };

    pertable.PerTable.prototype.onReset = function () {
        // don't need to do anything
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