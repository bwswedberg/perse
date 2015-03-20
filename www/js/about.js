/**
 *  This file is part of PerSE. PerSE is a visual analytics app for
 *  event periodicity detection and analysis.
 *  Copyright (C) 2015  Brian Swedberg
 */

/**
 *  This file is part of PerSE. PerSE is a visual analytics app for
 *  event periodicity detection and analysis.
 *  Copyright (C) 2015  Brian Swedberg
 */

require.config({
    paths: {
        'jquery': 'lib/jquery',
        'bootstrap': 'lib/bootstrap'
    },
    shim: {
        'jquery': {exports: '$'},
        'bootstrap': {deps: ['jquery']}
    }
});


require([
    'jquery',
    'page/page'
], function ($, page) {
    var headings;

    $('body').prepend(page.createNavBar({
        brand: './index.html',
        about: './about.html',
        help: './help.html',
        isAlwaysShowing: false
    }));

    function makeSpyDataStruct (opts) {
        return {
            label: opts.label || 'Unknown',
            id: opts.id || '#',
            subgroups: opts.subgroups || []
        };
    }

    headings = $('#main-content > .group').get().map(function (gElem) {
        var group = $(gElem);
        return makeSpyDataStruct({
            label: group.attr('data-title'),
            id: group.attr('id'),
            subgroups: group.find('.content > .subgroup').get().map(function (subElem) {
                var sub = $(subElem);
                return makeSpyDataStruct({
                    label: sub.attr('data-title'),
                    id: sub.attr('id')
                });
            })
        });
    });

    $('#main-content-spy').append(page.createScrollSpy({
        target: $('#main-content-spy'),
        headings: headings
    }));

    page.decorateCarousel({
        'target': '#jumbotron-carousel',
        'data': [
            {
                'caption': {
                    'h': 'PerSE',
                    'p': ''
                },
                'src': ''
            },
            {
                'caption': {
                    'h': 'Voronoi Subplots Map',
                    'p': ''
                },
                'src': 'img/screenshots/voronoi-subplots-map/voronoi-subplots-map.png'
            },
            {
                'caption': {
                    'h': 'Voronoi Subplots Map',
                    'p': ''
                },
                'src': 'img/screenshots/voronoi-subplots-map/seeds-five-moved-islamic-wmouse.png'
            },
            {
                'caption': {
                    'h': 'Voronoi Subplots Map',
                    'p': ''
                },
                'src': 'img/screenshots/timeline/timeline.png'
            },
            {
                'caption': {
                    'h': 'Timeline',
                    'p': ''
                },
                'src': 'img/screenshots/timeline/filter-1-wmouse.png'
            },
            {
                'caption': {
                    'h': 'Time-Wheel',
                    'p': ''
                },
                'src': 'img/screenshots/time-wheel/time-wheel.png'
            },
            {
                'caption': {
                    'h': 'Time-Wheel',
                    'p': ''
                },
                'src': 'img/screenshots/time-wheel/brush-month-of-year-wmouse.png'
            },
            {
                'caption': {
                    'h': 'Attribute-View',
                    'p': ''
                },
                'src': 'img/screenshots/attribute-view/event-type.png'
            },
            {
                'caption': {
                    'h': 'Attribute-View',
                    'p': ''
                },
                'src': 'img/screenshots/attribute-view/actor.png'
            },
            {
                'caption': {
                    'h': 'Attribute-View',
                    'p': ''
                },
                'src': 'img/screenshots/attribute-view/filter-numerical-2-wmouse.png'
            }
        ]
    });

    $('body').append(page.createFooter());

});
