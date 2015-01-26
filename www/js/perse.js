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
    'perplots/perplots',
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
    perplots
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
        this.build();
        this.loadData();
    };

    perse.PerSE.prototype.build = function () {
        var mainRow = $('<div>').attr({'class': 'row'}),
            largeLeft = $('<div>').attr({'class': 'col-sm-6', 'id': 'perse-large'}),
            largeRight = $('<div>').attr({'class': 'col-sm-6'}),
            largeRightRow = $('<div>').attr({'class': 'container-fluid'}),
            mediumRightTop = $('<div>').attr({'class': 'col-sm-12', 'id': 'perse-medium'}),
            smRightBottomLeft = $('<div>').attr({'class': 'col-sm-6', 'id': 'perse-smleft'}),
            smRightBottomRight = $('<div>').attr({'class': 'col-sm-6', 'id': 'perse-smright'});
        this.container.append(mainRow);
        mainRow.append(largeLeft).append(largeRight);
        largeRight.append(largeRightRow);
        largeRightRow.append(mediumRightTop).append(smRightBottomLeft).append(smRightBottomRight);

        // permap section
        var perMap = new permap.PerMap()
            .render(mediumRightTop)
            .registerListener(this.coordinator.getFilterChangedListener());
        perMap.makeInteractive();
        this.coordinator.registerObserver(perMap);

        // perwheel section
        var perWheel = new perwheel.PerWheel()
            .render(smRightBottomLeft)
            .registerListener(this.coordinator.getFilterChangedListener());
        this.coordinator.registerObserver(perWheel);

        // perattr section
        var perAttr = new perattr.PerAttr()
            .render(smRightBottomRight)
            .registerListener(this.coordinator.getFilterChangedListener());
        this.coordinator.registerObserver(perAttr);

        // perplots section
        var perPlots = new perplots.PerPlots()
            .render(largeLeft)
            .registerListener(this.coordinator.getFilterChangedListener());
        this.coordinator.registerObserver(perPlots);

    };

    perse.PerSE.prototype.createNavBar = function () {
        var nav = $('<nav>').attr({'class': 'navbar navbar-default navbar-fixed-top'}),
            header = $('<div>').attr({'class': 'navbar-header'}),
            b = $('<p>').attr({'class': 'navbar-brand'}).text('PerSE'),
            p = $('<p>').attr({'class': 'navbar-text'}).text('Visual Analytics for Event Periodicity');
        header.append(b);
        nav.append(header).append(p);

        return header;
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