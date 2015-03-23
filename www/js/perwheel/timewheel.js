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
        this.shouldAnimate = undefined;
        this.contentAttribute = undefined;
        this.container = $('<div>').attr({'class': 'timewheel'});
        this.svg = undefined;
        this.margin = {left: 5, right: 5, top: 9, bottom: 1};
        this.viewBox = {
            width: 100 - this.margin.left - this.margin.right,
            height: 100 - this.margin.top - this.margin.bottom
        };
        this.radius = {
            max: this.viewBox.width / 2.0,
            min: (this.viewBox.width / 2.0) * 0.2
        };
        this.rings = [];
        this.focusRingId = undefined;
        this.listeners = [];
    };

    timewheel.TimeWheel.prototype.render = function (parent) {
        $(parent).append(this.container);
        return this;
    };

    timewheel.TimeWheel.prototype.build = function (dataObj) {
        var that = this,
            ringRadius;
        this.svg = d3.select(this.container.get(0)).append('svg')
            .attr('viewBox', [
                0,
                0,
                this.viewBox.width + this.margin.left + this.margin.right,
                this.viewBox.height + this.margin.top + this.margin.bottom
            ].join(' '))
            .attr('preserveAspectRatio', 'xMidYMid meet')
            .append('g')
            .attr('transform', 'translate(' + this.margin.left + ',' + this.margin.top + ')')
            .on('mouseleave', function () {
                that.notifyListeners('onHoverEvent', {'context': that, 'data': undefined});
            });

        ringRadius = (this.radius.max - this.radius.min) / dataObj.data.length;
        dataObj.data.forEach(function (item, index) {
            var outerRadius = this.radius.max - (ringRadius * index),
                innerRadius = outerRadius - ringRadius,
                twr = new ring.Ring(this.svg)
                    .setShouldAnimate(this.shouldAnimate)
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
            .attr('id', 'timewheel-arc-label');
        this.svg.append('text')
            .attr('id', 'timewheel-stats-label');
    };

    timewheel.TimeWheel.prototype.update = function (dataObj) {
        dataObj.data.forEach(function (item, index) {
            this.rings[index]
                .setExtent(dataObj.extent[index])
                .update(item.data);
        }, this);
    };

    timewheel.TimeWheel.prototype.onHover = function (event) {
        var ringData, count;
        if (event === undefined || event.data === undefined || event.data.ringId === undefined) {
            this.changeRingSize();
            this.updateLabel();

            this.rings.forEach(function (r) {
                r.setArcActive();
            });

        } else {
            ringData = this.getArcValue(event.data.ringId, event.data.arcId);
            count = ringData.events[ringData.events.length - 1].count.end;
            this.changeRingSize(event.data.ringId);
            this.updateLabel({
                arc: event.data.label + ': ' + event.data.long,
                frequency: 'Count: ' + count
            });

            this.rings.forEach(function (r) {
                if (r.getRingId() === event.data.ringId) {
                    r.setArcActive(event.data.arcId);
                }
            });

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

            this.rings.forEach(function (r) {

                if (ring.getRingId() === focusRingId) {
                    startRadius = endRadius - ((scaleFactor + 1) * ringRadius);
                    r
                        .setRadius(startRadius, endRadius)
                        .update();

                } else {
                    startRadius = endRadius - ringRadius;
                    r
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
                var data = event.data;
                data.calendarName = this.calendarName;
                this.notifyListeners('onHoverEvent', {'context': this, 'data': data});
            },
            onMouseClick: function (event) {
                var data = event.data;
                data.calendarName = this.calendarName;
                this.notifyListeners('onTimeWheelSelectionChanged', {context: this});
                this.notifyListeners('onHoverEvent', {'context': this, 'data': data});
            }
        };
    };

    timewheel.TimeWheel.prototype.updateLabel = function (labels) {
        var arcText, arcBBox, statsText, statsBBox;

        if (labels === undefined ||
            labels === null ||
            !labels.hasOwnProperty('arc') ||
            !labels.hasOwnProperty('frequency')) {
            this.svg.select('#timewheel-arc-label')
                .text('');
            this.svg.select('#timewheel-stats-label')
                .text('');
        } else {
            arcText = this.svg.select('#timewheel-arc-label')
                .text(labels.arc);
            arcBBox = arcText.node().getBBox();
            statsText = this.svg.select('#timewheel-stats-label')
                .text(labels.frequency);
            statsBBox = statsText.node().getBBox();

            arcText
                .attr('x', (this.viewBox.width + this.margin.right) - arcBBox.width)
                .attr('y', -(this.margin.top));

            statsText
                .attr('x', (this.viewBox.width + this.margin.right) - statsBBox.width)
                .attr('y', -(this.margin.top) + arcBBox.height);
        }

    };

    timewheel.TimeWheel.prototype.getArcValue = function (ringId, arcValue) {
        var arcData;

        this.rings.forEach(function (r) {
            if (ringId === r.getRingId()) {
                arcData = r.getArcData(arcValue);
            }
        });

        return arcData;
    };

    timewheel.TimeWheel.prototype.setShouldAnimate = function (someBool) {
        this.shouldAnimate = someBool;
        if (this.rings.length > 0) {
            this.rings.setShouldAnimate(someBool);
        }
        return this;
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
