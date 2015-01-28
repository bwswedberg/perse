/**
 *  This file is part of PerSE. PerSE is a visual analytics app for
 *  event periodicity detection and analysis.
 *  Copyright (C) 2015  Brian Swedberg
 */

define([], function () {

    var coordination = {};

    coordination.Coordinator = function (dataSetAdapterAccessor) {
        this.dataSetAdapterAccessor = dataSetAdapterAccessor;
        this.observers = [];
    };

    coordination.Coordinator.prototype.getDataSetAdapter = function () {
        return this.dataSetAdapterAccessor.getDataSetAdapter();
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

    coordination.Coordinator.prototype.getCoordinationListener = function () {
        return {
            context: this,
            onFilterChanged: function (event) {
                this.updateFilter(event.filter);
            },
            onRemoveFilter: function (event) {
                this.removeFilter(event.filter);
            },
            onRefresh: function (event) {
                this.selectionChanged(this.getDataSetAdapter().getData());
            }
        };
    };

    coordination.Coordinator.prototype.dataSetChanged = function () {
        this.observers.forEach(function (obs) {
            obs.onDataSetChanged(this.getDataSetAdapter().getData(), this.getDataSetAdapter().getMetadata());
        }, this);
    };

    coordination.Coordinator.prototype.selectionChanged = function (selection) {
        this.observers.forEach(function (obs) {
            obs.onSelectionChanged(selection);
        }, this);
    };

    coordination.Coordinator.prototype.updateFilter = function (filterObject) {
        this.getDataSetAdapter().updateFilter(filterObject);
        this.selectionChanged(this.getDataSetAdapter().getData());
    };

    coordination.Coordinator.prototype.removeFilter = function (filterObject) {
        this.getDataSetAdapter().removeFilter(filterObject);
        this.selectionChanged(this.getDataSetAdapter().getData());
    };

    return coordination;

});