/**
 *  This file is part of PerSE. PerSE is a visual analytics app for
 *  event periodicity detection and analysis.
 *  Copyright (C) 2015  Brian Swedberg
 */

define([
    'ol'
], function (ol) {

    var voronoidatasetbuilder = {};

    voronoidatasetbuilder.VoronoiDataSetBuilder = function () {
        this.data = undefined;
        this.polygonVectorLayer = undefined;
        this.projectionString = undefined;
    };

    voronoidatasetbuilder.VoronoiDataSetBuilder.prototype.setPolygonVectorLayer = function (polygonVectorLayer) {
        this.polygonVectorLayer = polygonVectorLayer;
        return this;
    };

    voronoidatasetbuilder.VoronoiDataSetBuilder.prototype.setData = function (data) {
        this.data = data;
        return this;
    };

    voronoidatasetbuilder.VoronoiDataSetBuilder.prototype.setProjection = function (projectionString) {
        this.projectionString = projectionString;
        return this;
    };

    voronoidatasetbuilder.VoronoiDataSetBuilder.prototype.formatExtent = function (olExtentObj) {
        // olExtentObj = [minx, miny, maxx, maxy]
        return {
            x: {max: olExtentObj[2], min: olExtentObj[0], dif: (olExtentObj[2] - olExtentObj[0])},
            y: {max: olExtentObj[3], min: olExtentObj[1], dif: (olExtentObj[3] - olExtentObj[1])}
        };
    };

    voronoidatasetbuilder.VoronoiDataSetBuilder.prototype.build = function () {
        var that = this,
            newData = this.polygonVectorLayer.getSource().getFeatures().map(function (feature) {
                return {
                    id: feature.getProperties().data.voronoiId,
                    feature: feature,
                    data: []
                };
            });

        this.data.forEach(function (d) {
            var coord = ol.proj.transform(d.coord, this.projectionString, 'EPSG:3857'),
                features = this.polygonVectorLayer.getSource().getFeaturesAtCoordinate(coord);
            newData[features[0].getProperties().data.voronoiId].data.push(d);
        }, this);

        return newData;
    };

    return voronoidatasetbuilder;

});