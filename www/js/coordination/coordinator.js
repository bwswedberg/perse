/**
 *  This file is part of PerSE. PerSE is a visual analytics app for
 *  event periodicity detection and analysis.
 *  Copyright (C) 2015  Brian Swedberg
 */

define([], function () {

    var coordination = {};

    coordination.Coordinator = function () {
        this.dataSetAdapter = undefined;
        this.observers = [];
    };

    coordination.Coordinator.prototype.registerObserver = function (observer) {
        this.observers.push(observer);
    };

    coordination.Coordinator.prototype.removeObserver = function (observer) {
        this.observers.forEach(function (obs, index) {
            if (obs === observer) {
                this.observers.splice(index, 1);
            }
        }, this);
    };

    coordination.Coordinator.prototype.createListener = function () {
        return {
            context: this,
            onFilterChanged: function (event) {
                this.updateFilter(event.filter);
            },
            onRemoveFilter: function (event) {
                this.removeFilter(event.filter);
            },
            onDataSetRequested: function (event) {
                event.callback.call(event.context, this.dataSetAdapter.getData());
            }
        };
    };

    coordination.Coordinator.prototype.registerDataSetAdapter = function (dataSetAdapter) {
        this.dataSetAdapter = dataSetAdapter;
    };

    coordination.Coordinator.prototype.onRefresh = function () {
        this.selectionChanged(this.dataSetAdapter.getData());
    };

    coordination.Coordinator.prototype.setCalendar = function (calendarName) {
        this.observers.forEach(function (obs) {
            if (obs.setCalendar !== undefined) {
                obs.setCalendar(calendarName);
            }
        }, this);
    };

    coordination.Coordinator.prototype.setContentAttribute = function (attributeId) {
        this.observers.forEach(function (obs) {
            obs.setContentAttribute(attributeId);
        }, this);
    };

    coordination.Coordinator.prototype.onReset = function () {
        this.observers.forEach(function (obs) {
            console.log(obs);
            obs.onReset();
        }, this);
    };

    coordination.Coordinator.prototype.updateFilter = function (filterObject) {
        this.dataSetAdapter.updateFilter(filterObject);
        this.selectionChanged(this.dataSetAdapter.getData());
    };

    coordination.Coordinator.prototype.removeFilter = function (filterObject) {
        this.dataSetAdapter.removeFilter(filterObject);
        this.selectionChanged(this.dataSetAdapter.getData());
    };

    coordination.Coordinator.prototype.selectionChanged = function (selection) {
        this.observers.forEach(function (obs) {
            obs.onSelectionChanged(selection);
        }, this);
    };

    coordination.Coordinator.prototype.dataSetChanged = function () {
        this.observers.forEach(function (obs) {
            obs.onDataSetChanged(this.dataSetAdapter.getData(), this.dataSetAdapter.getMetadata());
        }, this);

    };

    return coordination;

});