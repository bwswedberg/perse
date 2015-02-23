/**
 *  This file is part of PerSE. PerSE is a visual analytics app for
 *  event periodicity detection and analysis.
 *  Copyright (C) 2015  Brian Swedberg
 */

define([
    'jquery',
    'perattrs/rugplot',
    'perattrs/barchart',
    'perattrs/categoricalbarchart',
    'data/filter',
    // No namespace
    'bootstrap'
], function (
    $,
    rugplot,
    barchart,
    categoricalbarchart,
    filter
) {

    var perattr = {};

    perattr.PerAttr = function (attribute) {
        var classId = 'perse-perattr-' + attribute;
        this.attribute = attribute;
        this.container = $('<div>').attr({'class': classId});
        this.listeners = [];
        this.metadata = undefined;
        this.barChart = undefined;
        this.rugPlot = undefined;
        this.categoricalBarChart = undefined;
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
        if (this.metadata.getMetadata().attribute.attributes[this.attribute].isNumeric) {
            this.buildNumerical(data);
        } else {
            this.buildCategorical(data);
        }
    };

    perattr.PerAttr.prototype.buildNumerical = function (data) {
        var barChartDiv = $('<div>').attr({'class': 'perse-perattr'}),
            rugPlotDiv = $('<div>').attr({'class': 'perse-perattr'});

        this.barChart = new barchart.BarChart(this.attribute)
            .render(barChartDiv.get(0))
            .registerListener({
                context: this,
                onBarChartBinChanged: function (event) {
                    this.notifyListeners('onFilterChanged', {context: this, filter: this.getFilter()});
                }
            });
        this.barChart.onDataSetChanged(data, this.metadata);

        this.rugPlot = new rugplot.RugPlot(this.attribute)
            .render(rugPlotDiv.get(0))
            .registerListener({
                context: this,
                onRugPlotSelectionChanged: function (event) {
                    this.notifyListeners('onFilterChanged', {context: this, filter: this.getFilter()});
                }
            });
        this.rugPlot.onDataSetChanged(data, this.metadata);

        this.container.append(
            $('<span>').text('Range:'),
            this.rugPlot.createRangeInput(),
            rugPlotDiv,
            $('<span>').text('Histogram:'),
            barChartDiv
        );

        this.toolbar = this.createNumericalControls();
    };

    perattr.PerAttr.prototype.buildCategorical = function (data) {
        var categoricalBarChartDiv = $('<div>')
                .attr({'class': 'perse-perattr'});

        this.categoricalBarChart = new categoricalbarchart.CategoricalBarChart(this.attribute)
            .render(categoricalBarChartDiv.get(0))
            .registerListener({
                context: this,
                onCategoricalBarChartSelectionChanged: function (event) {
                    this.notifyListeners('onFilterChanged', {context: this, filter: this.getFilter()});
                }
            });

        this.categoricalBarChart.onDataSetChanged(data, this.metadata);

        this.container.append(categoricalBarChartDiv);

        this.toolbar = this.createCategoricalControls();
    };

    perattr.PerAttr.prototype.createNumericalControls = function () {
        var filterDiv = $('<div>')
            .attr({'class': 'btn-group', 'role': 'group'})
            .append(this.createFilterControlButton());
        return $('<div>')
            .attr({'class': 'btn-toolbar perse-header-toolbar', 'role': 'toolbar'})
            .append(filterDiv);
    };

    perattr.PerAttr.prototype.createCategoricalControls = function () {
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
        if (this.metadata.getMetadata().attribute.attributes[this.attribute].isNumeric) {
            this.filter.filterOn = this.rugPlot.getFilter();
        } else {
            this.filter.filterOn = this.categoricalBarChart.getFilter();
        }
        return this.filter;
    };

    perattr.PerAttr.prototype.onSelectionChanged = function (data) {
        [this.barChart, this.rugPlot, this.categoricalBarChart].forEach(function (view) {
            if (view) {
                view.onSelectionChanged(data);
            }
        });
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