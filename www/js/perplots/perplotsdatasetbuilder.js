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

    perplots.PerPlotsDataSetBuilder = function (metadata) {
        this.metadata = metadata;
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
        this.data = data || [];
        //this.data = data.filter(function (d) {return cal.fromJD(d.julianDate).year() >= 1431 && d.attribute_1 === 'Boko Haram'; });
        return this;
    };

    perplots.PerPlotsDataSetBuilder.prototype.createMonthOfYearData = function () {

        var cal = $.calendars.instance(this.calendarName),
            newData = [],
            extent = this.getJulianDateExtent(),
            minDate = {year: cal.fromJD(extent.min).year(), month: 0},
            maxDate = {year: cal.fromJD(extent.max).year(), month: cal.fromJD(extent.max).monthOfYear() - 1},
            myDate = {year: cal.fromJD(extent.min).year(), month: 0},
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
            extent = this.getJulianDateExtent(),
            myDate = cal.fromJD(extent.min).add(-cal.fromJD(extent.min).dayOfWeek(), 'd'),
            newData = [],
            item,
            ii,
            i,
            endD;

        // builds the structure
        for (i = 0; myDate.toJD() <= extent.max; i += 1) {
            item = {label: i.toString(), value: i, partitions: []};

            for (ii = 0; ii < cal.local.dayNamesShort.length; ii += 1) {
                item.partitions.push({
                    label: cal.local.dayNamesShort[ii],
                    value: ii,
                    events: []
                });
                myDate.add(1, 'd');
            }
            newData.push(item);
        }

        // adds the real data
        this.data.sort(function (a, b) {return a.julianDate - b.julianDate; });
        i = 0;
        endD = cal.fromJD(extent.min)
            .add(-(cal.fromJD(extent.min).dayOfWeek()), 'd')
            .add(1, 'w');
        this.data.forEach(function (d) {
            var date = cal.fromJD(d.julianDate);
            while (date.compareTo(endD) >= 0) {
                endD.add(1, 'w');
                i += 1;
            }
            newData[i].partitions[date.dayOfWeek()].events.push(d);
        });
        return newData;
    };

    perplots.PerPlotsDataSetBuilder.prototype.createDayOfMonthData = function () {
        var cal = $.calendars.instance(this.calendarName),
            newData = [],
            extent = this.getJulianDateExtent(),
            myDate = cal.fromJD(extent.min).add((-cal.fromJD(extent.min).day()) + 1, 'd'),
            endD,
            item,
            ii,
            i = 0;

        // builds the structure
        while (myDate.toJD() <= extent.max) {
            item = {label: (i + 1).toString(), value: i, partitions: []};

            for (ii = 1; myDate.day() === ii; ii += 1, myDate.add(1, 'd')) {
                item.partitions.push({
                    label: ii,
                    value: ii - 1,
                    events: []
                });
            }
            i += 1;
            newData.push(item);
        }

        this.data.sort(function (a, b) {return a.julianDate - b.julianDate; });
        i = 0;
        endD = cal.fromJD(extent.min)
            .add((-cal.fromJD(extent.min).day()) + 1, 'd')
            .add(1, 'm');

        this.data.forEach(function (d) {
            var date = cal.fromJD(d.julianDate);
            if (date.compareTo(endD) < 0) {
                newData[i].partitions[date.day() - 1].events.push(d);
            } else {
                while (date.compareTo(endD) >= 0) {
                    endD.add(1, 'm');
                    i += 1;
                }
            }
        });

        return newData;
    };

    perplots.PerPlotsDataSetBuilder.prototype.createWeekOfYearData = function () {
        var cal = $.calendars.instance(this.calendarName),
            newData = [],
            extent = this.getJulianDateExtent(),
            myDate = cal.fromJD(extent.min)
                .add((-cal.fromJD(extent.min).weekOfYear()) + 1, 'w'),
            item,
            endD,
            i,
            y,
            w;

        // builds the structure
        while (myDate.toJD() <= extent.max) {
            item = {label: myDate.year().toString(), value: myDate.year(), partitions: []};
            while (myDate.weekOfYear() >= item.partitions.length) {
                if (item.partitions.length !== myDate.weekOfYear()) {
                    item.partitions.push({label: myDate.weekOfYear().toString(), value: myDate.weekOfYear() - 1, events: []});
                }
                myDate.add(1, 'd');
            }
            newData.push(item);
        }



        this.data = this.data.sort(function (a, b) {return a.julianDate - b.julianDate; });

        i = 0;
        w = cal.fromJD(this.data[0].julianDate).weekOfYear();
        this.data.forEach(function (d) {
            var date = cal.fromJD(d.julianDate);
            if (date.weekOfYear() < w) {
                i += 1;
                while (newData[i].value < date.year()) {
                    i += i;
                }
            }
            w = date.weekOfYear();
            newData[i].partitions[date.weekOfYear() - 1].events.push(d);
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

    perplots.PerPlotsDataSetBuilder.prototype.getJulianDateExtent = function () {
        var m = this.metadata.getMetadata().temporal;
        return {min: m.beginJulianDate, max: m.endJulianDate};
    };

    perplots.PerPlotsDataSetBuilder.prototype.getJulianDateExtent_dep = function () {
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