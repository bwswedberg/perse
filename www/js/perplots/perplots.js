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
        this.contentAttribute = undefined;
        this.calendarName = 'islamic';
        this.cycleName = 'MonthOfYear';
        this.voronoiPolygons = undefined;
        this.plots = {};
    };

    perplots.PerPlots.prototype.render = function (parent) {
        $(parent).append(this.container);
        return this;
    };

    perplots.PerPlots.prototype.addNewPlot = function (updateObj) {
        this.plots[updateObj.id] = new perplot.PerPlot(updateObj.id)
            .render(this.container)
            .registerListener(this.createPerPlotListener())
            .setCalendar(this.calendarName)
            .setCycleName(this.cycleName)
            .setContentAttribute(this.contentAttribute)
            .setPlotExtent(updateObj.extent)
            .setPosition(updateObj.position);

        this.plots[updateObj.id].onDataSetChanged(updateObj.data, this.metadata);
    };

    perplots.PerPlots.prototype.updatePlot = function (updateObj) {
        //plot.setPlotExtent(extent);
        this.plots[updateObj.id]
            .setPlotExtent(updateObj.extent)
            .setPosition(updateObj.position)
            .onSelectionChanged(updateObj.data);
    };

    perplots.PerPlots.prototype.removePlot = function (plotId) {
        this.plots[plotId].destroy();
        delete this.plots[plotId];
    };

    perplots.PerPlots.prototype.update = function (data) {
        var parsedData = this.parseData(data),
            builtData = this.getBuiltData(parsedData),
            positions = this.getPositions(parsedData),
            updatedIds = [],
            extent = this.getExtent(builtData);

        parsedData.forEach(function (d, i) {
            var updateObj = {
                id: d.id,
                extent: extent,
                data: builtData[i],
                position: positions[d.id].position
            };

            if (this.plots.hasOwnProperty(d.id)) {
                this.updatePlot(updateObj);
            } else {
                this.addNewPlot(updateObj);
            }
            updatedIds.push(d.id);
        }, this);

        // remove extra plots
        Object.keys(this.plots)
            .filter(function (key) {
                return updatedIds.indexOf(key) < 0;
            })
            .forEach(this.removePlot, this);
    };

    perplots.PerPlots.prototype.parseData = function (data) {
        return new voronoidatasetbuilder.VoronoiDataSetBuilder()
            .setProjection(this.metadata.geospatial.projection)
            .setPolygonVectorLayer(this.voronoiPolygons)
            .setData(data)
            .build();
    };

    perplots.PerPlots.prototype.getPositions = function (parsedData) {
        return new perplotspositioncalculator.PerPlotsPositionCalculator()
            .setData(parsedData)
            .setExtent(this.voronoiPolygons.getSource().getExtent())
            .calculate();
    };

    perplots.PerPlots.prototype.getBuiltData = function (parsedData) {
        return parsedData.map(function (d) {
            return perplot.PerPlot.prototype.processData({
                data: d.data,
                calendarName: this.calendarName,
                cycleName: this.cycleName,
                metadata: this.metadata
            });
        }, this);
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
                var indicationEvent;

                Object.keys(this.plots).forEach(function (k) {
                    this.plots[k].onHover(event);
                }, this);

                if (event.data === undefined || event.data === null) {
                    indicationEvent = {
                        'context': this,
                        'voronoiId': undefined,
                        'indicationFilter': undefined
                    };
                } else {
                    indicationEvent = {
                        'context': this,
                        'voronoiId': event.firingPlot.getId(),
                        'indicationFilter': event.firingPlot.createIndicationFilter(event.data.lineValue, event.data.xValue)
                    };
                }

                this.notifyListeners('onIndicationChanged', indicationEvent);

            }
        };
    };

    perplots.PerPlots.prototype.getExtent = function (builtData) {
        return builtData
            .map(function (d) {
                return perplot.PerPlot.prototype.getExtent(d);
            })
            .reduce(function (p, c) {
                p.x.min = Math.min(c.x.min, p.x.min);
                p.x.max = Math.max(c.x.max, p.x.max);
                p.y.min = Math.min(c.y.min, p.y.min);
                p.y.max = Math.max(c.y.max, p.y.max);
                return p;
            });
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
                this.setCalendar(event.calendarName);
                this.notifyListeners('onDataSetRequested', {context: this});
            },
            onCycleChanged: function (event) {
                this.cycleName = event.cycleName;
                Object.keys(this.plots).forEach(function (key) {
                    this.plots[key].setCycleName(event.cycleName);
                }, this);
                this.notifyListeners('onDataSetRequested', {context: this});
            }
        };
    };

    perplots.PerPlots.prototype.onIndicationChanged = function (event) {
    };

    perplots.PerPlots.prototype.setCalendar = function (calendarName) {
        this.calendarName = calendarName;
        Object.keys(this.plots).forEach(function (key) {
            this.plots[key].setCalendar(calendarName);
        }, this);
    };

    perplots.PerPlots.prototype.setContentAttribute = function (contentAttribute) {
        this.contentAttribute = contentAttribute;
        Object.keys(this.plots).forEach(function (key) {
            this.plots[key].setContentAttribute(contentAttribute);
        }, this);
    };

    perplots.PerPlots.prototype.onReset = function () {
        Object.keys(this.plots).forEach(function (key) {
            this.plots[key].onReset();
        }, this);
    };

    perplots.PerPlots.prototype.onSelectionChanged = function (data) {
        this.update(data);
    };

    perplots.PerPlots.prototype.onDataSetChanged = function (data, metadata) {
        this.metadata = metadata;
        this.update(data);
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

    return perplots;

});