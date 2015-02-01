/**
 *  This file is part of PerSE. PerSE is a visual analytics app for
 *  event periodicity detection and analysis.
 *  Copyright (C) 2015  Brian Swedberg
 */

define([
    'jquery',
    // no namespace
    '$.calendars'
], function ($) {

    var pertimelinedatasetbuilder = {};

    pertimelinedatasetbuilder.PerTimelineDataSetBuilder = function (metadata) {
        this.metadata = metadata;
        this.calendarName = undefined;
        this.data = undefined;
        this.resolution = undefined;
    };

    pertimelinedatasetbuilder.PerTimelineDataSetBuilder.prototype.setData = function (data) {
        this.data = data;
        return this;
    };

    pertimelinedatasetbuilder.PerTimelineDataSetBuilder.prototype.setCalendar = function (calendarName) {
        this.calendarName = calendarName;
        return this;
    };

    pertimelinedatasetbuilder.PerTimelineDataSetBuilder.prototype.setResolution = function (resolution) {
        this.resolution = resolution;
        return this;
    };

    pertimelinedatasetbuilder.PerTimelineDataSetBuilder.prototype.createAggregate = function (label, value) {
        return {
            label: label,
            value: value,
            dateRange: {begin: 0, end: 0},
            isLeaf: true,
            composite: []
        };
    };

    pertimelinedatasetbuilder.PerTimelineDataSetBuilder.prototype.buildYearlyDataSet = function () {
        var cal = $.calendars.instance(this.calendarName),
            newData = [],
            extent = this.getExtent(),
            minDate = cal.fromJD(extent.min),
            myDate = cal.fromJD(extent.min),
            agg = this.createAggregate(myDate.year().toString(), myDate.year());

        // add data in
        this.data.forEach(function (d) {
            var currentDate = cal.fromJD(d.julianDate);
            while (myDate.compareTo(currentDate) < 1) {
                if (myDate.year() - minDate.year() > newData.length - 1) {
                    agg = this.createAggregate(myDate.year().toString(), myDate.year());
                    agg.dateRange.begin = myDate.toJD();
                    agg.isLeaf = false;
                    newData.push(agg);
                }
                if (myDate.month() - minDate.month() > newData[myDate.year() - minDate.year()].composite.length - 1) {
                    agg.composite.push(this.createAggregate(cal.local.monthNamesShort[myDate.monthOfYear() - 1], myDate.monthOfYear() - 1));
                    agg.composite[agg.composite.length - 1].dateRange.begin = myDate.toJD();
                    agg.composite[agg.composite.length - 1].isLeaf = true;
                }
                agg.dateRange.end = myDate.toJD();
                agg.composite[agg.composite.length - 1].dateRange.end = myDate.toJD();

                myDate.add(1, 'd');
            }
            newData[currentDate.year() - minDate.year()]
                .composite[currentDate.month() - 1]
                .composite.push(d);
        }, this);

        return newData;
    };

    pertimelinedatasetbuilder.PerTimelineDataSetBuilder.prototype.buildMonthlyDataSet = function () {
        var cal = $.calendars.instance(this.calendarName),
            newData = [],
            extent = this.getExtent(),
            minDate = cal.fromJD(extent.min),
            myDate = cal.fromJD(extent.min),
            agg = this.createAggregate(cal.local.monthNamesShort[myDate.monthOfYear() - 1], myDate.monthOfYear() - 1);

        agg.dateRange.begin = minDate.toJD();
        if (myDate.day() !== 1) {
            newData.push(agg);
        }
        // add data in
        this.data.forEach(function (d) {
            var currentDate = cal.fromJD(d.julianDate);
            while (myDate.compareTo(currentDate) < 1) {
                if (myDate.day() === 1) {
                    agg = this.createAggregate(cal.local.monthNamesShort[myDate.monthOfYear() - 1], myDate.monthOfYear() - 1);
                    agg.dateRange.begin = myDate.toJD();
                    newData.push(agg);
                }
                agg.dateRange.end = myDate.toJD();
                myDate.add(1, 'd');
            }
            newData[newData.length - 1].composite.push(d);
        }, this);

        return newData;
    };

    pertimelinedatasetbuilder.PerTimelineDataSetBuilder.prototype.buildWeeklyDataSet = function () {
        var cal = $.calendars.instance(this.calendarName),
            newData = [],
            extent = this.getExtent(),
            minDate = cal.fromJD(extent.min),
            myDate = cal.fromJD(extent.min),
            agg = this.createAggregate('0', 0);

        agg.dateRange.begin = minDate.toJD();
        if (myDate.dayOfWeek() !== 1) {
            newData.push(agg);
        }
        // add data in
        this.data.forEach(function (d) {
            var currentDate = cal.fromJD(d.julianDate);
            while (myDate.compareTo(currentDate) < 1) {
                if (myDate.dayOfWeek() === 1) {
                    agg = this.createAggregate(newData.length.toString(), newData.length);
                    agg.dateRange.begin = myDate.toJD();
                    newData.push(agg);
                }
                agg.dateRange.end = myDate.toJD();
                myDate.add(1, 'd');
            }
            newData[newData.length - 1].composite.push(d);
        }, this);

        return newData;
    };

    pertimelinedatasetbuilder.PerTimelineDataSetBuilder.prototype.buildDailyDataSet = function () {
        var cal = $.calendars.instance(this.calendarName),
            newData = [],
            extent = this.getExtent(),
            minDate = cal.fromJD(extent.min),
            myDate = cal.fromJD(extent.min),
            agg = this.createAggregate('0', 0);

        // add data in
        this.data.forEach(function (d) {
            var currentDate = cal.fromJD(d.julianDate);
            while (myDate.compareTo(currentDate) < 1) {
                agg = this.createAggregate(newData.length.toString(), newData.length);
                agg.dateRange.begin = myDate.toJD();
                newData.push(agg);
                myDate.add(1, 'd');
                agg.dateRange.end = myDate.toJD();
            }
            newData[newData.length - 1].composite.push(d);
        }, this);

        return newData;
    };

    pertimelinedatasetbuilder.PerTimelineDataSetBuilder.prototype.getExtent = function () {
        return {
            min: this.metadata.getMetadata().temporal.beginJulianDate,
            max: this.metadata.getMetadata().temporal.endJulianDate
        };
    };

    pertimelinedatasetbuilder.PerTimelineDataSetBuilder.prototype.build = function () {
        var newData = [];
        switch (this.resolution) {
        case ('Year'):
            newData = this.buildYearlyDataSet();
            break;
        case ('Month'):
            newData = this.buildMonthlyDataSet();
            break;
        case ('Week'):
            newData = this.buildWeeklyDataSet();
            break;
        case ('Day'):
            newData = this.buildDailyDataSet();
            break;
        default:
            console.warn('Case not supported:', this.resolution);
        }
        return newData;
    };


    return pertimelinedatasetbuilder;

});