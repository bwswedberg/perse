/**
 *  This file is part of PerSE. PerSE is a visual analytics app for
 *  event periodicity detection and analysis.
 *  Copyright (C) 2015  Brian Swedberg
 */

define([
    'jquery',
    'd3',
    // no namespace
    '$.calendars',
    'bootstrap'
], function ($, d3) {

    var timeline = {};

    timeline.Timeline = function (calendarName) {
        this.calendarName = calendarName;
        this.metadata = undefined;
        this.container = $('<div>').attr({'class': 'perse-timeline'});
    };

    timeline.Timeline.prototype.render = function (parent) {
        $(parent).append(this.container);
        return this;
    };

    timeline.Timeline.prototype.build = function (data) {

    };

    timeline.Timeline.prototype.update = function (data) {

    };

    timeline.Timeline.prototype.notifyListeners = function (callbackStr, event) {
        this.listeners.forEach(function (listenerObj) {
            listenerObj[callbackStr].call(listenerObj.context, event);
        }, this);
    };

    timeline.Timeline.prototype.registerListener = function (callbackObj) {
        this.listeners.push(callbackObj);
        return this;
    };

    timeline.Timeline.prototype.onSelectionChanged = function (data) {
        this.update(data);
    };

    timeline.Timeline.prototype.onDataSetChanged = function (data, metadata) {
        this.metadata = metadata;
        this.build(data);
    };

    return timeline;

});