/**
 *  This file is part of PerSE. PerSE is a visual analytics app for
 *  event periodicity detection and analysis.
 *  Copyright (C) 2015  Brian Swedberg
 */

define([
    'jquery',
    'permap/map',
    'perplots/perplots',
    'data/filter'
], function ($, map, perplots, filter) {

    var permap = {};

    permap.PerMap = function () {
        this.container = $('<div>').attr({'class': 'panel-body perse-panel-body'});
        this.metadata = undefined;
        this.listeners = [];
        this.toolbarListeners = [];
        this.perPlots = undefined;
        this.map = undefined;
        this.filter = new filter.Filter({
            uniqueId: 'perse-permap',
            property: 'coord',
            filterOn: function () {return true; }
        });
    };

    permap.PerMap.prototype.render = function (container) {
        var title = $('<p>')
                .attr({'class': 'perse-header-title'})
                .text('Map'),
            panelHeader = $('<div>')
                .attr({'class': 'panel-heading perse-panel-heading'})
                .append($('<div>').attr({'class': 'panel-title'}).append(title, this.createControls())),
            panel = $('<div>')
                .attr({'class': 'panel panel-default perse-permap'})
                .append(panelHeader, this.container);

        $(container).append(panel);

        return this;
    };

    permap.PerMap.prototype.build = function (data) {
        this.map = new map.Map()
            .render(this.container)
            .registerListener(this.createPerMapListener());
        this.registerToolbarListener(this.map.createToolbarListener());

        this.perPlots = new perplots.PerPlots()
            .render(this.container)
            .registerListener(this.createPerMapListener());
        this.registerToolbarListener(this.perPlots.createToolbarListener());

        this.map.onDataSetChanged(data, this.metadata);
        this.perPlots.setVoronoiPolygons(this.map.getVoronoiPolygonLayer());
        this.perPlots.onDataSetChanged(data, this.metadata);
    };

    permap.PerMap.prototype.update = function (data) {
        this.map.onSelectionChanged(data);
        this.perPlots.setVoronoiPolygons(this.map.getVoronoiPolygonLayer());
        this.perPlots.onSelectionChanged(data);
    };

    permap.PerMap.prototype.createPerMapListener = function () {
        return {
            context: this,
            onFilterChanged: function (event) {
                this.notifyListeners('onFilterChanged', {context: this, filter: this.getFilter()});
            },
            onRemoveFilter: function (event) {
                this.notifyListeners('onRemoveFilter', {context: this, filter: this.getFilter()});
            },
            onDataSetRequested: function (event) {
                this.notifyListeners('onDataSetRequested', {context: this, callback: this.onSelectionChanged});
            }
        };
    };

    permap.PerMap.prototype.createControls = function () {
        var zoom = this.createZoomControlButtonGroup(),
            cycle = this.createCycleButtonGroup(),
            cal = this.createCalendarButtonGroup(),
            seed = this.createSeedControlButtonGroup(),
            filterC = this.createFilterControlButtonGroup();
        return $('<div>')
            .attr({'class': 'btn-toolbar perse-header-toolbar', 'role': 'toolbar'})
            .append(zoom, cycle, cal, seed, filterC);
    };

    permap.PerMap.prototype.createFilterControlButtonGroup = function () {
        return $('<div>')
            .attr({'class': 'btn-group', 'role': 'group'})
            .append(
                this.createDrawControlButton(),
                this.createResetControlButton()
            );
    };

    permap.PerMap.prototype.createResetControlButton = function () {
        var filterIcon = $('<span>')
                .attr({'class': 'glyphicon glyphicon-filter', 'aria-hidden': 'true'}),
            filterButton = $('<button>')
                .attr({'class': 'btn btn-default btn-xs', 'type': 'button', 'title': 'Reset Filter'})
                .append(filterIcon);

        filterButton.on('mouseup', $.proxy(function () {
            $(filterButton).blur();
            this.notifyToolbarListeners('onRemoveShape', {'context': this});
        }, this));

        return filterButton;
    };

    permap.PerMap.prototype.createDrawControlButton = function () {
        var // menu
            drawHeader = $('<li>').attr({'class': 'dropdown-header', 'role': 'presentation'}).text('Draw'),
            polygon = $('<a>').attr({'role': 'menuitem'}).text('Polygon '),
            circle = $('<a>').attr({'role': 'menuitem'}).text('Circle '),
            divider1 = $('<li>').attr({'class': 'divider', 'role': 'presentation'}),
            actionHeader = $('<li>').attr({'class': 'dropdown-header', 'role': 'presentation'}).text('Edit'),
            modify = $('<a>').attr({'role': 'menuitem'}).text('Modify '),
            move = $('<a>').attr({'role': 'menuitem'}).text('Move '),
            divider2 = $('<li>').attr({'class': 'divider', 'role': 'presentation'}),
            remove = $('<a>').attr({'role': 'menuitem'}).text('Remove'),
            menu = $('<ul>')
            .attr({'class': 'dropdown-menu', 'role': 'menu'})
            .append([
                drawHeader,
                $('<li>').attr({'role': 'presentation'}).append(polygon),
                $('<li>').attr({'class': 'disabled', 'role': 'presentation'}).append(circle),
                divider1,
                actionHeader,
                $('<li>').attr({'role': 'presentation'}).append(modify),
                $('<li>').attr({'role': 'presentation'}).append(move),
                divider2,
                $('<li>').attr({'role': 'presentation'}).append(remove)
            ]),
        // button
            pencilIcon = $('<span>').attr({'class': 'glyphicon glyphicon-pencil', 'aria-hidden': 'true'}),
            pencilButton = $('<button>')
            .attr({
                'class': 'btn btn-default btn-xs dropdown-toggle',
                'type': 'button',
                'data-toggle': 'dropdown',
                'title': 'Draw Geospatial Filter'
            })
            .append(pencilIcon, ' ', $('<span>').attr({'class': 'caret'}));

        // add events here
        polygon.on('mouseup', $.proxy(function () {
            this.notifyToolbarListeners('onInteractionModeChanged', {'context': this, 'mode': 'drawFilter', 'shape': 'Polygon'});
        }, this));

        circle.on('mouseup', $.proxy(function () {
            this.notifyToolbarListeners('onInteractionModeChanged', {'context': this, 'mode': 'drawFilter', 'shape': 'Circle'});
        }, this));

        modify.on('mouseup', $.proxy(function () {
            if (modify.find('.glyphicon').length) {
                modify.find('.glyphicon').remove();
                this.notifyToolbarListeners('onInteractionModeChanged', {'context': this, 'mode': 'none'});
            } else {
                menu.find('li a span').remove();
                modify.append($('<span>').attr({'class': 'glyphicon glyphicon-ok-sign', 'aria-hidden': 'true'}));
                this.notifyToolbarListeners('onInteractionModeChanged', {'context': this, 'mode': 'modifyFilter'});
            }
        }, this));

        move.on('mouseup', $.proxy(function () {
            if (move.find('.glyphicon').length) {
                move.find('.glyphicon').remove();
                this.notifyToolbarListeners('onInteractionModeChanged', {'context': this, 'mode': 'none'});
            } else {
                menu.find('li a span').remove();
                move.append($('<span>').attr({'class': 'glyphicon glyphicon-ok-sign', 'aria-hidden': 'true'}));
                this.notifyToolbarListeners('onInteractionModeChanged', {'context': this, 'mode': 'moveFilter'});
            }
        }, this));

        remove.on('mouseup', $.proxy(function () {
            move.find('.glyphicon').remove();
            modify.find('.glyphicon').remove();
            this.notifyToolbarListeners('onInteractionModeChanged', {'context': this, 'mode': 'none'});
            this.notifyToolbarListeners('onRemoveShape', {'context': this});
        }, this));

        return $('<div>').attr({'class': 'btn-group', 'role': 'group'}).append(pencilButton, menu);
    };

    permap.PerMap.prototype.createZoomControlButtonGroup = function () {
        var zoomInIcon = $('<span>')
                .attr({'class': 'glyphicon glyphicon-zoom-in', 'aria-hidden': 'true'}),
            zoomInButton = $('<button>')
                .attr({'class': 'btn btn-default btn-xs', 'type': 'button', 'title': 'Zoom In'})
                .append(zoomInIcon),
            zoomOutIcon = $('<span>')
                .attr({'class': 'glyphicon glyphicon-zoom-out', 'aria-hidden': 'true', 'title': 'Zoom Out'}),
            zoomOutButton = $('<button>')
                .attr({'class': 'btn btn-default btn-xs', 'type': 'button'})
                .append(zoomOutIcon);

        zoomInButton.on('mouseup', $.proxy(function () {
            this.notifyToolbarListeners('onZoomIn', {'context': this});
            $(zoomInButton).blur();
        }, this));

        zoomOutButton.on('mouseup', $.proxy(function () {
            this.notifyToolbarListeners('onZoomOut', {'context': this});
            $(zoomOutButton).blur();
        }, this));

        return $('<div>')
            .attr({'class': 'btn-group', 'role': 'group'})
            .append(zoomInButton, zoomOutButton);
    };

    permap.PerMap.prototype.createCalendarButtonGroup = function () {
        var // menu
            calendarHeader = $('<li>').attr({'class': 'dropdown-header', 'role': 'presentation'}).text('Calendar'),
            gregorian = $('<a>').attr({'role': 'menuitem'}).text('Gregorian '),
            islamic = $('<a>').attr({'role': 'menuitem'}).text('Islamic ').append($('<span>').attr({'class': 'glyphicon glyphicon-ok-sign', 'aria-hidden': 'true'})),
            menu = $('<ul>')
            .attr({'class': 'dropdown-menu', 'role': 'menu'})
            .append([
                calendarHeader,
                $('<li>').attr({'role': 'presentation'}).append(gregorian),
                $('<li>').attr({'role': 'presentation'}).append(islamic)
            ]),
        // button
            calendarIcon = $('<span>').attr({'class': 'glyphicon glyphicon-calendar', 'aria-hidden': 'true'}),
            calendarButton = $('<button>').attr({
                'class': 'btn btn-default btn-xs dropdown-toggle',
                'type': 'button',
                'data-toggle': 'dropdown',
                'title': 'Change Calendar System'
            })
            .append(calendarIcon, ' ',  $('<span>').attr({'class': 'caret'}));

        // add events here
        gregorian.on('mouseup', $.proxy(function () {
            this.notifyToolbarListeners('onCalendarChanged', {'context': this, 'calendarName': 'gregorian'});
            menu.find('li a span').remove();
            gregorian.append($('<span>').attr({'class': 'glyphicon glyphicon-ok-sign', 'aria-hidden': 'true'}));
        }, this));

        islamic.on('mouseup', $.proxy(function () {
            this.notifyToolbarListeners('onCalendarChanged', {'context': this, 'calendarName': 'islamic'});
            menu.find('li a span').remove();
            islamic.append($('<span>').attr({'class': 'glyphicon glyphicon-ok-sign', 'aria-hidden': 'true'}));
        }, this));

        return $('<div>').attr({'class': 'btn-group', 'role': 'group'}).append(calendarButton, menu);
    };

    permap.PerMap.prototype.createCycleButtonGroup = function () {
        var // menu
            calendarHeader = $('<li>').attr({'class': 'dropdown-header', 'role': 'presentation'}).text('Cycle'),
            monthOfYear = $('<a>').attr({'role': 'menuitem'}).text('Month of Year ').append($('<span>').attr({'class': 'glyphicon glyphicon-ok-sign', 'aria-hidden': 'true'})),
            weekOfYear = $('<a>').attr({'role': 'menuitem'}).text('Week of Year '),
            dayOfMonth = $('<a>').attr({'role': 'menuitem'}).text('Day of Month '),
            dayOfWeek = $('<a>').attr({'role': 'menuitem'}).text('Day of Week '),
            menu = $('<ul>')
            .attr({'class': 'dropdown-menu', 'role': 'menu'})
            .append([
                calendarHeader,
                $('<li>').attr({'role': 'presentation'}).append(monthOfYear),
                $('<li>').attr({'role': 'presentation'}).append(weekOfYear),
                $('<li>').attr({'role': 'presentation'}).append(dayOfMonth),
                $('<li>').attr({'role': 'presentation'}).append(dayOfWeek)
            ]),
        // button
            cycleIcon = $('<span>').attr({'class': 'glyphicon glyphicon-stats', 'aria-hidden': 'true'}),
            cycleButton = $('<button>')
            .attr({
                'class': 'btn btn-default btn-xs dropdown-toggle',
                'type': 'button',
                'data-toggle': 'dropdown',
                'title': 'Change Temporal Cycle'
            })
            .append(cycleIcon, ' ', $('<span>').attr({'class': 'caret'}));

        // add events here
        monthOfYear.on('mouseup', $.proxy(function () {
            this.notifyToolbarListeners('onCycleChanged', {'context': this, 'cycleName': 'MonthOfYear'});
            menu.find('li a span').remove();
            monthOfYear.append($('<span>').attr({'class': 'glyphicon glyphicon-ok-sign', 'aria-hidden': 'true'}));
        }, this));

        weekOfYear.on('mouseup', $.proxy(function () {
            this.notifyToolbarListeners('onCycleChanged', {'context': this, 'cycleName': 'WeekOfYear'});
            menu.find('li a span').remove();
            weekOfYear.append($('<span>').attr({'class': 'glyphicon glyphicon-ok-sign', 'aria-hidden': 'true'}));
        }, this));

        dayOfMonth.on('mouseup', $.proxy(function () {
            this.notifyToolbarListeners('onCycleChanged', {'context': this, 'cycleName': 'DayOfMonth'});
            menu.find('li a span').remove();
            dayOfMonth.append($('<span>').attr({'class': 'glyphicon glyphicon-ok-sign', 'aria-hidden': 'true'}));
        }, this));

        dayOfWeek.on('mouseup', $.proxy(function () {
            this.notifyToolbarListeners('onCycleChanged', {'context': this, 'cycleName': 'DayOfWeek'});
            menu.find('li a span').remove();
            dayOfWeek.append($('<span>').attr({'class': 'glyphicon glyphicon-ok-sign', 'aria-hidden': 'true'}));
        }, this));

        return $('<div>').attr({'class': 'btn-group', 'role': 'group'}).append(cycleButton, menu);
    };

    permap.PerMap.prototype.createSeedControlButtonGroup = function () {
        var // menu
            positioningHeader = $('<li>').attr({'class': 'dropdown-header', 'role': 'presentation'}).text('Positioning'),
            fixed = $('<a>').attr({'role': 'menuitem'}).text('Fixed ').append($('<span>').attr({'class': 'glyphicon glyphicon-ok-sign', 'aria-hidden': 'true'})),
            auto = $('<a>').attr({'role': 'menuitem'}).text('Auto '),
            divider1 = $('<li>').attr({'class': 'divider', 'role': 'presentation'}),
            editHeader = $('<li>').attr({'class': 'dropdown-header', 'role': 'presentation'}).text('Edit'),
            add = $('<a>').attr({'role': 'menuitem'}).text('Add '),
            move = $('<a>').attr({'role': 'menuitem'}).text('Move '),
            remove = $('<a>').attr({'role': 'menuitem'}).text('Remove '),
            divider2 = $('<li>').attr({'class': 'divider', 'role': 'presentation'}),
            reset = $('<a>').attr({'role': 'menuitem'}).text('Reset'),
            menu = $('<ul>')
            .attr({'class': 'dropdown-menu', 'role': 'menu'})
            .append([
                positioningHeader,
                $('<li>').attr({'role': 'presentation'}).append(fixed),
                $('<li>').attr({'role': 'presentation'}).append(auto),
                divider1,
                editHeader,
                $('<li>').attr({'role': 'presentation'}).append(add),
                $('<li>').attr({'role': 'presentation'}).append(move),
                    $('<li>').attr({'role': 'presentation'}).append(remove),
                divider2,
                $('<li>').attr({'role': 'presentation'}).append(reset)
            ]),
        // button
            seedIcon = $('<span>').attr({'class': 'glyphicon glyphicon-record', 'aria-hidden': 'true'}),
            seedButton = $('<button>')
            .attr({'class': 'btn btn-default btn-xs dropdown-toggle', 'type': 'button', 'data-toggle': 'dropdown'})
            .append(seedIcon, ' ', $('<span>').attr({'class': 'caret'}));

        // add events here
        fixed.on('mouseup', $.proxy(function () {
            // make seeds stay at the same location regardless of extent of what is selected
            this.notifyToolbarListeners('onVoronoiPositioningChanged', {'context': this, 'positioning': 'fixed'});
            auto.find('span').remove();
            fixed.append($('<span>').attr({'class': 'glyphicon glyphicon-ok-sign', 'aria-hidden': 'true'}));
        }, this));

        auto.on('mouseup', $.proxy(function () {
            // make seeds change based on the extent of what is selected
            this.notifyToolbarListeners('onVoronoiPositioningChanged', {'context': this, 'positioning': 'auto'});
            fixed.find('span').remove();
            auto.append($('<span>').attr({'class': 'glyphicon glyphicon-ok-sign', 'aria-hidden': 'true'}));
        }, this));

        add.on('mouseup', $.proxy(function () {
            if (add.find('.glyphicon').length) {
                add.find('.glyphicon').remove();
                this.notifyToolbarListeners('onInteractionModeChanged', {'context': this, 'mode': 'none'});
            } else {
                move.find('span').remove();
                remove.find('span').remove();
                add.append($('<span>').attr({'class': 'glyphicon glyphicon-ok-sign', 'aria-hidden': 'true'}));
                this.notifyToolbarListeners('onInteractionModeChanged', {'context': this, 'mode': 'addVoronoi'});
            }
        }, this));

        move.on('mouseup', $.proxy(function () {

            if (move.find('.glyphicon').length) {
                move.find('.glyphicon').remove();
                this.notifyToolbarListeners('onInteractionModeChanged', {'context': this, 'mode': 'none'});
            } else {
                add.find('span').remove();
                remove.find('span').remove();
                move.append($('<span>').attr({'class': 'glyphicon glyphicon-ok-sign', 'aria-hidden': 'true'}));
                this.notifyToolbarListeners('onInteractionModeChanged', {'context': this, 'mode': 'moveVoronoi'});
            }
        }, this));

        remove.on('mouseup', $.proxy(function () {
            if (remove.find('.glyphicon').length) {
                remove.find('.glyphicon').remove();
                this.notifyToolbarListeners('onInteractionModeChanged', {'context': this, 'mode': 'none'});
            } else {
                add.find('span').remove();
                move.find('span').remove();
                remove.append($('<span>').attr({'class': 'glyphicon glyphicon-ok-sign', 'aria-hidden': 'true'}));
                this.notifyToolbarListeners('onInteractionModeChanged', {'context': this, 'mode': 'removeVoronoi'});
            }
        }, this));

        reset.on('mouseup', $.proxy(function () {
            add.find('.glyphicon').remove();
            move.find('.glyphicon').remove();
            remove.find('.glyphicon').remove();
            this.notifyToolbarListeners('onInteractionModeChanged', {'context': this, 'mode': 'none'});
            this.notifyToolbarListeners('onVoronoiPositioningReset', {'context': this});
        }, this));


        return $('<div>').attr({'class': 'btn-group', 'role': 'group'}).append(seedButton, menu);
    };

    permap.PerMap.prototype.getFilter = function () {
        // get filter from perplots
        this.filter.filterOn = this.map.getFilter();

        return this.filter;
    };

    permap.PerMap.prototype.onDataSetChanged = function (data, metadata) {
        this.metadata = metadata;
        this.build(data);
    };

    permap.PerMap.prototype.onSelectionChanged = function (data) {
        this.update(data);
    };

    permap.PerMap.prototype.notifyToolbarListeners = function (callbackStr, event) {
        this.toolbarListeners.forEach(function (listenerObj) {
            if (listenerObj.hasOwnProperty(callbackStr)) {
                listenerObj[callbackStr].call(listenerObj.context, event);
            }
        }, this);
    };

    permap.PerMap.prototype.registerToolbarListener = function (callbackObj) {
        this.toolbarListeners.push(callbackObj);
        return this;
    };

    permap.PerMap.prototype.notifyListeners = function (callbackStr, event) {
        this.listeners.forEach(function (listenerObj) {
            listenerObj[callbackStr].call(listenerObj.context, event);
        }, this);
    };

    permap.PerMap.prototype.registerListener = function (callbackObj) {
        this.listeners.push(callbackObj);
        return this;
    };

    return permap;

});