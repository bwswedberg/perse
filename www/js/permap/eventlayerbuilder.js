/**
 *  This file is part of PerSE. PerSE is a visual analytics app for
 *  event periodicity detection and analysis.
 *  Copyright (C) 2015  Brian Swedberg
 */

define([
    'ol'
], function (ol) {

    var eventlayerbuilder = {};

    eventlayerbuilder.EventLayerBuilder = function () {
        this.data = undefined;
        this.projection = undefined;
    };

    eventlayerbuilder.EventLayerBuilder.prototype.setData = function (data) {
        this.data = data;
        return this;
    };

    eventlayerbuilder.EventLayerBuilder.prototype.setProjection = function (projectionName) {
        this.projection = projectionName;
        return this;
    };

    eventlayerbuilder.EventLayerBuilder.prototype.buildPointVectorLayer = function () {
        var features = [],
            vectorSource,
            fill,
            stroke,
            styles;

        this.data.forEach(function (obj) {
            var feature = new ol.Feature({
                geometry: new ol.geom.Point(ol.proj.transform(obj.coord, this.projection, 'EPSG:3857')),
                data: obj
            });
            features.push(feature);
        }, this);

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

    return eventlayerbuilder;

});