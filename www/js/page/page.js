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
            help: opts.help || '#',
            isAlwaysShowing: opts.hasOwnProperty('isAlwaysShowing') ? opts.isAlwaysShowing : true
            },
            // ------ title/sub ----
            b = $('<a>')
                .attr({'class': 'navbar-brand', 'href': params.brand})
                .text('PerSE'),
            p = $('<p>')
                .attr({'class': 'navbar-text'})
                .text('Visual Analytics for Periodicity Detection and Analysis'),
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
                .append(divHeader, navbar),
            out = $('<div>')
                .attr({'class': 'navbar navbar-default navbar-fixed-top'})
                .append(cont);

        b.toggleClass('disabled', params.brand === '#');
        aAbout.toggleClass('disabled', params.about === '#');
        aHelp.toggleClass('disabled', params.help === '#');



        if (!params.isAlwaysShowing) {
            out.hide();
            // set distance user needs to scroll before we start fadeIn
            if ($(this).scrollTop() > 100) {
                $('.navbar').fadeIn();
            } else {
                $('.navbar').fadeOut();
            }
            $(window).scroll(function () {

                 // set distance user needs to scroll before we start fadeIn
                if ($(this).scrollTop() > 100) {
                    $('.navbar').fadeIn();
                } else {
                    $('.navbar').fadeOut();
                }
            });
        }

        return out;

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

    page.decorateCarousel = function (params) {
        var data = params.data,
            carousel = $(params.target),
            indicators,
            inner,
            leftControl,
            rightControl;


        // build indicators
        indicators = $('<ol>').attr({'class': 'carousel-indicators'});

        data.forEach(function (d, i) {
            var li = $('<li>').attr({
                'data-target': '#' + carousel.attr('id'),
                'data-slide-to': i.toString()
            });
            if (i === 0) {
                li.toggleClass('active', true);
            }
            indicators.append(li);
        });


        // build inner
        inner = $('<div>').attr({'class': 'carousel-inner', 'role': 'listbox'});
        data.forEach(function (d, i) {
            var img = $('<img>')
                    .attr({
                        'class': 'img-responsive',
                        'src': d.src
                }),
                captionHeader = $('<h3>')
                    .text(d.caption.h),
                captionP = $('<p>')
                    .text(d.caption.p),
                captionDiv = $('<div>')
                    .attr({'class': 'carousel-caption'})
                    .append(captionHeader, captionP),
                item = $('<div>')
                    .attr({'class': 'item'})
                    .append(img);//, captionDiv);
            if (i === 0) {
                item.toggleClass('active', true);
            }
            inner.append(item);
        });

        // build controls
        leftControl = $('<a>')
            .attr({
                'class': 'left carousel-control',
                'href': '#' + carousel.attr('id'),
                'role': 'button',
                'data-slide': 'prev'
            })
            .append(
                $('<span>').attr({
                    'class': 'glyphicon glyphicon-chevron-left',
                    'aria-hidden': 'true'
                }),
                $('<span>')
                    .attr({'class': 'sr-only'})
                    .append('Previous')
            );

        rightControl = $('<a>')
            .attr({
                'class': 'right carousel-control',
                'href': '#' + carousel.attr('id'),
                'role': 'button',
                'data-slide': 'next'
            })
            .append(
                $('<span>').attr({
                    'class': 'glyphicon glyphicon-chevron-right',
                    'aria-hidden': 'true'
                }),
                $('<span>')
                    .attr({'class': 'sr-only'})
                    .append('Next')
            );

        carousel
            .toggleClass('carousel', true)
            .toggleClass('slide', true)
            .attr({'data-ride': 'carousel'})
            .append(indicators, inner, leftControl, rightControl);

        $(carousel).carousel();

        return carousel;
    };

    page.createFooter = function () {
        var small1 = $('<p>')
                .attr({'class': 'small'})
                .html('Copyright 2015 <a href="mailto:bwswedberg@gmail.com">Brian Swedberg</a>.' +
                ' <a href="http://opensource.org/licenses/MIT">MIT License</a>');
        return $('<footer>')
            .attr({'class': 'footer'})
            .append(small1);
    };

    return page;
});
