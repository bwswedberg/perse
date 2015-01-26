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