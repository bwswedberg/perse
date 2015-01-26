/**
 *  This file is part of PerSE. PerSE is a visual analytics app for
 *  event periodicity detection and analysis.
 *  Copyright (C) 2015  Brian Swedberg
 */

define([],function () {

    var data = {};

    data.Filter = function (filterObj) {
        this.uniqueId = filterObj.uniqueId;
        this.property = filterObj.property;
        this.filterOn = filterObj.filterOn;
    };

    return data;

});