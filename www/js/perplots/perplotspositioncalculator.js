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

    calc.PerPlotsPositionCalculator.prototype.getExtent = function () {
        // olExtentObj = [minx, miny, maxx, maxy]
        var first = this.data[0].feature.getProperties().data.coord,
            extent = {
            x: {max: first[0], min: first[0], dif: 0},
            y: {max: first[1], min: first[1], dif: 0}
        };
        this.data.forEach(function (d) {
            var coord = d.feature.getProperties().data.coord;
            extent.x.max = Math.max(extent.x.max, coord[0]);
            extent.x.min = Math.min(extent.x.min, coord[0]);
            extent.y.max = Math.max(extent.y.max, coord[1]);
            extent.y.min = Math.min(extent.y.min, coord[1]);
        });
        extent.x.dif = extent.x.max - extent.x.min;
        extent.y.dif = extent.y.max - extent.y.min;
        return extent;
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
            rightSide,
            extent = this.getExtent();

        leftSide = ['topleft', 'midleft', 'bottomleft'].map(function (name, i) {
            return {
                name: name,
                coord: [extent.x.min, (extent.y.max - (i * extent.y.dif / 2))],
                position: {
                    top: (height * i) + '%',
                    left: 0,
                    right: 'auto',
                    width: this.width + '%',
                    height: height + '%'
                }
            };
        }, this);

        rightSide = ['topright', 'midright', 'bottomright'].map(function (name, i) {
            return {
                name: name,
                coord: [extent.x.max, (extent.y.max - (i * extent.y.dif / 2))],
                position: {
                    top: (height * i) + '%',
                    left: 'auto',
                    right: 0,
                    width: this.width + '%',
                    height: height + '%'
                }
            };
        }, this);

        return leftSide.concat(rightSide);
    };

    calc.PerPlotsPositionCalculator.prototype.calculate = function () {
        var getDistance = function (p1, p2) {
            // this is euclidean but shouldn't be
            return Math.sqrt(Math.pow(p1[0] - p2[0], 2) + Math.pow(p1[1] - p2[1], 2));
        };

        // Each data point ranks them
        var rankings = this.data.map(function (d) {
            var rank, seedCoord;

            seedCoord = d.feature.getProperties().data.coord;

            rank = this.getPositions();

            rank.sort(function (a, b) {
                return getDistance(seedCoord, a.coord) - getDistance(seedCoord, b.coord);
            });

            return {data: d, rank: rank, seedCoord: seedCoord};
        }, this);

        var getClosestToAnyPosition = function (dataList) {
            return dataList.reduce(function (pData, cData) {
                if (getDistance(pData.seedCoord, pData.rank[0].coord) > getDistance(cData.seedCoord, cData.rank[0].coord)) {
                    return cData;
                }
                return pData;
            });
        };

        function positionData(notPositionedData, positionedData) {
            var closestData = getClosestToAnyPosition(notPositionedData),
                takenPosition = closestData.rank[0].name;
            closestData.data.position = closestData.rank[0].position;

            positionedData.push(closestData.data);

            notPositionedData.splice(notPositionedData.indexOf(closestData), 1);

            notPositionedData = notPositionedData.map(function (d) {
                var match = d.rank.filter(function (f) {return f.name === takenPosition; })[0];

                d.rank.splice(d.rank.indexOf(match), 1);
                return d;
            });

            return {notPositionedData: notPositionedData, positionedData: positionedData};
        }

        var notPositionedData = rankings,
            positionedData = [],
            out;

        while (notPositionedData.length > 0) {
            out = positionData(notPositionedData, positionedData);

            notPositionedData = out.notPositionedData;
            positionedData = out.positionedData;
        }
        return positionedData;

    };

    calc.PerPlotsPositionCalculator.prototype.calculate_dep = function () {
        var positionsTaken = [],
            getDistance;
        getDistance = function (p1, p2) {
            // this is euclidean but shouldn't be
            return Math.sqrt(Math.pow(p1[0] - p2[0], 2) + Math.pow(p1[1] - p2[1], 2));
        };

        var d = this.data.map(function (d) {
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
        console.log(d);
        return d;
    };

    return calc;

});