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

    var timewheel = {};

    timewheel.TimeWheelDataSetBuilder = function () {
        this.rawData = [];
        this.ringData = [];
        this.calendarName = undefined;
        this.contentAttribute = undefined;
        this.metadata = undefined;
    };

    timewheel.TimeWheelDataSetBuilder.prototype.setMetadata = function (mdata) {
        this.metadata = mdata;
        return this;
    };

    timewheel.TimeWheelDataSetBuilder.prototype.setContentAttribute = function (contentAttr) {
        this.contentAttribute = contentAttr;
        return this;
    };

    timewheel.TimeWheelDataSetBuilder.prototype.setCalendarName = function (cldrName) {
        this.calendarName = cldrName;
        return this;
    };

    timewheel.TimeWheelDataSetBuilder.prototype.build = function () {
        this.addRawDataCountToRingData();
        this.setRelativeCounts();
        return this.ringData;
    };

    timewheel.TimeWheelDataSetBuilder.prototype.addRawDataCountToRingData = function () {
        var cal = $.calendars.instance(this.calendarName),
            lookUpMap = this.getEventTypeLookUpMap(),
            i;

        this.rawData.forEach(function (d) {
            var date = cal.fromJD(d.julianDate),
                eventIndex = (this.contentAttribute === undefined) ? 0 : lookUpMap[d[this.contentAttribute]];
            for (i = 0; i < this.ringData.length; i += 1) {
                switch (this.ringData[i].ringId) {
                case ('dayOfWeek'):
                    this.ringData[i].data[date.dayOfWeek()].events[eventIndex].count.total += 1;
                    break;
                case ('dayOfMonth'):
                    this.ringData[i].data[date.day() - 1].events[eventIndex].count.total += 1;
                    break;
                case ('monthOfYear'):
                    this.ringData[i].data[date.month() - 1].events[eventIndex].count.total += 1;
                    break;
                default:
                    console.warn('Case Not supported');
                }
            }
        }, this);
    };

    timewheel.TimeWheelDataSetBuilder.prototype.setRelativeCounts = function () {
        this.ringData.forEach(function (ring) {
            ring.data.forEach(function (agg) {
                var begin = 0;
                agg.events.forEach(function (e) {
                    e.count.begin = begin;
                    e.count.end = e.count.begin + e.count.total;
                    begin = e.count.end;
                });
            });
        });
    };

    timewheel.TimeWheelDataSetBuilder.prototype.setRawData = function (rawData) {
        this.rawData = rawData;
        return this;
    };

    timewheel.TimeWheelDataSetBuilder.prototype.addRing = function (ringData) {
        this.ringData.push(ringData);
        return this;
    };

    timewheel.TimeWheelDataSetBuilder.prototype.getRange = function (min, max) {
        var array = [], i;
        for (i = min; i <= max; i += 1) {
            array.push(i);
        }
        return array;
    };

    timewheel.TimeWheelDataSetBuilder.prototype.getJQueryCalendarDayInWeekData = function (jqueryCalendarInstance) {
        var daysOfWeek = jqueryCalendarInstance.local.dayNames.map(function (dayName, index) {
            return {
                short: jqueryCalendarInstance.local.dayNamesMin[index],
                long: dayName,
                value: index,
                events: this.getEventTypeList()
            };
        }, this);
        return {
            label: 'Day of Week',
            ringId: 'dayOfWeek',
            data: daysOfWeek
        };
    };

    timewheel.TimeWheelDataSetBuilder.prototype.getJQueryCalendarDayInMonthData = function (jqueryCalendarInstance) {
        var daysOfMonth,
            min = jqueryCalendarInstance.minDay,
            max = jqueryCalendarInstance.daysPerMonth.reduce(function (pre, cur) {
                return (pre < cur) ? cur : pre;
            });
        daysOfMonth = this.getRange(min, max).map(function (num) {
            return {
                short: num.toString(),
                long: num.toString(),
                value: num - 1,
                events: this.getEventTypeList()
            };
        }, this);
        return {
            label: 'Day of Month',
            ringId: 'dayOfMonth',
            data: daysOfMonth
        };
    };

    timewheel.TimeWheelDataSetBuilder.prototype.getJQueryCalendarMonthInYearData = function (jqueryCalendarInstance) {
        var monthsOfYear = jqueryCalendarInstance.local.monthNames.map(function (monthName, index) {
            return {
                short: jqueryCalendarInstance.local.monthNamesShort[index],
                long: monthName,
                value: index,
                events: this.getEventTypeList()
            };
        }, this);
        return {
            label: 'Month of Year',
            ringId: 'monthOfYear',
            data: monthsOfYear
        };
    };

    timewheel.TimeWheelDataSetBuilder.prototype.getEventTypeLookUpMap = function () {
        var eventTypeLookUpMap = {},
            uniqueValues;
        if (this.contentAttribute === undefined) {

        } else {
            uniqueValues = this.metadata.attribute.attributes[this.contentAttribute].uniqueValues;
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

    timewheel.TimeWheelDataSetBuilder.prototype.getEventTypeList = function () {
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

    return timewheel;

});