/**
 *  This file is part of PerSE. PerSE is a visual analytics app for
 *  event periodicity detection and analysis.
 *  Copyright (C) 2015  Brian Swedberg
 */

require.config({
    paths: {
        'jquery': 'lib/jquery',
        'd3': 'lib/d3',
        'crossfilter': 'lib/crossfilter',
        '$.calendars': 'lib/jquery.calendars',
        'metricsgraphics': 'lib/metricsgraphics',
        'ol': 'lib/ol',
        'papaparse': 'lib/papaparse',
        'colorbrewer': 'lib/colorbrewer',
        'bootstrap': 'lib/bootstrap',
        'randomcolor': 'lib/randomcolor'
    },
    shim: {
        'jquery': {exports: '$'},
        'd3': {exports: 'd3'},
        'crossfilter': {exports: 'crossfilter'},
        '$.calendars': {exports: '$.calendars', deps: ['jquery']},
        'metricsgraphics': {exports: 'MG', deps: ['jquery', 'd3']},
        'ol': {exports: 'ol'},
        'papaparse': {exports: 'Papa'},
        'colorbrewer': {exports: 'colorbrewer'},
        'bootstrap': {deps: ['jquery']},
        'randomcolor': {exports: 'randomcolor'}
    }
});

require([
    'perse',
    'jquery'
], function (perse, $) {
    var app = new perse.PerSE(document.getElementById('perse'));
    $('body').prepend(app.createNavBar());
    app.init();
});