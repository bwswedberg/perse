/**
 *  This file is part of PerSE. PerSE is a visual analytics app for
 *  event periodicity detection and analysis.
 *  Copyright (C) 2015  Brian Swedberg
 */

define([

], function () {

    var calc = {};

    calc.PerPlotsPositionCalculator = function () {
        this.data = undefined;
        this.extent = undefined;
        this.width = 20;
    };

    calc.PerPlotsPositionCalculator.prototype.setData = function (data) {
        this.data = data;
        return this;
    };

    calc.PerPlotsPositionCalculator.prototype.setExtent = function (mapExtent) {
        this.extent = this.formatExtent(mapExtent);
        return this;
    };

    calc.PerPlotsPositionCalculator.prototype.formatExtent = function (olExtentObj) {
        // olExtentObj = [minx, miny, maxx, maxy]
        return {
            x: {max: olExtentObj[2], min: olExtentObj[0], dif: (olExtentObj[2] - olExtentObj[0])},
            y: {max: olExtentObj[3], min: olExtentObj[1], dif: (olExtentObj[3] - olExtentObj[1])}
        };
    };

    calc.PerPlotsPositionCalculator.prototype.getPositions = function () {
        var height = 100 / 3, // this is a percent
            leftSide,
            rightSide;

        leftSide = ['topleft', 'midleft', 'bottomleft'].map(function (name, i) {
            return {
                name: name,
                coord: [this.extent.x.min, (this.extent.y.max - (i * this.extent.y.dif / 2))],
                position: {
                    top: (height * i) + '%',
                    left: 0,
                    width: this.width + '%',
                    height: height + '%'
                }
            };
        }, this);

        rightSide = ['topright', 'midright', 'bottomright'].map(function (name, i) {
            return {
                name: name,
                coord: [this.extent.x.max, (this.extent.y.max - (i * this.extent.y.dif / 2))],
                position: {
                    top: (height * i) + '%',
                    right: 0,
                    width: this.width + '%',
                    height: height + '%'
                }
            };
        }, this);

        return leftSide.concat(rightSide);
    };

    calc.PerPlotsPositionCalculator.prototype.calculate = function () {
        var positionsTaken = [],
            getDistance;
        getDistance = function (p1, p2) {
            // this is euclidean but shouldn't be
            return Math.sqrt(Math.pow(p1[0] - p2[0], 2) + Math.pow(p1[1] - p2[1], 2));
        };

        return this.data.map(function (d) {
            var i = 0, rank, seedCoord;

            seedCoord = d.feature.getProperties().data.coord;

            rank = this.getPositions();

            rank.sort(function (a, b) {
                return getDistance(seedCoord, a.coord) - getDistance(seedCoord, b.coord);
            });

            while (positionsTaken.indexOf(rank[i].name) > -1) {
                i += 1;
            }
            positionsTaken.push(rank[i].name);

            d.position = rank[i].position;

            return d;
        }, this);
    };

    return calc;

});