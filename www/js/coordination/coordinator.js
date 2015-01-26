/**
 *  This file is part of PerSE. PerSE is a visual analytics app for
 *  exploring spatiotemporal periodicity.
 *  Copyright (C) 2014  Brian Swedberg
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with this program.  If not, see <http://www.gnu.org/licenses/>.
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

    coordination.Coordinator.prototype.getFilterChangedListener = function () {
        return {
            context: this,
            onFilterChanged: function (event) {
                this.updateFilter(event.filter);
            },
            onRemoveFilter: function (event) {
                this.removeFilter(event.filter);
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