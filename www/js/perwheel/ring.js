/**
 *  This file is part of PerSE. PerSE is a visual analytics app for
 *  event periodicity detection and analysis.
 *  Copyright (C) 2015  Brian Swedberg
 */

define([
    'd3'
], function (d3) {

    var timewheel = {};

    timewheel.Ring = function (svg, label, ringId, centerX, centerY) {
        this.svg = svg;
        this.label = label;
        this.ringId = ringId;
        this.position = {centerX: centerX, centerY: centerY};
        this.data = undefined;
        this.ring = undefined;
        this.listeners = [];
        this.countExtent = undefined;
    };

    timewheel.Ring.prototype.getCountExtent = function (ringData) {
        var countExtent = {min: ringData[0].count, max: ringData[0].count};
        ringData.forEach(function (d) {
            countExtent.min = Math.min(d.count, countExtent.min);
            countExtent.max = Math.max(d.count, countExtent.max);
        });
        countExtent.min = 0;
        return countExtent;
    };

    timewheel.Ring.prototype.updateRingFill = function (ringData) {
        this.countExtent = this.getCountExtent(ringData);
        var innerRadius = this.data[0].innerRadius,
            radiusScale = d3.scale.linear()
                .domain([this.countExtent.min, this.countExtent.max])
                .range([this.data[0].innerRadius, this.data[0].outerRadius]),
            pie = d3.layout.pie()
                .sort(null) // preserve init order
                .value(function () {return 1; }), // equal arcs
            arc = d3.svg.arc();

        this.dataFill = pie(ringData).map(function (v) {
            v.innerRadius = innerRadius;
            v.outerRadius = radiusScale(v.data.count);
            return v;
        });

        this.ring.selectAll('g.timewheel-arc-fill')
            .data(this.dataFill)
            .select('path')
            .transition()
            .delay(200)
            .duration(200)
            .attr('d', arc);
    };

    timewheel.Ring.prototype.build = function (ringData, innerRadius, outerRadius) {
        this.countExtent = this.getCountExtent(ringData);
        var pie = d3.layout.pie()
                .sort(null) // preserve init order
                .value(function () {return 1; }), // equal arcs
            arcGroup,
            that = this,
            radiusScale = d3.scale.linear()
                .domain([this.countExtent.min, this.countExtent.max])
                .range([innerRadius, outerRadius]);

        this.data = pie(ringData).map(function (v) {
            v.innerRadius = innerRadius;
            v.outerRadius = outerRadius;
            v.data.enabled = true;
            return v;
        });

        this.dataFill = pie(ringData).map(function (v) {
            v.innerRadius = innerRadius;
            v.outerRadius = radiusScale(v.data.count);
            return v;
        }, this);

        this.ring = this.svg.append('g')
            .attr('transform', 'translate(' + this.position.centerX + ',' + this.position.centerY + ')')
            .classed('timewheel-ring', true);

        var arcGroupFill = this.ring.selectAll('g.timewheel-arc-fill')
            .data(this.dataFill)
            .enter().append('g')
            .classed({'timewheel-arc': true, 'timewheel-arc-fill': true});
        arcGroupFill.append('path')
            .attr('stroke', 'none')
            .style('fill', '#C0C0C0');

        arcGroup = this.ring.selectAll('g.timewheel-arc-background')
            .data(this.data)
            .enter().append('g')
            .classed({'enabled': true, 'timewheel-arc': true, 'timewheel-arc-background': true})
            .on('mouseenter', function (d) {
                that.notifyListeners('onMouseOver', {
                    context: that,
                    ring: that,
                    data: d.data
                });
            })
            .on('click', function (d) {
                that.notifyListeners('onMouseClick', {
                    context: that,
                    ring: that,
                    data: d.data
                });
            });

        arcGroup.append('path')
            .attr('stroke', '#000')
            .attr('fill', '#FFF');

        arcGroup.append('text')
            .text(function (d) { return d.data.short; })
            .style('text-anchor', 'middle')
            .attr('font-size', 0);

        this.updateRing();
    };

    timewheel.Ring.prototype.getDistance = function (p1, p2) {
        return Math.sqrt(Math.pow(p1[0] - p2[0], 2) + Math.pow(p1[1] - p2[1], 2));
    };

    timewheel.Ring.prototype.updateRing = function (isBigOne) {
        var arc = d3.svg.arc(),
            g1 = this.ring.selectAll('g.timewheel-arc-background')
                .data(this.data),
            g2 = this.ring.selectAll('g.timewheel-arc-fill')
                .data(this.dataFill),
            textFactor = this.data[0].outerRadius - this.data[0].innerRadius,
            textFactor2 = isBigOne ? 0.015 : 0.03;

        g2.select('path')
            .transition()
            .duration(200)
            .attr('d', arc);

        g1.select('path')
            .transition()
            .duration(200)
            .attr('d', arc);

        g1.select('text')
            .transition()
            .duration(200)
            .attr('transform', function (d) {
                return 'translate(' + arc.centroid(d) + ')';
            })
            .attr('font-size', function (d) {
                return textFactor * textFactor2 + 'em';
            })
            .attr('dy', '.35em');
    };

    timewheel.Ring.prototype.getRadius = function () {
        return {
            inner: this.data[0].innerRadius,
            outer: this.data[0].outerRadius
        };
    };

    timewheel.Ring.prototype.getData = function () {
        return {
            label: this.label,
            data: this.data.map(function (d) {return d.data; })
        };
    };

    timewheel.Ring.prototype.updateSize = function (innerRadius, outerRadius, isBigOne) {
        var radiusScale = d3.scale.linear()
            .domain([this.countExtent.min, this.countExtent.max])
            .range([innerRadius, outerRadius]);

        // update the data first
        this.data.forEach(function (item, index) {
            this.data[index].innerRadius = innerRadius;
            this.data[index].outerRadius = outerRadius;
        }, this);

        this.dataFill.forEach(function (item, index) {
            this.dataFill[index].innerRadius = innerRadius;
            this.dataFill[index].outerRadius = radiusScale(item.data.count);
        }, this);

        // update the actual ring
        this.updateRing(isBigOne);
    };

    timewheel.Ring.prototype.setIsEnabledArc = function (filterFunction, isEnabled) {
        var item = this.ring.selectAll('g')
            .filter(filterFunction)
            .datum(function (d) {
                d.data.enabled = isEnabled;
                return d;
            })
            .classed('enabled', isEnabled);
    };

    timewheel.Ring.prototype.setAllEnabled = function () {
        this.setIsEnabledArc(function (d) {
            return !d.data.enabled;
        }, true);
    };

    timewheel.Ring.prototype.registerListener = function (listenerObj) {
        this.listeners.push(listenerObj);
    };

    timewheel.Ring.prototype.notifyListeners = function (callbackStr, event) {
        this.listeners.forEach(function (listenerObj) {
            listenerObj[callbackStr].call(listenerObj.context, event);
        });
    };

    return timewheel;

});
