/**
 *  This file is part of PerSE. PerSE is a visual analytics app for
 *  event periodicity detection and analysis.
 *  Copyright (C) 2015  Brian Swedberg
 */

define([
    'jquery',
    'perplots/perplot',
    'perplots/perplotspositioncalculator',
    'perplots/voronoidatasetbuilder',
    'perlineplot/perlineplot',
    'perwheel/perwheel',
    // no namespace
    'bootstrap'
], function (
    $,
    perplot,
    perplotspositioncalculator,
    voronoidatasetbuilder,
    perlineplot,
    perwheel) {

    var perplots = {};

    perplots.PerPlots = function (params) {
        this.container = $('<div>').attr({'class': 'perse-perplots'});
        this.listeners = [];
        this.metadata = undefined;
        this.contentAttribute = undefined;
        this.calendarName = params.calendar || 'gregorian';
        this.cycleName = params.cycleName || 'monthOfYear';
        this.voronoiPolygons = undefined;
        this.plotType = params.plotType || 'timeWheel';//'linePlot';
        this.plots = {};
    };

    perplots.PerPlots.prototype.render = function (parent) {
        $(parent).append(this.container);
        return this;
    };

    perplots.PerPlots.prototype.getNewPerPlot = function (plotType) {
        switch (plotType) {
        case ('timeWheel'):
            return $.extend(new perwheel.PerWheel(), perplot.PerPlot.prototype);
        case ('linePlot'):
            return $.extend(new perlineplot.PerLinePlot(), perplot.PerPlot.prototype);
        default:
            console.warn('Case not supported');
        }
    };

    perplots.PerPlots.prototype.getPerPlotPrototype = function (plotType) {
        switch (plotType) {
        case ('timeWheel'):
            return perwheel.PerWheel.prototype;
        case ('linePlot'):
            return perlineplot.PerLinePlot.prototype;
        default:
            console.warn('Case not supported');
        }
    };

    perplots.PerPlots.prototype.addNewPlot = function (updateObj) {
        var perPlotDiv = $('<div>')
            .attr({'class': 'perse-perplot', 'id': 'perse-perplot-' + updateObj.id})
            .css(updateObj.position);
        this.plots[updateObj.id] = this.getNewPerPlot(this.plotType)
            .setPerPlotId(updateObj.id)
            .render(perPlotDiv)
            .registerListener(this.createPerPlotListener())
            .setCalendar(this.calendarName)
            .setCycleName(this.cycleName)
            .setContentAttribute(this.contentAttribute);
        this.container.append(perPlotDiv);
        this.plots[updateObj.id].onDataSetChanged({data: updateObj.data, extent: updateObj.extent}, this.metadata);
    };

    perplots.PerPlots.prototype.updatePlot = function (updateObj) {
        this.plots[updateObj.id]
            .onSelectionChanged({data: updateObj.data, extent: updateObj.extent});
        this.setPerPlotPosition(updateObj.id, updateObj.position);
    };

    perplots.PerPlots.prototype.removePlot = function (plotId) {
        this.plots[plotId].destroy();
        this.container.find('#' + 'perse-perplot-' + plotId).remove();
        delete this.plots[plotId];
    };

    perplots.PerPlots.prototype.update = function (data) {
        var parsedData = this.parseData(data),
            builtData = this.getBuiltData(parsedData),
            positions = this.getPositions(parsedData),
            updatedIds = [],
            extent = this.getExtent(builtData);

        // update and add new plots
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
            .setContainer(this.container)
            .calculate();
    };

    perplots.PerPlots.prototype.getBuiltData = function (parsedData) {
        var proto = this.getPerPlotPrototype(this.plotType);
        return parsedData.map(function (d) {
            return proto.processData({
                data: d.data,
                contentAttribute: this.contentAttribute,
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
            onFilterChanged: function () {
                console.log('filter changed');
            },
            onHoverEvent: function (event) {
                var indicationEvent;

                Object.keys(this.plots).forEach(function (k) {
                    this.plots[k].onHover(event);
                }, this);

                this.notifyListeners('onIndicationChanged', {
                    'context': this,
                    'voronoiId': event.firingPlot.getPerPlotId(),
                    'indicationFilter': event.indicationFilter
                });
            }
        };
    };

    perplots.PerPlots.prototype.getCycleName = function () {
        return this.cycleName;
    };

    perplots.PerPlots.prototype.getPlotType = function () {
        return this.plotType;
    };

    perplots.PerPlots.prototype.setCycleName = function (cycleName) {
        this.cycleName = cycleName;
        Object.keys(this.plots).forEach(function (key) {
            this.plots[key].setCycleName(this.cycleName);
        }, this);
    };

    perplots.PerPlots.prototype.setPlotType = function (plotType) {
        this.plotType = plotType;
    };

    perplots.PerPlots.prototype.getExtent = function (builtData) {
        var proto = this.getPerPlotPrototype(this.plotType);
        return proto.reduceExtents(builtData.map(proto.getExtent));
    };

    perplots.PerPlots.prototype.setPerPlotPosition = function (plotId, positionObj) {
        var plotContainer = this.container.find('#' + 'perse-perplot-' + plotId);
        plotContainer.animate(positionObj, 1000);
        return this;
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
                this.setCycleName(event.cycleName);
                this.notifyListeners('onDataSetRequested', {context: this});
            },
            onPlotTypeChanged: function (event) {
                if (event.plotType !== this.plotType) {
                    this.removeAllPlots();
                    this.plotType = event.plotType;
                    this.notifyListeners('onToolbarEvent', {
                        'context': this,
                        'type': 'onPlotTypeChanged',
                        'plotType': this.plotType,
                        'cycleName': this.cycleName
                    });
                    this.notifyListeners('onDataSetRequested', {context: this});
                }
            }
        };
    };

    perplots.PerPlots.prototype.removeAllPlots = function () {
        Object.keys(this.plots).forEach(function (key) {
            this.removePlot(this.plots[key].getPerPlotId());
        }, this);
    };

    perplots.PerPlots.prototype.onIndicationChanged = function (event) {
        Object.keys(this.plots).forEach(function (key) {
            var plotId = this.plots[key].getPerPlotId();
            this.container.find('#' + 'perse-perplot-' + plotId).toggleClass('active', plotId === event.voronoiId);
        }, this);
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