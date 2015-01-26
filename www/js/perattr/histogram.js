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
    'jquery',
    'perattr/rugplot',
    'perattr/barchart',
    'perattr/categoricalbarchart',
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

    var histogram = {};

    histogram.Histogram = function (attribute) {
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
    };

    histogram.Histogram.prototype.render = function (container) {
        $(container).append(this.container);
        return this;
    };

    histogram.Histogram.prototype.build = function (data) {
        var name = this.metadata.getMetadata().attribute.attributes[this.attribute].label;

        if (this.metadata.getMetadata().attribute.attributes[this.attribute].isNumeric) {
            this.buildNumerical(data);
        } else {
            this.buildCategorical(data);
        }
    };

    histogram.Histogram.prototype.buildNumerical = function (data) {
        var barChartDiv = $('<div>').attr({'class': 'row perse-row perse-perattr-histogram'}),
            rugPlotDiv = $('<div>').attr({'class': 'row perse-row perse-perattr-histogram'});

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
            barChartDiv);
    };

    histogram.Histogram.prototype.buildCategorical = function (data) {
        var categoricalBarChartDiv = $('<div>')
                .attr({'class': 'perse-perattr-histogram'}),
            categoryAmt = $('<span>')
                .text(Object.keys(this.metadata.getMetadata().attribute.attributes[this.attribute].uniqueValues).length.toString()),
            categoryAmtLabel = $('<span>')
                .text('Total Unique Categories:'),
            categoryAmtDiv = $('<div>')
                .append(categoryAmtLabel, categoryAmt);


        this.categoricalBarChart = new categoricalbarchart.CategoricalBarChart(this.attribute)
            .render(categoricalBarChartDiv.get(0))
            .registerListener({
                context: this,
                onCategoricalBarChartSelectionChanged: function (event) {
                    this.notifyListeners('onFilterChanged', {context: this, filter: this.getFilter()});
                }
            });

        this.categoricalBarChart.onDataSetChanged(data, this.metadata);

        this.container.append(
            categoryAmtDiv,
            $('<span>').text('Categories:'),
            this.categoricalBarChart.createAllNoneSpan(),
            categoricalBarChartDiv);
    };

    histogram.Histogram.prototype.getFilter = function () {
        if (this.metadata.getMetadata().attribute.attributes[this.attribute].isNumeric) {
            this.filter.filterOn = this.rugPlot.getFilter();
        } else {
            this.filter.filterOn = this.categoricalBarChart.getFilter();
        }
        return this.filter;
    };

    histogram.Histogram.prototype.onSelectionChanged = function (data) {
        [this.barChart, this.rugPlot, this.categoricalBarChart].forEach(function (view) {
            if (view) {
                view.onSelectionChanged(data);
            }
        });
    };

    histogram.Histogram.prototype.onDataSetChanged = function (data, metadata) {
        this.metadata = metadata;
        this.build(data);
    };

    histogram.Histogram.prototype.registerListener = function (listenerObj) {
        this.listeners.push(listenerObj);
        return this;
    };

    histogram.Histogram.prototype.notifyListeners = function (callbackStr, event) {
        this.listeners.forEach(function (listenerObj) {
            listenerObj[callbackStr].call(listenerObj.context, event);
        });
    };

    return histogram;

});