/**
 *  This file is part of PerSE. PerSE is a visual analytics app for
 *  event periodicity detection and analysis.
 *  Copyright (C) 2015  Brian Swedberg
 */

define([
    'jquery',
    'ol',
    'permap/draginteraction',
    // no namespace
    'bootstrap'
], function ($, ol, draginteraction) {

    var map = {};

    map.Map = function () {
        this.listeners = [];
        this.metadata = undefined;
        this.theMap = undefined;
        this.layers = {
            filterPolygon: undefined,
            eventPoints: undefined,
            voronoiPolygons: undefined,
            voronoiPoints: undefined
        };
        this.interactions = {
            select: undefined,
            draw: undefined,
            drag: undefined,
            modify: undefined
        };
        this.filterShapeInteractionMode = 'none';
    };

    map.Map.prototype.render = function (parent) {
        this.theMap = new ol.Map({
            controls: [],
            view: new ol.View({
                projection: 'EPSG:900913',
                center: [0, 0],
                zoom: 5
            }),
            renderer: 'canvas',
            layers: [
                new ol.layer.Tile({
                    source: new ol.source.OSM()
                })
            ],
            target: $(parent).get(0)
        });
        return this;
    };

    map.Map.prototype.build = function (layerObj, metadata) {
        this.metadata = metadata;
        this.theMap.getView().fitExtent(layerObj.eventPoints.getSource().getExtent(), this.theMap.getSize());
        this.update(layerObj);
    };

    map.Map.prototype.update = function (layerObj) {

        Object.keys(this.layers).forEach(function (key) {
            if (layerObj[key]) {
                this.theMap.removeLayer(this.layers[key]);
                this.layers[key] = layerObj[key];
                this.theMap.addLayer(layerObj[key]);
            }
        }, this);

    };

    map.Map.prototype.createToolbarListener = function () {
        return {
            context: this,
            onZoomIn: function (event) {
                var zoom = this.theMap.getView().getZoom();
                this.theMap.getView().setZoom(zoom + 1);
            },
            onZoomOut: function (event) {
                var zoom = this.theMap.getView().getZoom();
                this.theMap.getView().setZoom(zoom - 1);
            },
            onDrawShape: function (event) {
                this.addDrawInteraction(event.shape);
            },
            onPointer: function (event) {
                this.filterShapeInteractionMode = 'none';
                this.updateFilterShapeInteractionMode();
            },
            onMoveShape: function (event) {
                this.filterShapeInteractionMode = 'move';
                this.updateFilterShapeInteractionMode();
            },
            onModifyShape: function (event) {
                this.filterShapeInteractionMode = 'modify';
                this.updateFilterShapeInteractionMode();
            },
            onRemoveShape: function (event) {
                if (this.layers.filterPolygon) {
                    this.interactions.select.getFeatures().clear();
                    this.clearInteractions();
                    this.theMap.removeLayer(this.layers.filterPolygon);
                    this.layers.filterPolygon = undefined;
                    this.notifyListeners('onFilterChanged', {'context': this});
                }

            }
        };
    };

    map.Map.prototype.clearInteractions = function () {
        if (this.interactions.select) {
            this.theMap.removeInteraction(this.interactions.select);
        }
        if (this.interactions.modify) {
            this.theMap.removeInteraction(this.interactions.modify);
        }
        if (this.interactions.drag) {
            this.theMap.removeInteraction(this.interactions.drag);
        }
    };

    map.Map.prototype.addInteractionListener = function () {
        $(this.theMap.getTarget()).on('mouseup', $.proxy(function () {
            this.notifyListeners('onFilterChanged', {context: this, filter: this.getFilter()});
        }, this));
    };

    map.Map.prototype.removeInteractionListener = function () {
        $(this.theMap.getTarget()).off('mouseup');
    };

    map.Map.prototype.updateFilterShapeInteractionMode = function () {
        var that = this;

        this.removeInteractionListener();
        if (this.layers.filterPolygon) {

            this.clearInteractions();

            this.interactions.select = new ol.interaction.Select({
                layers: function (vLayer) {
                    return vLayer === that.layers.filterPolygon;
                }
            });

            this.layers.filterPolygon.getSource().getFeatures().forEach(function (f) {
                this.interactions.select.getFeatures().push(f);
            }, this);

            this.theMap.addInteraction(this.interactions.select);

            this.addInteractionListener();

            switch (this.filterShapeInteractionMode) {
            case ('modify'):
                this.interactions.modify = new ol.interaction.Modify({
                    features: that.interactions.select.getFeatures(),
                    deleteCondition: function (event) {
                        return ol.events.condition.shiftKeyOnly(event) &&
                            ol.events.condition.singleClick(event);
                    }
                });

                this.theMap.addInteraction(this.interactions.modify);
                break;
            case ('move'):
                this.interactions.drag = new draginteraction.Drag({
                    features: that.interactions.select.getFeatures()
                });
                this.theMap.addInteraction(this.interactions.drag);
                break;
            case ('none'):
                this.interactions.select.getFeatures().clear();
                this.removeInteractionListener();
                this.clearInteractions();
                break;
            default:
                console.warn('Case Not Supported');
            }
        }
    };

    map.Map.prototype.addDrawInteraction = function (geomType) {
        var type = geomType || 'Polygon';

        this.removeInteractionListener();
        this.clearInteractions();

        if (!this.layers.filterPolygon) {
            this.layers.filterPolygon = new ol.layer.Vector({
                source: new ol.source.Vector(),
                style: new ol.style.Style({
                    fill: new ol.style.Fill({
                        color: 'rgba(255, 255, 255, 0.2)'
                    }),
                    stroke: new ol.style.Stroke({
                        color: '#ffcc33',
                        width: 2
                    }),
                    image: new ol.style.Circle({
                        radius: 7,
                        fill: new ol.style.Fill({
                            color: '#ffcc33'
                        })
                    })
                })
            });
            this.theMap.addLayer(this.layers.filterPolygon);
            //this.layers.filterPolygon.setMap(this.theMap);
        }

        this.interactions.draw = new ol.interaction.Draw({
            source: this.layers.filterPolygon.getSource(),
            //features: this.layers.filterPolygon.getFeatures(),
            type: type
        });

        this.interactions.draw.on('drawend', function (event) {
            this.theMap.removeInteraction(this.interactions.draw);
            this.updateFilterShapeInteractionMode();
            this.notifyListeners('onFilterChanged', {context: this, filter: this.getFilter()});
        }, this);

        this.theMap.addInteraction(this.interactions.draw);
    };

    map.Map.prototype.getFilter = function () {
        var projection, source, featureAmt;

        if (this.layers.filterPolygon) {
            projection = this.metadata.getMetadata().geospatial.projection;
            source = this.layers.filterPolygon.getSource();
            featureAmt = source.getFeatures().length;
            return function (d) {
                var coordinate = ol.proj.transform(d, projection, 'EPSG:3857'),
                    features = source.getFeaturesAtCoordinate(coordinate);
                return features.length === featureAmt;
            };
        }
        return function () {return true; };
    };

    map.Map.prototype.onSelectionChanged = function (data) {
        //this.update(data);
    };

    map.Map.prototype.onDataSetChanged = function (data, metadata) {
        //this.metadata = metadata;
        //this.build(data);
    };

    map.Map.prototype.notifyListeners = function (callbackStr, event) {
        this.listeners.forEach(function (listenerObj) {
            listenerObj[callbackStr].call(listenerObj.context, event);
        }, this);
    };

    map.Map.prototype.registerListener = function (callbackObj) {
        this.listeners.push(callbackObj);
        return this;
    };

    return map;

});