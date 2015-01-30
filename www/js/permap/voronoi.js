/**
 *  This file is part of PerSE. PerSE is a visual analytics app for
 *  event periodicity detection and analysis.
 *  Copyright (C) 2015  Brian Swedberg
 */

define([
    'ol',
    'd3'
], function (ol, d3) {

    var permap = {};

    permap.Voronoi = function (metadata) {
        this.metadata = metadata;
        this.extent = undefined;
        this.seedCoords = undefined;
    };

    permap.Voronoi.prototype.setExtent = function (extent) {
        this.extent = extent;
        return this;
    };

    permap.Voronoi.prototype.setSeedCoords = function (seedCoords) {
        this.seedCoords = seedCoords;
        return this;
    };

    permap.Voronoi.prototype.createVoronoi = function () {

        this.seedCoords = this.seedCoords || this.getInitSeedCoords(this.extent);

        return d3.geom.voronoi()
                .clipExtent(
                [
                    [this.extent.x.min - 1, this.extent.y.min - 1],
                    [this.extent.x.max + 1, this.extent.y.max + 1]
                ]
            )(this.seedCoords);
    };

    permap.Voronoi.prototype.buildVoronoiPointVectorLayer = function () {
        var features = [],
            vectorSource,
            fill,
            stroke,
            styles;

        this.seedCoords = this.seedCoords || this.getInitSeedCoords(this.extent);

        this.seedCoords.forEach(function (obj) {
            var feature = new ol.Feature({
                geometry: new ol.geom.Point(obj),
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

    permap.Voronoi.prototype.buildVoronoiPolygonVectorLayer = function () {
        var voronoi = this.createVoronoi(),
            features = [],
            vectorSource,
            fill,
            stroke,
            styles;

        voronoi.forEach(function (polyPoints, i) {
            var feature = new ol.Feature({
                    geometry: new ol.geom.Polygon([polyPoints]),
                    data: {voronoiIndex: i}
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

    permap.Voronoi.prototype.getInitSeedCoords = function (extent) {
        var xValues = [
                extent.x.min + (extent.x.dif * (1 / 4)),
                extent.x.min + (extent.x.dif * (3 / 4))
            ],
            yValues = [
               extent.y.min + (extent.y.dif * (5 / 6)),
               extent.y.min + (extent.y.dif * (3 / 6)),
               extent.y.min + (extent.y.dif * (1 / 6))
            ],
            seedCoords = [],
            x,
            y;

        for (y = 0; y < yValues.length; y += 1) {
            for (x = 0; x < xValues.length; x += 1) {
                seedCoords.push([xValues[x], yValues[y]]);
            }
        }
        return seedCoords;
    };

    permap.Voronoi.prototype.parseData = function (data) {
        var voronoiLayer = this.buildVoronoiPolygonVectorLayer(),
            newData = this.seedCoords.map(function () {return []; }),
            projection = this.metadata.getMetadata().geospatial.projection;

        data.forEach(function (d) {
            var coord = ol.proj.transform(d.coord, projection, 'EPSG:3857'),
                features = voronoiLayer.getSource().getFeaturesAtCoordinate(coord);
            newData[features[0].getProperties().data.voronoiIndex].push(d);
        });

        return newData;
    };

    return permap;
});