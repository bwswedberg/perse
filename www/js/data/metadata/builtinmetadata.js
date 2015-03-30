/**
 *  This file is part of PerSE. PerSE is a visual analytics app for
 *  event periodicity detection and analysis.
 *  Copyright (C) 2015  Brian Swedberg
 */

define([], function () {

    var builtindata = {};

    builtindata.nigeria0813 = {
        fileName: './dataset/ACLED_Nigeria_08_13.txt',
        columns: {
            year: 'YEAR',
            month: 'MONTH',
            day: 'DAY',
            latDD: 'LATITUDE',
            lonDD: 'LONGITUDE',
            attributes: ['Event Type', 'Actor', 'Fatalities'],
            description: 'Notes'
        }
    };

    builtindata.nigeria0814 = {
        fileName: './dataset/ACLED_Nigeria_08_14.txt',
        columns: {
            year: 'YEAR',
            month: 'MONTH',
            day: 'DAY',
            latDD: 'LATITUDE',
            lonDD: 'LONGITUDE',
            attributes: ['Event Type', 'Actor', 'Fatalities'],
            description: 'Notes'
        }
    };

    builtindata.sudan0814 = {
        fileName: './dataset/ACLED_Sudan_00_14.txt',
        columns: {
            year: 'YEAR',
            month: 'MONTH',
            day: 'DAY',
            latDD: 'LATITUDE',
            lonDD: 'LONGITUDE',
            attributes: ['Event Type', 'Actor', 'Fatalities'],
            description: 'Notes'
        }
    };

    builtindata.southSudan1114 = {
        fileName: './dataset/ACLED_SouthSudan_11_14.txt',
        columns: {
            year: 'YEAR',
            month: 'MONTH',
            day: 'DAY',
            latDD: 'LATITUDE',
            lonDD: 'LONGITUDE',
            attributes: ['Event Type', 'Actor', 'Fatalities'],
            description: 'Notes'
        }
    };

    builtindata.allSudan0014 = {
        fileName: './dataset/ACLED_AllSudan_00_14.txt',
        columns: {
            year: 'YEAR',
            month: 'MONTH',
            day: 'DAY',
            latDD: 'LATITUDE',
            lonDD: 'LONGITUDE',
            attributes: ['Event Type', 'Actor', 'Fatalities'],
            description: 'Notes'
        }
    };

    builtindata.somalia0014 = {
        fileName: './dataset/ACLED_Somalia_00_14.txt',
        columns: {
            year: 'YEAR',
            month: 'MONTH',
            day: 'DAY',
            latDD: 'LATITUDE',
            lonDD: 'LONGITUDE',
            attributes: ['Event Type', 'Actor', 'Fatalities'],
            description: 'Notes'
        }
    };

    builtindata.angola9714 = {
        fileName: './dataset/ACLED_Angola_97_14.txt',
        columns: {
            year: 'YEAR',
            month: 'MONTH',
            day: 'DAY',
            latDD: 'LATITUDE',
            lonDD: 'LONGITUDE',
            attributes: ['Event Type', 'Actor', 'Fatalities'],
            description: 'Notes'
        }
    };

    builtindata.drc0014 = {
        fileName: './dataset/ACLED_DRC_00_14.txt',
        columns: {
            year: 'YEAR',
            month: 'MONTH',
            day: 'DAY',
            latDD: 'LATITUDE',
            lonDD: 'LONGITUDE',
            attributes: ['Event Type', 'Actor', 'Fatalities'],
            description: 'Notes'
        }
    };

    builtindata.drc9714 = {
        fileName: './dataset/ACLED_DRC_97_14.txt',
        columns: {
            year: 'YEAR',
            month: 'MONTH',
            day: 'DAY',
            latDD: 'LATITUDE',
            lonDD: 'LONGITUDE',
            attributes: ['Event Type', 'Actor', 'Fatalities'],
            description: 'Notes'
        }
    };

    builtindata.egypt9714 = {
        fileName: './dataset/ACLED_Egypt_97_14.txt',
        columns: {
            year: 'YEAR',
            month: 'MONTH',
            day: 'DAY',
            latDD: 'LATITUDE',
            lonDD: 'LONGITUDE',
            attributes: ['Event Type', 'Actor', 'Fatalities'],
            description: 'Notes'
        }
    };

    builtindata.car0014 = {
        fileName: './dataset/ACLED_CAR_00_14.txt',
        columns: {
            year: 'YEAR',
            month: 'MONTH',
            day: 'DAY',
            latDD: 'LATITUDE',
            lonDD: 'LONGITUDE',
            attributes: ['Event Type', 'Actor', 'Fatalities'],
            description: 'Notes'
        }
    };

    return builtindata;
});
