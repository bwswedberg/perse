/**
 *  This file is part of PerSE. PerSE is a visual analytics app for
 *  event periodicity detection and analysis.
 *  Copyright (C) 2015  Brian Swedberg
 */

define(['data/metadata/metadata'], function (metadata) {

    metadata.MetadataBuilder = function () {
        this.metadata = {
            totalEvents: 0,
            temporal: {},
            geospatial: {},
            attribute: {}
        };
    };

    metadata.MetadataBuilder.prototype.setTotalEvents = function (totalEvents) {
        this.metadata.totalEvents = totalEvents;
        return this;
    };

    metadata.MetadataBuilder.prototype.setTemporal = function (timeParameters) {
        this.metadata.temporal.beginJulianDate = timeParameters.beginJulianDate || 2457023.5; // January 1, 2015
        this.metadata.temporal.endJulianDate = timeParameters.endJulianDate || 2457023.5; // January 1, 2015
        this.metadata.temporal.label = 'Time';
        this.metadata.temporal.id = timeParameters.id || 'julianDate';
        this.metadata.temporal.type = 'temporal';
        this.metadata.temporal.color = '#C1B3DB';
        return this;
    };

    metadata.MetadataBuilder.prototype.setGeospatial = function (geospatialParameters) {
        this.metadata.geospatial.projection = geospatialParameters.projection || 'EPSG:4326';
        this.metadata.geospatial.label = 'Location';
        this.metadata.geospatial.id = geospatialParameters.id || 'coord';
        this.metadata.geospatial.type = 'geospatial';
        this.metadata.geospatial.color = '#9CCFA4';
        return this;
    };

    metadata.MetadataBuilder.prototype.setDescriptionAttribute = function (descriptionParameters) {
        var description = {};
        this.metadata.attribute = this.metadata.attribute || {};
        description.id = descriptionParameters.id || 'description';
        description.label = descriptionParameters.label || 'Description';
        this.metadata.attribute.description = description;
        return this;
    };

    metadata.MetadataBuilder.prototype.addAttribute = function (attributeParameters) {
        var attribute = {};
        this.metadata.attribute.attributes = this.metadata.attribute.attributes || {};
        attribute.isNumeric = attributeParameters.isNumeric || false;
        attribute.label = attributeParameters.label || 'attribute_' + this.metadata.attribute.length;
        attribute.id = 'attribute_' + Object.keys(this.metadata.attribute.attributes).length;
        attribute.type = 'attribute';
        attribute.uniqueValues = attributeParameters.uniqueValues || 'numeric';
        if (attribute.isNumeric) {
            attribute.colors = attributeParameters.colors || '#000';
            attribute.color = attributeParameters.color || '#000';
            attribute.extent = attributeParameters.extent || {min: 0, max: 0};
        }
        this.metadata.attribute.attributes[attribute.id] = attribute;
        return this;
    };

    metadata.MetadataBuilder.prototype.setAttribute = function (attributeParameters) {
        this.metadata.attribute.color = '#9E8973';
        this.metadata.attribute.attributeKeys = Object.keys(this.metadata.attribute.attributes);
        return this;
    };

    metadata.MetadataBuilder.prototype.build = function () {
        return new metadata.Metadata(this.metadata);
    };

    return metadata;

});