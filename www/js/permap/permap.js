/**
 *  This file is part of PerSE. PerSE is a visual analytics app for
 *  event periodicity detection and analysis.
 *  Copyright (C) 2015  Brian Swedberg
 */

define([
    'jquery',
    'ol',
    'permap/voronoi',
    'data/filter'
], function ($, ol, voronoi, filter) {

    var permap = {};

    permap.PerMap = function () {
        this.container = $('<div>').attr({'class': 'perse-permap'});
        this.metadata = undefined;
        this.theMap = undefined;
        this.listeners = [];
        this.voronoi = undefined;
        this.voronoiObservers = [];
        this.voronoiPointsLayer = undefined;
        this.voronoiPolygonLayer = undefined;
        this.eventPointsLayer = undefined;
        this.filter = new filter.Filter({
            uniqueId: 'perse-permap',
            property: 'coord',
            filterOn: function () {return true; }
        });
    };

    permap.PerMap.prototype.render = function (container) {
        $(container).append(this.container);

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
            target: this.container.get(0)
        });
        return this;
    };

    permap.PerMap.prototype.build = function (data) {
        var pointsLayer = this.createPointsVectorLayer(data),
            extent = this.formatExtent(pointsLayer.getSource().getExtent()); // [minx, miny, maxx, maxy]

        this.voronoi = new voronoi.Voronoi(this.metadata)
            .setExtent(extent);

        this.eventPointsLayer = pointsLayer;
        this.voronoiPolygonLayer = this.voronoi.buildVoronoiPolygonVectorLayer();
        this.voronoiPointsLayer = this.voronoi.buildVoronoiPointVectorLayer();
        this.theMap.addLayer(this.eventPointsLayer);
        this.theMap.addLayer(this.voronoiPolygonLayer);
        this.theMap.addLayer(this.voronoiPointsLayer);
        this.theMap.getView().fitExtent(pointsLayer.getSource().getExtent(), this.theMap.getSize());
        this.notifyVoronoiObservers(this.voronoi.parseData(data));
    };

    permap.PerMap.prototype.update = function (data) {
        var newEventPointsLayer = this.createPointsVectorLayer(data);

        this.theMap.removeLayer(this.eventPointsLayer);
        this.eventPointsLayer = newEventPointsLayer;
        this.theMap.addLayer(this.eventPointsLayer);
        //this.theMap.removeLayer(this.voronoiPointsLayer);
        //this.theMap.removeLayer(this.voronoiPolygonLayer);

        this.notifyVoronoiObservers(this.voronoi.parseData(data));
    };

    permap.PerMap.prototype.createPointsVectorLayer = function (data) {
        var features = [],
            projection = this.metadata.getMetadata().geospatial.projection,
            vectorSource,
            fill,
            stroke,
            styles;

        data.forEach(function (obj) {
            var feature = new ol.Feature({
                geometry: new ol.geom.Point(ol.proj.transform(obj.coord, projection, 'EPSG:3857')),
                data: obj
            });
            features.push(feature);
        });

        fill = new ol.style.Fill({
            color: 'rgba(255,255,255,0.4)'
        });
        stroke = new ol.style.Stroke({
            color: '#3399CC',
            width: 1.25
        });
        styles = [
            new ol.style.Style({
                image: new ol.style.Circle({
                    fill: fill,
                    stroke: stroke,
                    radius: 3,
                    opacity: 0.1
                })
            })
        ];

        vectorSource = new ol.source.Vector({features: features});

        return new ol.layer.Vector({source: vectorSource, style: styles});
    };

    permap.PerMap.prototype.formatExtent = function (olExtentObj) {
        // olExtentObj = [minx, miny, maxx, maxy]
        return {
            x: {max: olExtentObj[2], min: olExtentObj[0], dif: (olExtentObj[2] - olExtentObj[0])},
            y: {max: olExtentObj[3], min: olExtentObj[1], dif: (olExtentObj[3] - olExtentObj[1])}
        };
    };

    permap.PerMap.prototype.onDataSetChanged = function (data, metadata) {
        this.metadata = metadata;
        this.build(data);
    };

    permap.PerMap.prototype.onSelectionChanged = function (data) {
        this.update(data);
    };

    permap.PerMap.prototype.makeInteractive = function () {
        this.vector = new ol.layer.Vector({
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

        this.theMap.addLayer(this.vector);
        this.addDrawInteraction('Polygon');
    };

    permap.PerMap.prototype.addDrawInteraction = function (geomType) {
        var type = geomType || 'Polygon',
            draw = new ol.interaction.Draw({
                source: this.vector.getSource(),
                type: type
            });

        draw.on('drawend', function (event) {
            this.theMap.removeInteraction(draw);
            this.notifyListeners('onFilterChanged', {context: this, filter: this.getFilter()});
        }, this);

        this.theMap.addInteraction(draw);
    };

    permap.PerMap.prototype.getFilter = function () {
        var projection = this.metadata.getMetadata().geospatial.projection,
            source = this.vector.getSource(),
            featureAmt = source.getFeatures().length;
        this.filter.filterOn = function (d) {
            var coordinate = ol.proj.transform(d, projection, 'EPSG:3857'),
                features = source.getFeaturesAtCoordinate(coordinate);
            return features.length === featureAmt;
        };

        return this.filter;
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

    permap.PerMap.prototype.notifyVoronoiObservers = function (data) {
        this.voronoiObservers.forEach(function (o) {
            o.onVoronoiChanged(data);
        });
    };

    permap.PerMap.prototype.registerVoronoiObserver = function (callbackObj) {
        this.voronoiObservers.push(callbackObj);
        return this;
    };

    return permap;

});