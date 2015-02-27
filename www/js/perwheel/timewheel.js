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

    timewheel.TimeWheel = function (calendarName) {
        this.calendarName = calendarName;
        this.contentAttribute = undefined;
        this.container = $('<div>').attr({'class': 'perse-perwheel-timewheel'});
        this.svg = undefined;
        this.margin = {left: 4.5, right: 4.5, top: 8, bottom: 1};
        this.viewBox = {width: 100 - this.margin.left - this.margin.right, height: 100 - this.margin.top - this.margin.bottom};
        this.radius = {
            max: this.viewBox.width / 2.0,
            min: (this.viewBox.width / 2.0) * 0.2
        };
        this.rings = [];
        this.focusRing = null;
        this.listeners = [];
        //this.originalData = [];
    };

    timewheel.TimeWheel.prototype.render = function (parent) {
        $(parent).append(this.container);
        return this;
    };

    timewheel.TimeWheel.prototype.build = function (data) {
        var that = this;
        this.svg = d3.select(this.container.get(0)).append('svg')
            .attr('class', 'timewheel')
            .attr('viewBox', [
                0,
                0,
                this.viewBox.width + this.margin.left + this.margin.right,
                this.viewBox.height + this.margin.top + this.margin.bottom
            ].join(' '))
            .on('mouseleave', function () {
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
            var outerRadius = this.radius.max - (ringRadius * index),
                innerRadius = outerRadius - ringRadius,
                twr = new ring.Ring(this.svg)
                    .setLabel(item.label)
                    .setRingId(item.ringId)
                    .setCenter(this.viewBox.width / 2.0, this.viewBox.height / 2.0)
                    .setRadius(innerRadius, outerRadius)
                    .registerListener(this.createRingListener());

            twr.build(item.data);
            this.rings.push(twr);
        }, this);

        // this is for the mouse hover labels
        this.svg.append('text')
            .attr('id', 'timewheel-label');
    };

    timewheel.TimeWheel.prototype.update = function (data) {
        data.forEach(function (item, index) {
            this.rings[index].update(item.data);
        }, this);
    };

    timewheel.TimeWheel.prototype.changeRingSize = function (focusRing) {
        var scaleFactor = focusRing ? 2 : 0,
            ringRadius = (this.radius.max - this.radius.min) / (this.rings.length + scaleFactor),
            endRadius = this.radius.max,
            startRadius;
        if (focusRing !== this.focusRing) {
            if (this.focusRing) {
                this.focusRing.setIsFocusRing(false);
            }
            this.focusRing = focusRing;
            if (this.focusRing) {
                this.rings.forEach(function (r) {r.setIsFocusRing(false); });
                this.focusRing.setIsFocusRing(true);
            } else {
                this.rings.forEach(function (r) {r.setIsFocusRing(true); });
            }
            this.rings.forEach(function (someRing) {
                if (someRing === focusRing) {
                    startRadius = endRadius - ((scaleFactor + 1) * ringRadius);
                    someRing.setRadius(startRadius, endRadius)
                        .update();

                } else {
                    startRadius = endRadius - ringRadius;
                    someRing.setRadius(startRadius, endRadius)
                        .update();

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
            onMouseClick: function () {
                this.notifyListeners('onTimeWheelSelectionChanged', {
                    context: this
                });
            }
        };
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

    timewheel.TimeWheel.prototype.setCalendar = function (calendarName) {
        this.calendarName = calendarName;
        //this.onDataSetChanged(this.originalData, this.metadata);
        return this;
    };

    timewheel.TimeWheel.prototype.setAllEnabled = function () {
        this.rings.forEach(function (r) {
            r.setAllEnabled();
        });
    };

    timewheel.TimeWheel.prototype.getData = function () {
        return this.rings.reduce(function (p, c) {
            p[c.ringId] = c.getData();
            return p;
        }, {});
    };

    timewheel.TimeWheel.prototype.processData = function (data) {
        var cal = $.calendars.instance(this.calendarName),
            twBuilder = new timewheeldatasetbuilder.TimeWheelDataSetBuilder();
        return twBuilder
            .setCalendarName(this.calendarName)
            .setContentAttribute(this.contentAttribute)
            .setMetadata(this.metadata)
            .addRing(twBuilder.getJQueryCalendarDayInMonthData(cal))
            .addRing(twBuilder.getJQueryCalendarMonthInYearData(cal))
            .addRing(twBuilder.getJQueryCalendarDayInWeekData(cal))
            .setRawData(data)
            .build();
    };

    timewheel.TimeWheel.prototype.setContentAttribute = function (contentAttr) {
        this.contentAttribute = contentAttr;
    };

    timewheel.TimeWheel.prototype.onSelectionChanged = function (data) {
        this.update(this.processData(data));
    };

    timewheel.TimeWheel.prototype.onDataSetChanged = function (data, metadata) {
        this.metadata = metadata;
        this.build(this.processData(data));
    };

    timewheel.TimeWheel.prototype.registerListener = function (listenerObj) {
        this.listeners.push(listenerObj);
        return this;
    };

    timewheel.TimeWheel.prototype.notifyListeners = function (callbackStr, event) {
        this.listeners.forEach(function (listenerObj) {
            listenerObj[callbackStr].call(listenerObj.context, event);
        });
    };

    return timewheel;

});