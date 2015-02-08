/**
 *  This file is part of PerSE. PerSE is a visual analytics app for
 *  event periodicity detection and analysis.
 *  Copyright (C) 2015  Brian Swedberg
 */

define([], function () {

    var builtindata = {};

    /*
    builtindata.getRawDataMetadataYemen = function () {
        return {
            fileName: './dataset/default_data_v3.txt',
            columns: {
                year: 'year',
                month: 'month',
                day: 'day',
                latDD: 'latitude',
                lonDD: 'longitude',
                attributes: ['primary_name', 'secondary_name']
            }
        };
    };*/

    builtindata.getRawDataMetadataNigeria0813 = function () {
        return {
            fileName: './dataset/ACLED_Nigeria_08_13.txt',
            columns: {
                year: 'YEAR',
                month: 'MONTH',
                day: 'DAY',
                latDD: 'LATITUDE',
                lonDD: 'LONGITUDE',
                attributes: ['Event Type', 'Actor', 'Fatalities']
            }
        };
    };

    return builtindata;
});