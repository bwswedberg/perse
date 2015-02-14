/**
 *  This file is part of PerSE. PerSE is a visual analytics app for
 *  event periodicity detection and analysis.
 *  Copyright (C) 2015  Brian Swedberg
 */

define([
    'ol'
], function (ol) {

    var drag = {};

    /**
     * @constructor
     * @extends {ol.interaction.Pointer}
     */
    drag.Drag = function (obj) {

        ol.interaction.Pointer.call(this, {
            handleDownEvent: drag.Drag.prototype.handleDownEvent,
            handleDragEvent: drag.Drag.prototype.handleDragEvent,
            handleMoveEvent: drag.Drag.prototype.handleMoveEvent,
            handleUpEvent: drag.Drag.prototype.handleUpEvent
        });

        this.layerFilter_ = obj.layerFilter || function () {return false; };

        /**
         * @type {ol.Pixel}
         * @private
         */
        this.coordinate_ = null;

        /**
         * @type {string|undefined}
         * @private
         */
        this.cursor_ = 'move';

        /**
         * @type {ol.Feature}
         * @private
         */
        this.feature_ = null;

        /**
         * @type {string|undefined}
         * @private
         */
        this.previousCursor_ = undefined;

        this.listeners = [];

    };
    ol.inherits(drag.Drag, ol.interaction.Pointer);

    /**
     * @param {ol.MapBrowserEvent} evt Map browser event.
     * @return {boolean} `true` to start the drag sequence.
     */
    drag.Drag.prototype.handleDownEvent = function(evt) {
        var map = evt.map;

        var feature = map.forEachFeatureAtPixel(
            evt.pixel,
            function(feature, layer) {
                return feature;
            },
            this,
            this.layerFilter_
        );

        if (feature) {
            this.coordinate_ = evt.coordinate;
            this.feature_ = feature;
        }
        this.notifyListeners('handleDownEvent', {'context': this});
        return !!feature;
    };


    /**
     * @param {ol.MapBrowserEvent} evt Map browser event.
     */
    drag.Drag.prototype.handleDragEvent = function(evt) {
        var map = evt.map;

        var feature = map.forEachFeatureAtPixel(
            evt.pixel,
            function(feature, layer) {
                return feature;
            },
            this,
            this.layerFilter_
        );

        var deltaX = evt.coordinate[0] - this.coordinate_[0];
        var deltaY = evt.coordinate[1] - this.coordinate_[1];

        var geometry = /** @type {ol.geom.SimpleGeometry} */
            (this.feature_.getGeometry());
        geometry.translate(deltaX, deltaY);

        this.coordinate_[0] = evt.coordinate[0];
        this.coordinate_[1] = evt.coordinate[1];
        this.notifyListeners('handleDragEvent', {'context': this});
    };


    /**
     * @param {ol.MapBrowserEvent} evt Event.
     */
    drag.Drag.prototype.handleMoveEvent = function(evt) {
        if (this.cursor_) {
            var map = evt.map;
            var feature = map.forEachFeatureAtPixel(
                evt.pixel,
                function(feature, layer) {
                    return feature;
                },
                this,
                this.layerFilter_
            );
            var element = evt.map.getTargetElement();
            if (feature) {
                if (element.style.cursor != this.cursor_) {
                    this.previousCursor_ = element.style.cursor;
                    element.style.cursor = this.cursor_;
                }
            } else if (this.previousCursor_ !== undefined) {
                element.style.cursor = this.previousCursor_;
                this.previousCursor_ = undefined;
            }
            this.notifyListeners('handleMoveEvent', {'context': this});
        }
    };


    /**
     * @param {ol.MapBrowserEvent} evt Map browser event.
     * @return {boolean} `false` to stop the drag sequence.
     */
    drag.Drag.prototype.handleUpEvent = function(evt) {
        this.coordinate_ = null;
        this.feature_ = null;
        this.notifyListeners('handleUpEvent', {'context': this});
        return false;
    };

    drag.Drag.prototype.notifyListeners = function (callbackStr, event) {
        this.listeners.forEach(function (listenerObj) {
            if (listenerObj[callbackStr]) {
                listenerObj[callbackStr].call(listenerObj.context, event);
            }
        }, this);
    };

    drag.Drag.prototype.registerListener = function (callbackObj) {
        this.listeners.push(callbackObj);
        return this;
    };

    return drag;

});
