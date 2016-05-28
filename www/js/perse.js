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
    'data/metadata/builtinmetadata',
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
    pertoolbar,
    builtinmetadata
) {

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
        this.loadData(builtinmetadata.nigeria0814);
        return this;
    };

    perse.PerSE.prototype.build = function () {
        var largeLeft = $('<div>')
                .attr({'class': 'col-xs-2', 'id': 'perse-large-left'}),
            largeRight = $('<div>')
                .attr({'class': 'col-xs-10', 'id': 'perse-large-right'}),
            topRow = $('<div>')
                .attr({'class': 'row', 'id': 'perse-top-row'})
                .append(largeLeft, largeRight),
            top = $('<div>')
                .attr({'class': 'col-xs-12'})
                .append(topRow),
            middle = $('<div>')
                .attr({'class': 'col-xs-12'}),
            bottom = $('<div>')
                .attr({'class': 'col-xs-12'}),
            main = $('<div>')
                .attr({'class': 'row'})
                .append(top, middle, bottom);

        this.container.append(main);

        // permap section
        var perMap = new permap.PerMap()
            .render(largeRight)
            .registerListener(this.coordinator.createListener());
        this.coordinator.registerObserver(perMap);

        // pertoolbar section
        new pertoolbar.PerToolbar()
            .render(largeLeft)
            .registerListener({
                'context': this,
                'onReset': function () {
                    this.coordinator.onReset();
                },
                'onCalendarChanged': function (event) {
                    this.coordinator.setCalendar(event.calendarName);
                    this.coordinator.onRefresh();
                },
                'onDataSetChanged': function (event) {
                    this.loadData(event.builtInDataSetMetadata);
                }
            });

        // perattr section
        var perAttrs = new perattrs.PerAttrs()
            .render(largeLeft)
            .registerListener(this.coordinator.createListener());
        this.coordinator.registerObserver(perAttrs);

        // perwheel section
        var perWheel = new perwheel.PerWheel()
            .render(largeLeft, true)
            .setShouldAnimate(true)
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

    perse.PerSE.prototype.loadData = function (builtInDataSetMetadata) {
        var dataLoader = new dataloader.DataLoader();
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
        dataLoader.loadBuiltInData(builtInDataSetMetadata);
    };

    return perse;
});
