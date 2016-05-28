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
        'ol': 'lib/ol',
        'papaparse': 'lib/papaparse',
        'colorbrewer': 'lib/colorbrewer',
        'bootstrap': 'lib/bootstrap'
    },
    shim: {
        'jquery': {exports: '$'},
        'd3': {exports: 'd3'},
        'crossfilter': {exports: 'crossfilter'},
        '$.calendars': {exports: '$.calendars', deps: ['jquery']},
        'ol': {exports: 'ol'},
        'papaparse': {exports: 'Papa'},
        'colorbrewer': {exports: 'colorbrewer'},
        'bootstrap': {deps: ['jquery']}
    }
});

require([
    'jquery',
    'general/waitmodal',
    'perse',
    'page/page'
], function ($, waitmodal, perse, page) {
    var app, nav, footer, loadEnd, modal;

    modal = waitmodal.createWaitModal();

    loadEnd = function () {
        app.show();
        footer.show();
        modal.modal('hide');
    };

    modal.on('shown.bs.modal', function () {
        app = new perse.PerSE()
            .render($('#perse'))
            .onLoadEnd(loadEnd)
            .hide()
            .init();
        nav = page.createNavBar({
            brand: './index.html',
            about: './about.html',
            help: './help.html'
        });
        $('body').prepend(nav);

        footer = page.createFooter().hide();
        $('body').append(footer);
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