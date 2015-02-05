/**
 *  This file is part of PerSE. PerSE is a visual analytics app for
 *  event periodicity detection and analysis.
 *  Copyright (C) 2015  Brian Swedberg
 */

define([
    'jquery',
    'ol',
    'permap/eventlayerbuilder',
    'permap/map',
    'permap/voronoilayerbuilder',
    'permap/voronoidataparser',
    'perplots/perplots',
    'data/filter'
], function ($, ol, eventlayerbuilder, map, voronoilayerbuilder, voronoidataparser, perplots, filter) {

    var permap = {};

    permap.PerMap = function () {
        this.container = $('<div>').attr({'class': 'panel-body perse-permap'});
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
                .attr({'class': 'panel-heading'})
                .append($('<div>').attr({'class': 'panel-title'}).append(title)),
            panel = $('<div>')
                .attr({'class': 'panel panel-default perse-permap'})
                .append(panelHeader, this.container);

        $(container).append(panel);

        return this;
    };

    permap.PerMap.prototype.build = function (data) {
        var projection = this.metadata.getMetadata().geospatial.projection,
            eventLayer = new eventlayerbuilder.EventLayerBuilder()
                .setProjection(projection)
                .setData(data)
                .buildPointVectorLayer(),
            extent = this.formatExtent(eventLayer.getSource().getExtent()), // [minx, miny, maxx, maxy]
            voronoiLayerBuilder = new voronoilayerbuilder.VoronoiLayerBuilder()
                .setExtent(extent),
            voronoiParsedData = new voronoidataparser.VoronoiDataParser()
                .setProjection(projection)
                .setPolygonVectorLayer(voronoiLayerBuilder.buildPolygonVectorLayer())
                .setData(data);

        this.map = new map.Map()
            .render(this.container)
            .registerListener(this.createPerMapListener());
        this.registerToolbarListener(this.map.createToolbarListener());
        this.map.build({'eventPoints': eventLayer, 'voronoiPoints': voronoiLayerBuilder.buildPointVectorLayer()}, this.metadata);

        this.container.siblings('.panel-heading').find('div').append(this.createControls());

        /*
        this.perPlots = new perplots.PerPlots()
            .render(this.container)
            .registerListener(this.createPerMapListener());
         this.registerToolbarListener(this.perPlots.createToolbarListener());
        //this.perPlots.build(voronoiParsedData, this.metadata);
        */
    };

    permap.PerMap.prototype.update = function (data) {
        var projection = this.metadata.getMetadata().geospatial.projection,
            eventLayer = new eventlayerbuilder.EventLayerBuilder()
                .setProjection(projection)
                .setData(data)
                .buildPointVectorLayer(),
            extent = this.formatExtent(eventLayer.getSource().getExtent());
        this.map.update({'eventPoints': eventLayer});
    };

    permap.PerMap.prototype.createPerMapListener = function () {
        return {
            context: this,
            onFilterChanged: function (event) {
                this.notifyListeners('onFilterChanged', {context: this, filter: this.getFilter()});
            },
            onRemoveFilter: function (event) {
                this.notifyListeners('onRemoveFilter', {context: this, filter: this.getFilter()});
            }
        };
    };

    permap.PerMap.prototype.createControls = function () {
        var zoom = this.createZoomControlButtonGroup(),
            cycle = this.createCycleButtonGroup(),
            cal = this.createCalendarButtonGroup(),
            seed = this.createSeedControlButtonGroup(),
            filter = this.createFilterControlButtonGroup();
        return $('<div>')
            .attr({'class': 'btn-toolbar perse-header-toolbar', 'role': 'toolbar'})
            .append(zoom, cycle, cal, seed, filter);
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
            move = $('<a>').attr({'role': 'menuitem'}).text('Move ').append($('<span>').attr({'class': 'glyphicon glyphicon-ok-sign', 'aria-hidden': 'true'})),
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
            .attr({'class': 'btn btn-default btn-xs dropdown-toggle', 'type': 'button', 'data-toggle': 'dropdown', 'title': 'Draw Geospatial Filter'})
            .append(pencilIcon, ' ', $('<span>').attr({'class': 'caret'}));

        // add events here
        polygon.on('mouseup', $.proxy(function () {
            this.notifyToolbarListeners('onDrawShape', {'context': this, 'shape': 'Polygon'});
        }, this));

        circle.on('mouseup', $.proxy(function () {
            this.notifyToolbarListeners('onDrawShape', {'context': this, 'shape': 'Circle'});
        }, this));

        modify.on('mouseup', $.proxy(function () {
            this.notifyToolbarListeners('onModifyShape', {'context': this});
            menu.find('li a span').remove();
            modify.append($('<span>').attr({'class': 'glyphicon glyphicon-ok-sign', 'aria-hidden': 'true'}));
        }, this));

        move.on('mouseup', $.proxy(function () {
            this.notifyToolbarListeners('onMoveShape', {'context': this});
            menu.find('li a span').remove();
            move.append($('<span>').attr({'class': 'glyphicon glyphicon-ok-sign', 'aria-hidden': 'true'}));
        }, this));

        remove.on('mouseup', $.proxy(function () {
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
            gregorian = $('<a>').attr({'role': 'menuitem'}).text('Gregorian ').append($('<span>').attr({'class': 'glyphicon glyphicon-ok-sign', 'aria-hidden': 'true'})),
            islamic = $('<a>').attr({'role': 'menuitem'}).text('Islamic '),
            menu = $('<ul>')
            .attr({'class': 'dropdown-menu', 'role': 'menu'})
            .append([
                calendarHeader,
                $('<li>').attr({'role': 'presentation'}).append(gregorian),
                $('<li>').attr({'role': 'presentation'}).append(islamic)
            ]),
        // button
            calendarIcon = $('<span>').attr({'class': 'glyphicon glyphicon-calendar', 'aria-hidden': 'true'}),
            calendarButton = $('<button>')
            .attr({'class': 'btn btn-default btn-xs dropdown-toggle', 'type': 'button', 'data-toggle': 'dropdown', 'title': 'Change Calendar System'})
            .append(calendarIcon, ' Gregorian ', $('<span>').attr({'class': 'caret'}));

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
            cycleIcon = $('<span>').attr({'class': 'glyphicon glyphicon-repeat', 'aria-hidden': 'true'}),
            cycleButton = $('<button>')
            .attr({'class': 'btn btn-default btn-xs dropdown-toggle', 'type': 'button', 'data-toggle': 'dropdown', 'title': 'Change Temporal Cycle'})
            .append(cycleIcon, ' Month of Year ', $('<span>').attr({'class': 'caret'}));

        // add events here
        monthOfYear.on('mouseup', $.proxy(function () {
            this.notifyToolbarListeners('onCycleChanged', {'context': this, 'cycleName': 'MonthOfYear'});
            cycleButton.empty().append(cycleIcon, ' Month of Year ', $('<span>').attr({'class': 'caret'}));
            menu.find('li a span').remove();
            monthOfYear.append($('<span>').attr({'class': 'glyphicon glyphicon-ok-sign', 'aria-hidden': 'true'}));
        }, this));

        weekOfYear.on('mouseup', $.proxy(function () {
            this.notifyToolbarListeners('onCycleChanged', {'context': this, 'cycleName': 'WeekOfYear'});
            cycleButton.empty().append(cycleIcon, ' Week of Year ', $('<span>').attr({'class': 'caret'}));
            menu.find('li a span').remove();
            weekOfYear.append($('<span>').attr({'class': 'glyphicon glyphicon-ok-sign', 'aria-hidden': 'true'}));
        }, this));

        dayOfMonth.on('mouseup', $.proxy(function () {
            this.notifyToolbarListeners('onCycleChanged', {'context': this, 'cycleName': 'DayOfMonth'});
            cycleButton.empty().append(cycleIcon, ' Day of Month ', $('<span>').attr({'class': 'caret'}));
            menu.find('li a span').remove();
            dayOfMonth.append($('<span>').attr({'class': 'glyphicon glyphicon-ok-sign', 'aria-hidden': 'true'}));
        }, this));

        dayOfWeek.on('mouseup', $.proxy(function () {
            this.notifyToolbarListeners('onCycleChanged', {'context': this, 'cycleName': 'DayOfWeek'});
            cycleButton.empty().append(cycleIcon, ' Day of Week ', $('<span>').attr({'class': 'caret'}));
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
            divider = $('<li>').attr({'class': 'divider', 'role': 'presentation'}),
            reset = $('<a>').attr({'role': 'menuitem'}).text('Reset'),
            menu = $('<ul>')
            .attr({'class': 'dropdown-menu', 'role': 'menu'})
            .append([
                positioningHeader,
                $('<li>').attr({'role': 'presentation'}).append(fixed),
                $('<li>').attr({'role': 'presentation'}).append(auto),
                divider,
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
            menu.find('li a span').remove();
            fixed.append($('<span>').attr({'class': 'glyphicon glyphicon-ok-sign', 'aria-hidden': 'true'}));
        }, this));

        auto.on('mouseup', $.proxy(function () {
            // make seeds change based on the extent of what is selected
            menu.find('li a span').remove();
            auto.append($('<span>').attr({'class': 'glyphicon glyphicon-ok-sign', 'aria-hidden': 'true'}));
        }, this));

        reset.on('mouseup', $.proxy(function () {
            // make seeds grided
        }, this));


        return $('<div>').attr({'class': 'btn-group', 'role': 'group'}).append(seedButton, menu);
    };

    permap.PerMap.prototype.createPointerControlButtonGroup = function () {
        var pointerIcon = $('<span>').attr({'class': 'glyphicon glyphicon-asterisk', 'aria-hidden': 'true'});
    };

    permap.PerMap.prototype.formatExtent = function (olExtentObj) {
        // olExtentObj = [minx, miny, maxx, maxy]
        return {
            x: {max: olExtentObj[2], min: olExtentObj[0], dif: (olExtentObj[2] - olExtentObj[0])},
            y: {max: olExtentObj[3], min: olExtentObj[1], dif: (olExtentObj[3] - olExtentObj[1])}
        };
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
            if (listenerObj[callbackStr]) {
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