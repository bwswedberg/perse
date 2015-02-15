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
        this.shouldUpdate = true;
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
        var extent;
        this.update(data);
        extent = this.layers.eventPoints.getSource().getExtent();
        this.layers.voronoi.points = new voronoilayerbuilder.VoronoiLayerBuilder()
            .setExtent(extent)
            .setSeedCoords(this.calculateNewSeedCoords(extent))
            .buildPointVectorLayer();
        this.theMap.addLayer(this.layers.voronoi.points);
        this.theMap.getView().fitExtent(extent, this.theMap.getSize());
        this.maxPointsExtent = this.layers.eventPoints.getSource().getExtent();
        this.addInteractionListener();
    };

    map.Map.prototype.update = function (data) {
        this.theMap.removeLayer(this.layers.eventPoints);
        this.layers.eventPoints = this.createEventPointsLayer(data);
        this.theMap.addLayer(this.layers.eventPoints);
        if (this.voronoiPositioning === 'auto') {
            this.setVoronoiPoints(this.calculateNewSeedCoords(this.layers.eventPoints.getSource().getExtent()));
        }
        this.shouldUpdate = false;
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
                if (this.voronoiPositioning === 'auto') {
                    this.setVoronoiPoints(this.calculateNewSeedCoords(this.layers.eventPoints.getSource().getExtent()));
                    this.notifyListeners('onDataSetRequested', {'context': this});
                }
            },
            onVoronoiPositioningReset: function (event) {
                this.setVoronoiPoints(this.calculateNewSeedCoords(this.layers.eventPoints.getSource().getExtent()));
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
            if (this.shouldUpdate) {
                this.notifyListeners('onFilterChanged', {context: this, filter: this.getFilter()});
            }
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
        var filterInteractions = ['modify', 'drag', 'draw'];
        if (this.interactions.filter.select) {
            this.theMap.removeInteraction(this.interactions.filter.select);
            this.interactions.filter.select.getFeatures().clear();
        }
        filterInteractions.forEach(function (interaction) {
            if (this.interactions.filter[interaction]) {
                this.theMap.removeInteraction(this.interactions.filter[interaction]);
                this.interactions.filter[interaction] = undefined;
            }
        }, this);
    };

    map.Map.prototype.removeFilterSelectInteraction = function () {
        if (this.interactions.filter.select) {
            this.theMap.removeInteraction(this.interactions.filter.select);
            this.interactions.filter.select.getFeatures().forEach(function (f) {
                f.un('change');
            });
            this.interactions.filter.select.getFeatures().clear();
            this.interactions.filter.select = undefined;
        }
    };

    map.Map.prototype.removeVoronoiInteractions = function () {
        var voronoiInteractions = ['modify'];
        if (this.interactions.voronoi.select) {
            this.theMap.removeInteraction(this.interactions.voronoi.select);
            this.interactions.voronoi.select.getFeatures().forEach(function (f) {
                f.un('change');
            });
            this.interactions.voronoi.select.getFeatures().clear();
            this.interactions.voronoi.select = undefined;
        }
        voronoiInteractions.forEach(function (interaction) {
            if (this.interactions.voronoi[interaction]) {
                this.theMap.removeInteraction(this.interactions.voronoi[interaction]);
                this.interactions.voronoi[interaction] = undefined;
            }
        }, this);
    };

    map.Map.prototype.createSelectInteraction = function (layer) {
        var select = new ol.interaction.Select({
                layers: function (vLayer) {
                    return vLayer === layer;
                }
            });

        layer.getSource().getFeatures().forEach(function (feature) {
            feature.on('change', function (event) {
                this.shouldUpdate = true;
            }, this);
        }, this);

        return select;
    };

    map.Map.prototype.createModifyInteraction = function (selectInteraction) {
        return new ol.interaction.Modify({
            features: selectInteraction.getFeatures(),
            deleteCondition: function (event) {
                return ol.events.condition.shiftKeyOnly(event) &&
                    ol.events.condition.singleClick(event);
            }
        });
    };

    map.Map.prototype.createDragInteraction = function (layer) {
        return new draginteraction.Drag({
            layerFilter: function (someLayer) {
                return someLayer === layer;
            }
        });
    };

    map.Map.prototype.updateFilterShapeInteractionMode = function () {
        this.removeFilterInteractions();

        switch (this.filterShapeInteractionMode) {
        case ('modify'):
            this.interactions.filter.modify = this.createModifyInteraction(this.interactions.filter.select);
            this.theMap.addInteraction(this.interactions.filter.modify);
            this.theMap.addInteraction(this.interactions.filter.select);
            if (this.layers.filterPolygon) {
                this.layers.filterPolygon.getSource().getFeatures().forEach(function (feature) {
                    this.interactions.filter.select.getFeatures().push(feature);
                }, this);
            }
            break;
        case ('move'):
            this.interactions.filter.drag = this.createDragInteraction(this.layers.filterPolygon);
            this.theMap.addInteraction(this.interactions.filter.drag);
            this.theMap.addInteraction(this.interactions.filter.select);
            if (this.layers.filterPolygon) {
                this.layers.filterPolygon.getSource().getFeatures().forEach(function (feature) {
                    this.interactions.filter.select.getFeatures().push(feature);
                }, this);
            }
            break;
        case ('none'):
            if (this.interactions.filter.select) {
                this.interactions.filter.select.getFeatures().clear();
            }
            break;
        default:
            console.warn('Case Not Supported');
        }
    };

    map.Map.prototype.addDrawInteraction = function (geomType) {
        var type = geomType || 'Polygon';

        this.removeInteractionListener();
        this.removeFilterSelectInteraction();
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
        }

        this.interactions.filter.draw = new ol.interaction.Draw({
            source: this.layers.filterPolygon.getSource(),
            type: type
        });

        this.interactions.filter.draw.on('drawend', function () {
            this.addInteractionListener();
            this.theMap.removeInteraction(this.interactions.filter.draw);
            this.interactions.filter.select = this.createSelectInteraction(this.layers.filterPolygon);
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

    map.Map.prototype.setVoronoiPoints = function (seedCoords) {
        this.layers.voronoi.points.getSource().getFeatures().forEach(function (feature, i) {
            feature.setGeometry(new ol.geom.Point(seedCoords[i].coord));
        });
    };

    map.Map.prototype.getSeedCoords = function () {
        return this.layers.voronoi.points.getSource().getFeatures().map(function (f) {
            return {'coord': f.getGeometry().getCoordinates(), 'voronoiId': f.getProperties().data.voronoiId};
        });
    };

    map.Map.prototype.calculateNewSeedCoords = function (olExtentObj) {
        var extent, xValues, yValues, seedCoords = [], x, y;

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