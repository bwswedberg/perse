/**
 *  This file is part of PerSE. PerSE is a visual analytics app for
 *  event periodicity detection and analysis.
 *  Copyright (C) 2015  Brian Swedberg
 */

define([
    'jquery',
    // no namesapce
    'bootstrap'
], function ($) {

    var perplot = {};

    perplot.PerPlot = function () {
        this.perPlotId = undefined;
    };

    perplot.PerPlot.prototype.getPerPlotId = function () {
        return this.perPlotId;
    };

    perplot.PerPlot.prototype.setPerPlotId = function (id) {
        this.perPlotId = id;
        return this;
    };

    perplot.PerPlot.prototype.setCalendar = function () {
        // in case sub class doesn't have it
        return this;
    };

    perplot.PerPlot.prototype.setCycleName = function () {
        // in case sub class doesn't have it
        return this;
    };

    return perplot;

});