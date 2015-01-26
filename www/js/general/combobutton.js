/**
 *  This file is part of PerSE. PerSE is a visual analytics app for
 *  event periodicity detection and analysis.
 *  Copyright (C) 2015  Brian Swedberg
 */

define([
    'jquery',
    // no namespace
    'bootstrap'
],function ($) {

    var combobutton = {};

    combobutton.ComboButton = function (params) {
        var defaults = {
            'label': 'Unknown:',
            'values': [
                {'alias': 'Alias A', 'id': 'id-1'},
                {'alias': 'Alias B', 'id': 'id-2'}
            ],
            'active': 'id-1'
        };
        this.params = {
            'label': params.label || defaults.label,
            'values': params.values || defaults.values,
            'active': params.active || defaults.active
        };

        this.listeners = [];
    };

    combobutton.ComboButton.prototype.render = function (parent) {
        var b = $('<button>')
                .attr({'class': 'btn btn-default dropdown-toggle btn-xs perse-btn', 'data-toggle':'dropdown'})
                .text(this.params.label + ' ')
                .append($('<span>').attr({'class': 'caret'})),
            menu = $('<ul>')
                .attr({'class': 'dropdown-menu', 'role': 'menu'}),
            dropdown = $('<span>')
                .attr({'class': 'dropdown col-sm-3'})
                .append(b)
                .append(menu),
            label = $('<span>').attr({'class': 'col-sm-3'}).text('Cycle:');

        this.cButton = b;

        this.params.values.forEach(function (d) {
            var button = $('<a>').attr({'role': 'menuitem'}).text(d.alias),
                li = $('<li>').attr({'role': 'presentation'}).append(button);
            button.click($.proxy(function () {
                var newAlias = $(button).text(),
                    newId = this.params.values.filter(function (d) {return newAlias === d.alias; })[0].id;
                b.text(newAlias);
                this.params.active = newId;
                this.notifyListeners('onComboChanged', {'context': this, 'active': newId});
            }, this));
            menu.append(li);
        }, this);

        $(parent).append(label, dropdown);

        return this;
    };

    combobutton.ComboButton.getParams = function () {
        return this.params;
    };

    combobutton.ComboButton.prototype.notifyListeners = function (callbackStr, event) {
        this.listeners.forEach(function (listenerObj) {
            listenerObj[callbackStr].call(listenerObj.context, event);
        }, this);
    };

    combobutton.ComboButton.prototype.registerListener = function (callbackObj) {
        this.listeners.push(callbackObj);
        return this;
    };

    return combobutton;

});