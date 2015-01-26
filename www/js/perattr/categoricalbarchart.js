/**
 *  This file is part of PerSE. PerSE is a visual analytics app for
 *  exploring spatiotemporal periodicity.
 *  Copyright (C) 2014  Brian Swedberg
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

define([
    'jquery',
    'd3',
    // no namespace
    'bootstrap'
], function ($, d3) {

    var categoricalbarchart = {};

    categoricalbarchart.CategoricalBarChart = function (attribute) {
        this.attribute = attribute;
        this.container = $('<div>').attr({'class': 'perse-perattr-categoricalbarchart'});
        this.listeners = [];
        this.svg = undefined;
        this.margin = {top: 1, right: 3, bottom: 1, left: 3};
        this.size = {
            width: 200 - this.margin.left - this.margin.right,
            height: 170 - this.margin.top - this.margin.bottom
        };
        this.metadata = undefined;
        this.deselected = [];
        this.dataExtent = undefined;
    };

    categoricalbarchart.CategoricalBarChart.prototype.render = function (parent) {
        $(parent).append(this.container);
        return this;
    };

    categoricalbarchart.CategoricalBarChart.prototype.createAllNoneSpan = function () {
        var noneButton = $('<button>')
                .attr({type: 'button', title: 'Deselect All Categories'})
                .text('None'),
            allButton = $('<button>')
                .attr({type: 'button', title: 'Select All Categories'})
                .text('All');

        noneButton.click($.proxy(function () {
            console.log('here');
            this.deselected = Object.keys(this.metadata.getMetadata().attribute.attributes[this.attribute].uniqueValues);
            this.notifyListeners('onCategoricalBarChartSelectionChanged', {context: this});
        }, this));

       allButton.click($.proxy(function () {
           console.log('here');
            this.deselected = [];
            this.notifyListeners('onCategoricalBarChartSelectionChanged', {context: this});
        }, this));

        return $('<span>').append(allButton, noneButton);
    };

    categoricalbarchart.CategoricalBarChart.prototype.build = function (data) {
        var chartContainer = $('<div>').attr({'class': 'categoricalbarchart-chart'}),
            axisContainer = $('<div>').attr({'class': 'categoricalbarchart-axis'});
        this.buildChart(chartContainer.get(0), data);
        this.buildAxis(axisContainer.get(0), data);
        this.container.append(chartContainer, axisContainer);
    };

    categoricalbarchart.CategoricalBarChart.prototype.buildAxis = function (container, data) {
        var dataExtent = d3.extent(data, function (d) {return d.count; }),
            axisSvg,
            xScale,
            xAxisBuilder;

        axisSvg = d3.select(container).append('svg')
            .attr('height', '30px')
            .attr('width', this.size.width + this.margin.left + this.margin.right + 'px')
            .append('g')
            .attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")");

        xScale = d3.scale.linear()
            .domain([0, dataExtent[1]])
            .range([0, this.size.width]);

        xAxisBuilder = d3.svg.axis()
            .scale(xScale)
            .ticks(5)
            .innerTickSize(5)
            .outerTickSize(5)
            .tickPadding(7)
            .orient("bottom");

        axisSvg.append("g")
            .attr("transform", "translate(0, 0)")
            .call(xAxisBuilder)
            .append('text')
            .attr('class', 'categoricalbarchart-axis-label')
            .attr("transform", 'translate(' + (this.size.width / 2) + ',' + 23 + ')')
            .attr("dy", ".71em")
            .style("text-anchor", "middle")
            .text("Frequency");
    };

    categoricalbarchart.CategoricalBarChart.prototype.buildChart = function (container, data) {
        var that = this,
            xScale,
            yScale,
            offset = 1,
            height = 20,
            bars;
        this.dataExtent = d3.extent(data, function (d) {return d.count; });
        this.size.height = this.margin.top + this.margin.bottom + height * data.length;

        data = data.sort(function (a, b) {return a.count - b.count; });

        xScale = d3.scale.linear()
            .domain([0, this.dataExtent[1]])
            .range([0, this.size.width]);

        yScale = d3.scale.linear()
            .domain([0, data.length])
            .range([this.size.height, 0]);


        this.svg = d3.select(container).append('svg')
            .attr('height', this.size.height + 'px')
            .attr('width', this.size.width + this.margin.left + this.margin.right + 'px')
            .append('g')
            .attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")");

        this.svg.append('rect')
            .attr('x', 0)
            .attr('y', 0)
            .attr('width', this.size.width + 'px')
            .attr('height', this.size.height + 'px')
            .attr('opacity', '0');

        bars = this.svg.selectAll('.categoricalbarchart-category')
            .data(data, function (d) {return d.name; })
            .enter().append('g')
            .attr('class', 'categoricalbarchart-category')
            .attr("transform", function (d, i) { return "translate(0," + yScale(i + 1) + ")"; })
            .on('mouseup', function () {
                var name = d3.select(this).datum().name;
                if (that.deselected.indexOf(name) < 0) {
                    that.deselected.push(d3.select(this).datum().name);
                } else {
                    that.deselected.splice(that.deselected.indexOf(name), 1);
                }
                that.notifyListeners('onCategoricalBarChartSelectionChanged', {context: that});
            });

        bars.append('rect')
            .attr('class', 'categoricalbarchart-bar')
            .attr('x', 0)
            .attr('y', offset)
            .attr('rx', 1)
            .attr('ry', 1)
            .attr('width', function (d) {return xScale(d.count); })
            .attr('height', height - (offset * 2))
            .attr('fill', function (d) {return d.color; })
            .attr('fill-opacity', '1')
            .attr('stroke-opacity', '0');

        bars.append('text')
            .text(function (d) {
                var shortName = d.name.substring(35, 0);
                shortName = (d.name.length > 35) ? shortName + '...' : shortName;
                return shortName;
            })
            .attr('x', '1em')
            .attr('y', (height - (offset * 2)) / 2 + 1)
            .attr('text-anchor', 'start')
            .attr('dominant-baseline', 'central');

        bars.append('rect')
            .attr('class', 'categoricalbarchart-category-background')
            .attr('x', 0)
            .attr('y', offset)
            .attr('width', this.size.width + 'px')
            .attr('height', height - (offset * 2) + 'px');

    };

    categoricalbarchart.CategoricalBarChart.prototype.update = function (data) {
        var xScale = d3.scale.linear()
            .domain([0, this.dataExtent[1]])
            .range([0, this.size.width]);
        this.svg.selectAll('.categoricalbarchart-category')
            .data(data, function (d) {return d.name; })
            .select('.categoricalbarchart-bar')
            .attr('width', function (d) {return xScale(d.count); });
    };

    categoricalbarchart.CategoricalBarChart.prototype.getFilter = function () {
        var that = this;
        return function (d) {
            return that.deselected.indexOf(d) < 0;
        };
    };

    categoricalbarchart.CategoricalBarChart.prototype.onSelectionChanged = function (data) {
        var that = this,
            nestData = d3.nest().key(function (d) {return d[that.attribute]; }).map(data),
            newData = Object.keys(nestData).map(function (key) {
                return {name: key, count: nestData[key].length};
            }),
            md = this.metadata.getMetadata().attribute.attributes[this.attribute];
        Object.keys(md.uniqueValues).forEach(function (key) {
            if (!nestData[key]) {
                newData.push({name: key, count: 0});
            }
        });
        this.update(newData);
    };

    categoricalbarchart.CategoricalBarChart.prototype.onDataSetChanged = function (data, metadata) {
        this.metadata = metadata;
        var md = this.metadata.getMetadata().attribute.attributes[this.attribute];
        this.build(Object.keys(md.uniqueValues).map(function (key) {
            return {
                name: md.uniqueValues[key].name,
                color: md.uniqueValues[key].color,
                count: md.uniqueValues[key].count,
                selected: true
            };
        }));
    };

    categoricalbarchart.CategoricalBarChart.prototype.registerListener = function (listenerObj) {
        this.listeners.push(listenerObj);
        return this;
    };

    categoricalbarchart.CategoricalBarChart.prototype.notifyListeners = function (callbackStr, event) {
        this.listeners.forEach(function (listenerObj) {
            listenerObj[callbackStr].call(listenerObj.context, event);
        });
    };

    return categoricalbarchart;
});