/**
 *  This file is part of PerSE. PerSE is a visual analytics app for
 *  event periodicity detection and analysis.
 *  Copyright (C) 2015  Brian Swedberg
 */

define([
    'jquery',
    // no namesapce
    '$.calendars'
], function ($) {
    
    var perplots = {};

    perplots.PerPlotsDataSetBuilder = function () {
        this.calendarName = undefined;
        this.cycleName = undefined;
        this.data = [];
    };

    perplots.PerPlotsDataSetBuilder.prototype.setCalendarName = function (calendarName) {
        this.calendarName = calendarName;
        return this;
    };

    perplots.PerPlotsDataSetBuilder.prototype.setCycleName = function (cycleName) {
        this.cycleName = cycleName;
        return this;
    };

    perplots.PerPlotsDataSetBuilder.prototype.setData = function (data) {
        //var cal = $.calendars.instance(this.calendarName);
        this.data = data;
        //this.data = data.filter(function (d) {return cal.fromJD(d.julianDate).year() >= 1431 && d.attribute_1 === 'Boko Haram'; });
        return this;
    };

    perplots.PerPlotsDataSetBuilder.prototype.createMonthOfYearData = function () {
        var cal = $.calendars.instance(this.calendarName),
            newData = [],
            extent = this.getExtent(),
            minDate = {year: cal.fromJD(extent.min).year(), month: cal.fromJD(extent.min).monthOfYear() - 1},
            maxDate = {year: cal.fromJD(extent.max).year(), month: cal.fromJD(extent.max).monthOfYear() - 1},
            myDate = {year: cal.fromJD(extent.min).year(), month: cal.fromJD(extent.min).monthOfYear() - 1},
            maxPossibleMonths = cal.local.monthNamesShort.length;

        // builds the structure
        while (myDate.year <= maxDate.year) {
            var item = {label: myDate.year.toString(), value: myDate.year, partitions: []},
                maxMonth = maxPossibleMonths;
            if (myDate.year === maxDate.year) {
                maxMonth = maxDate.month + 1;
            }
            while (myDate.month < maxMonth) {
                item.partitions.push({label: cal.local.monthNamesShort[myDate.month], value: myDate.month, events: []});
                myDate.month += 1;
            }
            myDate.month = 0;
            myDate.year += 1;
            newData.push(item);
        }

        this.data.forEach(function (d) {
            var date = cal.fromJD(d.julianDate),
                m = newData[date.year() - minDate.year].partitions[0].value;
            newData[date.year() - minDate.year].partitions[date.monthOfYear() - 1 - m].events.push(d);
        });
        return newData;
    };

    perplots.PerPlotsDataSetBuilder.prototype.createDayOfWeekData = function () {
        var cal = $.calendars.instance(this.calendarName),
            newData = [];

        // builds the structure
        cal.local.dayNamesShort.forEach(function (label, index) {
            newData.push({label: label, count: 0, value: index});
        });

        // adds the real data
        this.data.forEach(function (d) {
            var date = cal.fromJD(d.julianDate);
            newData[date.dayOfWeek()].count += 1;
        });
        return newData;
    };

    perplots.PerPlotsDataSetBuilder.prototype.createDayOfMonthData = function () {
        var cal = $.calendars.instance(this.calendarName),
            newData = [],
            min = cal.minDay,
            max = cal.daysPerMonth.reduce(function (pre, cur) {
                return (pre < cur) ? cur : pre;
            }),
            i;

        // builds the structure
        for (i = min; i <= max; i += 1) {
            newData.push({label: i, count: 0, value: i - min});
        }

        // adds the real data
        this.data.forEach(function (d) {
            var date = cal.fromJD(d.julianDate);
            newData[date.day() - min].count += 1;
        });

        return newData;
    };

    perplots.PerPlotsDataSetBuilder.prototype.createWeekOfYearData = function () {
        var cal = $.calendars.instance(this.calendarName),
            newData = [],
            initDate = cal.fromJD(this.data[0].julianDate),
            weeksInYear = initDate.daysInYear() / initDate.daysInWeek(),
            i;

        // builds the structure
        for (i = 0; i < weeksInYear; i += 1) {
            newData.push({label: i + 1, count: 0, value: i - 1});
        }

        // adds the real data
        this.data.forEach(function (d) {
            var date = cal.fromJD(d.julianDate);
            if (date.weekOfYear() > newData.length) {
                newData.push({label: date.weekOfYear(), count: 0, value: date.weekOfYear() - 1});
            }
            newData[date.weekOfYear() - 1].count += 1;
        });
        return newData;
    };

    perplots.PerPlotsDataSetBuilder.prototype.createDayOfYearData = function () {
        var cal = $.calendars.instance(this.calendarName),
            newData = [],
            initDate = cal.fromJD(this.data[0].julianDate),
            daysInYear = initDate.daysInYear(),
            i;

        // builds the structure
        for (i = 0; i < daysInYear; i += 1) {
            newData.push({label: i + 1, count: 0, value: i - 1});
        }

        // adds the real data
        this.data.forEach(function (d) {
            var date = cal.fromJD(d.julianDate);
            if (date.dayOfYear() > newData.length) {
                newData.push({label: date.dayOfYear(), count: 0, value: date.dayOfYear() - 1});
            }
            newData[date.dayOfYear() - 1].count += 1;
        });
        return newData;
    };

    perplots.PerPlotsDataSetBuilder.prototype.getExtent = function () {
        return this.data.reduce(function (prev, cur) {
            prev.min = Math.min(prev.min, cur.julianDate);
            prev.max = Math.max(prev.max, cur.julianDate);
            return prev;
        }, {min: this.data[0].julianDate, max: this.data[0].julianDate});
    };

    perplots.PerPlotsDataSetBuilder.prototype.build = function () {
        var newData;
        switch (this.cycleName) {
        case ('MonthOfYear'):
            newData = this.createMonthOfYearData();
            break;
        case ('DayOfMonth'):
            newData = this.createDayOfMonthData();
            break;
        case ('DayOfWeek'):
            newData = this.createDayOfWeekData();
            break;
        case ('WeekOfYear'):
            newData = this.createWeekOfYearData();
            break;
        case ('DayOfYear'):
            newData = this.createWeekOfYearData();
            break;
        default:
            console.warn('Case not supported.');
        }
        return newData;
    };
    
    return perplots;
    
});