/**
 *  This file is part of PerSE. PerSE is a visual analytics app for
 *  event periodicity detection and analysis.
 *  Copyright (C) 2015  Brian Swedberg
 */

/**
 *  This file is part of PerSE. PerSE is a visual analytics app for
 *  event periodicity detection and analysis.
 *  Copyright (C) 2015  Brian Swedberg
 */

define([
    'jquery',
    'perattrs/numericalplot',
    'perattrs/categoricalplot',
    'data/filter',
    // No namespace
    'bootstrap'
], function ($, numericalplot, categoricalplot, filter) {

    var perattr = {};

    perattr.PerAttr = function (attribute) {
        var classId = 'perse-perattr-' + attribute;
        this.attribute = attribute;
        this.container = $('<div>').attr({'class': classId});
        this.listeners = [];
        this.metadata = undefined;
        this.plot = undefined;
        this.filter = new filter.Filter({
            uniqueId: classId,
            property: this.attribute,
            filterOn: function (d) {return true; }
        });
        this.toolbar = undefined;
    };

    perattr.PerAttr.prototype.render = function (container) {
        $(container).append(this.container);
        return this;
    };

    perattr.PerAttr.prototype.build = function (data) {
        var isNumeric = this.metadata.attribute.attributes[this.attribute].isNumeric,
            plotDiv = $('<div>').attr({'class': 'perse-perattr'});

        if (isNumeric) {
            this.plot = new numericalplot.NumericalPlot(this.attribute)
                .render(plotDiv.get(0))
                .registerListener(this.createPlotListener());
        } else {
            this.plot = new categoricalplot.CategoricalPlot(this.attribute)
                .render(plotDiv.get(0))
                .registerListener(this.createPlotListener());
        }

        this.toolbar = this.plot.createToolbar();
        this.plot.onDataSetChanged(data, this.metadata);
        this.container.append(plotDiv);
    };

    perattr.PerAttr.prototype.createPlotListener = function () {
        return {
            context: this,
            onPlotSelectionChanged: function (event) {
                this.notifyListeners('onFilterChanged', {context: this, filter: this.getFilter()});
            }
        };
    };

    perattr.PerAttr.prototype.getToolbar = function () {
        return this.toolbar;
    };

    perattr.PerAttr.prototype.getFilter = function () {
        this.filter.filterOn = this.plot.getFilter();
        return this.filter;
    };

    perattr.PerAttr.prototype.setContentAttribute = function (contentAttribute) {
        this.plot.setContentAttribute(contentAttribute);
    };

    perattr.PerAttr.prototype.onReset = function () {
        this.plot.onReset();
    };

    perattr.PerAttr.prototype.onSelectionChanged = function (data) {
        this.plot.onSelectionChanged(data);
    };

    perattr.PerAttr.prototype.onDataSetChanged = function (data, metadata) {
        this.metadata = metadata;
        this.build(data);
    };

    perattr.PerAttr.prototype.registerListener = function (listenerObj) {
        this.listeners.push(listenerObj);
        return this;
    };

    perattr.PerAttr.prototype.notifyListeners = function (callbackStr, event) {
        this.listeners.forEach(function (listenerObj) {
            listenerObj[callbackStr].call(listenerObj.context, event);
        });
    };

    return perattr;

});