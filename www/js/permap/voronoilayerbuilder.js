/**
 *  This file is part of PerSE. PerSE is a visual analytics app for
 *  event periodicity detection and analysis.
 *  Copyright (C) 2015  Brian Swedberg
 */

define([
    'ol',
    'd3'
], function (ol, d3) {

    var voronoilayerbuilder = {};

    voronoilayerbuilder.VoronoiLayerBuilder = function () {
        this.extent = undefined;
        this.seedCoords = undefined;
    };

    voronoilayerbuilder.VoronoiLayerBuilder.prototype.setExtent = function (extent) {
        this.extent = this.formatExtent(extent);
        return this;
    };

    voronoilayerbuilder.VoronoiLayerBuilder.prototype.setSeedCoords = function (seedCoords) {
        this.seedCoords = seedCoords;
        return this;
    };

    voronoilayerbuilder.VoronoiLayerBuilder.prototype.getExtent = function () {
        var extent = {
            x: {min: this.seedCoords[0][0], max: this.seedCoords[0][0]},
            y: {min: this.seedCoords[0][1], max: this.seedCoords[0][1]}
        };
        this.seedCoords.forEach(function (s) {
            extent.x.min = Math.min(extent.x.min, s[0]);
            extent.x.min = Math.max(extent.x.max, s[0]);
            extent.y.min = Math.min(extent.y.min, s[1]);
            extent.y.min = Math.max(extent.y.max, s[1]);
        });
        return extent;
    };

    voronoilayerbuilder.VoronoiLayerBuilder.prototype.formatExtent = function (olExtentObj) {
        // olExtentObj = [minx, miny, maxx, maxy]
        return {
            x: {max: olExtentObj[2], min: olExtentObj[0], dif: (olExtentObj[2] - olExtentObj[0])},
            y: {max: olExtentObj[3], min: olExtentObj[1], dif: (olExtentObj[3] - olExtentObj[1])}
        };
    };

    voronoilayerbuilder.VoronoiLayerBuilder.prototype.createVoronoi = function () {
        return d3.geom.voronoi()
                .clipExtent([
                    [this.extent.x.min - 1, this.extent.y.min - 1],
                    [this.extent.x.max + 1, this.extent.y.max + 1]
                ])
                .x(function (d) {return d.coord[0]; })
                .y(function (d) {return d.coord[1]; })
        (this.seedCoords);
    };

    voronoilayerbuilder.VoronoiLayerBuilder.prototype.buildPointVectorLayer = function () {
        var features = [],
            vectorSource,
            fill,
            stroke,
            styles;
        this.seedCoords.forEach(function (obj) {
            var feature = new ol.Feature({
                geometry: new ol.geom.Point(obj.coord),
                data: obj
            });
            features.push(feature);
        });

        fill = new ol.style.Fill({
            color: 'rgba(0,0,0,0.4)'
        });
        stroke = new ol.style.Stroke({
            color: '#000',
            width: 3
        });
        styles = [
            new ol.style.Style({
                image: new ol.style.Circle({
                    fill: fill,
                    stroke: stroke,
                    radius: 3,
                    opacity: 0.5
                })
            })
        ];

        vectorSource = new ol.source.Vector({features: features});

        return new ol.layer.Vector({source: vectorSource, style: styles});

    };

    voronoilayerbuilder.VoronoiLayerBuilder.prototype.buildPolygonVectorLayer = function () {
        var voronoi = this.createVoronoi(),
            features = [],
            vectorSource,
            fill,
            stroke,
            styles;
        voronoi.forEach(function (polyPoints, i) {
            var feature = new ol.Feature({
                    geometry: new ol.geom.Polygon([polyPoints]),
                    data: polyPoints.point
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
                fill: fill,
                stroke: stroke
            })
        ];

        vectorSource = new ol.source.Vector({features: features});

        return new ol.layer.Vector({source: vectorSource, style: styles});

    };

    return voronoilayerbuilder;
});
