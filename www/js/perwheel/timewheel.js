/**
 *  This file is part of PerSE. PerSE is a visual analytics app for
 *  event periodicity detection and analysis.
 *  Copyright (C) 2015  Brian Swedberg
 */

define([
    'jquery',
    'd3',
    'perwheel/ring',
    'perwheel/timewheeldatasetbuilder',
    // no namespace
    '$.calendars'
], function ($, d3, ring, timewheeldatasetbuilder) {

    var timewheel = {};

    timewheel.TimeWheel = function (calendarName, container) {
        this.calendarName = calendarName;
        this.wrapper = container;
        this.svg = undefined;
        this.margin = {left: 4.5, right: 4.5, top: 8, bottom: 1};
        this.viewBox = {width: 100 - this.margin.left - this.margin.right, height: 100 - this.margin.top - this.margin.bottom};
        this.radius = {
            max: this.viewBox.width / 2.0,
            min: (this.viewBox.width / 2.0) * 0.2
        };
        this.rings = [];
        this.bigRing = null;
        this.listeners = [];
        this.originalData = [];
    };

    timewheel.TimeWheel.prototype.build = function (data) {
        var that = this;
        this.svg = d3.select(this.wrapper).append('svg')
            .attr('class', 'timewheel-svg')
            .attr('viewBox', [
                0,
                0,
                this.viewBox.width + this.margin.left + this.margin.right,
                this.viewBox.height + this.margin.top + this.margin.bottom
            ].join(' '))
            .on('mouseout', function () {
                // A more sophisticated function to reliably check if mouse outside of or inside
                // of the wheel/annulus
                var xy = d3.mouse(this),
                    centerX = that.viewBox.width / 2.0,
                    centerY = that.viewBox.height / 2.0,
                    distance = Math.sqrt(Math.pow(centerX - xy[0], 2) + Math.pow(centerY - xy[1], 2));
                if (distance > that.radius.max || distance < that.radius.min) {
                    that.changeRingSize(null);
                    that.updateLabel(null, null);
                }
            })
            .append('g')
            .attr('transform', 'translate(' + this.margin.left + ',' + this.margin.top + ')');

        var ringRadius = (this.radius.max - this.radius.min) / data.length;
        data.forEach(function (item, index) {
            var twr = new ring.Ring(this.svg, item.label, item.ringId, this.viewBox.width / 2.0, this.viewBox.height / 2.0),
                endRadius = this.radius.max - (ringRadius * index),
                startRadius = endRadius - ringRadius;
            twr.registerListener(this.createRingListener());
            twr.build(item.data, startRadius, endRadius);
            this.rings.push(twr);
        }, this);

        this.svg.append('text')
            .attr('id', 'timewheel-label');
    };

    timewheel.TimeWheel.prototype.updateRingFill = function (data) {
        data.forEach(function (item, index) {
            this.rings[index].updateRingFill(item.data);
        }, this);
    };

    timewheel.TimeWheel.prototype.changeRingSize = function (enlargeRing) {
        var scaleFactor = enlargeRing ? 2 : 0,
            ringRadius = (this.radius.max - this.radius.min) / (this.rings.length + scaleFactor),
            endRadius = this.radius.max,
            startRadius;
        if (enlargeRing !== this.bigRing) {
            this.bigRing = enlargeRing;
            this.rings.forEach(function (someRing, index) {
                if (someRing === enlargeRing) {
                    startRadius = endRadius - ((scaleFactor + 1) * ringRadius);
                    someRing.updateSize(startRadius, endRadius, true);
                } else {
                    startRadius = endRadius - ringRadius;
                    someRing.updateSize(startRadius, endRadius, false);
                }

                endRadius = startRadius;
            }, this);
        }
    };

    timewheel.TimeWheel.prototype.createRingListener = function () {
        return {
            context: this,
            onMouseOver: function (event) {
                this.changeRingSize(event.ring);
                this.updateLabel(event.ring.label, event.data.long);
            },
            onMouseClick: function (event) {
                event.ring.setIsEnabledArc(function (d) {
                    return d.data.long === event.data.long;
                }, !event.data.enabled);
                this.notifyListeners('onTimeWheelSelectionChanged', {
                    context: this,
                    calendarName: this.getCalendarName(),
                    data: this.getData()
                });
            }
        };
    };

    timewheel.TimeWheel.prototype.getCalendarName = function () {
        return this.calendarName;
    };

    timewheel.TimeWheel.prototype.updateLabel = function (ringLabel, arcLabel) {
        var label = (ringLabel && arcLabel) ? ringLabel + ': ' + arcLabel : '',
            text = this.svg.select('#timewheel-label')
                .text(label),
            bbox = text.node().getBBox();

        text
            .attr('x', this.viewBox.width - bbox.width)
            .attr('y', -3);
    };

    timewheel.TimeWheel.prototype.setCalendarName = function (calendarName) {
        this.calendarName = calendarName;
        this.onDataSetChanged(this.originalData, this.metadata);
    };

    timewheel.TimeWheel.prototype.onSelectionChanged = function (data) {
        var twBuilder = new timewheeldatasetbuilder.TimeWheelDataSetBuilder(),
            cal = $.calendars.instance(this.calendarName);

        twBuilder.setCalendarName(this.calendarName)
            .addRing(twBuilder.getJQueryCalendarDayInMonthData(cal))
            .addRing(twBuilder.getJQueryCalendarMonthInYearData(cal))
            .addRing(twBuilder.getJQueryCalendarDayInWeekData(cal))
            .setRawData(data);

        this.updateRingFill(twBuilder.build());
    };

    timewheel.TimeWheel.prototype.onDataSetChanged = function (data, metadata) {
        var twBuilder = new timewheeldatasetbuilder.TimeWheelDataSetBuilder(),
            cal = $.calendars.instance(this.calendarName);
        this.metadata = metadata;
        this.originalData = data;
        twBuilder.setCalendarName(this.calendarName)
            .addRing(twBuilder.getJQueryCalendarDayInMonthData(cal))
            .addRing(twBuilder.getJQueryCalendarMonthInYearData(cal))
            .addRing(twBuilder.getJQueryCalendarDayInWeekData(cal))
            .setRawData(data);

        if (this.svg) {
            d3.select(this.wrapper).select('.timewheel-svg').remove();
            this.svg = null;
        }
        this.rings = [];
        this.bigRing = null;
        this.build(twBuilder.build());
    };

    timewheel.TimeWheel.prototype.setAllEnabled = function () {
        this.rings.forEach(function (r) {
            r.setAllEnabled();
        });
    };

    timewheel.TimeWheel.prototype.getData = function () {
        var data = {};
        this.rings.forEach(function (ring) {
            data[ring.ringId] = ring.getData();
        });
        return data;
    };

    timewheel.TimeWheel.prototype.registerListener = function (listenerObj) {
        this.listeners.push(listenerObj);
    };

    timewheel.TimeWheel.prototype.notifyListeners = function (callbackStr, event) {
        this.listeners.forEach(function (listenerObj) {
            listenerObj[callbackStr].call(listenerObj.context, event);
        });
    };

    return timewheel;

});