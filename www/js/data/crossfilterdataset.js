/**
 *  This file is part of PerSE. PerSE is a visual analytics app for
 *  event periodicity detection and analysis.
 *  Copyright (C) 2015  Brian Swedberg
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