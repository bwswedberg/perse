/**
 *  This file is part of PerSE. PerSE is a visual analytics app for
 *  event periodicity detection and analysis.
 *  Copyright (C) 2015  Brian Swedberg
 */

define([
    'jquery',
    'd3',
    'pertimeline/pertimelinedatasetbuilder',
    // no namespace
    '$.calendars',
    'bootstrap'
], function ($, d3, pertimelinedatasetbuilder) {

    var timeline = {};

    timeline.Timeline = function (calendarName, resolution) {
        this.calendarName = calendarName;
        this.resolution = resolution;
        this.contentAttribute = undefined;
        this.metadata = undefined;
        this.listeners = [];
        this.container = $('<div>').attr({'class': 'timeline'});
        this.svg = undefined;
        this.margin = {left: 30, right: 3, top: 10, bottom: 15};
        this.size = {
            width: 1125 - this.margin.right - this.margin.left,
            height: 80 - this.margin.top - this.margin.bottom
        };
        this.xScale = undefined;
        this.yScale = undefined;
        this.brush = undefined;

    };

    timeline.Timeline.prototype.render = function (parent) {
        $(parent).append(this.container);
        return this;
    };

    timeline.Timeline.prototype.build = function (data) {
        var that = this,
            extent = {
                x: this.getXExtent(),
                y: this.getYExtent(data)
            },
            brushMove,
            brushEnd,
            brushG;

        this.xScale = d3.scale.linear()
            .domain([extent.x.min, extent.x.max])
            .range([0, this.size.width]);


        this.yScale = d3.scale.linear()
            .domain([0, extent.y.max])
            .range([this.size.height, 0]);

        this.svg = d3.select(this.container.get(0))
            .append('svg')
            .attr('width', this.size.width + this.margin.left + this.margin.right)
            .attr('height', this.size.height + this.margin.top + this.margin.bottom)
            .append('g')
            .attr('transform', 'translate(' + this.margin.left + ',' + this.margin.top + ')');

        this.dateScale = d3.scale.linear()
            .domain([0, this.size.width])
            .range([extent.x.min, extent.x.max]);

        this.svg
            .on('mousemove', function () {
                var cal = $.calendars.instance(that.calendarName),
                    myDate = cal.fromJD(that.dateScale(d3.mouse(that.svg.node())[0]));
                that.updateLabel([myDate.day(), cal.local.monthNames[myDate.month() - 1], myDate.year()].join(' '));
            })
            .on('mouseout', function () {
                that.updateLabel('');
            });

        this.updateResolution(data);

        brushMove = function () {
            var bExtent = that.brush.extent(),
                cal = $.calendars.instance(that.calendarName),
                bDate = cal.fromJD(bExtent[0]),
                eDate = cal.fromJD(bExtent[1]);

            that.updateLabel([
                [bDate.day(), cal.local.monthNamesShort[bDate.month() - 1], bDate.year()].join('-'),
                [eDate.day(), cal.local.monthNamesShort[eDate.month() - 1], eDate.year()].join('-')
            ].join(' to '));
        };

        brushEnd = function () {
            that.notifyListeners('onTimelineSelectionChanged', {context: that});
        };

        this.brush = d3.svg.brush()
            .x(this.xScale)
            .on('brush', brushMove)
            .on('brushend', brushEnd);

        brushG = this.svg.insert('g', '.timeline-bars')
            .attr('class', 'brush')
            .call(this.brush);

        brushG.selectAll("rect")
            .attr("height", this.size.height);

        this.svg.append('text')
            .attr('id', 'timeline-label');

    };

    timeline.Timeline.prototype.updateResolution = function (data) {
        var that = this,
            extent = {
                x: this.getXExtent(),
                y: this.getYExtent(data)
            },
            barsG;

        this.yScale = d3.scale.linear()
            .domain([0, extent.y.max])
            .range([this.size.height, 0]);

        this.svg.selectAll('g.timeline-bars').remove();

        barsG = this.svg.selectAll('g.timeline-bars')
            .data(data);

        barsG.enter().append('g')
            .attr('class', 'timeline-bars selected');

        barsG.each(function () {
            var g = d3.select(this),
                rects = g.selectAll('rect')
                    .data(g.datum().composite);

            rects.enter().append('rect');

            rects
                .style('fill', function (d) {
                    return d.color;
                })
                .attr('x', function (d) {
                    return that.xScale(d.dateRange.begin);
                })
                .attr('width', function (d) {
                    return that.xScale(d.dateRange.end) - that.xScale(d.dateRange.begin);
                })
                .attr('y', function () {
                    return that.yScale(0);
                })
                .attr('height', function () {
                    return that.size.height - that.yScale(0);
                })
                .transition()
                .duration(500)
                .attr('y', function (d) {
                    return that.yScale(d.y);
                })
                .attr('height', function (d) {
                    return that.size.height - that.yScale(d.events.length);
                });

            rects.exit().remove();
        });

        barsG.exit().remove();

        this.updateYAxis();
        this.updateXAxis();

    };

    timeline.Timeline.prototype.updateData = function (data) {

        var that = this,
            extent = {
                x: this.getXExtent(),
                y: this.getYExtent(data)
            },
            barsG;

        this.yScale = d3.scale.linear()
            .domain([0, extent.y.max])
            .range([this.size.height, 0]);


        barsG = this.svg.selectAll('g.timeline-bars')
            .data(data);

        barsG.enter().append('g')
            .attr('class', 'timeline-bars selected');

        barsG.each(function () {
            var g = d3.select(this),
                rects = g.selectAll('rect')
                    .data(g.datum().composite);

            rects.enter().append('rect')
                .attr('y', that.size.height)
                .attr('height', 0);

            rects
                .style('fill', function (d) {
                    return d.color;
                })
                .attr('x', function (d) {
                    return that.xScale(d.dateRange.begin);
                })
                .attr('width', function (d) {
                    return that.xScale(d.dateRange.end) - that.xScale(d.dateRange.begin);
                })
                .transition()
                .duration(500)
                .attr('y', function (d) {
                    return that.yScale(d.y);
                })
                .attr('height', function (d) {
                    return that.size.height - that.yScale(d.events.length);
                });

            rects.exit().remove();
        });

        // make the values for other stuff 0
        barsG.exit().remove();

        this.updateYAxis();
        this.updateXAxis();
    };

    timeline.Timeline.prototype.updateYAxis = function () {
        var yAxisBuilder = d3.svg.axis()
            .scale(this.yScale)
            .ticks(5)
            .innerTickSize(3)
            .outerTickSize(0)
            .tickPadding(3)
            .orient('left');

        this.svg.select('#timeline-axis-y').remove();
        this.svg.append('g')
            .attr('class', 'timeline-axis')
            .attr('id', 'timeline-axis-y')
            .attr('transform', 'translate(-1,0)')
            .call(yAxisBuilder)
            .append('text')
            .attr('class', 'timeline-axis-label')
            .attr('transform', 'translate(-' +
                (this.margin.left * 0.95) + ',' + (this.size.height / 2) + ') rotate(-90)')
            .attr('dy', '.71em')
            .style('text-anchor', 'middle')
            .text('Frequency');
    };

    timeline.Timeline.prototype.updateXAxis = function () {
        var cal = $.calendars.instance(this.calendarName),
            extent = this.getXExtent(),
            myDate = cal.fromJD(extent.min),
            maxDate = cal.fromJD(extent.max),
            jdLabels = [],
            xAxisBuilder;

        myDate.add(myDate.daysInMonth() - myDate.day() + 1, 'd');

        while (myDate <= maxDate) {
            jdLabels.push(myDate.toJD());
            myDate.add(1, 'm');
        }

        xAxisBuilder = d3.svg.axis()
            .scale(this.xScale)
            .ticks(jdLabels.length)
            .tickValues(jdLabels)
            .tickFormat(function (v) {
                var d = cal.fromJD(v);
                if (d.month() === 1) {
                    return d.year().toString();
                }
                return '';
            })
            .innerTickSize(3)
            .outerTickSize(0)
            .tickPadding(3)
            .orient('bottom');

        this.svg.select('#timeline-axis-x').remove();
        this.svg.append('g')
            .attr('class', 'timeline-axis')
            .attr('id', 'timeline-axis-x')
            .attr('transform', 'translate(0,' + (this.size.height + 1) + ')')
            .call(xAxisBuilder);
    };

    timeline.Timeline.prototype.updateLabel = function (label) {
        var labelNode = this.svg.select('#timeline-label')
                .text(label),
            bbox = labelNode.node().getBBox();
        labelNode
            .attr('x', this.size.width - bbox.width)
            .attr('y', -3);

    };

    timeline.Timeline.prototype.getXExtent = function () {
        return {
            min: this.metadata.temporal.beginJulianDate,
            max: this.metadata.temporal.endJulianDate
        };
    };

    timeline.Timeline.prototype.getYExtent = function (data) {
        var e = d3.extent(data, function (d) {
            return d.composite.reduce(function (p, c) {return c.events.length + p; }, 0);
        });
        return {min: e[0], max: e[1]};
    };

    timeline.Timeline.prototype.getData = function (data) {
        return new pertimelinedatasetbuilder.PerTimelineDataSetBuilder(this.metadata)
            .setContentAttribute(this.contentAttribute)
            .setCalendar(this.calendarName)
            .setData(data)
            .setResolution(this.resolution)
            .build();
    };

    timeline.Timeline.prototype.setResolution = function (resolution) {
        this.resolution = resolution;
        return this;
    };

    timeline.Timeline.prototype.setCalendarName = function (calendarName) {
        this.calendarName = calendarName;
        return this;
    };

    timeline.Timeline.prototype.getBrushExtent = function () {
        var extent = this.brush.extent(),
            m;
        if (extent[0] === extent[1]) {
            m = this.metadata.temporal;
            return {begin: m.beginJulianDate, end: m.endJulianDate};
        }
        return {begin: extent[0], end: extent[1]};
    };

    timeline.Timeline.prototype.isBrushing = function () {
        var extent = this.brush.extent();
        return extent[0] !== extent[1];
    };

    timeline.Timeline.prototype.clearBrush = function () {
        this.svg.selectAll('.brush').call(this.brush.clear());
        this.notifyListeners('onTimelineSelectionChanged', {context: this});
    };

    timeline.Timeline.prototype.setContentAttribute = function (contentAttribute) {
        this.contentAttribute = contentAttribute;
    };

    timeline.Timeline.prototype.onResolutionChanged = function (data) {
        this.updateResolution(this.getData(data));
    };

    timeline.Timeline.prototype.onSelectionChanged = function (data) {
        this.updateData(this.getData(data));
    };

    timeline.Timeline.prototype.onDataSetChanged = function (data, metadata) {
        this.metadata = metadata;
        this.build(this.getData(data));
    };

    timeline.Timeline.prototype.notifyListeners = function (callbackStr, event) {
        this.listeners.forEach(function (listenerObj) {
            listenerObj[callbackStr].call(listenerObj.context, event);
        }, this);
    };

    timeline.Timeline.prototype.registerListener = function (callbackObj) {
        this.listeners.push(callbackObj);
        return this;
    };

    return timeline;

});