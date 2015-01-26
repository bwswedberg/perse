/**
 *  This file is part of PerSE. PerSE is a visual analytics app for
 *  exploring spatiotemporal periodicity.
 *  Copyright (C) 2014  Brian Swedberg
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

define([
    'jquery',
    'ol',
    'data/filter'
], function ($, ol, filter) {

    var permap = {};

    permap.PerMap = function () {
        this.container = $('<div>').attr({'class': 'perse-permap'});
        this.metadata = undefined;
        this.theMap = undefined;
        this.vector = undefined;
        this.listeners = [];
        this.filter = new filter.Filter({
            uniqueId: 'perse-permap',
            property: 'coord',
            filterOn: function (d) {return true; }
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

    permap.PerMap.prototype.createPointsLayer = function (data) {
        var features = [],
            projection = this.metadata.getMetadata().geospatial.projection,
            vectorSource,
            fill,
            stroke,
            styles;

        data.forEach(function (obj) {
            var feature = new ol.Feature({
                geometry: new ol.geom.Point(ol.proj.transform(obj.coord, projection,
                    'EPSG:3857')),
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

    permap.PerMap.prototype.onDataSetChanged = function (data, metadata) {
        this.metadata = metadata;
        this.pointsLayer = this.createPointsLayer(data);
        this.theMap.getView().fitExtent(this.pointsLayer.getSource().getExtent(), this.theMap.getSize());
        this.theMap.addLayer(this.pointsLayer);
    };

    permap.PerMap.prototype.onSelectionChanged = function (data) {
        var newPointsLayer = this.createPointsLayer(data);
        this.theMap.removeLayer(this.pointsLayer);
        this.theMap.addLayer(newPointsLayer);
        this.pointsLayer = newPointsLayer;
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

    return permap;

});