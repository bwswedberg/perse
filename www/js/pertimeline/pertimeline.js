define([
    'jquery',
    'data/filter',
    'general/combobutton',
    'pertimeline/timeline',
    // no namespace
    '$.calendars',
    'bootstrap'
], function ($, filter, combobutton, timeline) {

    var pertimeline = {};

    pertimeline.PerTimeline = function () {
        this.container = $('<div>').attr({'class': 'panel-body'});
        this.calendarName = 'Gregorian';
        this.resolution = 'Week';
        this.metadata = undefined;
        this.listeners = [];
        this.filter = new filter.Filter({
            uniqueId: 'perse-pertimeline',
            property: 'julianDate',
            filterOn: function (d) {return true; }
        });
        this.timeline = undefined;
    };

    pertimeline.PerTimeline.prototype.render = function (parent) {
        var title = $('<p>')
                .attr({'class': 'perse-header-title'})
                .text('Timeline'),
            panelHeader = $('<div>')
                .attr({'class': 'panel-heading'})
                .append($('<div>').attr({'class': 'panel-title'}).append(title, this.createControls())),
            panel = $('<div>')
                .attr({'class': 'panel panel-default perse-pertimeline'})
                .append(panelHeader, this.container);

        $(parent).append(panel);
        this.container.append(this.createTimeline());
        return this;
    };

    pertimeline.PerTimeline.prototype.createControls = function () {
        var resolution = this.createResolutionButtonGroup(),
            cal = this.createCalendarButtonGroup(),
            filter = this.createFilterButtonGroup();
        return $('<div>')
            .attr({'class': 'btn-toolbar perse-header-toolbar', 'role': 'toolbar'})
            .append(resolution, cal, filter);
    };

    pertimeline.PerTimeline.prototype.createFilterButtonGroup = function () {
        var filterIcon = $('<span>')
                .attr({'class': 'glyphicon glyphicon-filter', 'aria-hidden': 'true'}),
            filterButton = $('<button>')
                .attr({'class': 'btn btn-default btn-xs', 'type': 'button', 'title': 'Reset Filter'})
                .append(filterIcon);

        filterButton.on('mouseup', $.proxy(function () {
            $(filterButton).blur();
            this.filter.filterOn = function (d) {return true; };
            this.notifyListeners('onFilterChanged', {context: this, filter: this.filter});
        }, this));

        return $('<div>').attr({'class': 'btn-group', 'role': 'group'}).append(filterButton);
    };

    pertimeline.PerTimeline.prototype.createCalendarButtonGroup = function () {
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
                .append(calendarIcon, ' ' + this.calendarName + ' ', $('<span>').attr({'class': 'caret'}));

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

    pertimeline.PerTimeline.prototype.createResolutionButtonGroup = function () {
        var // menu
            calendarHeader = $('<li>').attr({'class': 'dropdown-header', 'role': 'presentation'}).text('Cycle'),
            year = $('<a>').attr({'role': 'menuitem'}).text('Year '),
            month = $('<a>').attr({'role': 'menuitem'}).text('Month '),
            week = $('<a>').attr({'role': 'menuitem'}).text('Week ').append($('<span>').attr({'class': 'glyphicon glyphicon-ok-sign', 'aria-hidden': 'true'})),
            day = $('<a>').attr({'role': 'menuitem'}).text('Day '),
            menu = $('<ul>')
                .attr({'class': 'dropdown-menu', 'role': 'menu'})
                .append([
                    calendarHeader,
                    $('<li>').attr({'role': 'presentation'}).append(year),
                    $('<li>').attr({'role': 'presentation'}).append(month),
                    $('<li>').attr({'role': 'presentation'}).append(week),
                    $('<li>').attr({'role': 'presentation'}).append(day)

                ]),
        // button
            resIcon = $('<span>').attr({'class': 'glyphicon glyphicon-stats', 'aria-hidden': 'true'}),
            resButton = $('<button>')
                .attr({'class': 'btn btn-default btn-xs dropdown-toggle', 'type': 'button', 'data-toggle': 'dropdown', 'title': 'Change Temporal Resolution'})
                .append(resIcon, ' ' + this.resolution + ' ', $('<span>').attr({'class': 'caret'}));

        // add events here
        year.on('mouseup', $.proxy(function () {
            this.resolutionChanged('Year');
            resButton.empty().append(resIcon, ' Year ', $('<span>').attr({'class': 'caret'}));
            menu.find('li a span').remove();
            year.append($('<span>').attr({'class': 'glyphicon glyphicon-ok-sign', 'aria-hidden': 'true'}));
        }, this));

        month.on('mouseup', $.proxy(function () {
            this.resolutionChanged('Month');
            resButton.empty().append(resIcon, ' Month ', $('<span>').attr({'class': 'caret'}));
            menu.find('li a span').remove();
            month.append($('<span>').attr({'class': 'glyphicon glyphicon-ok-sign', 'aria-hidden': 'true'}));
        }, this));

        week.on('mouseup', $.proxy(function () {
            this.resolutionChanged('Week');
            resButton.empty().append(resIcon, ' Week ', $('<span>').attr({'class': 'caret'}));
            menu.find('li a span').remove();
            week.append($('<span>').attr({'class': 'glyphicon glyphicon-ok-sign', 'aria-hidden': 'true'}));
        }, this));

        day.on('mouseup', $.proxy(function () {
            this.resolutionChanged('Day');
            resButton.empty().append(resIcon, ' Day ', $('<span>').attr({'class': 'caret'}));
            menu.find('li a span').remove();
            day.append($('<span>').attr({'class': 'glyphicon glyphicon-ok-sign', 'aria-hidden': 'true'}));
        }, this));

        return $('<div>').attr({'class': 'btn-group', 'role': 'group'}).append(resButton, menu);
    };

    pertimeline.PerTimeline.prototype.createResolutionCombo = function () {
        var row = $('<div>').attr({'class': 'perse-pertimeline-resolution'}),
            resolutionDropdown = new combobutton.ComboButton({
                'label': 'Resolution:',
                'values': [
                    {'alias': 'Year', id: 'year'},
                    {'alias': 'Month', id: 'month'},
                    {'alias': 'Week', id: 'week'},
                    {'alias': 'Day', id: 'day'}
                ],
                'active': this.resolution
            });
        resolutionDropdown.registerListener({
            context: this,
            onComboChanged: function (event) {
                this.resolutionChanged(event.active);
            }
        });
        resolutionDropdown.render(row);
        return row;
    };

    pertimeline.PerTimeline.prototype.createTimeline = function () {
        var timelineContainer = $('<div>').attr({'class': 'perse-pertimeline-timelinecontainer'});
        this.timeline = new timeline.Timeline(this.calendarName, this.resolution);
        this.timeline.render(timelineContainer);
        this.timeline.registerListener({
            context: this,
            onTimelineLabelChanged: function (event) {
            },
            onTimelineSelectionChanged: function (event) {
                this.notifyListeners('onFilterChanged', {context: this, filter: this.getFilter()});
            }
        });
        return timelineContainer;
    };

    pertimeline.PerTimeline.prototype.calendarChanged = function (calendarName) {
        this.calendarName = calendarName;
        this.timeline.setCalendarName(calendarName);
        this.notifyListeners('onDataSetRequested', {context: this, callback: function (data) {
            this.timeline.onSelectionChanged(data);
        }});
    };

    pertimeline.PerTimeline.prototype.resolutionChanged = function (resolution) {
        this.resolution = resolution;
        this.timeline.setResolution(resolution);
        this.notifyListeners('onDataSetRequested', {context: this, callback: function (data) {
            this.timeline.onResolutionChanged(data);
        }});
    };

    pertimeline.PerTimeline.prototype.getFilter = function () {
        var timelineExtent = this.timeline.getBrushExtent();
        this.filter.filterOn = function (julianDate) {
            if (timelineExtent.begin <= julianDate && timelineExtent.end >= julianDate) {
                return true;
            }
            return false;
        };
        return this.filter;
    };

    pertimeline.PerTimeline.prototype.notifyListeners = function (callbackStr, event) {
        this.listeners.forEach(function (listenerObj) {
            listenerObj[callbackStr].call(listenerObj.context, event);
        }, this);
    };

    pertimeline.PerTimeline.prototype.registerListener = function (callbackObj) {
        this.listeners.push(callbackObj);
        return this;
    };

    pertimeline.PerTimeline.prototype.onSelectionChanged = function (data) {
        this.timeline.onSelectionChanged(data);
    };

    pertimeline.PerTimeline.prototype.onDataSetChanged = function (data, metadata) {
        this.metadata = metadata;
        this.timeline.onDataSetChanged(data, metadata);
    };

    return pertimeline;

});