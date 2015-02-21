/**
 *  This file is part of PerSE. PerSE is a visual analytics app for
 *  event periodicity detection and analysis.
 *  Copyright (C) 2015  Brian Swedberg
 */

define([
    'jquery',
    'permap/map',
    'perplots/perplots',
    'permap/permaptoolbar',
    'data/filter'
], function ($, map, perplots, permaptoolbar, filter) {

    var permap = {};

    permap.PerMap = function () {
        this.container = $('<div>').attr({'class': 'panel-body perse-panel-body'});
        this.metadata = undefined;
        this.listeners = [];
        this.perPlots = undefined;
        this.map = undefined;
        this.toolbar = undefined;
        this.filter = new filter.Filter({
            uniqueId: 'perse-permap',
            property: 'coord',
            filterOn: function () {return true; }
        });
        this.controls = {};
    };

    permap.PerMap.prototype.render = function (container) {
        var title,
            panelHeader,
            panel;

        this.toolbar = new permaptoolbar.PerMapToolbar();

        title = $('<p>')
            .attr({'class': 'perse-header-title'})
            .text('Map');

        panelHeader = $('<div>')
            .attr({'class': 'panel-heading perse-panel-heading'})
            .append($('<div>').attr({'class': 'panel-title'}).append(title, this.toolbar.createControls()));

        panel = $('<div>')
            .attr({'class': 'panel panel-default perse-permap'})
            .append(panelHeader, this.container);

        $(container).append(panel);

        return this;
    };

    permap.PerMap.prototype.build = function (data) {
        this.toolbar.registerListener(this.createListener());

        this.map = new map.Map()
            .render(this.container)
            .registerListener(this.createListener());
        this.toolbar.registerListener(this.map.createToolbarListener());

        this.perPlots = new perplots.PerPlots()
            .render(this.container)
            .registerListener(this.createListener());
        this.toolbar.registerListener(this.perPlots.createToolbarListener());

        this.map.onDataSetChanged(data, this.metadata);
        this.perPlots.setVoronoiPolygons(this.map.getVoronoiPolygonLayer());
        this.perPlots.onDataSetChanged(data, this.metadata);
    };

    permap.PerMap.prototype.update = function (data) {
        this.map.onSelectionChanged(data);
        this.perPlots.setVoronoiPolygons(this.map.getVoronoiPolygonLayer());
        this.perPlots.onSelectionChanged(data);
    };

    permap.PerMap.prototype.createListener = function () {
        return {
            context: this,
            onFilterChanged: function (event) {
                this.notifyListeners('onFilterChanged', {context: this, filter: this.getFilter()});
            },
            onRemoveFilter: function (event) {
                this.notifyListeners('onRemoveFilter', {context: this, filter: this.getFilter()});
            },
            onDataSetRequested: function (event) {
                this.notifyListeners('onDataSetRequested', {context: this, callback: this.onSelectionChanged});
            },
            onIndicationChanged: function (event) {
                this.map.onIndicationChanged(event);
                this.perPlots.onIndicationChanged(event);
            },
            onToolbarEvent: function (event) {
                this.toolbar.handleEvent(event.type, event);
            }
        };
    };

    permap.PerMap.prototype.getFilter = function () {
        // get filter from perplots
        this.filter.filterOn = this.map.getFilter();

        return this.filter;
    };

    permap.PerMap.prototype.onDataSetChanged = function (data, metadata) {
        this.metadata = metadata;
        this.build(data);
    };

    permap.PerMap.prototype.onSelectionChanged = function (data) {
        this.update(data);
    };

    permap.PerMap.prototype.notifyListeners = function (callbackStr, event) {
        this.listeners.forEach(function (listenerObj) {
            listenerObj[callbackStr].call(listenerObj.context, event);
        }, this);
    };

    permap.PerMap.prototype.registerListener = function (callbackObj) {
        this.listeners.push(callbackObj);
        return this;
    };

    return permap;

});