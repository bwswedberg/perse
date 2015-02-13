/**
 *  This file is part of PerSE. PerSE is a visual analytics app for
 *  event periodicity detection and analysis.
 *  Copyright (C) 2015  Brian Swedberg
 */

define([
    'jquery',
    'ol',
    'permap/eventlayerbuilder',
    'permap/voronoilayerbuilder',
    'permap/draginteraction',
    // no namespace
    'bootstrap'
], function ($, ol, eventlayerbuilder, voronoilayerbuilder, draginteraction) {

    var map = {};

    map.Map = function () {
        this.listeners = [];
        this.metadata = undefined;
        this.theMap = undefined;
        this.layers = {
            filterPolygon: undefined,
            eventPoints: undefined,
            voronoi: {polygons: undefined, points: undefined}
        };
        this.interactions = {
            voronoi: {select: undefined, modify: undefined},
            filter: {
                select: undefined,
                modify: undefined,
                draw: undefined,
                drag: undefined
            }
        };
        this.voronoiPositioning = 'fixed';
        this.filterShapeInteractionMode = 'none';
        this.voronoiCount = 0;
        this.maxPointsExtent = undefined;
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
            /* For Mapbox stuff
            layers: [
                new ol.layer.Tile({
                    source: new ol.source.XYZ({
                        url: 'http://api.tiles.mapbox.com/v4/bwswedberg.l5e51i3j/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoiYndzd2VkYmVyZyIsImEiOiJBTjZDRnBJIn0.xzlamtU5oK5yGfb1-w-bYg',
                    })
                })
            ],*/
            target: $(parent).get(0)
        });
        return this;
    };

    map.Map.prototype.build = function (data) {
        this.update(data);
        this.theMap.getView().fitExtent(this.layers.eventPoints.getSource().getExtent(), this.theMap.getSize());
        this.maxPointsExtent = this.layers.eventPoints.getSource().getExtent();
    };

    map.Map.prototype.update = function (data) {
        this.theMap.removeLayer(this.layers.eventPoints);
        this.layers.eventPoints = this.createEventPointsLayer(data);
        this.theMap.addLayer(this.layers.eventPoints);
        this.theMap.removeLayer(this.layers.voronoi.points);
        this.layers.voronoi.points = this.getVoronoiPointsLayer();
        this.theMap.addLayer(this.layers.voronoi.points);
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
            onVoronoiPositioningChanged: function (event) {
                this.voronoiPositioning = event.positioning;
            },
            onVoronoiPositioningReset: function (event) {
                this.removeVoronoi();
                this.notifyListeners('onDataSetRequested', {'context': this});
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
                    this.removeFilterShape();
                    this.notifyListeners('onFilterChanged', {'context': this});
                }

            }
        };
    };

    map.Map.prototype.addInteractionListener = function () {
        $(this.theMap.getTarget()).on('mouseup', $.proxy(function () {
            this.notifyListeners('onFilterChanged', {context: this, filter: this.getFilter()});
        }, this));
    };

    map.Map.prototype.removeInteractionListener = function () {
        $(this.theMap.getTarget()).off('mouseup');
    };

    map.Map.prototype.removeFilterShape = function () {
        if (this.layers.filterPolygon) {
            this.removeFilterInteractions();
            this.theMap.removeLayer(this.layers.filterPolygon);
            this.layers.filterPolygon = undefined;
        }
    };

    map.Map.prototype.removeFilterInteractions = function () {
        var filterInteractions = ['select', 'modify', 'drag', 'draw'];
        if (this.interactions.filter.select) {
            this.interactions.filter.select.getFeatures().clear();
        }
        filterInteractions.forEach(function (interaction) {
            if (this.interactions.filter[interaction]) {
                this.theMap.removeInteraction(this.interactions.filter[interaction]);
                this.interactions.filter[interaction] = undefined;
            }
        }, this);
    };

    map.Map.prototype.removeVoronoiInteractions = function () {
        var voronoiInteractions = ['select', 'modify'];
        voronoiInteractions.forEach(function (interaction) {
            if (this.interactions.voronoi[interaction]) {
                this.theMap.removeInteraction(this.interactions.voronoi[interaction]);
                this.interactions.voronoi[interaction] = undefined;
            }
        }, this);
    };

    map.Map.prototype.removeVoronoi = function () {
        this.removeVoronoiInteractions();
        ['points', 'polygons'].forEach(function (k) {
            this.theMap.removeLayer(this.voronoi[k]);
            this.layers.voronoi[k] = undefined;
        }, this);
    };

    map.Map.prototype.createModifyInteraction = function (layer) {
        var selectInteraction, modifyInteraction;
        console.trace();

        selectInteraction = new ol.interaction.Select({
            layers: function (vLayer) {
                return vLayer === layer;
            }
        });

        modifyInteraction = new ol.interaction.Modify({
            features: selectInteraction.getFeatures(),
            deleteCondition: function (event) {
                return ol.events.condition.shiftKeyOnly(event) &&
                    ol.events.condition.singleClick(event);
            }
        });

        return {'select': selectInteraction, 'modify': modifyInteraction};
    };

    map.Map.prototype.createDragInteraction = function (layer) {
        var selectInteraction, dragInteraction;

        selectInteraction = new ol.interaction.Select({
            layers: function (vLayer) {
                return vLayer === layer;
            }
        });

        dragInteraction = new draginteraction.Drag({
            features: selectInteraction.getFeatures()
        });

        return {'select': selectInteraction, 'drag': dragInteraction};
    };

    map.Map.prototype.updateFilterShapeInteractionMode = function () {
        var interaction;

        this.removeFilterInteractions();
        this.removeInteractionListener();

        switch (this.filterShapeInteractionMode) {
        case ('modify'):

            interaction = this.createModifyInteraction(this.layers.filterPolygon);
            this.interactions.filter.select = interaction.select;
            this.interactions.filter.modify = interaction.modify;
            this.theMap.addInteraction(this.interactions.filter.select);
            this.theMap.addInteraction(this.interactions.filter.modify);
            this.addInteractionListener();
            break;
        case ('move'):
            interaction = this.createDragInteraction(this.layers.filterPolygon);
            this.interactions.filter.select = interaction.select;
            this.interactions.filter.drag = interaction.drag;
            this.theMap.addInteraction(this.interactions.filter.select);
            this.theMap.addInteraction(this.interactions.filter.drag);
            this.addInteractionListener();
            break;
        case ('none'):
            //this.interactions.filter.select.getFeatures().clear();
            //this.removeFilterInteractions();
            break;
        default:
            console.warn('Case Not Supported');
        }
    };

    map.Map.prototype.addDrawInteraction = function (geomType) {
        var type = geomType || 'Polygon';

        this.removeInteractionListener();

        this.removeFilterInteractions();

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

        this.interactions.filter.draw = new ol.interaction.Draw({
            source: this.layers.filterPolygon.getSource(),
            //features: this.layers.filterPolygon.getFeatures(),
            type: type
        });

        this.interactions.filter.draw.on('drawend', function (event) {
            this.theMap.removeInteraction(this.interactions.filter.draw);
            this.updateFilterShapeInteractionMode();
            this.notifyListeners('onFilterChanged', {context: this, filter: this.getFilter()});
        }, this);

        this.theMap.addInteraction(this.interactions.filter.draw);
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

    map.Map.prototype.createEventPointsLayer = function (data) {
        var projection = this.metadata.getMetadata().geospatial.projection;
        return new eventlayerbuilder.EventLayerBuilder()
                .setProjection(projection)
                .setData(data)
                .buildPointVectorLayer();
    };

    map.Map.prototype.getVoronoiPointsLayer = function () {
        var voronoiLayer, extent;
        if (!this.layers.voronoi.points || this.voronoiPositioning === 'auto') {
            this.removeVoronoiInteractions();
            extent = this.layers.eventPoints.getSource().getExtent();
            voronoiLayer = new voronoilayerbuilder.VoronoiLayerBuilder()
                .setExtent(extent)
                .setSeedCoords(this.getSeedCoords(extent))
                .buildPointVectorLayer();
            //this.interactions.voronoi = this.createModifyInteraction(voronoiLayer);
            //this.theMap.addInteraction(this.interactions.voronoi.select);
            //this.theMap.addInteraction(this.interactions.voronoi.modify);
            return voronoiLayer;
        }
        return this.layers.voronoi.points;
    };

    map.Map.prototype.getVoronoiPolygonLayer = function () {
        var extent = this.layers.eventPoints.getSource().getExtent(),
            voronoiLayerBuilder = new voronoilayerbuilder.VoronoiLayerBuilder()
                .setExtent(this.maxPointsExtent)
                .setSeedCoords(this.getSeedCoords(extent));
        return voronoiLayerBuilder.buildPolygonVectorLayer();
    };

    map.Map.prototype.getUniqueVoronoiId = function () {
        var id = this.voronoiCount.toString();
        this.voronoiCount += 1;
        return id;
    };

    map.Map.prototype.getSeedCoords = function (olExtentObj) {
        var extent, xValues, yValues, seedCoords = [], x, y;

        if (!this.layers.voronoi.points || this.voronoiPositioning === 'auto') {
            extent = {
                x: {max: olExtentObj[2], min: olExtentObj[0], dif: (olExtentObj[2] - olExtentObj[0])},
                y: {max: olExtentObj[3], min: olExtentObj[1], dif: (olExtentObj[3] - olExtentObj[1])}
            };
            xValues = [
                    extent.x.min + (extent.x.dif * (1 / 4)),
                    extent.x.min + (extent.x.dif * (3 / 4))
            ];
            yValues = [
                    extent.y.min + (extent.y.dif * (5 / 6)),
                    extent.y.min + (extent.y.dif * (3 / 6)),
                    extent.y.min + (extent.y.dif * (1 / 6))
            ];

            for (y = 0; y < yValues.length; y += 1) {
                for (x = 0; x < xValues.length; x += 1) {
                    seedCoords.push({'coord': [xValues[x], yValues[y]], 'voronoiId': this.getUniqueVoronoiId()});
                }
            }

        } else {
            seedCoords = this.layers.voronoi.points.getSource().getFeatures().map(function (f) {
                return f.getProperties().data;
            });
        }
        return seedCoords;
    };

    map.Map.prototype.onSelectionChanged = function (data) {
        this.update(data);
    };

    map.Map.prototype.onDataSetChanged = function (data, metadata) {
        this.metadata = metadata;
        this.build(data);
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