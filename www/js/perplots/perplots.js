/**
 *  This file is part of PerSE. PerSE is a visual analytics app for
 *  event periodicity detection and analysis.
 *  Copyright (C) 2015  Brian Swedberg
 */

define([
    'jquery',
    'perplots/perplot',
    'perplots/perplotsdatasetbuilder',
    'perplots/perplotspositioncalculator',
    'perplots/voronoidatasetbuilder',
    // no namespace
    'bootstrap'
], function ($, perplot, perplotsdatasetbuilder, perplotspositioncalculator, voronoidatasetbuilder) {

    var perplots = {};

    perplots.PerPlots = function () {
        this.container = $('<div>').attr({'class': 'perse-perplots'});
        this.listeners = [];
        this.metadata = undefined;
        this.calendarName = 'islamic';
        this.cycleName = 'MonthOfYear';
        this.voronoiPolygons = undefined;
        this.plots = [];
    };

    perplots.PerPlots.prototype.render = function (parent) {
        $(parent).append(this.container);
        return this;
    };

    perplots.PerPlots.prototype.addNewPlot = function (plotData, extent) {
        var plot = new perplot.PerPlot(plotData.id)
            .render(this.container)
            .registerListener(this.createPerPlotListener())
            .setCalendarName(this.calendarName)
            .setCycleName(this.cycleName)
            .setPlotExtent(extent)
            .setPosition(plotData.position);

        this.plots.push(plot);
        plot.onDataSetChanged(plotData.data, this.metadata);
        return plot;
    };

    perplots.PerPlots.prototype.updatePlot = function (plot, plotData, extent) {
        //plot.setPlotExtent(extent);
        plot.setPlotExtent(extent)
            .setPosition(plotData.position)
            .onSelectionChanged(plotData.data);
        return plot;
    };

    perplots.PerPlots.prototype.removePlot = function (plot) {
        plot.destroy();
        this.plots.splice(this.plots.indexOf(plot), 1);
    };

    perplots.PerPlots.prototype.update = function (data) {
        var processedData = this.getData(data),
            updatedPlots = [],
            extent = {
                'x': this.getXExtent(processedData),
                'y': this.getYExtent(processedData)
            };
        // add and update plots
        processedData.forEach(function (d) {
            var id = d.id,
                matches = this.plots.filter(function (plot) {
                    return plot.getId() === id;
                }),
                newPlot;
            if (matches.length === 0) {
                newPlot = this.addNewPlot(d, extent);
                updatedPlots.push(newPlot);
            } else if (matches.length === 1) {

                this.updatePlot(matches[0], d, extent);
                updatedPlots.push(matches[0]);
            } else {
                console.warn('Unexpected amount of matches.');
            }
        }, this);

        // remove
        this.plots
            .filter(function (p) {return updatedPlots.indexOf(p) < 0; })
            .forEach(this.removePlot);
    };

    perplots.PerPlots.prototype.getData = function (data) {
        var voronoiData = new voronoidatasetbuilder.VoronoiDataSetBuilder()
                .setProjection(this.metadata.getMetadata().geospatial.projection)
                .setPolygonVectorLayer(this.voronoiPolygons)
                .setData(data)
                .build(),
                //.map(function (d) {d.extent = this.formatExtent(d.extent); return d; }, this),
            builder = new perplotsdatasetbuilder.PerPlotsDataSetBuilder(this.metadata)
                .setCalendarName(this.calendarName)
                .setCycleName(this.cycleName),
            positionedData = new perplotspositioncalculator.PerPlotsPositionCalculator()
                .setData(voronoiData)
                .setExtent(this.voronoiPolygons.getSource().getExtent())
                .calculate()
                .map(function (elem) {
                    elem.data = builder.setData(elem.data).build();
                    return elem;
                });
        return positionedData;
    };

    perplots.PerPlots.prototype.setVoronoiPolygons = function (voronoiPolygons) {
        this.voronoiPolygons = voronoiPolygons;
    };

    perplots.PerPlots.prototype.createPerPlotListener = function () {
        return {
            context: this,
            onFilterChanged: function (event) {
                console.log('filter changed');
            },
            onHoverEvent: function (event) {
                Object.keys(this.plots).forEach(function (k) {
                    this.plots[k].onHover(event);
                }, this);
            }
        };
    };

    perplots.PerPlots.prototype.getYExtent = function (data) {
        var innerFunction = function (dataObj) {
            var extent = {
                max: dataObj.data[0].partitions[0].events.length || 0,
                min: dataObj.data[0].partitions[0].events.length || 0
            };

            dataObj.data.forEach(function (part) {
                part.partitions.forEach(function (member) {
                    extent.max = Math.max(extent.max, member.events.length);
                    extent.min = Math.min(extent.min, member.events.length);
                });
            });

            return extent;
        };

        return data.map(innerFunction)
            .reduce(function (prev, cur) {
                prev.max = Math.max(prev.max, cur.max);
                prev.min = Math.min(prev.min, cur.min);
                return prev;
            });
    };

    perplots.PerPlots.prototype.getXExtent = function (data) {
        var dataObj = data[0],
            extent = {
                min: dataObj.data[0].partitions[0].value,
                max: dataObj.data[0].partitions[0].value
            };
        dataObj.data.forEach(function (d) {
            d.partitions.forEach(function (p) {
                extent.min = Math.min(extent.min, p.value);
                extent.max = Math.max(extent.max, p.value);
            });
        });
        return extent;
    };

    perplots.PerPlots.prototype.createFilterChangedListener = function () {
        return {
            context: this,
            onFilterChanged: function (event) {
                this.notifyListeners('onFilterChanged', {context: this, filter: event.filter });
            }
        };
    };

    perplots.PerPlots.prototype.createToolbarListener = function () {
        return {
            context: this,
            onCalendarChanged: function (event) {
                this.calendarName = event.calendarName;
                Object.keys(this.plots).forEach(function (k) {
                    this.plots[k].setCalendarName(event.calendarName);
                }, this);
                this.notifyListeners('onDataSetRequested', {context: this});
            },
            onCycleChanged: function (event) {
                this.cycleName = event.cycleName;
                Object.keys(this.plots).forEach(function (k) {
                    this.plots[k].setCycleName(event.cycleName);
                }, this);
                this.notifyListeners('onDataSetRequested', {context: this});
            }
        };
    };

    perplots.PerPlots.prototype.notifyListeners = function (callbackStr, event) {
        this.listeners.forEach(function (listenerObj) {
            listenerObj[callbackStr].call(listenerObj.context, event);
        }, this);
    };

    perplots.PerPlots.prototype.registerListener = function (callbackObj) {
        this.listeners.push(callbackObj);
        return this;
    };

    perplots.PerPlots.prototype.onSelectionChanged = function (data) {
        this.update(data);
    };

    perplots.PerPlots.prototype.onDataSetChanged = function (data, metadata) {
        this.metadata = metadata;
        this.update(data);
    };

    return perplots;

});