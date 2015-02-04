/**
 *  This file is part of PerSE. PerSE is a visual analytics app for
 *  event periodicity detection and analysis.
 *  Copyright (C) 2015  Brian Swedberg
 */

define([
    'ol'
], function (ol) {

    var voronoiparser = {};

    voronoiparser.VoronoiParser = function () {
        this.data = undefined;
        this.voronoiPolygonVectorLayer = undefined;
        this.projectionString = undefined;
    };

    voronoiparser.VoronoiParser.prototype.setVoronoiPolygonVectorLayer = function (voronoiPolygonVectorLayer) {
        this.voronoiPolygonVectorLayer = voronoiPolygonVectorLayer;
        return this;
    };

    voronoiparser.VoronoiParser.prototype.setData = function (data) {
        this.data = data;
        return this;
    };

    voronoiparser.VoronoiParser.prototype.setProjection = function (projectionString) {
        this.projectionString = projectionString;
        return this;
    };

    voronoiparser.VoronoiParser.prototype.parse = function () {
        var voronoiLayer = this.voronoiPolygonVectorLayer,
            newData = this.voronoiPolygonVectorLayer.getSource().getFeatures().map(function () {return []; });

        this.data.forEach(function (d) {
            var coord = ol.proj.transform(d.coord, this.projectionString, 'EPSG:3857'),
                features = voronoiLayer.getSource().getFeaturesAtCoordinate(coord);
            newData[features[0].getProperties().data.voronoiIndex].push(d);
        }, this);

        return newData;
    };

});