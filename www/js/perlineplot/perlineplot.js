/**
 *  This file is part of PerSE. PerSE is a visual analytics app for
 *  event periodicity detection and analysis.
 *  Copyright (C) 2015  Brian Swedberg
 */

define([
    'jquery',
    'd3',
    'data/filter',
    'perlineplot/perlineplotdatasetbuilder',
    // no namespace
    '$.calendars',
    'bootstrap'
], function ($, d3, filter, perlineplotdatasetbuilder) {

    var perlineplot = {};

    perlineplot.PerLinePlot = function () {
        this.container = $('<div>').attr({'class': 'panel-body perse-panel-body'});
        this.listeners = [];
        this.svg = undefined;
        this.contentAttribute = undefined;
        this.calendarName = undefined;
        this.cycleName = undefined;
        this.margin = {'top': 10, 'bottom': 15, 'left': 15, 'right': 0};
        this.viewBox = {'width': 150, 'height': 125};
        this.size = {
            'width': this.viewBox.width - this.margin.left - this.margin.right,
            'height': this.viewBox.height - this.margin.top - this.margin.top
        };
        this.filter = new filter.Filter({
            uniqueId: this.getUniqueId(),
            property: 'coord',
            filterOn: function () {
                return true;
            }
        });
        this.plotExtent = undefined;
        this.xScale = undefined;
        this.yScale = undefined;
    };

    perlineplot.PerLinePlot.prototype.instanceCount = 0;

    perlineplot.PerLinePlot.prototype.getUniqueId = function () {
        var id = 'perse-perlineplot-' + this.instanceCount;
        this.instanceCount += 1;
        return id;
    };

    perlineplot.PerLinePlot.prototype.render = function (parent, shouldRenderToolbar) {
        var title = $('<p>')
                .attr({'class': 'perse-header-title'})
                .text('Line Plot'),
            panelHeader = $('<div>')
                .attr({'class': 'panel-heading perse-panel-heading'})
                .append($('<div>').attr({'class': 'panel-title'}).append(title)),
            panel = $('<div>')
                .attr({'class': 'panel panel-default perse-perlineplot'});

        if (shouldRenderToolbar) {
            panel.append(panelHeader, this.container);
            $(parent).append(panel);
        } else {
            parent.addClass('perse-perlineplot');
            this.container = parent;
        }

        return this;
    };

    perlineplot.PerLinePlot.prototype.build = function (data) {
        var that = this;
        this.svg = d3.select(this.container.get(0))
            .append('svg')
            .attr('preserveAspectRatio', 'xMinYMin meet')
            .attr('viewBox', '0 0 ' + this.viewBox.width + ' ' + this.viewBox.height)
            .append('g')
            .attr('transform', 'translate(' + this.margin.left + ',' + this.margin.top + ')');

        this.svg.append('g')
            .attr('id', 'perlineplot-voronoi')
            .on('mouseout', function () {
                that.notifyListeners('onHoverEvent', {
                    'context': that,
                    'firingPlot': that,
                    indicationFilter: undefined,
                    'data': undefined
                });
            });

        this.svg.append('text')
            .attr('class', 'perlineplot-label');

        this.update(data);
    };

    perlineplot.PerLinePlot.prototype.update = function (data) {
        var that = this,
            xAxisBuilder,
            yAxisBuilder,
            xLabels = data[0].partitions.map(function (d) {
                return d.label;
            }),
            line,
            pathsG,
            tickStep = Math.round(xLabels.length / 6),
            verticies,
            voronoiPolys,
            voronoiG;

        this.xScale = d3.scale.ordinal()
            .domain(d3.range(this.plotExtent.x.max + 1))
            .rangePoints([0, this.size.width]);

        this.yScale = d3.scale.linear()
            .domain([this.plotExtent.y.min, this.plotExtent.y.max])
            .range([this.size.height, 0]);

        line = d3.svg.line()
            .interpolate('monotone')
            .x(function (d) {
                return that.xScale(d.value);
            })
            .y(function (d) {
                return that.yScale(d.events.length);
            });

        pathsG = this.svg.selectAll('path.perlineplot-path')
            .data(data);

        pathsG.enter().append('path');

        pathsG.transition()
            .duration(500)
            .attr('d', function (d) {
                return line(d.partitions);
            })
            .attr('class', function (d) {
                return 'perlineplot-path ' + that.getLineClass(d.value).replace('.', '');
            });

        pathsG.exit().remove();

        // voronoi
        verticies = this.getVerticies(data);

        voronoiPolys = d3.geom.voronoi()
            .clipExtent([
                [0, 0],
                [this.size.width, this.size.height]
            ])
            .x(function (d) {
                return that.xScale(d.xValue);
            })
            .y(function (d) {
                return that.yScale(d.yValue);
            })
        (verticies);

        voronoiG = this.svg.select('#perlineplot-voronoi')
            .selectAll('path')
            .data(verticies);

        voronoiG.enter().append('path')
            .on('mouseover', function () {
                var d = d3.select(this).datum();
                that.notifyListeners('onHoverEvent', {
                    'context': that,
                    'firingPlot': that,
                    'indicationFilter': that.createIndicationFilter(d),
                    'data': d
                });
            });

        voronoiG
            .attr('class', function (d) {
                return that.getLineClass(d.lineValue).replace('.', '') + ' ' + that.getXClass(d.xValue).replace('.', '');
            })
            .attr('d', function (d, i) {
                if (!voronoiPolys[i]) {
                    return '';
                }
                return 'M' + voronoiPolys[i].join('L') + 'Z';
            });

        voronoiG.exit().remove();

        // axis jazz
        this.svg.selectAll('.perlineplot-axis').remove();

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

        this.svg.append('g')
            .attr('class', 'perlineplot-axis')
            .attr('transform', 'translate(0,' + (this.size.height - 1) + ')')
            .call(xAxisBuilder);

        yAxisBuilder = d3.svg.axis()
            .scale(that.yScale)
            .innerTickSize(2)
            .outerTickSize(2)
            .orient('left');

        this.svg.append('g')
            .attr('class', 'perlineplot-axis')
            .attr('transform', 'translate(-1, 0)')
            .call(yAxisBuilder);

    };

    perlineplot.PerLinePlot.prototype.getVerticies = function (data) {
        var verticies = [];
        data.forEach(function (d) {
            d.partitions.forEach(function (p) {
                verticies.push({
                    julianDateExtent: p.julianDateExtent,
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

    perlineplot.PerLinePlot.prototype.updateLabel = function (d) {
        var label = d.xLabel + ' ' + d.lineLabel + ', Count: ' + d.yLabel,
            labelNode = this.svg.select('.perlineplot-label')
                .text(label),
            bbox = labelNode.node().getBBox();
        labelNode
            .attr('x', this.size.width - bbox.width)
            .attr('y', -3);
    };

    perlineplot.PerLinePlot.prototype.showAxes = function (shouldShowAxes) {
        this.svg.selectAll('.perlineplot-axis')
            .classed('active', shouldShowAxes);
    };

    perlineplot.PerLinePlot.prototype.getLineClass = function (lineValue) {
        return '.line-id-' + lineValue;
    };

    perlineplot.PerLinePlot.prototype.getXClass = function (xValue) {
        return '.x-id-' + xValue;
    };

    perlineplot.PerLinePlot.prototype.onHover = function (hoverObj) {
        var lineClass, xClass, d;
        if (hoverObj.data === undefined || hoverObj.data === null) {
            this.svg.selectAll('.perlineplot-path.active')
                .classed('active', false);
            this.svg.selectAll('circle')
                .remove();
            this.svg.selectAll('.perlineplot-label')
                .text('');
            this.showAxes(false);
        } else {
            lineClass = this.getLineClass(hoverObj.data.lineValue);
            xClass = this.getXClass(hoverObj.data.xValue);
            this.svg.selectAll('.perlineplot-path.active')
                .classed('active', false);
            this.svg.selectAll('.perlineplot-path' + lineClass)
                .classed('active', true);
            d = this.svg.select('#perlineplot-voronoi ' + lineClass + xClass)
                .datum();
            this.svg.selectAll('circle')
                .remove();
            this.svg.append('circle')
                .attr('transform', 'translate(' + this.xScale(d.xValue) + ',' + this.yScale(d.yValue) + ')')
                .attr('r', 1.5);
            this.updateLabel(d);
            this.showAxes(hoverObj.firingPlot === this);
        }
    };

    perlineplot.PerLinePlot.prototype.setCalendar = function (calendarName) {
        this.calendarName = calendarName;
        if (this.svg) {
            this.svg.select('#perlineplot-voronoi')
                .selectAll('*')
                .on('mouseover', null);
        }
        return this;
    };

    perlineplot.PerLinePlot.prototype.setCycleName = function (cycleName) {
        this.cycleName = cycleName;
        if (this.svg) {
            this.svg.select('#perlineplot-voronoi')
                .selectAll('*')
                .on('mouseover', null);
        }
        return this;
    };

    perlineplot.PerLinePlot.prototype.setExtent = function (plotExtent) {
        this.plotExtent = plotExtent;
        return this;
    };

    perlineplot.PerLinePlot.prototype.reduceExtents = function (extents) {
        return extents.reduce(function (p, c) {
            p.x.min = Math.min(c.x.min, p.x.min);
            p.x.max = Math.max(c.x.max, p.x.max);
            p.y.min = Math.min(c.y.min, p.y.min);
            p.y.max = Math.max(c.y.max, p.y.max);
            return p;
        });
    };

    perlineplot.PerLinePlot.prototype.getExtent = function (data) {
        var firstX = data[0].partitions[0].value,
            firstY = data[0].partitions[0].events.length,
            extent = {
                x: {min: firstX, max: firstX},
                y: {min: firstY, max: firstY}
            };
        data.forEach(function (d) {
            d.partitions.forEach(function (p) {
                extent.x.min = Math.min(extent.x.min, p.value);
                extent.x.max = Math.max(extent.x.max, p.value);
                extent.y.max = Math.max(extent.y.max, p.events.length);
                extent.y.min = Math.min(extent.y.min, p.events.length);
            });
        });
        return extent;
    };

    perlineplot.PerLinePlot.prototype.getFilter = function () {
        return this.filter;
    };

    perlineplot.PerLinePlot.prototype.createIndicationFilter = function (dataObj) {
        var lineValue = dataObj.lineValue,
            xValue = dataObj.xValue,
            data = this.svg.select('.perlineplot-path' + this.getLineClass(lineValue))
                .datum(),
            extent = data.partitions[xValue].julianDateExtent;
        return function (d) {
            return extent.min <= d.julianDate && d.julianDate < extent.max;
        };
    };

    perlineplot.PerLinePlot.prototype.destroy = function () {
        this.svg.select('#perlineplot-voronoi')
            .selectAll('*')
            .on('mouseover', null);
        this.container.remove();
        this.listeners = null;
    };

    perlineplot.PerLinePlot.prototype.processData = function (params) {
        return new perlineplotdatasetbuilder.PerLinePlotDataSetBuilder()
            .setMetadata(params.metadata)
            .setCalendarName(params.calendarName)
            .setCycleName(params.cycleName)
            .setData(params.data)
            .build();
    };

    perlineplot.PerLinePlot.prototype.onReset = function () {
        this.filter.filterOn = function () {
            return true;
        };
    };

    perlineplot.PerLinePlot.prototype.setContentAttribute = function (contentAttribute) {
        this.contentAttribute = contentAttribute;
        return this;
    };

    perlineplot.PerLinePlot.prototype.notifyListeners = function (callbackStr, event) {
        this.listeners.forEach(function (listenerObj) {
            listenerObj[callbackStr].call(listenerObj.context, event);
        }, this);
    };

    perlineplot.PerLinePlot.prototype.registerListener = function (callbackObj) {
        this.listeners.push(callbackObj);
        return this;
    };

    perlineplot.PerLinePlot.prototype.onSelectionChanged = function (dataObj) {
        var extent, data;
        if (dataObj.hasOwnProperty('data') && dataObj.hasOwnProperty('extent')) {
            data = dataObj.data;
            extent = dataObj.extent;
        } else {
            data = this.processData({
                metadata: this.metadata,
                calendarName: this.calendarName,
                cycleName: this.cycleName,
                data: dataObj
            });
            extent = this.getExtent(data);
        }
        this.setExtent(extent);
        this.update(data);
    };

    perlineplot.PerLinePlot.prototype.onDataSetChanged = function (dataObj, metadata) {
        var extent, data;
        this.metadata = metadata;
        if (dataObj.hasOwnProperty('data') && dataObj.hasOwnProperty('extent')) {
            data = dataObj.data;
            extent = dataObj.extent;
        } else {
            data = this.processData({
                metadata: this.metadata,
                calendarName: this.calendarName,
                cycleName: this.cycleName,
                data: dataObj
            });
            extent = this.getExtent(data);
        }
        this.setExtent(extent);
        this.build(data);
    };

    return perlineplot;

});
