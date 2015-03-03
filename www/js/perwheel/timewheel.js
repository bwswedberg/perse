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
        this.container = $('<div>').attr({'class': 'timewheel'});
        this.svg = undefined;
        this.margin = {left: 4.5, right: 4.5, top: 8, bottom: 1};
        this.viewBox = {width: 100 - this.margin.left - this.margin.right, height: 100 - this.margin.top - this.margin.bottom};
        this.radius = {
            max: this.viewBox.width / 2.0,
            min: (this.viewBox.width / 2.0) * 0.2
        };
        this.rings = [];
        this.focusRingId = undefined;
        this.listeners = [];
        //this.originalData = [];
    };

    timewheel.TimeWheel.prototype.render = function (parent) {
        $(parent).append(this.container);
        return this;
    };

    timewheel.TimeWheel.prototype.build = function (dataObj) {
        var that = this;
        this.svg = d3.select(this.container.get(0)).append('svg')
            .attr('preserveAspectRatio', 'xMinYMin meet')
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
                    //that.onHover();
                    that.notifyListeners('onHoverEvent', {'context': that, 'data': undefined});
                    //that.changeRingSize(null);
                    //that.updateLabel(null, null);
                }
            })
            .append('g')
            .attr('transform', 'translate(' + this.margin.left + ',' + this.margin.top + ')');

        var ringRadius = (this.radius.max - this.radius.min) / dataObj.data.length;
        dataObj.data.forEach(function (item, index) {
            var outerRadius = this.radius.max - (ringRadius * index),
                innerRadius = outerRadius - ringRadius,
                twr = new ring.Ring(this.svg)
                    .setLabel(item.label)
                    .setRingId(item.ringId)
                    .setCenter(this.viewBox.width / 2.0, this.viewBox.height / 2.0)
                    .setExtent(dataObj.extent[index])
                    .setRadius(innerRadius, outerRadius)
                    .registerListener(this.createRingListener());

            twr.build(item.data);
            this.rings.push(twr);
        }, this);

        // this is for the mouse hover labels
        this.svg.append('text')
            .attr('id', 'timewheel-label');
    };

    timewheel.TimeWheel.prototype.update = function (dataObj) {
        dataObj.data.forEach(function (item, index) {
            this.rings[index]
                .setExtent(dataObj.extent[index])
                .update(item.data);
        }, this);
    };

    timewheel.TimeWheel.prototype.onHover = function (event) {
        if (event === undefined || event.data === undefined || event.data.ringId === undefined) {
            this.changeRingSize(null);
            this.updateLabel(null, null);
        } else {
            this.changeRingSize(event.data.ringId);
            this.updateLabel(event.data.label, event.data.long);
        }
    };

    timewheel.TimeWheel.prototype.changeRingSize = function (focusRingId) {
        var scaleFactor = (focusRingId === undefined || focusRingId === null) ? 0 : 2,
            ringRadius = (this.radius.max - this.radius.min) / (this.rings.length + scaleFactor),
            endRadius = this.radius.max,
            startRadius;

        if (focusRingId !== this.focusRingId) {

            if (focusRingId === undefined || focusRingId === null) {
                this.rings.forEach(function (r) {r.setIsFocusRing(true); });
            } else {
                this.rings.forEach(function (r) {r.setIsFocusRing(r.getRingId() === focusRingId); });
            }

            this.rings.forEach(function (ring) {

                if (ring.getRingId() === focusRingId) {
                    startRadius = endRadius - ((scaleFactor + 1) * ringRadius);
                    ring
                        .setRadius(startRadius, endRadius)
                        .update();

                } else {
                    startRadius = endRadius - ringRadius;
                    ring
                        .setRadius(startRadius, endRadius)
                        .update();

                }
                endRadius = startRadius;
            }, this);
            this.focusRingId = focusRingId;
        }

    };

    timewheel.TimeWheel.prototype.createRingListener = function () {
        return {
            context: this,
            onMouseOver: function (event) {
                //this.onHover(event);
                var data = event.data;
                data.calendarName = this.calendarName;
                this.notifyListeners('onHoverEvent', {'context': this, 'data': data});
                //this.changeRingSize(event.ring);
                //this.updateLabel(event.ring.label, event.data.long);
            },
            onMouseClick: function () {
                this.notifyListeners('onTimeWheelSelectionChanged', {context: this});
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
        return this;
    };

    timewheel.TimeWheel.prototype.setAllEnabled = function () {
        this.rings.forEach(function (r) {
            r.setAllEnabled();
        });
    };

    timewheel.TimeWheel.prototype.getExtent = function (dataObj) {
        return dataObj.map(function (d) {
            return ring.Ring.prototype.getExtent(d.data);
        });
    };

    timewheel.TimeWheel.prototype.getFilterData = function () {
        return this.rings.reduce(function (p, c) {
            p[c.ringId] = c.getFilterData();
            return p;
        }, {});
    };

    timewheel.TimeWheel.prototype.processData = function (params) {
        var cal = $.calendars.instance(params.calendarName),
            twBuilder = new timewheeldatasetbuilder.TimeWheelDataSetBuilder();
        return twBuilder
            .setCalendarName(params.calendarName)
            .setContentAttribute(params.contentAttribute)
            .setMetadata(params.metadata)
            .addRing(twBuilder.getJQueryCalendarDayInMonthData(cal))
            .addRing(twBuilder.getJQueryCalendarMonthInYearData(cal))
            .addRing(twBuilder.getJQueryCalendarDayInWeekData(cal))
            .setRawData(params.data)
            .build();
    };

    timewheel.TimeWheel.prototype.setContentAttribute = function (contentAttr) {
        this.contentAttribute = contentAttr;
    };

    timewheel.TimeWheel.prototype.onSelectionChanged = function (dataObj) {
        var data;
        if (dataObj.hasOwnProperty('data') && dataObj.hasOwnProperty('extent')) {
            this.update(dataObj);
        } else {
            data = this.processData({
                calendarName: this.calendarName,
                contentAttribute: this.contentAttribute,
                metadata: this.metadata,
                data: dataObj
            });
            this.update({
                'data': data,
                'extent': this.getExtent(data)
            });
        }
    };

    timewheel.TimeWheel.prototype.onDataSetChanged = function (dataObj, metadata) {
        var data;
        this.metadata = metadata;
        if (dataObj.hasOwnProperty('data') && dataObj.hasOwnProperty('extent')) {
            this.build(dataObj);
        } else {
            data = this.processData({
                calendarName: this.calendarName,
                contentAttribute: this.contentAttribute,
                metadata: this.metadata,
                data: dataObj
            });
            this.build({
                'data': data,
                'extent': this.getExtent(data)
            });
        }
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