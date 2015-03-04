/**
 *  This file is part of PerSE. PerSE is a visual analytics app for
 *  event periodicity detection and analysis.
 *  Copyright (C) 2015  Brian Swedberg
 */

define([], function () {

    var data = {};

    /**
     * This class acts as an abstract class for all data sets that are used by the app. This is needed to enforce
     * modularity, and to limit any hidden dependencies that the app could develop on particular data set data
     * structure. Essentially this acts as a wrapper, but with closures--think 'adapter pattern'.
     * @param dataSetObject
     * @param columns
     * @returns
     * @constructor
     */
    data.DataSetAdapter = function (dataSetObject) {
        var verifyCall, getSize, updateFilter, removeFilter, removeAllFilters, getAllData, getData, getMetadata;

        verifyCall = function (someFunction, args) {
            var value;
            value = someFunction.apply(dataSetObject, args);
            return value;
        };

        getSize = function () {
            return verifyCall(dataSetObject.getSize, []);
        };

        updateFilter = function (someFilter) {
            return verifyCall(dataSetObject.updateFilter, [someFilter]);
        };

        removeFilter = function (someFilterUniqueId) {
            return verifyCall(dataSetObject.removeFilter, [someFilterUniqueId]);
        };

        removeAllFilters = function () {
            return verifyCall(dataSetObject.removeAllFilters);
        };

        getData = function () {
            return verifyCall(dataSetObject.getData, []);
        };

        getAllData = function () {
            return verifyCall(dataSetObject.getAllData, []);
        };

        getMetadata = function () {
            return verifyCall(dataSetObject.getMetadata, []);
        };

        return {
            getSize: getSize,
            updateFilter: updateFilter,
            removeFilter: removeFilter,
            removeAllFilters: removeAllFilters,
            getAllData: getAllData,
            getData: getData,
            getMetadata: getMetadata
        };
    };

    return data;
});
