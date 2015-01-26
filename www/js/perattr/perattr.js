/**
 *  This file is part of PerSE. PerSE is a visual analytics app for
 *  exploring spatiotemporal periodicity.
 *  Copyright (C) 2014  Brian Swedberg
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

define([
    'jquery',
    'perattr/histogram',
    // No namespace
    'bootstrap'
], function ($, histogram) {

    var perattr = {};

    perattr.PerAttr = function (container) {
        this.container = $('<div>').attr({'class': 'container-fluid perse-perattr'});;
        this.listeners = [];
        this.metadata = undefined;
        this.histograms = [];
    };

    perattr.PerAttr.prototype.render = function (parent) {
        $(parent).append(this.container);
        return this;
    };

    perattr.PerAttr.prototype.build = function (data) {
        var content = $('<div>').attr({'class': 'perse-perattr-content'});

        this.histograms = [];

        var b = $('<a>')
                .attr({'class': 'btn-default dropdown-toggle perse-btn', 'data-toggle':'dropdown'}),
            menu = $('<ul>')
                .attr({'class': 'dropdown-menu', 'role': 'menu'}),
            dropdown = $('<h3>')
                .attr({'class': 'dropdown'})
                .append(b)
                .append(menu);

        content.append(dropdown);

        this.metadata.getMetadata().attribute.attributeKeys.forEach(function (attributeName, i) {
            var id = 'perse-perattr-panel-' + attributeName,
                label = this.metadata.getMetadata().attribute.attributes[attributeName].label,
                panel = $('<div>').hide().attr({'class': 'perse-perattr-panel', id: id}),
                button = $('<a>').attr({'role': 'menuitem'}).text(label),
                li = $('<li>').attr({'role': 'presentation'}).append(button),
                hist;

            if (i === 0) {
                b.append($('<h3>').text(label).append($('<span>').attr({'class': 'caret'})));
                panel.addClass('active').show();
                li.addClass('active')
            }

            content.append(panel);
            hist = new histogram.Histogram(attributeName)
                .render(panel)
                .registerListener(this.createFilterChangedListener())
            hist.onDataSetChanged(data, this.metadata);

            this.histograms.push(hist);

            button.click($.proxy(function () {
                b.find('h3').text($(button).text()).append($('<span>').attr({'class': 'caret'}));
                content.find('.perse-perattr-panel.active').removeClass('active').hide();
                content.find('#' + id).addClass('active').show();
            }, this));
            menu.append(li);
            content.append(panel);
        }, this);

        /////////


        this.container.append(content);
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