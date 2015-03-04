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
    'jquery',
    'general/waitmodal',
    'perse'
], function ($, waitmodal, perse) {
    var app,
        load,
        modal = waitmodal.createWaitModal();

    load = function () {
        app.show();
        modal.modal('hide');
    };

    modal.on('shown.bs.modal', function () {
        app = new perse.PerSE()
            .render($('#perse'))
            .onLoadEnd(load)
            .hide()
            .init();
        $('body').prepend(app.createNavBar());
    });

    modal.on('hidden.bs.modal', function () {
        modal.off();
        modal.remove();
    });

    $(modal).modal({
        keyboard: false,
        background: 'static'
    });





});