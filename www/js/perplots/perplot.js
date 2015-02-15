/**
*  This file is part of PerSE. PerSE is a visual analytics app for
*  event periodicity detection and analysis.
*  Copyright (C) 2015  Brian Swedberg
*/

define([
    'jquery',
    'd3',
    'data/filter',
    // no namespace
    '$.calendars',
    'bootstrap'
], function ($, d3, filter) {

    var perplot = {};

    perplot.PerPlot = function (uniqueId) {
        this.id = uniqueId;
        this.container = $('<div>').attr({'class': 'perse-perplot', 'id': 'perse-perplot-' + uniqueId});
        this.listeners = [];
        this.svg = undefined;
        this.calendarName = 'Gregorian';
        this.cycleName = 'MonthOfYear';
        this.margin = {'top': 0, 'bottom': 10, 'left': 15, 'right': 0};
        this.viewBox = {'width': 150, 'height': 100};
        this.size = {
            'width': this.viewBox.width - this.margin.left - this.margin.right,
            'height': this.viewBox.height - this.margin.top - this.margin.top
        };
        this.filter = new filter.Filter({
            uniqueId: 'perse-perplot-' + uniqueId,
            property: 'coord',
            filterOn: function (d) {
                return true;
            }
        });
        this.plotExtent = undefined;
        this.xScale = undefined;
        this.yScale = undefined;
    };

    perplot.PerPlot.prototype.render = function (parent) {
        $(parent).append(this.container);
        return this;
    };

    perplot.PerPlot.prototype.build = function (data) {
        var that = this;
        this.svg = d3.select(this.container.get(0))
            .append('svg')
            .attr('viewBox', '0 0 ' + this.viewBox.width + ' ' + this.viewBox.height)
            .append('g')
            .attr('transform', 'translate(' + this.margin.left + ',' + this.margin.top + ')');

        this.svg.append('g')
            .attr('id', 'perplot-voronoi')
            .on('mouseout', function () {
                that.notifyListeners('onHoverEvent', {'context': that, 'firingPlot': this, 'data': undefined});
            });

        this.svg.append('text')
            .attr('class', 'perplot-label');

        this.update(data);
    };

    perplot.PerPlot.prototype.update = function (data) {
        var that = this,
            xAxisBuilder,
            yAxisBuilder,
            xLabels = data[0].partitions.map(function (d) {return d.label; }),
            line,
            pathsG,
            tickStep = Math.round(xLabels.length / 6);

        this.xScale = d3.scale.ordinal()
            .domain(d3.range(this.plotExtent.x.max + 1))
            .rangePoints([0, this.size.width]);

        this.yScale = d3.scale.linear()
            .domain([this.plotExtent.y.min, this.plotExtent.y.max])
            .range([this.size.height, 0]);

        line = d3.svg.line()
            .interpolate('monotone')
            .x(function (d) { return that.xScale(d.value); })
            .y(function (d) {return that.yScale(d.events.length); });

        pathsG = this.svg.selectAll('path.perplot-path')
            .data(data);

        pathsG.enter().append('path');

        pathsG.transition()
            .duration(500)
            .attr('d', function (d) {return line(d.partitions); })
            .attr('class', function (d) {
                return 'perplot-path line-id-' + d.value;
            });

        pathsG.exit().remove();

        // voronoi
        var verticies = this.getVerticies(data);

        var voronoiPolys = d3.geom.voronoi()
            .clipExtent([[0, 0], [this.size.width, this.size.height]])
            .x(function (d) {return that.xScale(d.xValue); })
            .y(function (d) {return that.yScale(d.yValue); })
        (verticies);

        var voronoiG = this.svg.select('#perplot-voronoi')
            .selectAll('path')
            .data(verticies);

        voronoiG.enter().append('path')
            .attr('class', function (d) {
                return 'line-id-' + d.lineValue + ' ' + 'x-id-' + d.xValue;
            })
            .on('mouseover', function () {
                var d = d3.select(this).datum();
                that.notifyListeners('onHoverEvent', {'context': that, 'firingPlot': that, 'data': d});
            });

        voronoiG.attr('d', function (d, i) {
            if (!voronoiPolys[i]) {
                return '';
            }
            return 'M' + voronoiPolys[i].join('L') + 'Z';
        });

        // axis jazz
        this.svg.selectAll('.perplot-axis').remove();

        xAxisBuilder = d3.svg.axis()
            .scale(that.xScale)
            .tickFormat(function (v) {
                if (!(v % tickStep)) {
                    return xLabels[v];
                }
            })
            .innerTickSize(2)
            .outerTickSize(2)
            .orient('bottom');

        this.svg.append("g")
            .attr('class', 'perplot-axis')
            .attr('transform', 'translate(0,' + (this.size.height - 1) + ')')
            .call(xAxisBuilder);

        yAxisBuilder = d3.svg.axis()
            .scale(that.yScale)
            .innerTickSize(2)
            .outerTickSize(2)
            .orient('left');

        this.svg.append("g")
            .attr('class', 'perplot-axis')
            .attr('transform', 'translate(-1, 0)')
            .call(yAxisBuilder);

    };

    perplot.PerPlot.prototype.getVerticies = function (data) {
        var verticies = [];
        data.forEach(function (d) {
            d.partitions.forEach(function (p) {
                verticies.push({
                    lineValue: d.value,
                    lineLabel: d.label,
                    xValue: p.value,
                    xLabel: p.label,
                    yValue: p.events.length,
                    yLabel: p.events.length.toString()
                });
            });

        });
        return verticies;
    };

    perplot.PerPlot.prototype.getId = function () {
        return this.id;
    };

    perplot.PerPlot.prototype.updateLabel = function (d) {
        var label = d.xLabel + ' ' + d.lineLabel + ', Freq ' + d.yLabel,
            labelNode = this.svg.select('.perplot-label')
                .text(label),
            bbox = labelNode.node().getBBox();
        labelNode
            .attr('x', this.size.width - bbox.width)
            .attr('y', -3);
    };

    perplot.PerPlot.prototype.showAxes = function (shouldShowAxes) {
        this.svg.selectAll('.perplot-axis')
            .classed('active', shouldShowAxes);
    };

    perplot.PerPlot.prototype.onHover = function (hoverObj) {
        if (hoverObj.data) {
            var lineClass = '.line-id-' + hoverObj.data.lineValue,
                xClass = '.x-id-' + hoverObj.data.xValue;
            this.svg.selectAll('.perplot-path.active')
                .classed('active', false);
            this.svg.selectAll('.perplot-path' + lineClass)
                .classed('active', true);
            var d = this.svg.select('#perplot-voronoi ' + lineClass + xClass)
                .datum();
            this.svg.selectAll('circle')
                .remove();
            this.svg.append('circle')
                .attr("transform", 'translate(' + this.xScale(d.xValue) + ',' + this.yScale(d.yValue) + ')')
                .attr("r", 1.5);
            this.updateLabel(d);
            this.showAxes(hoverObj.firingPlot === this);
        } else {
            this.svg.selectAll('.perplot-path.active')
                .classed('active', false);
            this.svg.selectAll('circle')
                .remove();
            this.svg.selectAll('.perplot-label')
                .text('');
            this.showAxes(false);
        }
    };

    perplot.PerPlot.prototype.setCalendarName = function (calendarName) {
        this.calendarName = calendarName;
        if (this.svg) {
            this.svg.select('#perplot-voronoi')
                .selectAll('*')
                .on('mouseover', null)
                .remove();
        }
        return this;
    };

    perplot.PerPlot.prototype.setCycleName = function (cycleName) {
        this.cycleName = cycleName;
        if (this.svg) {
            this.svg.select('#perplot-voronoi')
                .selectAll('*')
                .on('mouseover', null)
                .remove();
        }
        return this;
    };

    perplot.PerPlot.prototype.setPosition = function (positionObj) {
        this.container.animate(positionObj, 'slow');
        return this;
    };

    perplot.PerPlot.prototype.setPlotExtent = function (plotExtent) {
        this.plotExtent = plotExtent;
        return this;
    };

    perplot.PerPlot.prototype.getFilter = function () {
        return this.filter;
    };

    perplot.PerPlot.prototype.destroy = function () {
        this.svg.select('#perplot-voronoi')
            .selectAll('*')
            .on('mouseover', null);
        this.container.remove();
        this.listeners = null;
    };

    perplot.PerPlot.prototype.notifyListeners = function (callbackStr, event) {
        this.listeners.forEach(function (listenerObj) {
            listenerObj[callbackStr].call(listenerObj.context, event);
        }, this);
    };

    perplot.PerPlot.prototype.registerListener = function (callbackObj) {
        this.listeners.push(callbackObj);
        return this;
    };

    perplot.PerPlot.prototype.onSelectionChanged = function (data) {
        this.update(data);
    };

    perplot.PerPlot.prototype.onDataSetChanged = function (data, metadata) {
        this.metadata = metadata;
        this.build(data);
    };

    return perplot;

});