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

    timeline.Timeline = function (calendarName) {
        this.calendarName = calendarName;
        this.metadata = undefined;
        this.listeners = [];
        this.container = $('<div>').attr({'class': 'perse-timeline'});
        this.resolution = 'Week';
        this.svg = undefined;
        this.margin = {left: 3, right: 3, top: 3, bottom: 3};
        this.size = {
            width: 1000 + this.margin.right + this.margin.left,
            height: 50 + this.margin.top + this.margin.bottom
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
            xAxisBuilder,
            yAxisBuilder,
            barsG;

        this.xScale = d3.scale.linear()
            .domain([extent.x.min, extent.x.max])
            .range([0, this.size.width]);


        xAxisBuilder = d3.svg.axis()
            .scale(this.xScale)
            .ticks(5)
            .innerTickSize(2)
            .outerTickSize(2)
            .tickPadding(2)
            .orient('bottom');

        this.yScale = d3.scale.linear()
            .domain([0, extent.y.max])
            .range([this.size.height, 0]);

        yAxisBuilder = d3.svg.axis()
            .scale(this.yScale)
            .innerTickSize(2)
            .outerTickSize(2)
            .tickPadding(2)
            .orient('left');

        this.svg = d3.select(this.container.get(0))
            .append('svg')
            .attr('width', this.size.width + this.margin.left + this.margin.right)
            .attr('height', this.size.height + this.margin.top + this.margin.bottom)
            .append('g')
            .attr('transform', 'translate(' + this.margin.left + ',' + this.margin.top + ')');

        barsG = this.svg.selectAll('g.timeline-bars')
            .data(data)
            .enter().append('g')
            .attr('class', 'timeline-bars selected');

        barsG.append('rect')
            .attr('x', function (d) {return that.xScale(d.dateRange.begin); })
            .attr('y', function (d) {return that.yScale(d.composite.length); })
            .attr('width', function (d) {return that.xScale(d.dateRange.end) - that.xScale(d.dateRange.begin); })
            .attr('height', function (d) {return that.size.height - that.yScale(d.composite.length); });

        var brushstart = function () {
            //that.svg.classed("selecting", true);
        };

        var brushmove = function () {
            var extent = that.brush.extent();

            barsG.classed("selected", function (d) { return (extent[0] <= d.dateRange.begin) && (d.dateRange.end <= extent[1]); });
            //that.toInput.value = extent[0];
            //that.fromInput.value = extent[1];

        };

        var brushend = function () {
            var extent = that.brush.extent();
            //that.svg.classed("selecting", !d3.event.target.empty());
            if (extent[0] === extent[1]) {
                //that.toInput.value = that.toInput.min;
                //that.fromInput.value = that.fromInput.max;
                barsG.classed("selected", true);
            }
            that.notifyListeners('onTimelineSelectionChanged', {context: that});
        };

        this.brush = d3.svg.brush()
            .x(this.xScale)
            .on("brushstart", brushstart)
            .on("brush", brushmove)
            .on("brushend", brushend);

        var brushg = this.svg.append("g")
            .attr("class", "brush")
            .call(this.brush);

        brushg.selectAll("rect")
            .attr("height", this.size.height);

    };

    timeline.Timeline.prototype.update = function (data) {
        var that = this,
            extent = {
                x: this.getXExtent(),
                y: this.getYExtent(data)
            },
            yScale,
            barsG;

        yScale = d3.scale.linear()
            .domain([0, extent.y.max])
            .range([this.size.height, 0]);

        barsG = this.svg.selectAll('g.timeline-bars')
            .data(data);

        barsG.select('rect')
            .transition()
            .attr('x', function (d) {
                return that.xScale(d.dateRange.begin);
            })
            .attr('y', function (d) {
                return yScale(d.composite.length);
            })
            .attr('width', function (d) {
                return that.xScale(d.dateRange.end) - that.xScale(d.dateRange.begin);
            })
            .attr('height', function (d) {
                return that.size.height - yScale(d.composite.length);
            });

        // make the values for other stuff 0
        barsG.exit()
            .select('rect')
            .attr('x', function (d) {
                return that.xScale(d.dateRange.begin);
            })
            .attr('y', function (d) {
                return yScale(0);
            })
            .attr('width', function (d) {
                return that.xScale(d.dateRange.end) - that.xScale(d.dateRange.begin);
            })
            .attr('height', function (d) {
                return that.size.height - yScale(0);
            });

    };

    timeline.Timeline.prototype.getXExtent = function () {
        return {
            min: this.metadata.getMetadata().temporal.beginJulianDate,
            max: this.metadata.getMetadata().temporal.endJulianDate
        };
    };

    timeline.Timeline.prototype.hellYeah = function (prev, cur) {
        function f(prev, cur) {
            if (cur.isLeaf) {
                return prev + cur.composite.length;
            } else {
                return cur.composite.reduce(f, 0);
            }
        }
        return f(prev, cur);
    };

    timeline.Timeline.prototype.getCount = function (data) {
        return data.map(function (d) {
            return this.hellYeah(0, d);
        }, this);
    };

    timeline.Timeline.prototype.getYExtent = function (data) {
        var e = d3.extent(data, function (d) {return d.composite.length; })
        return {min: e[0], max: e[1]};
    };

    timeline.Timeline.prototype.getYExtent_dep = function (data) {
        var initObj = {
                isLeaf: false,
                min: data[0].composite[0].composite.length,
                max: data[0].composite[0].composite.length
            };

        function hellYeah(prev, cur) {
            if (cur.isLeaf) {
                return {
                    min: Math.min(cur.composite.length, prev.min),
                    max: Math.max(cur.composite.length, prev.max)
                };
            } else {
                return cur.composite.reduce(hellYeah, prev);
            }
        }
        var out = data.reduce(hellYeah, initObj);
        return out;
    };

    timeline.Timeline.prototype.getData = function (data) {
        return new pertimelinedatasetbuilder.PerTimelineDataSetBuilder(this.metadata)
            .setCalendar(this.calendarName)
            .setData(data)
            .setResolution(this.resolution)
            .build();
    };

    timeline.Timeline.prototype.getBrushExtent = function () {
        var extent = this.brush.extent(),
            m;
        if (extent[0] === extent[1]) {
            m = this.metadata.getMetadata().temporal;
            return {begin: m.beginJulianDate, end: m.endJulianDate};
        }
        return {begin: extent[0], end: extent[1]};
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

    timeline.Timeline.prototype.onSelectionChanged = function (data) {
        this.update(this.getData(data));
    };

    timeline.Timeline.prototype.onDataSetChanged = function (data, metadata) {
        this.metadata = metadata;
        this.build(this.getData(data));
    };

    return timeline;

});