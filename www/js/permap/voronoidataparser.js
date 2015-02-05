/**
 *  This file is part of PerSE. PerSE is a visual analytics app for
 *  event periodicity detection and analysis.
 *  Copyright (C) 2015  Brian Swedberg
 */

define([
    'ol'
], function (ol) {

    var voronoidataparser = {};

    voronoidataparser.VoronoiDataParser = function () {
        this.data = undefined;
        this.polygonVectorLayer = undefined;
        this.projectionString = undefined;
    };

    voronoidataparser.VoronoiDataParser.prototype.setPolygonVectorLayer = function (polygonVectorLayer) {
        this.polygonVectorLayer = polygonVectorLayer;
        return this;
    };

    voronoidataparser.VoronoiDataParser.prototype.setData = function (data) {
        this.data = data;
        return this;
    };

    voronoidataparser.VoronoiDataParser.prototype.setProjection = function (projectionString) {
        this.projectionString = projectionString;
        return this;
    };

    voronoidataparser.VoronoiDataParser.prototype.parse = function () {
        var newData = this.polygonVectorLayer.getSource().getFeatures().map(function () {return []; });

        this.data.forEach(function (d) {
            var coord = ol.proj.transform(d.coord, this.projectionString, 'EPSG:3857'),
                features = this.polygonVectorLayer.getSource().getFeaturesAtCoordinate(coord);
            newData[features[0].getProperties().data.voronoiIndex].push(d);
        }, this);

        return newData;
    };

    return voronoidataparser;

});