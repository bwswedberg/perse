/**
 *  This file is part of PerSE. PerSE is a visual analytics app for
 *  event periodicity detection and analysis.
 *  Copyright (C) 2015  Brian Swedberg
 */

define([
    'jquery',
    'micrographics',
    // no namespace
    'bootstrap'
], function ($, MG) {

    var perplot = {};

    perplot.PerPlot = function () {
        this.container = $('<div>').attr({'class': 'container-fluid perse-perplot'});;
        this.listeners = [];
        this.metadata = undefined;
    };

    perplot.PerPlot.prototype.render = function (parent) {
        $(parent).append(this.container);
        return this;
    };

    perplot.PerPlot.prototype.build = function (data) {

    };

    perplot.PerPlot.prototype.update = function (data) {

    };


    perplot.PerPlot.prototype.notifyListeners = function (callbackStr, event) {
        this.listeners.forEach(function (listenerObj) {
            listenerObj[callbackStr].call(listenerObj.context, event);
        }, this);
    };

    perplot.PerPlot.prototype.registerListener = function (callbackObj) {
        this.listeners.push(callbackObj);
        return this;
    };

    perplot.PerPlot.prototype.onSelectionChanged = function (data) {
        this.update(data);
    };

    perplot.PerPlot.prototype.onDataSetChanged = function (data, metadata) {
        this.metadata = metadata;
        this.build(data);
    };

    return perplot;

});