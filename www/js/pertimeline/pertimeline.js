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
        this.container = $('<div>').attr({'class': 'container-fluid perse-pertimeline'});
        this.calendarName = 'gregorian';
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
        $(parent).append(this.container);
        this.container
            .append(this.createHeader())
            .append(this.createCalendar())
            .append(this.createTimeline());
        return this;
    };

    pertimeline.PerTimeline.prototype.createHeader = function () {
        var h = $('<h3>').attr({'class': 'perse-pertimeline-header'}).text('Timeline');
        return $('<div>').attr({'class': 'row'}).append(h);
    };

    pertimeline.PerTimeline.prototype.createCalendar = function () {
        var row = $('<div>').attr({'class': 'row perse-row perse-pertimeline-calendar'}),
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
                this.calendarChanged(event.active);
            }
        });
        calendarDropdown.render(row);
        return row;
    };

    pertimeline.PerTimeline.prototype.createTimeline = function () {
        this.timeline = new timeline.Timeline();
        this.timeline.render();
        this.timeline.registerListener({
            context: this,
            onTimelineLabelChanged: function (event) {
            },
            onTimelineSelectionChanged: function (event) {
                this.notifyListeners('onFilterChanged', {context: this, filter: this.getFilter()});
            }
        });
    };

    pertimeline.PerTimeline.prototype.calendarChanged = function (calendarName) {
        this.calendarName = calendarName;
    };

    pertimeline.PerTimeline.prototype.getFilter = function () {
        this.filter.filterOn = function (julianDate) {

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