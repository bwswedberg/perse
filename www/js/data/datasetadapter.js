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
        var verifyCall, getSize, updateFilter, removeFilter, getAllData, getData, getMetadata;

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
            getAllData: getAllData,
            getData: getData,
            getMetadata: getMetadata
        };
    };

    return data;
});
