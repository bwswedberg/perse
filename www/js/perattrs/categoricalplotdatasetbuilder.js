/**
 *  This file is part of PerSE. PerSE is a visual analytics app for
 *  event periodicity detection and analysis.
 *  Copyright (C) 2015  Brian Swedberg
 */

define([], function () {

    var categoricalplotdatasetbuilder = {};

    categoricalplotdatasetbuilder.CategoricalPlotDataSetBuilder = function () {
        this.metadata = undefined;
        this.data = undefined;
        this.attribute = undefined;
        this.contentAttribute = undefined;
    };

    categoricalplotdatasetbuilder.CategoricalPlotDataSetBuilder.prototype.setMetadata = function (mData) {
        this.metadata = mData;
        return this;
    };

    categoricalplotdatasetbuilder.CategoricalPlotDataSetBuilder.prototype.setData = function (rData) {
        this.data = rData;
        return this;
    };

    categoricalplotdatasetbuilder.CategoricalPlotDataSetBuilder.prototype.setAttribute = function (attr) {
        this.attribute = attr;
        return this;
    };

    categoricalplotdatasetbuilder.CategoricalPlotDataSetBuilder.prototype.setContentAttribute = function (cAttr) {
        this.contentAttribute = cAttr;
        return this;
    };

    categoricalplotdatasetbuilder.CategoricalPlotDataSetBuilder.prototype.getLookUpMap = function (someAttr) {
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

    categoricalplotdatasetbuilder.CategoricalPlotDataSetBuilder.prototype.getContentAttributeList = function () {
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

    categoricalplotdatasetbuilder.CategoricalPlotDataSetBuilder.prototype.getAttributeList = function () {
        var uniqueValues = this.metadata.attribute.attributes[this.attribute].uniqueValues;
        return Object.keys(uniqueValues)
            .map(function (key) {
                return {
                    name: key,
                    events: this.getContentAttributeList()
                };
            }, this)
            .sort(function (a, b) {
                return uniqueValues[b.name].count - uniqueValues[a.name].count;
            });
    };

    categoricalplotdatasetbuilder.CategoricalPlotDataSetBuilder.prototype.nestRawData = function (data) {
        var contentAttrLookUpMap = this.getLookUpMap(this.contentAttribute),
            attrLookUpMap = this.getLookUpMap(this.attribute),
            nestData = this.getAttributeList();
        data.forEach(function (d) {
            var contentAttrIndex = (this.contentAttribute === undefined) ? 0 : contentAttrLookUpMap[d[this.contentAttribute]],
                attrIndex = attrLookUpMap[d[this.attribute]];
            nestData[attrIndex].events[contentAttrIndex].count.total += 1;
        }, this);
        return nestData;
    };

    categoricalplotdatasetbuilder.CategoricalPlotDataSetBuilder.prototype.tallyRelativeCounts = function (nestData) {
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

    categoricalplotdatasetbuilder.CategoricalPlotDataSetBuilder.prototype.build = function () {
        var nestData = this.nestRawData(this.data);
        return this.tallyRelativeCounts(nestData);
    };

    return categoricalplotdatasetbuilder;

});