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
    };

    timewheel.TimeWheelDataSetBuilder.prototype.setCalendarName = function (calendarName) {
        this.calendarName = calendarName;
        return this;
    };

    timewheel.TimeWheelDataSetBuilder.prototype.build = function () {
        this.addRawDataCountToRingData();
        return this.ringData;
    };

    timewheel.TimeWheelDataSetBuilder.prototype.addRawDataCountToRingData = function () {
        var cal = $.calendars.instance(this.calendarName),
            i;

        this.rawData.forEach(function (d) {
            var date = cal.fromJD(d.julianDate);
            for (i = 0; i < this.ringData.length; i += 1) {
                switch (this.ringData[i].ringId) {
                case ('dayOfWeek'):
                    this.ringData[i].data[date.dayOfWeek()].count += 1;
                    break;
                case ('dayOfMonth'):
                    this.ringData[i].data[date.day() - 1].count += 1;
                    break;
                case ('monthOfYear'):
                    this.ringData[i].data[date.month() - 1].count += 1;
                    break;
                default:
                    console.warn('Case Not supported');
                }
            }
        }, this);
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
        var daysOfWeek = [];
        jqueryCalendarInstance.local.dayNames.forEach(function (dayName, index) {
            var item = {
                short: jqueryCalendarInstance.local.dayNamesMin[index],
                long: dayName,
                value: index,
                count: 0
            };
            daysOfWeek.push(item);
        });
        return {
            label: 'Day of Week',
            ringId: 'dayOfWeek',
            data: daysOfWeek
        };
    };

    timewheel.TimeWheelDataSetBuilder.prototype.getJQueryCalendarDayInMonthData = function (jqueryCalendarInstance) {
        var daysOfMonth = [],
            min = jqueryCalendarInstance.minDay,
            max = jqueryCalendarInstance.daysPerMonth.reduce(function (pre, cur) {
                return (pre < cur) ? cur : pre;
            });
        this.getRange(min, max).forEach(function (num) {
            var item = {
                short: num.toString(),
                long: num.toString(),
                value: num,
                count: 0
            };
            daysOfMonth.push(item);
        });
        return {
            label: 'Day of Month',
            ringId: 'dayOfMonth',
            data: daysOfMonth
        };
    };

    timewheel.TimeWheelDataSetBuilder.prototype.getJQueryCalendarMonthInYearData = function (jqueryCalendarInstance) {
        var monthsOfYear = [];
        jqueryCalendarInstance.local.monthNames.forEach(function (monthName, index) {
            var item = {
                short: jqueryCalendarInstance.local.monthNamesShort[index],
                long: monthName,
                value: index,
                count: 0
            };
            monthsOfYear.push(item);
        });
        return {
            label: 'Month of Year',
            ringId: 'monthOfYear',
            data: monthsOfYear
        };
    };

    return timewheel;

});