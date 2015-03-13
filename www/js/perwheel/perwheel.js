/**
 *  This file is part of PerSE. PerSE is a visual analytics app for
 *  event periodicity detection and analysis.
 *  Copyright (C) 2015  Brian Swedberg
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
        this.container = $('<div>').attr({'class': 'panel-body perse-panel-body'});
        this.calendarName = 'gregorian';
        this.listeners = [];
        this.timeWheel = undefined;
        this.filterButton = undefined;
        this.calendarButtons = {gregorian: undefined, islamic: undefined};
        this.shouldAnimate = false;
        this.filter = new filter.Filter({
            uniqueId: this.getUniqueId(),
            property: 'julianDate',
            filterOn: function () {return true; }
        });
    };

    perwheel.PerWheel.prototype.instanceCount = 0;

    perwheel.PerWheel.prototype.getUniqueId = function () {
        var id = 'perse-perwheel-' + this.instanceCount;
        this.instanceCount += 1;
        return id;
    };

    perwheel.PerWheel.prototype.render = function (parent, shouldRenderToolbar) {
        var title = $('<p>')
                .attr({'class': 'perse-header-title'})
                .text('Time-Wheel'),
            panelHeader = $('<div>')
                .attr({'class': 'panel-heading perse-panel-heading'})
                .append($('<div>').attr({'class': 'panel-title'}).append(title, this.createControls())),
            panel = $('<div>')
                .attr({'class': 'panel panel-default perse-perwheel'});

        if (shouldRenderToolbar) {
            panel.append(panelHeader, this.container);
            $(parent).append(panel);
        } else {
            //panel.append(this.container);
            this.container = parent;
        }

        this.addMouseEnterListener();
        this.container.append(this.createTimeWheel());
        return this;
    };

    perwheel.PerWheel.prototype.createControls = function () {
        var cal = this.createCalendarButtonGroup(),
            filterBG = this.createFilterControlButtonGroup();
        return $('<div>')
            .attr({'class': 'btn-toolbar perse-header-toolbar', 'role': 'toolbar'})
            .append(cal, filterBG);
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
            gregorian = $('<a>')
            .attr({'role': 'menuitem'})
            .text('Gregorian ')
            .append($('<span>').attr({'class': 'glyphicon glyphicon-ok-sign', 'aria-hidden': 'true'})),
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
                'title': 'Change Calendar System'
            })
            .append(calendarIcon, ' ', $('<span>').attr({'class': 'caret'}));

        // add events here
        gregorian.on('mouseup', $.proxy(function () {
            this.setCalendar('gregorian');
        }, this));

        islamic.on('mouseup', $.proxy(function () {
            this.setCalendar('islamic');
        }, this));

        this.calendarButtons.gregorian = gregorian;
        this.calendarButtons.islamic = islamic;

        return $('<div>').attr({'class': 'btn-group', 'role': 'group'}).append(calendarButton, menu);
    };

    perwheel.PerWheel.prototype.createTimeWheel = function () {
        var timeWheelDiv = $('<div>').attr({'class': 'perse-perwheel-timewheel'});
        this.timeWheel = new timewheel.TimeWheel(this.calendarName)
            .render(timeWheelDiv.get(0))
            .setShouldAnimate(this.shouldAnimate)
            .registerListener({
                context: this,
                onTimeWheelSelectionChanged: function () {
                    this.notifyListeners('onFilterChanged', {context: this, filter: this.getFilter()});
                    this.validateFilterButton();
                },
                onHoverEvent: function (event) {
                    var hoverListeners = this.listeners.filter(function (listener) {
                        return listener.hasOwnProperty('onHoverEvent');
                    });
                    if (hoverListeners.length === 0) {
                        this.timeWheel.onHover(event);
                    } else {
                        this.notifyListeners('onHoverEvent', {
                            context: this,
                            firingPlot: this,
                            indicationFilter: (event.data) ? this.createIndicationFilter(event.data) : undefined,
                            data: event.data
                        });
                    }

                }
            });
        return timeWheelDiv;
    };

    perwheel.PerWheel.prototype.addMouseEnterListener = function () {
        this.container.on('mouseenter', $.proxy(function () {
            this.notifyListeners('onHoverEvent', {
                context: this,
                firingPlot: this,
                indicationFilter: function () {return true; },
                data: undefined
            });
        }, this));
    };

    perwheel.PerWheel.prototype.createIndicationFilter = function (event) {
        var cal = $.calendars.instance(event.calendarName);
        switch (event.ringId) {
        case ('dayOfMonth'):
            return function (d) {
                var date = cal.fromJD(d.julianDate);
                return date.day() - 1 === event.arcId;
            };

        case ('dayOfWeek'):
            return function (d) {
                var date = cal.fromJD(d.julianDate);
                return date.dayOfWeek() === event.arcId;
            };
        case ('monthOfYear'):
            return function (d) {
                var date = cal.fromJD(d.julianDate);
                return date.month() - 1 === event.arcId;
            };
        default:
            console.warn('Case not supported');
        }
    };

    perwheel.PerWheel.prototype.validateFilterButton = function () {
        var twData = this.getFilterData(),
            shouldEnable = Object.keys(twData.periodicity).every(function (key) {
                return twData.periodicity[key].data.every(function (cycle) {
                    return cycle.isEnabled;
                });
            });
        this.filterButton.toggleClass('disabled', shouldEnable);
    };

    perwheel.PerWheel.prototype.getExtent = function (data) {
        return timewheel.TimeWheel.prototype.getExtent(data);
    };

    perwheel.PerWheel.prototype.reduceExtents = function (timeWheelExtents) {
        return timeWheelExtents.reduce(function (pTimeWheel, cTimeWheel) {
            return pTimeWheel.map(function (ringExtent, index) {
                ringExtent.y.min = Math.min(ringExtent.y.min, cTimeWheel[index].y.min);
                ringExtent.y.max = Math.max(ringExtent.y.max, cTimeWheel[index].y.max);
                return ringExtent;
            });
        });
    };

    perwheel.PerWheel.prototype.getFilterData = function () {
        return {
            calendarName: this.calendarName,
            periodicity: this.timeWheel.getFilterData()
        };
    };

    perwheel.PerWheel.prototype.destroy = function () {
        var buttons = [this.filterButton, this.calendarButtons.islamic, this.calendarButtons.gregorian];
        buttons.forEach(function (b) {b.off(); });
        this.container.remove();
    };

    perwheel.PerWheel.prototype.getFilter = function () {
        var data = this.getFilterData(),
            cal = $.calendars.instance(data.calendarName);
        this.filter.filterOn = function (julianDate) {
            var date = cal.fromJD(julianDate);
            return data.periodicity.dayOfWeek.data[date.dayOfWeek()].isEnabled &&
                data.periodicity.dayOfMonth.data[date.day() - 1].isEnabled &&
                data.periodicity.monthOfYear.data[date.month() - 1].isEnabled;
        };
        return this.filter;
    };

    perwheel.PerWheel.prototype.processData = function (params) {
        return timewheel.TimeWheel.prototype.processData(params);
    };

    perwheel.PerWheel.prototype.setShouldAnimate = function (someBool) {
        this.shouldAnimate = someBool;
        if (this.timeWheel !== undefined || this.timeWheel !== null) {
            this.timeWheel.setShouldAnimate(someBool);
        }
        return this;
    };

    perwheel.PerWheel.prototype.setContentAttribute = function (contentAttribute) {
        this.timeWheel.setContentAttribute(contentAttribute);
        return this;
    };

    perwheel.PerWheel.prototype.setCalendar = function (calendarName) {
        if (this.calendarButtons.hasOwnProperty(calendarName)) {
            [this.calendarButtons.islamic, this.calendarButtons.gregorian].forEach(function (b) {
                b.find('.glyphicon').remove();
            });
            this.calendarButtons[calendarName].append(
                $('<span>').attr({'class': 'glyphicon glyphicon-ok-sign', 'aria-hidden': 'true'})
            );
            this.calendarName = calendarName;
            this.timeWheel.setCalendar(this.calendarName);
            this.filter.filterOn = function () {return true; };
            this.notifyListeners('onFilterChanged', {context: this, filter: this.filter});
        }
        return this;
    };

    perwheel.PerWheel.prototype.onHover = function (event) {
        this.timeWheel.onHover(event);
    };

    perwheel.PerWheel.prototype.onReset = function () {
        this.filterButton.toggleClass('disabled', true);
        this.timeWheel.setAllEnabled();
    };

    perwheel.PerWheel.prototype.notifyListeners = function (callbackStr, event) {
        this.listeners.forEach(function (listenerObj) {
            if (listenerObj[callbackStr] !== undefined) {
                listenerObj[callbackStr].call(listenerObj.context, event);
            }
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
