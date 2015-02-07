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
    'perattr/perattr',
    'pertimeline/pertimeline',
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
    perattr,
    pertimeline
) {

    var perse = {};

    perse.PerSE = function (parent) {
        this.container = $('<div>').addClass('container');
        $(parent)
            .append(this.container);
        this.coordinator = new coordination.Coordinator(this);
        this.dataSetAdapter = undefined;

    };

    perse.PerSE.prototype.init = function () {
        this.buildBigMap();
        this.loadData();
    };

    perse.PerSE.prototype.buildBigMap = function () {
        var largeLeft = $('<div>').attr({'class': 'col-md-9', 'id': 'perse-large-left'}),
            largeRight = $('<div>').attr({'class': 'col-md-3', 'id': 'perse-large-right'}),
            topRow = $('<div>').attr({'class': 'row'}).append(largeLeft, largeRight),
            top = $('<div>').attr({'class': 'col-md-12'})
                .append(topRow),
            bottom = $('<div>').attr({'class': 'col-md-12'}),
            main = $('<div>').attr({'class': 'row'})
                .append(top, bottom);

        this.container.append(main);

        // permap section
        var perMap = new permap.PerMap()
            .render(largeLeft)
            .registerListener(this.coordinator.getCoordinationListener());
        this.coordinator.registerObserver(perMap);

        // perattr section
        var perAttr = new perattr.PerAttr()
            .render(largeRight)
            .registerListener(this.coordinator.getCoordinationListener());
        this.coordinator.registerObserver(perAttr);

        // perwheel section
        var perWheel = new perwheel.PerWheel()
            .render(largeRight)
            .registerListener(this.coordinator.getCoordinationListener());
        this.coordinator.registerObserver(perWheel);

        // pertimeline section
        var perTimeline = new pertimeline.PerTimeline()
            .render(bottom)
            .registerListener(this.coordinator.getCoordinationListener());
        this.coordinator.registerObserver(perTimeline);

    };

    perse.PerSE.prototype.build = function () {
        var mainRow = $('<div>').attr({'class': 'row'}),
            largeLeft = $('<div>').attr({'class': 'col-md-6', 'id': 'perse-large'}),
            largeRight = $('<div>').attr({'class': 'col-md-6'}),
            longSkinny = $('<div>').attr({'class': 'col-md-12', 'id': 'perse-longskinny'}),
            largeRightRow = $('<div>').attr({'class': 'container-fluid'}),
            mediumRightTop = $('<div>').attr({'class': 'col-md-12', 'id': 'perse-medium'}),
            smRightBottomLeft = $('<div>').attr({'class': 'col-md-6', 'id': 'perse-smleft'}),
            smRightBottomRight = $('<div>').attr({'class': 'col-md-6', 'id': 'perse-smright'});
        this.container.append(mainRow);
        mainRow.append(largeLeft, largeRight, longSkinny);
        largeRight.append(largeRightRow);
        largeRightRow.append(mediumRightTop, smRightBottomLeft, smRightBottomRight);

        // perwheel section
        var perWheel = new perwheel.PerWheel()
            .render(smRightBottomLeft)
            .registerListener(this.coordinator.getCoordinationListener());
        this.coordinator.registerObserver(perWheel);

        // perattr section
        var perAttr = new perattr.PerAttr()
            .render(smRightBottomRight)
            .registerListener(this.coordinator.getCoordinationListener());
        this.coordinator.registerObserver(perAttr);

        // perplots section
        var perPlots = new perplots.PerPlots()
            .render(largeLeft)
            .registerListener(this.coordinator.getCoordinationListener());
        this.coordinator.registerObserver(perPlots);

        // permap section
        var perMap = new permap.PerMap()
            .render(mediumRightTop)
            .registerListener(this.coordinator.getCoordinationListener());
        perMap.makeInteractive();
        perMap.registerVoronoiObserver(perPlots);
        this.coordinator.registerObserver(perMap);

        // pertimeline section
        var perTimeline = new pertimeline.PerTimeline()
            .render(longSkinny)
            .registerListener(this.coordinator.getCoordinationListener());
        this.coordinator.registerObserver(perTimeline);

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
                .append(divHeader, navbar),
            header = $('<div>')
                .attr({'class': 'navbar navbar-default navbar-fixed-top'})
                .append(cont);

        return header;
    };

    perse.PerSE.prototype.createFooter = function () {

    };

    perse.PerSE.prototype.loadData = function () {
        var dataLoader = new dataloader.DataLoader(this.wrapper);
        dataLoader.registerListener({
            context: this,
            onLoad: function (event) {
                this.dataSetAdapter = new datasetadapter.DataSetAdapter(new crossfilterdataset.CrossfilterDataSet(event.data, event.metadata));
                this.coordinator.dataSetChanged();
            },
            onCancel: function () {
                console.log('onCancel', this);
            }
        });
        dataLoader.loadBuiltInData();
    };

    perse.PerSE.prototype.getDataSetAdapter = function () {
        return this.dataSetAdapter;
    };

    return perse;
});