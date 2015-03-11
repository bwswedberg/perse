/**
 *  This file is part of PerSE. PerSE is a visual analytics app for
 *  event periodicity detection and analysis.
 *  Copyright (C) 2015  Brian Swedberg
 */

define([
    'jquery',
    // no namespace
    'bootstrap'
], function ($) {

    var page = {};

    page.createNavBar = function (opts) {
        var params = {
            brand: opts.brand || '#',
            about: opts.about || '#',
            help: opts.help || '#'
            },
            // ------ title/sub ----
            b = $('<a>')
                .attr({'class': 'navbar-brand', 'href': params.brand})
                .text('PerSE'),
            p = $('<p>')
                .attr({'class': 'navbar-text'})
                .text('Visual Analytics for Event Periodicity Detection and Analysis'),
            divHeader = $('<div>')
                .attr({'class': 'navbar-header'})
                .append(b, p),
        // ----- Navbar stuff ------
            aAbout = $('<a>')
                .attr({'href': params.about})
                .text('About'),
            aHelp = $('<a>')
                .attr({'href': params.help})
                .text('Help'),
            nav = $('<ul>')
                .attr({'class': 'nav navbar-nav navbar-right'})
                .append(
                $('<li>').append(aAbout),
                $('<li>').append(aHelp)
            ),
            navbar = $('<div>')
                .attr({'class': 'navbar-collapse collapse'})
                .append(nav),
        // ----- Wrap it all up -----
            cont = $('<div>')
                .attr({'class': 'container'})
                .append(divHeader, navbar);

        b.toggleClass('disabled', params.brand === '#');
        aAbout.toggleClass('disabled', params.about === '#');
        aHelp.toggleClass('disabled', params.help === '#');

        return $('<div>')
            .attr({'class': 'navbar navbar-default navbar-fixed-top'})
            .append(cont);
    };

    page.createScrollSpy = function (opts) {
        var listItems,
            groupList = $('<ul>')
                .attr({'class': 'nav nav-stacked', 'id': 'sidebar'});

        listItems = opts.headings.map(function (group) {
            var a = $('<a>')
                    .attr({'href': '#' + group.id})
                    .text(group.label),
                li = $('<li>')
                    .append(a),
                subList;
            if (group.subgroups.length > 0) {
                subList = $('<ul>')
                    .attr({'class': 'nav nav-stacked'});
                group.subgroups.forEach(function (sub) {
                    var sA = $('<a>')
                            .attr({'href': '#' + sub.id})
                            .text(sub.label),
                        sLi = $('<li>')
                            .append(sA);

                    subList.append(sLi);
                });
                li.append(subList);
            }
            return li;
        });

        groupList.append(listItems);


        $('body').scrollspy({
            target: '#main-content-spy',
            offset: 60
        });

        $(opts.target).append(groupList);

        $('#sidebar').affix({
            offset: {
                top: opts.target.position().top - 60
            }
        });

        return opts.target;
    };

    page.createFooter = function () {
        var small1 = $('<p>')
                .attr({'class': 'small'})
                .html('PerSE was designed and built with love. <br> Copyright 2015 ' +
                '<a href="mailto:bwswedberg@gmail.com">Brian Swedberg</a>.' +
                ' <a href="http://opensource.org/licenses/MIT">MIT License</a>');
        return $('<footer>')
            .attr({'class': 'footer'})
            .append(small1);
    };

    return page;
});