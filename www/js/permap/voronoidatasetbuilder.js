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

    voronoidatasetbuilder.VoronoiDataSetBuilder.prototype.build = function () {
        var newData = this.polygonVectorLayer.getSource().getFeatures().map(function (feature) {
            return {
                id: feature.getProperties().data.voronoiIndex,
                extent: feature.getGeometry().getExtent(),
                data: []
            };
        });

        this.data.forEach(function (d) {
            var coord = ol.proj.transform(d.coord, this.projectionString, 'EPSG:3857'),
                features = this.polygonVectorLayer.getSource().getFeaturesAtCoordinate(coord);
            newData[features[0].getProperties().data.voronoiIndex].data.push(d);
        }, this);

        return newData;
    };

    return voronoidatasetbuilder;

});