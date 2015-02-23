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
        var isNumeric = this.metadata.getMetadata().attribute.attributes[this.attribute].isNumeric,
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

    perattr.PerAttr.prototype.createNumericalToolbar = function () {
        var filterDiv = $('<div>')
            .attr({'class': 'btn-group', 'role': 'group'})
            .append(this.createFilterControlButton());
        return $('<div>')
            .attr({'class': 'btn-toolbar perse-header-toolbar', 'role': 'toolbar'})
            .append(filterDiv);
    };

    perattr.PerAttr.prototype.createCategoricalToolbar = function () {
        var none = this.createNoneControlButton(),
            filterDiv = this.createFilterControlButton(),
            g = $('<div>')
                .attr({'class': 'btn-group', 'role': 'group'})
                .append(none, filterDiv);
        return $('<div>')
            .attr({'class': 'btn-toolbar perse-header-toolbar', 'role': 'toolbar'})
            .append(g);
    };

    perattr.PerAttr.prototype.createFilterControlButton = function () {
        var filterIcon = $('<span>')
                .attr({'class': 'glyphicon glyphicon-filter', 'aria-hidden': 'true'}),
            filterButton = $('<button>')
                .attr({'class': 'btn btn-default btn-xs', 'type': 'button', 'title': 'Reset Filter'})
                .append(filterIcon);

        filterButton.on('mouseup', $.proxy(function () {
            $(filterButton).blur();
            if (this.categoricalBarChart) {
                this.categoricalBarChart.selectAll();
            } else {
                this.rugPlot.reset();
            }
            this.notifyListeners('onFilterChanged', {context: this, filter: this.getFilter()});
        }, this));

        return filterButton;
    };

    perattr.PerAttr.prototype.createNoneControlButton = function () {
        var that = this,
            filterIcon = $('<span>')
                .attr({'class': 'glyphicon glyphicon-ban-circle', 'aria-hidden': 'true'}),
            filterButton = $('<button>')
                .attr({'class': 'btn btn-default btn-xs', 'type': 'button', 'title': 'Reset Filter'})
                .append(filterIcon);

        filterButton.on('mouseup', function () {
            $(filterButton).blur();
            that.categoricalBarChart.deselectAll();
        });

        return filterButton;
    };

    perattr.PerAttr.prototype.getToolbar = function () {
        return this.toolbar;
    };

    perattr.PerAttr.prototype.getFilter = function () {
        this.filter.filterOn = this.plot.getFilter();
        return this.filter;
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