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
        this.padding = 1;
        this.width = 20;
    };

    calc.PerPlotsPositionCalculator.prototype.setData = function (data) {
        this.data = data;
        return this;
    };

    calc.PerPlotsPositionCalculator.prototype.calculate = function () {
        var height = 100 / 3,
            leftSide,
            rightSide;

        // TODO: Write a more sophisticated layout algorithm
        this.data.sort(function (a, b) {
            return a.extent.x.min -  b.extent.x.min;
        });

        leftSide = this.data.slice(0, 3);
        rightSide = this.data.slice(3, 6);

        leftSide.sort(function (a, b) {
            return b.extent.y.max - a.extent.y.max;
        });

        rightSide.sort(function (a, b) {
            return b.extent.y.max - a.extent.y.max;
        });

        leftSide = leftSide.map(function (obj, i) {
            obj.position = {
                top: (height * i) + '%',
                left: this.padding + '%',
                width: this.width + '%',
                height: height + '%'
            };
            return obj;
        }, this);

        rightSide = rightSide.map(function (obj, i) {
            obj.position = {
                top: (height * i) + '%',
                right: this.padding + '%',
                width: this.width + '%',
                height: height + '%'
            };
            return obj;
        }, this);

        return leftSide.concat(rightSide);
    };

    return calc;

});