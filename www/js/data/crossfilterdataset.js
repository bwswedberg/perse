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

define([
    'crossfilter'
], function (crossfilter) {
    var data = {};
    
    data.CrossfilterDataSet = function (data, metadata) {
        this.dataSet = crossfilter(data);
        this.metadata = metadata;
        this.dimensions = {}; //{someUniqueId: someDimension, anotherUniqueId: ...}
        this.allData = this.getData();
    };

    data.CrossfilterDataSet.prototype.getSize = function () {
        return this.dataSet.size();
    };

    data.CrossfilterDataSet.prototype.getMetadata = function () {
        return this.metadata;
    };

    data.CrossfilterDataSet.prototype.getAllData = function () {
        return this.allData;
    };

    data.CrossfilterDataSet.prototype.getData = function () {
        var temporaryDimension,
            result;
        if (Object.keys(this.dimensions).length) {
            // Doesn't matter which dimension. All return the same crossfiltered data.
            // So just grab the first
            var firstId = Object.keys(this.dimensions)[0];
            var firstD = this.dimensions[firstId];
            return firstD.top(Infinity).sort(function (a, b) {return a.julianDate - b.julianDate; });
        } else {
            // Make a fake dimension. Get the data. Then dispose it.
            temporaryDimension = this.dataSet.dimension(function (d) {return d; });
            result = temporaryDimension.top(Infinity).sort(function (a, b) {return a.julianDate - b.julianDate; });
            temporaryDimension.dispose();
            return result;
        }

    };

    data.CrossfilterDataSet.prototype.containsDimension = function (someFilter) {
        return (this.dimensions[someFilter.uniqueId]);
    };

    data.CrossfilterDataSet.prototype.addDimension = function (someFilter) {
        var newDimension = this.dataSet
            .dimension(function (d) {return d[someFilter.property]; })
            .filter(someFilter.filterOn);
        this.dimensions[someFilter.uniqueId] = newDimension;
    };

    data.CrossfilterDataSet.prototype.updateDimension = function (someFilter) {
        this.dimensions[someFilter.uniqueId].filter(someFilter.filterOn);
    };

    data.CrossfilterDataSet.prototype.removeDimension = function (someFilter) {
        this.dimensions[someFilter.uniqueId].dispose();
        delete this.dimensions[someFilter.uniqueId];
    };

    data.CrossfilterDataSet.prototype.updateFilter = function (someFilter) {
        if (!this.containsDimension(someFilter)) {
            this.addDimension(someFilter);
        } else {
            this.updateDimension(someFilter);
        }
    };

    data.CrossfilterDataSet.prototype.removeFilter = function (someFilter) {
        if (this.containsDimension(someFilter)) {
            this.removeDimension(someFilter); // For sanity. Replace later.
        }
    };

    return data;
});