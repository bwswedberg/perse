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
        this.metadata = undefined;
        this.attributeName = undefined;
        this.data = undefined;
        this.projection = undefined;
    };

    eventlayerbuilder.EventLayerBuilder.prototype.setMetadata = function (metadata) {
        this.metadata = metadata;
        return this;
    };

    eventlayerbuilder.EventLayerBuilder.prototype.setAttribute = function (attributeName) {
        this.attributeName = attributeName;
        return this;
    };

    eventlayerbuilder.EventLayerBuilder.prototype.setData = function (data) {
        this.data = data;
        return this;
    };

    eventlayerbuilder.EventLayerBuilder.prototype.setProjection = function (projectionName) {
        this.projection = projectionName;
        return this;
    };

    eventlayerbuilder.EventLayerBuilder.prototype.getAttributeStyleFunction = function () {
        var uniqueValues = this.metadata.attribute.attributes[this.attributeName].uniqueValues,
            styles = {},
            colors = Object.keys(uniqueValues).map(function (key) {return uniqueValues[key].color; }),
            opacities = {'max': 0.8, 'med': 0.3, 'min': 0.00};

        Object.keys(opacities).forEach(function (highlightLevel) {
            colors.forEach(function (color) {
                var key = highlightLevel + '_' + color,
                    rgb = ol.color.asArray(color); // hex to rgb
                rgb[3] = opacities[highlightLevel]; // ol must set the 'alpha' value
                styles[key] = new ol.style.Style({
                    image: new ol.style.Circle({
                        radius: 3,
                        fill: new ol.style.Fill({
                            color: rgb
                        }),
                        opacity: opacities[highlightLevel]
                    })

                });
            });
        });

        return function (feature) {
            return [styles[feature.get('highlightLevel') + '_' + feature.get('color')]];
        };
    };

    eventlayerbuilder.EventLayerBuilder.prototype.buildAttributePointVectorLayer = function () {
        var uniqueValues = this.metadata.attribute.attributes[this.attributeName].uniqueValues,
            attrName = this.attributeName,
            features = [],
            vectorSource;

        this.data.forEach(function (obj) {
            var feature = new ol.Feature({
                geometry: new ol.geom.Point(ol.proj.transform(obj.coord, this.projection, 'EPSG:3857')),
                data: obj,
                color: uniqueValues[obj[attrName]].color,
                highlightLevel: 'max'
            });
            features.push(feature);
        }, this);

        vectorSource = new ol.source.Vector({features: features});

        return new ol.layer.Vector({source: vectorSource, style: this.getAttributeStyleFunction()});
    };

    eventlayerbuilder.EventLayerBuilder.prototype.buildDefaultPointVectorLayer = function () {
        var styles,
            features = [],
            vectorSource;

        styles = [new ol.style.Style({
            image: new ol.style.Circle({
                radius: 3,
                fill: new ol.style.Fill({
                    color: 'rgb(255, 255, 255, 0.5'
                }),
                opacity: '0.5'
            })
        })];

        this.data.forEach(function (obj) {
            var feature = new ol.Feature({
                geometry: new ol.geom.Point(ol.proj.transform(obj.coord, this.projection, 'EPSG:3857')),
                data: obj
            });
            features.push(feature);
        }, this);

        vectorSource = new ol.source.Vector({features: features});

        return new ol.layer.Vector({source: vectorSource, style: styles});
    };

    eventlayerbuilder.EventLayerBuilder.prototype.buildPointVectorLayer = function () {
        if (this.attributeName === undefined) {
            return this.buildDefaultPointVectorLayer();
        } else {
            return this.buildAttributePointVectorLayer();
        }
    };

    return eventlayerbuilder;

});