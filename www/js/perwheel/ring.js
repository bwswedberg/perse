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
        this.countExtent = undefined;
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

    timewheel.Ring.prototype.update = function (ringData) {
        this.updateArcFills(ringData);
        this.updateArcShells(ringData);
    };

    timewheel.Ring.prototype.updateArcShells = function (ringData) {
        var that = this,
            data,
            arc = d3.svg.arc(),
            pie,
            pieShellData,
            arcGroup;

        pie = d3.layout.pie()
            .sort(null) // preserve init order
            .value(function () {return 1; }); // equal arcs

        // for reuse of data on mouse overs if ringData is undefined
        data = (ringData === undefined) ? this.ring.selectAll('g.timewheel-arc-background').data() : pie(ringData);

        // update data
        pieShellData = data.map(function (d) {
            d.innerRadius = this.radius.inner;
            d.outerRadius = this.radius.outer;
            return d;
        }, this);
        arcGroup = this.ring.selectAll('g.timewheel-arc-background')
            .data(pieShellData);

        // add any additional
        arcGroup.enter().append('g')
            .classed({'enabled': true, 'timewheel-arc': true, 'timewheel-arc-background': true})
            .on('mouseenter', function (d) {
                that.notifyListeners('onMouseOver', {
                    context: that,
                    ring: that,
                    data: d.data
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

        // update the style
        arcGroup.select('path')
            .attr('stroke', '#000')
            .attr('fill', '#FFF');

        arcGroup.select('text')
            .transition()
            .duration(500)
            //.attr('font-size', 0)
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

    timewheel.Ring.prototype.updateArcFills = function (ringData) {
        var data,
            arc = d3.svg.arc(),
            pie,
            radiusScale,
            pieFillData,
            arcGroupFill;

        this.countExtent = (ringData === undefined) ? this.countExtent : this.getCountExtent(ringData);

        pie = d3.layout.pie()
            .sort(null) // preserve init order
            .value(function () {return 1; }); // equal arcs

        radiusScale = d3.scale.linear()
            .domain([this.countExtent.min, this.countExtent.max])
            .range([this.radius.inner, this.radius.outer]);

        // for reuse of data on mouse overs if ringData is undefined
        data = (ringData === undefined) ? this.ring.selectAll('g.timewheel-arc-fill').data() : pie(ringData);

        // update the data
        pieFillData = data.map(function (d) {
            d.innerRadius = this.radius.inner;
            d.outerRadius = radiusScale(d.data.events[d.data.events.length - 1].count.end);
            return d;
        }, this);

        arcGroupFill = this.ring.selectAll('g.timewheel-arc-fill')
            .data(pieFillData);

        // add any needed
        arcGroupFill.enter().append('g')
            .classed({'timewheel-arc': true, 'timewheel-arc-fill': true});
        /*
            .call(function (selection) {
                selection.append('path');
            });*/

        var arc2 = d3.svg.arc()
            .innerRadius(function (d) {
                return radiusScale(d.count.begin);
            })
            .outerRadius(function (d) {
                return radiusScale(d.count.end);
            });
        arcGroupFill.each(function () {
            var g = d3.select(this),
                gData = g.datum(),
                paths = g.selectAll('path')
                    .data(gData.data.events.map(function (d) {
                        d.startAngle = gData.startAngle;
                        d.endAngle = gData.endAngle;
                        return d;
                    }));

            paths.enter().append('path')
                .attr('stroke', 'none');

            paths
                .transition()
                .duration(500)
                .style('fill', function (d) {
                    return d.color;
                })
                .attr('d', function (d) {
                    return (d.count.total === 0) ? null : arc2(d);
                });

            paths.exit().remove();
        });

        // remove any extra
        arcGroupFill.exit().remove();

        /*
        // update the style
        arcGroupFill.select('path')
            .attr('stroke', 'none')
            .style('fill', function (d) {
                return d.data.events[0].color;
            });

        arcGroupFill.select('path')
            .transition()
            .duration(200)
            .attr('d', arc);*/

    };

    timewheel.Ring.prototype.getData = function () {
        //var data = this.ring.selectAll('g.timewheel-arc-fill').data();//.map(function (d) {return d; });
        return {
            label: this.label,
            data: this.disabledList
        };
    };

    timewheel.Ring.prototype.getCountExtent = function (ringData) {
        var firstValue = ringData[0].events[ringData[0].events.length - 1].count.end,
            countExtent = {min: firstValue, max: firstValue};
        ringData.forEach(function (d) {
            countExtent.min = Math.min(d.events[d.events.length - 1].count.end, countExtent.min);
            countExtent.max = Math.max(d.events[d.events.length - 1].count.end, countExtent.max);
        });
        countExtent.min = 0;
        return countExtent;
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
        //this.setIsEnabledArc(function () {return true; }, true);
    };

    timewheel.Ring.prototype.setRadius = function (inner, outer) {
        this.radius.inner = inner;
        this.radius.outer = outer;
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