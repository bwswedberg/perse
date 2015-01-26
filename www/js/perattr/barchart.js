/**
 *  This file is part of PerSE. PerSE is a visual analytics app for
 *  event periodicity detection and analysis.
 *  Copyright (C) 2015  Brian Swedberg
 */

define([
    'jquery',
    'd3'
], function ($, d3) {
    var barchart = {};

    barchart.BarChart = function (attribute) {
        this.attribute = attribute;
        this.container = $('<div>').attr({'class': 'perse-perattr-barchart'});
        this.listeners = [];
        this.svg = undefined;
        this.margin = {top: 3, right: 5, bottom: 10, left: 20};
        this.viewBox = {width: 100, height: 75};
        this.size = {
            width: this.viewBox.width - this.margin.left - this.margin.right,
            height: this.viewBox.height - this.margin.top - this.margin.bottom
        };
        this.binInput = undefined;
        this.metadata = undefined;
    };

    barchart.BarChart.prototype.render = function (parent) {
        $(parent).append(this.container);
        return this;
    };

    barchart.BarChart.prototype.build = function (data) {
        var that = this,
            dataExtent = d3.extent(data.map(function (d) {return d.value; })),
            min = dataExtent[0],
            max = dataExtent[1],
            binnedData = d3.layout.histogram().value(function (d) {return d.value; })(data),
            xScale,
            xAxisBuilder,
            yScale,
            yAxisBuilder,
            binDiv,
            color = this.metadata.getMetadata().attribute.attributes[this.attribute].color;

        xScale = d3.scale.linear()
            .domain([min, max])
            .range([0, this.size.width]);

        xAxisBuilder = d3.svg.axis()
            .scale(xScale)
            .ticks(5)
            .innerTickSize(2)
            .outerTickSize(2)
            .tickPadding(2)
            .orient('bottom');

        yScale = d3.scale.linear()
            .domain([0, d3.max(binnedData, function (d) {return d.y; })])
            .range([this.size.height, 0]);

        var formater = d3.format('.1f');
        yAxisBuilder = d3.svg.axis()
            .scale(yScale)
            .innerTickSize(2)
            .outerTickSize(2)
            .tickPadding(2)
            .tickFormat(function (v) {
                return (v >= 1000) ? formater(v/1000).toString() + 'k' : v;

            })
            .orient('left');

        this.svg = d3.select(this.container.get(0)).append('svg')
            .attr('viewBox', [0, 0, this.viewBox.width, this.viewBox.height].join(' '))
            .append('g')
            .attr('transform', 'translate(' + this.margin.left + ',' + this.margin.top + ')');

        this.svg.selectAll('.barchart-bin')
            .data(binnedData)
            .enter().append('g')
            .attr('class', 'barchart-bin')
            .attr('transform', function (d) { return 'translate(' + xScale(d.x) + ',' + yScale(d.y) + ')'; })
            .append('rect')
            .attr('x', 0)
            .attr('y', 0)
            .attr('width', xScale(binnedData[0].dx) - min)
            .attr('height', function (d) {return that.size.height - yScale(d.y); })
            .attr('fill', color);

        this.svg.append('g')
            .attr('class', 'barchart-axis')
            .attr('transform', 'translate(0,' + (this.size.height + 1) + ')')
            .call(xAxisBuilder);
        //.selectAll('text')
        //.attr('transform', function(d, i) {var v = i % 2; return 'translate(0,' + (-5 * v) + ')'; });

        this.svg.append('g')
            .attr('class', 'barchart-axis')
            .attr('transform', 'translate(-1,0)')
            .call(yAxisBuilder)
            .append('text')
            .attr('class', 'barchart-axis-label')
            .attr('transform', 'translate(-' + (this.margin.left * 0.95) + ',' + (this.size.height / 2) + ') rotate(-90)')
            .attr('dy', '.71em')
            .style('text-anchor', 'middle')
            .text('Frequency');

        this.binInput = this.createBinInput(5);
        this.container.append(this.binInput);
    };

    barchart.BarChart.prototype.createBinInput = function (value) {
        var binInput = $('<input>').attr({
                'class': 'barchart-bin-input',
                'type': 'number',
                'step': '1',
                'value': value.toString(),
                'min': '1',
                'max': '500',
                'title': 'Amount of Bins'
            });



        binInput.change($.proxy(function () {
            if (binInput.val() !== '' && binInput.val() !== '0') {
                this.notifyListeners('onBarChartBinChanged', {
                    context: this
                });
            }
        }, this));
        return binInput;
    };

    barchart.BarChart.prototype.update = function (data) {
        var that = this,
            dataExtent = d3.extent(data.map(function (d) {return d.value; })),
            min = dataExtent[0],
            max = dataExtent[1],
            binnedData,
            xScale,
            xAxisBuilder,
            yScale,
            yAxisBuilder,
            bars,
            color = this.metadata.getMetadata().attribute.attributes[this.attribute].color;

        xScale = d3.scale.linear()
            .domain([min, max])
            .range([0, this.size.width]);


        xAxisBuilder = d3.svg.axis()
            .scale(xScale)
            .ticks(5)
            .innerTickSize(2)
            .outerTickSize(2)
            .tickPadding(2)
            .orient('bottom');

        binnedData = d3.layout.histogram()
            .bins(+this.binInput.val())
            .value(function (d) {return d.value; })
        (data);

        yScale = d3.scale.linear()
            .domain([0, d3.max(binnedData, function (d) {return d.y; })])
            .range([this.size.height, 0]);

        var formater = d3.format('.1f');
        yAxisBuilder = d3.svg.axis()
            .scale(yScale)
            .innerTickSize(2)
            .outerTickSize(2)
            .tickPadding(2)
            .tickFormat(function (v) {
                console.log(v);
                return (v >= 1000) ? formater(v/1000).toString() + 'k' : v;

            })
            .orient('left');

        this.svg.selectAll('.barchart-bin')
            .remove();
        if (binnedData.length > 0) {
            bars = this.svg.selectAll('.barchart-bin')
                .data(binnedData);

            bars.enter().append('g')
                .attr('class', 'barchart-bin')
                .attr('transform', function (d) {
                    return 'translate(' + xScale(d.x) + ',' + yScale(d.y) + ')';
                })
                .append('rect')
                .attr('x', 0)
                .attr('y', 0)
                .attr('width', xScale(binnedData[0].dx + min) - xScale(min))
                .attr('height', function (d) {
                    return that.size.height - yScale(d.y);
                })
                .attr('fill', color);
        }

        this.svg.selectAll('.barchart-axis').remove();
        this.svg.append('g')
            .attr('class', 'barchart-axis')
            .attr('transform', 'translate(0,' + (this.size.height + 1) + ')')
            .call(xAxisBuilder);

        this.svg.append('g')
            .attr('class', 'barchart-axis')
            .attr('transform', 'translate(-1,0)')
            .call(yAxisBuilder)
            .append('text')
            .attr('class', 'barchart-axis-label')
            .attr('transform', 'translate(-' + (this.margin.left * 0.95) + ',' + (this.size.height / 2) + ') rotate(-90)')
            .attr('dy', '.71em')
            .style('text-anchor', 'middle')
            .text('Frequency');
    };

    barchart.BarChart.prototype.simplifyDataStructure = function (data) {
        return data.map(function (d) {
            return {value: d[this.attribute]};
        }, this);
    };

    barchart.BarChart.prototype.onSelectionChanged = function (data) {
        this.update(this.simplifyDataStructure(data));
    };

    barchart.BarChart.prototype.onDataSetChanged = function (data, metadata) {
        this.metadata = metadata;
        this.build(this.simplifyDataStructure(data));
    };

    barchart.BarChart.prototype.registerListener = function (listenerObj) {
        this.listeners.push(listenerObj);
        return this;
    };

    barchart.BarChart.prototype.notifyListeners = function (callbackStr, event) {
        this.listeners.forEach(function (listenerObj) {
            listenerObj[callbackStr].call(listenerObj.context, event);
        });
    };


    return barchart;
});