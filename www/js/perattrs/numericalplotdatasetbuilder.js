/**
 *  This file is part of PerSE. PerSE is a visual analytics app for
 *  event periodicity detection and analysis.
 *  Copyright (C) 2015  Brian Swedberg
 */

define([
    'd3'
], function (d3) {

    var numericalplotdatasetbuilder = {};

    numericalplotdatasetbuilder.NumericalPlotDataSetBuilder = function () {
        this.metadata = undefined;
        this.data = undefined;
        this.attribute = undefined;
        this.contentAttribute = undefined;
    };

    numericalplotdatasetbuilder.NumericalPlotDataSetBuilder.prototype.setMetadata = function (mData) {
        this.metadata = mData;
        return this;
    };

    numericalplotdatasetbuilder.NumericalPlotDataSetBuilder.prototype.setData = function (rData) {
        this.data = rData;
        return this;
    };

    numericalplotdatasetbuilder.NumericalPlotDataSetBuilder.prototype.setAttribute = function (attr) {
        this.attribute = attr;
        return this;
    };

    numericalplotdatasetbuilder.NumericalPlotDataSetBuilder.prototype.setContentAttribute = function (cAttr) {
        this.contentAttribute = cAttr;
        return this;
    };

    numericalplotdatasetbuilder.NumericalPlotDataSetBuilder.prototype.getLookUpMap = function (someAttr) {
        var eventTypeLookUpMap = {},
            uniqueValues;
        if (someAttr === undefined) {

        } else {
            uniqueValues = this.metadata.attribute.attributes[someAttr].uniqueValues;
            eventTypeLookUpMap = Object.keys(uniqueValues)
                .map(function (key) {
                    return uniqueValues[key];
                })
                .sort(function (a, b) {
                    return uniqueValues[b.name].count - uniqueValues[a.name].count;
                })
                .reduce(function (p, c, i) {
                    p[c.name] = i;
                    return p;
                }, {});
        }
        return eventTypeLookUpMap;
    };

    numericalplotdatasetbuilder.NumericalPlotDataSetBuilder.prototype.getContentAttributeList = function () {
        var eventTypeList,
            uniqueValues;

        if (this.contentAttribute === undefined) {
            eventTypeList = [{
                color: '#bdbdbd',
                count: {begin: 0, end: 0, total: 0}
            }];
        } else {
            uniqueValues = this.metadata.attribute.attributes[this.contentAttribute].uniqueValues;
            eventTypeList = Object.keys(uniqueValues)
                .map(function (key) {
                    return {
                        color: uniqueValues[key].color,
                        count: {begin: 0, end: 0, total: 0},
                        name: key
                    };
                })
                .sort(function (a, b) {
                    return uniqueValues[b.name].count - uniqueValues[a.name].count;
                });
        }

        return eventTypeList;
    };

    numericalplotdatasetbuilder.NumericalPlotDataSetBuilder.prototype.getBinnedData = function (data) {
        var that = this,
            histogramBinner = d3.layout.histogram()
                .value(function (d) {return d[that.attribute]; });
        return histogramBinner(data);
    };

    numericalplotdatasetbuilder.NumericalPlotDataSetBuilder.prototype.processBin = function (eventArrayObj) {
        var contentAttrLookUpMap = this.getLookUpMap(this.contentAttribute),
            events = this.getContentAttributeList();

        eventArrayObj.forEach(function (event) {
            var contentAttrIndex = (this.contentAttribute === undefined) ? 0 : contentAttrLookUpMap[event[this.contentAttribute]];
            events[contentAttrIndex].count.total += 1;
        }, this);

        return {
            events: events,
            dx: eventArrayObj.dx,
            x: eventArrayObj.x,
            y: eventArrayObj.y
        };
    };

    numericalplotdatasetbuilder.NumericalPlotDataSetBuilder.prototype.nestRawData = function (data) {
        return this.getBinnedData(data).map(this.processBin, this);
    };

    numericalplotdatasetbuilder.NumericalPlotDataSetBuilder.prototype.tallyRelativeCounts = function (nestData) {
        return nestData.map(function (agg) {
            var begin = 0;
            agg.events.forEach(function (contentAttr) {
                contentAttr.count.begin = begin;
                contentAttr.count.end = contentAttr.count.begin + contentAttr.count.total;
                begin = contentAttr.count.end;
            });
            return agg;
        });
    };

    numericalplotdatasetbuilder.NumericalPlotDataSetBuilder.prototype.build = function () {
        var nestData = this.nestRawData(this.data);
        return this.tallyRelativeCounts(nestData);
    };

    return numericalplotdatasetbuilder;

});