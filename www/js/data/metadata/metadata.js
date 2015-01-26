/**
 *  This file is part of PerSE. PerSE is a visual analytics app for
 *  event periodicity detection and analysis.
 *  Copyright (C) 2015  Brian Swedberg
 */
define([], function () {

    var metadata = {};

    metadata.Metadata = function (metadata) {
        this.metadata = metadata;
        console.log('Metadata:', this.metadata);
    };

    metadata.Metadata.prototype.getMetadata = function () {
        return this.metadata;
    };

    metadata.Metadata.prototype.getPropertyList = function () {
        var propertyList = [this.metadata.temporal, this.metadata.geospatial];
        this.metadata.attribute.attributeKeys.forEach(function (p) {
            propertyList.push(this.metadata.attribute.attributes[p]);
        }, this);
        return propertyList;
    };

    return metadata;

});