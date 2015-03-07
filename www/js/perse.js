/**
 *  This file is part of PerSE. PerSE is a visual analytics app for
 *  event periodicity detection and analysis.
 *  Copyright (C) 2015  Brian Swedberg
 */

define([
    'jquery',
    'data/dataloader',
    'data/datasetadapter',
    'data/crossfilterdataset',
    'coordination/coordinator',
    'permap/permap',
    'perwheel/perwheel',
    'perattrs/perattrs',
    'pertimeline/pertimeline',
    'pertable/pertable',
    'pertoolbar/pertoolbar',
    // No namespace
    'bootstrap'
], function (
    $,
    dataloader,
    datasetadapter,
    crossfilterdataset,
    coordination,
    permap,
    perwheel,
    perattrs,
    pertimeline,
    pertable,
    pertoolbar
) {

    //localhost:8080/WebStormProjects/perse-two/www/index.html
    var perse = {};

    perse.PerSE = function () {
        this.container = undefined;
        this.coordinator = new coordination.Coordinator();
        this.onLoadEndCallback = undefined;
    };

    perse.PerSE.prototype.render = function (parent) {
        this.container = $(parent).addClass('container');
        return this;
    };

    perse.PerSE.prototype.init = function () {
        this.build();
        this.loadData();
        return this;
    };

    perse.PerSE.prototype.build = function () {
        var largeLeft = $('<div>')
                .attr({'class': 'col-md-10', 'id': 'perse-large-left'}),
            largeRight = $('<div>')
                .attr({'class': 'col-md-2', 'id': 'perse-large-right'}),
            topRow = $('<div>')
                .attr({'class': 'row', 'id': 'perse-top-row'})
                .append(largeLeft, largeRight),
            top = $('<div>')
                .attr({'class': 'col-md-12'})
                .append(topRow),
            middle = $('<div>')
                .attr({'class': 'col-md-12'}),
            bottom = $('<div>')
                .attr({'class': 'col-md-12'}),
            main = $('<div>')
                .attr({'class': 'row'})
                .append(top, middle, bottom);

        this.container.append(main);

        // permap section
        var perMap = new permap.PerMap()
            .render(largeLeft)
            .registerListener(this.coordinator.createListener());
        this.coordinator.registerObserver(perMap);

        // pertoolbar section
        new pertoolbar.PerToolbar()
            .render(largeRight)
            .registerListener({
                'context': this,
                'onReset': function () {
                    this.coordinator.onReset();
                },
                'onCalendarChanged': function (event) {
                    this.coordinator.setCalendar(event.calendarName);
                    this.coordinator.onRefresh();
                }
            });

        // perattr section
        var perAttrs = new perattrs.PerAttrs()
            .render(largeRight)
            .registerListener(this.coordinator.createListener());
        this.coordinator.registerObserver(perAttrs);

        // perwheel section
        var perWheel = new perwheel.PerWheel()
            .render(largeRight, true)
            .registerListener(this.coordinator.createListener());
        this.coordinator.registerObserver(perWheel);

        // pertimeline section
        var perTimeline = new pertimeline.PerTimeline()
            .render(middle)
            .registerListener(this.coordinator.createListener());
        this.coordinator.registerObserver(perTimeline);

        // pertable section
        var perTable = new pertable.PerTable()
            .render(bottom)
            .registerListener(this.coordinator.createListener());
        this.coordinator.registerObserver(perTable);

    };

    perse.PerSE.prototype.createNavBar = function () {
        var // ------ title/sub ----
            b = $('<a>')
                .attr({'class': 'navbar-brand', 'href': './index.html'})
                .text('PerSE'),
            p = $('<p>')
                .attr({'class': 'navbar-text'})
                .text('Visual Analytics for Event Periodicity Detection and Analysis'),
            divHeader = $('<div>')
                .attr({'class': 'navbar-header'})
                .append(b, p),
            // ----- Navbar stuff ------
            aAbout = $('<a>')
                .attr({'href': './about.html'})
                .text('About'),
            aHelp = $('<a>')
                .attr({'href': './help.html'})
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
        return $('<div>')
                .attr({'class': 'navbar navbar-default navbar-fixed-top'})
                .append(cont);
    };

    perse.PerSE.prototype.onLoadEnd = function (callback) {
        this.onLoadEndCallback = callback;
        return this;
    };

    perse.PerSE.prototype.show = function () {
        this.container.css({'visibility': 'visible'});
        return this;
    };

    perse.PerSE.prototype.hide = function () {
        this.container.css({'visibility': 'hidden'});
        return this;
    };

    perse.PerSE.prototype.createFooter = function () {

    };

    perse.PerSE.prototype.loadData = function () {
        var dataLoader = new dataloader.DataLoader(this.wrapper);
        dataLoader.registerListener({
            context: this,
            onLoad: function (event) {
                var cfDataSetAdapter = new crossfilterdataset.CrossfilterDataSet(event.data, event.metadata),
                    dataSetAdapter = new datasetadapter.DataSetAdapter(cfDataSetAdapter);
                this.coordinator.registerDataSetAdapter(dataSetAdapter);
                this.coordinator.dataSetChanged();

                // Make sure all animations are finished globally
                $(':animated').promise().done($.proxy(function () {
                    this.coordinator.setCalendar('gregorian');
                    this.coordinator.setContentAttribute('attribute_0');
                    this.coordinator.onRefresh();
                    this.onLoadEndCallback();
                }, this));
            },
            onCancel: function () {
                console.log('onCancel', this);
            }
        });
        dataLoader.loadBuiltInData();
    };

    return perse;
});
