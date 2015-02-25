/**
 *  This file is part of PerSE. PerSE is a visual analytics app for
 *  event periodicity detection and analysis.
 *  Copyright (C) 2015  Brian Swedberg
 */

define([
    'jquery',
    'perattrs/perattr',
    // No namespace
    'bootstrap'
], function ($, perattr) {

    var perattrs = {};

    perattrs.PerAttrs = function (container) {
        this.container = $('<div>').attr({'class': 'panel-body perse-perattr perse-panel-body'});
        this.listeners = [];
        this.metadata = undefined;
        this.plots = [];
    };

    perattrs.PerAttrs.prototype.render = function (parent) {
        var title = $('<p>')
                .attr({'class': 'perse-header-title'})
                .text('Attributes'),
            panelHeader = $('<div>')
                .attr({'class': 'panel-heading perse-panel-heading'})
                .append($('<div>').attr({'class': 'panel-title'}).append(title)),
            panel = $('<div>')
                .attr({'class': 'panel panel-default perse-perattr'})
                .append(panelHeader, this.container);

        parent.append(panel);

        return this;
    };

    perattrs.PerAttrs.prototype.build = function (data) {
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

        this.plots = [];

        this.metadata.attribute.attributeKeys.forEach(function (attributeName, i) {
            var id = 'perse-perattr-card-' + attributeName,
                label = this.metadata.attribute.attributes[attributeName].label + ' ',
                card = $('<div>').hide().attr({'class': 'perse-perattr-card', id: id}),
                button = $('<a>').attr({'role': 'menuitem'}).text(label),
                li = $('<li>').attr({'role': 'presentation', 'id': id}).append(button),
                plot;

            //this.container.append(card);
            plot = new perattr.PerAttr(attributeName)
                .render(card)
                .registerListener(this.createFilterChangedListener());
            plot.onDataSetChanged(data, this.metadata);

            if (i === 0) {
                b.text(label).append($('<span>').attr({'class': 'caret'}));
                card.addClass('active').show();
                li.addClass('active');
                this.container
                    .siblings('.panel-heading')
                    .find('.panel-title')
                    .append(plot.getToolbar());
            }

            this.plots.push(plot);

            // When title is clicked it changes to show that card / toolbar
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
                    .append(plot.getToolbar());
            }, this));
            menu.append(li);
            cardContainer.append(card);
        }, this);

        this.container.append(cardContainer);
    };

    perattrs.PerAttrs.prototype.createFilterChangedListener = function () {
        return {
            context: this,
            onFilterChanged: function (event) {
                this.notifyListeners('onFilterChanged', {context: this, filter: event.filter });
            }
        };
    };

    perattrs.PerAttrs.prototype.setContentAttribute = function (contentAttribute) {
        if (this.plots.length > 0) {
            this.plots.forEach(function (plot) {
                plot.setContentAttribute(contentAttribute);
            }, this);
        }
        return this;
    };

    perattrs.PerAttrs.prototype.onReset = function () {
        this.plots.forEach(function (plot) {
            plot.onReset();
        }, this);
    };

    perattrs.PerAttrs.prototype.onSelectionChanged = function (data) {
        this.plots.forEach(function (plot) {
            plot.onSelectionChanged(data);
        });
    };

    perattrs.PerAttrs.prototype.onDataSetChanged = function (data, metadata) {
        this.metadata = metadata;
        this.build(data);
    };

    perattrs.PerAttrs.prototype.notifyListeners = function (callbackStr, event) {
        this.listeners.forEach(function (listenerObj) {
            listenerObj[callbackStr].call(listenerObj.context, event);
        }, this);
    };

    perattrs.PerAttrs.prototype.registerListener = function (callbackObj) {
        this.listeners.push(callbackObj);
        return this;
    };

    return perattrs;

});