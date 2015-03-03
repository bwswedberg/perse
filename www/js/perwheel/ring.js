/**
 *  This file is part of PerSE. PerSE is a visual analytics app for
 *  event periodicity detection and analysis.
 *  Copyright (C) 2015  Brian Swedberg
 */

define([
    'd3'
], function (d3) {

    var timewheel = {};

    timewheel.Ring = function (svg) {
        this.svg = svg;
        this.label = undefined;
        this.ringId = undefined;
        this.center = {x: 0, y: 0};
        this.radius = {inner: 0, outer: 0};
        this.data = undefined;
        this.ring = undefined;
        this.listeners = [];
        this.extent = undefined;
        this.disabledList = [];
        this.isFocusRing = true;
    };

    timewheel.Ring.prototype.build = function (ringData) {
        this.ring = this.svg.append('g')
            .attr('transform', 'translate(' + this.center.x + ',' + this.center.y + ')')
            .attr('class', 'timewheel-ring');

        this.disabledList = ringData.map(function (d) {
            var obj = {};
            obj.value = d.value;
            obj.long = d.long;
            obj.short = d.short;
            obj.isEnabled = true;
            return obj;
        });

        this.update(ringData);
        this.setAllEnabled();
    };

    timewheel.Ring.prototype.update = function (data) {
        this.updateArcFills(data);
        this.updateArcShells(data);
    };

    timewheel.Ring.prototype.updateArcShells = function (data) {
        var that = this,
            arc = d3.svg.arc()
                .innerRadius(this.radius.inner)
                .outerRadius(this.radius.outer),
            pie,
            arcGroup;

        pie = d3.layout.pie()
            .sort(null) // preserve init order
            .value(function () {return 1; }); // equal arcs

        // update data
        if (data !== undefined) {
            arcGroup = this.ring.selectAll('g.timewheel-arc-background')
                .data(pie(data));

            // add any additional
            arcGroup.enter().append('g')
                .classed({'enabled': true, 'timewheel-arc': true, 'timewheel-arc-background': true})
                .on('mouseenter', function (d) {
                    data = {
                        long: d.data.long,
                        short: d.data.short,
                        ringId: that.ringId,
                        label: that.label,
                        value: d.data.value
                    };
                    that.notifyListeners('onMouseOver', {
                        context: that,
                        //ring: that,
                        data: data
                    });
                })
                .on('click', function () {
                    var value = d3.select(this).datum().data.value;
                    that.disabledList[value].isEnabled = !that.disabledList[value].isEnabled;
                    that.notifyListeners('onMouseClick', {
                        context: that
                    });
                })
                .call(function (selection) {
                    selection.append('path');
                    selection.append('text')
                        .style('text-anchor', 'middle');
                });

            // remove any extra
            arcGroup.exit().remove();
        }

        arcGroup = this.ring.selectAll('g.timewheel-arc-background');

        // update the style
        arcGroup.select('path')
            .attr('stroke', '#000')
            .attr('fill', '#FFF');

        arcGroup.select('text')
            .transition()
            .duration(500)
            .text(function (d) { return d.data.short; })
            .attr('transform', function (d) {
                return 'translate(' + arc.centroid(d) + ')';
            })
            .attr('font-size', function (d) {
                return (that.isFocusRing) ? '.35' + 'em' : '.15' + 'em';
            })
            .attr('dy', '.35em');


        arcGroup.select('path')
            .transition()
            .duration(500)
            .attr('d', arc);

    };

    timewheel.Ring.prototype.updateArcFills = function (data) {
        var arc,
            pie,
            radiusScale,
            arcGroupFill;

        pie = d3.layout.pie()
            .sort(null) // preserve init order
            .value(function () {return 1; }); // equal arcs

        // for reuse of data on mouse overs if ringData is undefined
        radiusScale = d3.scale.linear()
            .domain([this.extent.y.min, this.extent.y.max])
            .range([this.radius.inner, this.radius.outer]);

        arc = d3.svg.arc()
            .innerRadius(function (d) {
                return radiusScale(d.count.begin);
            })
            .outerRadius(function (d) {
                return radiusScale(d.count.end);
            });


        if (data !== undefined) {
            arcGroupFill = this.ring.selectAll('g.timewheel-arc-fill')
                .data(pie(data));

            // add any needed
            arcGroupFill.enter().append('g')
                .classed({'timewheel-arc': true, 'timewheel-arc-fill': true});

            // remove any extra
            arcGroupFill.exit().remove();
        }

        this.ring.selectAll('g.timewheel-arc-fill').each(function () {
            var g = d3.select(this),
                gData = g.datum(),
                paths = g.selectAll('path')
                    .data(gData.data.events);

            arc
                .startAngle(gData.startAngle)
                .endAngle(gData.endAngle);

            paths.enter().append('path')
                .attr('stroke', 'none');

            paths
                .transition()
                .duration(500)
                .style('fill', function (d) {
                    return d.color;
                })
                .attr('d', function (d) {
                    return arc(d);
                });

            paths.exit().remove();
        });

    };

    timewheel.Ring.prototype.getRingId = function () {
        return this.ringId;
    };

    timewheel.Ring.prototype.getFilterData = function () {
        return {
            label: this.label,
            data: this.disabledList
        };
    };

    timewheel.Ring.prototype.getExtent = function (data) {
        var extent = {
                x: {min: 0, max: data.length},
                y: {min: 0, max: data[0].events[data[0].events.length - 1].count.end}
            };
        data.forEach(function (d) {
            extent.y.min = Math.min(d.events[d.events.length - 1].count.end, extent.y.min);
            extent.y.max = Math.max(d.events[d.events.length - 1].count.end, extent.y.max);
        });
        return extent;
    };

    timewheel.Ring.prototype.setIsFocusRing = function (isFocusRing) {
        this.isFocusRing = isFocusRing;
        return this;
    };

    timewheel.Ring.prototype.setAllEnabled = function () {
        this.disabledList = this.disabledList.map(function (d) {
            d.isEnabled = true;
            return d;
        });
    };

    timewheel.Ring.prototype.setRadius = function (inner, outer) {
        this.radius.inner = inner;
        this.radius.outer = outer;
        return this;
    };

    timewheel.Ring.prototype.setExtent = function (extentObj) {
        this.extent = extentObj;
        return this;
    };

    timewheel.Ring.prototype.setCenter = function (x, y) {
        this.center.x = x;
        this.center.y = y;
        return this;
    };

    timewheel.Ring.prototype.setRingId = function (ringId) {
        this.ringId = ringId;
        return this;
    };

    timewheel.Ring.prototype.setLabel = function (label) {
        this.label = label;
        return this;
    };

    timewheel.Ring.prototype.registerListener = function (listenerObj) {
        this.listeners.push(listenerObj);
        return this;
    };

    timewheel.Ring.prototype.notifyListeners = function (callbackStr, event) {
        this.listeners.forEach(function (listenerObj) {
            listenerObj[callbackStr].call(listenerObj.context, event);
        });
    };

    return timewheel;

});