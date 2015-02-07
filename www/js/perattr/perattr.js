/**
 *  This file is part of PerSE. PerSE is a visual analytics app for
 *  event periodicity detection and analysis.
 *  Copyright (C) 2015  Brian Swedberg
 */

define([
    'jquery',
    'perattr/histogram',
    // No namespace
    'bootstrap'
], function ($, histogram) {

    var perattr = {};

    perattr.PerAttr = function (container) {
        this.container = $('<div>').attr({'class': 'panel-body'});
        this.listeners = [];
        this.metadata = undefined;
        this.histograms = [];
    };

    perattr.PerAttr.prototype.render = function (parent) {
        var title = $('<p>')
                .attr({'class': 'perse-header-title'})
                .text('Attributes'),
            panelHeader = $('<div>')
                .attr({'class': 'panel-heading'})
                .append($('<div>').attr({'class': 'panel-title'}).append(title)),
            panel = $('<div>')
                .attr({'class': 'panel panel-default perse-perattr'})
                .append(panelHeader, this.container);

        parent.append(panel);

        return this;
    };

    perattr.PerAttr.prototype.build = function (data) {
        var cardContainer = $('<div>').attr({'class': 'perse-perattr-cardcontainer'}),
            b = $('<button>')
                .attr({'class': 'btn btn-link btn-md dropdown-toggle', 'data-toggle': 'dropdown'}),
            menu = $('<ul>')
                .attr({'class': 'dropdown-menu', 'role': 'menu'}),
            dropdown = $('<div>')
                .attr({'class': 'dropdown perse-header-title perse-perattr-title'})
                .append(b, menu);

        this.container
            .siblings('.panel-heading')
            .find('.panel-title ')
            .empty()
            .append(dropdown);

        this.histograms = [];

        this.metadata.getMetadata().attribute.attributeKeys.forEach(function (attributeName, i) {
            var id = 'perse-perattr-card-' + attributeName,
                label = this.metadata.getMetadata().attribute.attributes[attributeName].label + ' ',
                card = $('<div>').hide().attr({'class': 'perse-perattr-card', id: id}),
                button = $('<a>').attr({'role': 'menuitem'}).text(label),
                li = $('<li>').attr({'role': 'presentation', 'id': id}).append(button),
                hist;

            //this.container.append(card);
            hist = new histogram.Histogram(attributeName)
                .render(card)
                .registerListener(this.createFilterChangedListener());
            hist.onDataSetChanged(data, this.metadata);

            if (i === 0) {
                b.text(label).append($('<span>').attr({'class': 'caret'}));
                card.addClass('active').show();
                li.addClass('active');
                this.container
                    .siblings('.panel-heading')
                    .find('.panel-title')
                    .append(hist.getToolbar());
            }

            this.histograms.push(hist);

            button.click($.proxy(function () {
                b.text($(button).text() + ' ').append($('<span>').attr({'class': 'caret'}));
                cardContainer.find('.perse-perattr-card.active').removeClass('active').hide();
                cardContainer.find('div#' + id).addClass('active').show();
                menu.find('.active').removeClass('active');
                menu.find('li#' + id).addClass('active');

                this.container
                    .siblings('.panel-heading')
                    .find('.panel-title .perse-header-toolbar')
                    .remove();
                this.container
                    .siblings('.panel-heading')
                    .find('.panel-title')
                    .append(hist.getToolbar());
            }, this));
            menu.append(li);
            cardContainer.append(card);
        }, this);

        this.container.append(cardContainer);
    };

    perattr.PerAttr.prototype.build_dep = function (data) {
        var tabPanel = $('<div>').attr({'role': 'tabpanel'}),
            navTabs = $('<ul>').attr({'class': 'nav nav-tabs perse-perattr-navtabs', 'role': 'tablist'}),
            tabContent = $('<div>').attr({'class': 'tab-content'});

        tabPanel.append(navTabs, tabContent);

        this.histograms = [];

        this.metadata.getMetadata().attribute.attributeKeys.forEach(function (attributeName, i) {
            var id = 'perse-perattr-tab-' + attributeName,
                label = this.metadata.getMetadata().attribute.attributes[attributeName].label,
                panel = $('<div>').attr({'class': 'tab-pane', 'role': 'tabpanel', 'id': id}),
                a = $('<a>').attr({'href': '#' + id, 'aria-controls': id, 'role': 'tab', 'data-toggle': 'tab'}).text(label),
                li = $('<li>').attr({'role': 'presentation'}).append(a),
                hist;

            if (i === 0) {
                panel.addClass('active')
                li.addClass('active')
            }

            navTabs.append(li);
            tabContent.append(panel);
            hist = new histogram.Histogram(attributeName)
                .render(panel)
                .registerListener(this.createFilterChangedListener())
            hist.onDataSetChanged(data, this.metadata);
            //this.registerListener(hist);
            this.histograms.push(hist);
        }, this);

        this.container.append(tabPanel);
    };

    perattr.PerAttr.prototype.notifyListeners = function (callbackStr, event) {
        this.listeners.forEach(function (listenerObj) {
            listenerObj[callbackStr].call(listenerObj.context, event);
        }, this);
    };

    perattr.PerAttr.prototype.registerListener = function (callbackObj) {
        this.listeners.push(callbackObj);
        return this;
    };

    perattr.PerAttr.prototype.onSelectionChanged = function (data) {
        this.histograms.forEach(function (h) {
            h.onSelectionChanged(data);
        });
    };

    perattr.PerAttr.prototype.createFilterChangedListener = function () {
        return {
            context: this,
            onFilterChanged: function (event) {
                this.notifyListeners('onFilterChanged', {context: this, filter: event.filter });
            }
        }
    };

    perattr.PerAttr.prototype.onDataSetChanged = function (data, metadata) {
        this.metadata = metadata;
        this.build(data);
    };

    return perattr;

});