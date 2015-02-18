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
            select: undefined,
            modify: undefined,
            drag: undefined,
            remove: undefined,
            draw: undefined
        };
        /*

            voronoi: {
                select: undefined,
                modify: undefined,
                draw: undefined,
                drag: undefined,
                remove: undefined
            },
            filter: {
                select: undefined,
                modify: undefined,
                draw: undefined,
                drag: undefined
            }
        };
        */
        this.voronoiPositioning = 'auto';
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
        this.layers.eventPoints = this.createEventPointsLayer(data);
        extent = this.layers.eventPoints.getSource().getExtent();
        this.layers.voronoi.points = new voronoilayerbuilder.VoronoiLayerBuilder()
            .setExtent(extent)
            .setSeedCoords(this.calculateNewSeedCoords(extent))
            .buildPointVectorLayer();
        this.layers.voronoi.points.getSource().forEachFeature(this.addChangeListener, this);
        this.theMap.getView().fitExtent(extent, this.theMap.getSize());
        this.maxPointsExtent = this.layers.eventPoints.getSource().getExtent();

        this.layers.voronoi.polygons = this.getVoronoiPolygonLayer();

        this.theMap.addLayer(this.layers.voronoi.polygons);
        this.theMap.addLayer(this.layers.voronoi.points);
        this.theMap.addLayer(this.layers.eventPoints);

        if (this.voronoiPositioning === 'auto') {
            this.setVoronoiPoints(this.calculateNewSeedCoords(this.layers.eventPoints.getSource().getExtent()));
        }
        this.shouldUpdate = false;

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

    };

    map.Map.prototype.update = function (data) {
        this.theMap.removeLayer(this.layers.eventPoints);
        this.theMap.removeLayer(this.layers.voronoi.points);
        this.layers.eventPoints = this.createEventPointsLayer(data);

        if (this.voronoiPositioning === 'auto') {
            this.setVoronoiPoints(this.reCalculateSeedCoords(this.layers.eventPoints.getSource().getExtent()));
        }

        this.theMap.removeLayer(this.layers.voronoi.polygons);
        this.layers.voronoi.polygons = this.getVoronoiPolygonLayer();
        this.theMap.addLayer(this.layers.voronoi.polygons);


        this.theMap.addLayer(this.layers.eventPoints);
        this.theMap.addLayer(this.layers.voronoi.points);

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
            onVoronoiPositioningChanged: function (event) {
                this.voronoiPositioning = event.positioning;
                if (this.voronoiPositioning === 'auto') {
                    this.setVoronoiPoints(this.reCalculateSeedCoords(this.layers.eventPoints.getSource().getExtent()));
                    this.notifyListeners('onDataSetRequested', {'context': this});
                }
            },
            onInteractionModeChanged: function (event) {
                this.updateInteractionMode(event.mode);
            },
            onVoronoiPositioningReset: function (event) {
                this.setVoronoiPoints(this.calculateNewSeedCoords(this.layers.eventPoints.getSource().getExtent()));
                this.notifyListeners('onDataSetRequested', {'context': this});
            },
            onRemoveShape: function (event) {
                if (this.layers.filterPolygon) {
                    this.removeFilterShape();
                    this.updateInteractionMode('none');
                    this.notifyListeners('onFilterChanged', {'context': this});
                }

            }
        };
    };

    map.Map.prototype.addInteractionListener = function () {
        $(this.theMap.getViewport()).on('click', $.proxy(function () {
            if (this.shouldUpdate) {
                this.notifyListeners('onFilterChanged', {context: this, filter: this.getFilter()});
            }
        }, this));

    };

    map.Map.prototype.removeInteractionListener = function () {
        $(this.theMap.getViewport()).off('click');
    };

    map.Map.prototype.removeFilterShape = function () {
        this.layers.filterPolygon.getSource().clear();
    };

    map.Map.prototype.removeInteractions = function () {
        ['select', 'remove'].forEach(function (interaction) {
            if (this.interactions[interaction]) {
                this.theMap.removeInteraction(this.interactions[interaction]);
                this.interactions[interaction].getFeatures().clear();
                this.interactions[interaction] = undefined;
            }
        }, this);
        ['modify', 'draw', 'drag'].forEach(function (interaction) {
            if (this.interactions[interaction]) {
                this.theMap.removeInteraction(this.interactions[interaction]);
                this.interactions[interaction] = undefined;
            }
        }, this);
    };

    map.Map.prototype.addChangeListener = function (feature) {
        feature.on('change', this.changeListener, this);
    };

    map.Map.prototype.changeListener = function () {
        this.shouldUpdate = true;
    };

    map.Map.prototype.removeChangeListener = function (feature) {
        feature.un('change', this.changeListener, this);
    };

    map.Map.prototype.createSelectInteraction = function (layer) {
        var select = new ol.interaction.Select({
            layers: function (vLayer) {
                return vLayer === layer;
            }
        });
        return select;
    };

    map.Map.prototype.createRemoveInteraction = function (layer) {
        var remove = new ol.interaction.Select({
            layers: function (vLayer) {
                return vLayer === layer;
            }
        });

        layer.getSource().getFeatures().forEach(function (feature) {
            remove.getFeatures().push(feature);
        }, this);

        remove.getFeatures().on('add', function (event) {
            var feature = event.element;
            layer.getSource().removeFeature(feature);
            remove.getFeatures().clear();
            this.notifyListeners('onDataSetRequested', {context: this});
        }, this);

        /*
        map.on("pointermove", function (evt) {
            var hit = this.forEachFeatureAtPixel(evt.pixel,
                function(feature, layer) {
                    return true;
                });
            if (hit) {
                this.getTarget().style.cursor = 'pointer';
            } else {
                this.getTarget().style.cursor = '';
            }
        });
        */
        return remove;
    };

    map.Map.prototype.createModifyInteraction = function (selectInteraction) {
        return new ol.interaction.Modify({
            features: selectInteraction.getFeatures(),
            deleteCondition: function (event) {
                return ol.events.condition.click(event);
                //return ol.events.condition.mouseOnly(event);
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

    map.Map.prototype.updateInteractionMode = function (mode) {
        this.removeInteractionListener();
        this.removeInteractions();

        switch (mode) {
        case ('drawFilter'):
            if (this.layers.filterPolygon.getSource().getFeatures().length === 0) {
                this.addDrawInteraction('Polygon', this.layers.filterPolygon);
            }
            break;
        case ('modifyFilter'):
            this.interactions.select = this.createSelectInteraction(this.layers.filterPolygon);
            this.interactions.modify = this.createModifyInteraction(this.interactions.select);
            this.theMap.addInteraction(this.interactions.select);
            this.theMap.addInteraction(this.interactions.modify);
            this.layers.filterPolygon.getSource().getFeatures().forEach(function (feature) {
                this.interactions.select.getFeatures().push(feature);
            }, this);
            this.addInteractionListener();
            break;
        case ('moveFilter'):
            this.interactions.select = this.createSelectInteraction(this.layers.filterPolygon);
            this.interactions.drag = this.createDragInteraction(this.layers.filterPolygon);
            this.theMap.addInteraction(this.interactions.drag);
            this.theMap.addInteraction(this.interactions.select);
            this.layers.filterPolygon.getSource().getFeatures().forEach(function (feature) {
                this.interactions.select.getFeatures().push(feature);
            }, this);
            this.addInteractionListener();
            break;
        case ('addVoronoi'):
            if (this.layers.voronoi.points.getSource().getFeatures().length < 6) {
                this.addDrawInteraction('Point', this.layers.voronoi.points);
            }
            break;
        case ('moveVoronoi'):
            this.interactions.select = this.createSelectInteraction(this.layers.voronoi.points);
            this.interactions.drag = this.createDragInteraction(this.layers.voronoi.points);
            this.theMap.addInteraction(this.interactions.drag);
            this.theMap.addInteraction(this.interactions.select);
            this.layers.voronoi.points.getSource().getFeatures().forEach(function (feature) {
                this.interactions.select.getFeatures().push(feature);
            }, this);
            this.addInteractionListener();
            break;
        case ('removeVoronoi'):
            if (this.layers.voronoi.points.getSource().getFeatures().length > 1) {
                this.interactions.select = this.createRemoveInteraction(this.layers.voronoi.points);
                this.theMap.addInteraction(this.interactions.select);
                this.addInteractionListener();
            }
            break;
        case ('none'):
            break;
        default:
            console.warn('Case not supported');
        }
    };

    map.Map.prototype.addDrawInteraction = function (geomType, layer) {
        var type = geomType || 'Polygon';

        this.interactions.draw = new ol.interaction.Draw({
            source: layer.getSource(),
            type: type
        });

        this.interactions.draw.on('drawend', function () {
            layer.getSource().forEachFeature(this.removeChangeListener, this);
            layer.getSource().forEachFeature(this.addChangeListener, this);

            if (layer === this.layers.voronoi.points) {
                this.updateInteractionMode('addVoronoi');
            } else {
                this.updateInteractionMode('drawFilter');
            }

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

    map.Map.prototype.reCalculateSeedCoords = function (olExtentObj) {
        var pointFeatures = this.layers.voronoi.points.getSource().getFeatures(),
            amount = pointFeatures.length,
            steps = pointFeatures.length + (pointFeatures.length % 2),
            ySteps = steps,
            extent = {
                x: {max: olExtentObj[2], min: olExtentObj[0], dif: (olExtentObj[2] - olExtentObj[0])},
                y: {max: olExtentObj[3], min: olExtentObj[1], dif: (olExtentObj[3] - olExtentObj[1])}
            };

        return pointFeatures.map(function (feature, i) {
            var xValue, yValue, voronoiId, yStep = ((i + 1) % 2) + i;
            if (amount === 1) {
                xValue = extent.x.min + (extent.x.dif * (1 / 2));
                yValue = extent.y.min + (extent.y.dif * (1 / 2));
            } else if (amount % 2 === 0) {
                xValue = (i % 2) ? extent.x.min + (extent.x.dif * (1 / 4)) : extent.x.min + (extent.x.dif * (3 / 4));
                yValue = extent.y.min + extent.y.dif * ((ySteps - yStep) / ySteps);
            } else {
                if (i === amount - 1) {
                    xValue = extent.x.min + (extent.x.dif * (1 / 2));
                } else {
                    xValue = (i % 2) ? extent.x.min + (extent.x.dif * (1 / 4)) : extent.x.min + (extent.x.dif * (3 / 4));
                }
                yValue = extent.y.min + extent.y.dif * ((ySteps - yStep) / ySteps);
            }

            if (!feature.getProperties().hasOwnProperty('data')) {
                feature.set('data', {'coord': [xValue, yValue], 'voronoiId': this.getUniqueVoronoiId()});
            }

            return {'coord': [xValue, yValue], 'voronoiId': feature.getProperties().data.voronoiId};
            //return {'coord': [xValue, yValue], 'voronoiId': this.getUniqueVoronoiId()};
        }, this);
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