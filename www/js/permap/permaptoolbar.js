/**
 *  This file is part of PerSE. PerSE is a visual analytics app for
 *  event periodicity detection and analysis.
 *  Copyright (C) 2015  Brian Swedberg
 */

define([
    'jquery',
    // no namespace
    'bootstrap'
], function ($) {

    var permaptoolbar = {};

    permaptoolbar.PerMapToolbar = function () {
        this.listeners = [];
        this.buttons = {
            'reset': undefined,
            'filterMove': undefined,
            'filterModify': undefined,
            'filterRemove': undefined,
            'voronoiAdd': undefined,
            'voronoiMove': undefined,
            'voronoiRemove': undefined
        };
    };

    permaptoolbar.PerMapToolbar.prototype.createControls = function () {
        var zoom = this.createZoomControlButtonGroup(),
            cycle = this.createCycleButtonGroup(),
            cal = this.createCalendarButtonGroup(),
            seed = this.createSeedControlButtonGroup(),
            filterC = this.createFilterControlButtonGroup();
        return $('<div>')
            .attr({'class': 'btn-toolbar perse-header-toolbar', 'role': 'toolbar'})
            .append(zoom, cycle, cal, seed, filterC);
    };

    permaptoolbar.PerMapToolbar.prototype.createFilterControlButtonGroup = function () {
        return $('<div>')
            .attr({'class': 'btn-group', 'role': 'group'})
            .append(
                this.createDrawControlButton(),
                this.createResetControlButton()
            );
    };

    permaptoolbar.PerMapToolbar.prototype.createResetControlButton = function () {
        var filterIcon = $('<span>')
                .attr({'class': 'glyphicon glyphicon-filter', 'aria-hidden': 'true'}),
            filterButton = $('<button>')
                .attr({'class': 'btn btn-default btn-xs', 'type': 'button', 'title': 'Reset Filter'})
                .append(filterIcon);

        filterButton.on('mouseup', $.proxy(function () {
            $(filterButton).blur();
            this.notifyListeners('onRemoveShape', {'context': this});
        }, this));

        this.buttons.reset = filterButton;

        return this.buttons.reset;
    };

    permaptoolbar.PerMapToolbar.prototype.createDrawControlButton = function () {
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
            this.notifyListeners('onInteractionModeChanged', {'context': this, 'mode': 'drawFilter', 'shape': 'Polygon'});
        }, this));

        circle.on('mouseup', $.proxy(function () {
            this.notifyListeners('onInteractionModeChanged', {'context': this, 'mode': 'drawFilter', 'shape': 'Circle'});
        }, this));

        modify.on('mouseup', $.proxy(function () {
            if (modify.find('.glyphicon').length) {
                this.removeGlyphIcon(modify);
                this.notifyListeners('onInteractionModeChanged', {'context': this, 'mode': 'none'});
            } else {
                this.removeGlyphIcon(move);
                this.addGlyphIcon(modify);
                this.notifyListeners('onInteractionModeChanged', {'context': this, 'mode': 'modifyFilter'});
            }
        }, this));

        move.on('mouseup', $.proxy(function () {
            if (move.find('.glyphicon').length) {
                this.removeGlyphIcon(move);
                this.notifyListeners('onInteractionModeChanged', {'context': this, 'mode': 'none'});
            } else {
                this.removeGlyphIcon(modify);
                this.addGlyphIcon(move);
                this.notifyListeners('onInteractionModeChanged', {'context': this, 'mode': 'moveFilter'});
            }
        }, this));

        remove.on('mouseup', $.proxy(function () {
            [move, modify].forEach(this.removeGlyphIcon);
            this.notifyListeners('onInteractionModeChanged', {'context': this, 'mode': 'none'});
            this.notifyListeners('onRemoveShape', {'context': this});
        }, this));

        this.filterMove = move;
        this.filterModify = modify;
        this.filterRemove = remove;

        return $('<div>').attr({'class': 'btn-group', 'role': 'group'}).append(pencilButton, menu);
    };

    permaptoolbar.PerMapToolbar.prototype.createZoomControlButtonGroup = function () {
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
            this.notifyListeners('onZoomIn', {'context': this});
            $(zoomInButton).blur();
        }, this));

        zoomOutButton.on('mouseup', $.proxy(function () {
            this.notifyListeners('onZoomOut', {'context': this});
            $(zoomOutButton).blur();
        }, this));

        return $('<div>')
            .attr({'class': 'btn-group', 'role': 'group'})
            .append(zoomInButton, zoomOutButton);
    };

    permaptoolbar.PerMapToolbar.prototype.createCalendarButtonGroup = function () {
        var // menu
            calendarHeader = $('<li>').attr({'class': 'dropdown-header', 'role': 'presentation'}).text('Calendar'),
            gregorian = $('<a>').attr({'role': 'menuitem'}).text('Gregorian '),
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
            calendarButton = $('<button>').attr({
                    'class': 'btn btn-default btn-xs dropdown-toggle',
                    'type': 'button',
                    'data-toggle': 'dropdown',
                    'title': 'Change Calendar System'
                })
                .append(calendarIcon, ' ',  $('<span>').attr({'class': 'caret'}));

        this.addGlyphIcon(islamic);

        // add events here
        gregorian.on('mouseup', $.proxy(function () {
            this.removeGlyphIcon(islamic);
            this.addGlyphIcon(gregorian);
            this.notifyListeners('onCalendarChanged', {'context': this, 'calendarName': 'gregorian'});
        }, this));

        islamic.on('mouseup', $.proxy(function () {
            this.removeGlyphIcon(gregorian);
            this.addGlyphIcon(islamic);
            this.notifyListeners('onCalendarChanged', {'context': this, 'calendarName': 'islamic'});
        }, this));

        return $('<div>').attr({'class': 'btn-group', 'role': 'group'}).append(calendarButton, menu);
    };

    permaptoolbar.PerMapToolbar.prototype.createCycleButtonGroup = function () {
        var // menu
            calendarHeader = $('<li>').attr({'class': 'dropdown-header', 'role': 'presentation'}).text('Cycle'),
            monthOfYear = $('<a>').attr({'role': 'menuitem'}).text('Month of Year '),
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

        this.addGlyphIcon(monthOfYear);

        // add events here
        monthOfYear.on('mouseup', $.proxy(function () {
            [monthOfYear, weekOfYear, dayOfMonth, dayOfWeek].forEach(this.removeGlyphIcon);
            this.addGlyphIcon(monthOfYear);
            this.notifyListeners('onCycleChanged', {'context': this, 'cycleName': 'MonthOfYear'});
        }, this));

        weekOfYear.on('mouseup', $.proxy(function () {
            [monthOfYear, weekOfYear, dayOfMonth, dayOfWeek].forEach(this.removeGlyphIcon);
            this.addGlyphIcon(weekOfYear);
            this.notifyListeners('onCycleChanged', {'context': this, 'cycleName': 'WeekOfYear'});
        }, this));

        dayOfMonth.on('mouseup', $.proxy(function () {
            [monthOfYear, weekOfYear, dayOfMonth, dayOfWeek].forEach(this.removeGlyphIcon);
            this.addGlyphIcon(dayOfMonth);
            this.notifyListeners('onCycleChanged', {'context': this, 'cycleName': 'DayOfMonth'});
        }, this));

        dayOfWeek.on('mouseup', $.proxy(function () {
            [monthOfYear, weekOfYear, dayOfMonth, dayOfWeek].forEach(this.removeGlyphIcon);
            this.addGlyphIcon(dayOfWeek);
            this.notifyListeners('onCycleChanged', {'context': this, 'cycleName': 'DayOfWeek'});
        }, this));

        return $('<div>').attr({'class': 'btn-group', 'role': 'group'}).append(cycleButton, menu);
    };

    permaptoolbar.PerMapToolbar.prototype.createSeedControlButtonGroup = function () {
        var // menu
            positioningHeader = $('<li>').attr({'class': 'dropdown-header', 'role': 'presentation'}).text('Positioning'),
            auto = $('<a>').attr({'role': 'menuitem'}).text('Auto '),
            fixed = $('<a>').attr({'role': 'menuitem'}).text('Fixed '),
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
                    $('<li>').attr({'role': 'presentation'}).append(auto),
                    $('<li>').attr({'role': 'presentation'}).append(fixed),
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

        this.addGlyphIcon(auto);

        // add events here
        fixed.on('mouseup', $.proxy(function () {
            // make seeds stay at the same location regardless of extent of what is selected
            this.removeGlyphIcon(auto);
            if (fixed.find('.glyphicon').length === 0) {
                this.addGlyphIcon(fixed);
            }
            this.notifyListeners('onVoronoiPositioningChanged', {'context': this, 'positioning': 'fixed'});
        }, this));

        auto.on('mouseup', $.proxy(function () {
            // make seeds change based on the extent of what is selected
            this.removeGlyphIcon(fixed);
            if (auto.find('.glyphicon').length === 0) {
                this.addGlyphIcon(auto);
            }
            this.notifyListeners('onVoronoiPositioningChanged', {'context': this, 'positioning': 'auto'});
        }, this));

        add.on('mouseup', $.proxy(function () {
            if (add.find('.glyphicon').length) {
                this.removeGlyphIcon(add);
                this.notifyListeners('onInteractionModeChanged', {'context': this, 'mode': 'none'});
            } else {
                [move, remove].forEach(this.removeGlyphIcon);
                this.addGlyphIcon(add);
                this.notifyListeners('onInteractionModeChanged', {'context': this, 'mode': 'addVoronoi'});
            }
        }, this));

        move.on('mouseup', $.proxy(function () {

            if (move.find('.glyphicon').length) {
                this.removeGlyphIcon(move);
                this.notifyListeners('onInteractionModeChanged', {'context': this, 'mode': 'none'});
            } else {
                [add, remove].forEach(this.removeGlyphIcon);
                this.addGlyphIcon(move);
                this.notifyListeners('onInteractionModeChanged', {'context': this, 'mode': 'moveVoronoi'});
            }
        }, this));

        remove.on('mouseup', $.proxy(function () {
            if (remove.find('.glyphicon').length) {
                this.removeGlyphIcon(remove);
                this.notifyListeners('onInteractionModeChanged', {'context': this, 'mode': 'none'});
            } else {
                [add, move].forEach(this.removeGlyphIcon);
                this.addGlyphIcon(remove);
                this.notifyListeners('onInteractionModeChanged', {'context': this, 'mode': 'removeVoronoi'});
            }
        }, this));

        reset.on('mouseup', $.proxy(function () {
            [add, move, remove].forEach(this.removeGlyphIcon);
            this.notifyListeners('onInteractionModeChanged', {'context': this, 'mode': 'none'});
            this.notifyListeners('onVoronoiPositioningReset', {'context': this});
        }, this));

        this.buttons.voronoiAdd = add;
        this.buttons.voronoiMove = move;
        this.buttons.voronoiRemove = remove;

        return $('<div>').attr({'class': 'btn-group', 'role': 'group'}).append(seedButton, menu);
    };

    permaptoolbar.PerMapToolbar.prototype.addGlyphIcon = function (container) {
        container.append(
            $('<span>').attr({'class': 'glyphicon glyphicon-ok-sign', 'aria-hidden': 'true'})
        );
    };

    permaptoolbar.PerMapToolbar.prototype.removeGlyphIcon = function (container) {
        container.find('.glyphicon').remove();
    };

    permaptoolbar.PerMapToolbar.prototype.onButtonStatusChanged = function (event) {
        var buttonName = event.buttonName,
            isEnabled = event.isEnabled;
        switch (buttonName) {
        case ('reset'):
            this.buttons.reset.toggleClass('disabled', isEnabled);
            break;
        case ('allFilterButtons'):
            var filterButtons = [this.buttons.filterMove, this.buttons.filterModify, this.buttons.filterRemove];
            if (isEnabled) {
                filterButtons.forEach(function (b) {
                    b.toggleClass('disabled', false);
                }, this);
            } else {
                filterButtons.forEach(function (b) {
                    this.removeGlyphIcon(b);
                    b.toggleClass('disabled', true);
                }, this);
            }
            break;
        case ('filterMove'):
            if (isEnabled) {
                this.addGlyphIcon(this.buttons.filterMove);
            } else {
                this.removeGlyphIcon(this.buttons.filterMove);
            }
            break;
        case ('filterModify'):
            if (isEnabled) {
                this.addGlyphIcon(this.buttons.filterModify);
            } else {
                this.removeGlyphIcon(this.buttons.filterModify);
            }
            break;
        case ('filterRemove'):
            if (isEnabled) {
                this.addGlyphIcon(this.buttons.filterRemove);
            } else {
                this.removeGlyphIcon(this.buttons.filterRemove);
            }
            break;
        /*
        case ('voronoiAuto'):
            if (isEnabled) {
                this.removeGlyphIcon(this.buttons.filterMove);
                this.buttons.filterMove.toggleClass('disabled', true);
            } else {
                this.buttons.filterMove.toggleClass('disabled', false);
            }
            break;
        case ('voronoiFixed'):
            if (isEnabled) {
                this.buttons.filterMove.toggleClass('disabled', false);
            } else {
                this.removeGlyphIcon(this.buttons.filterMove);
                this.buttons.filterMove.toggleClass('disabled', true);
            }
            break;
        */
        case ('voronoiAdd'):
            if (isEnabled) {
                this.addGlyphIcon(this.buttons.voronoiAdd);
            } else {
                this.removeGlyphIcon(this.buttons.voronoiAdd);
            }
            break;
        case ('voronoiMove'):
            if (isEnabled) {
                this.addGlyphIcon(this.buttons.filterMove);
            } else {
                this.removeGlyphIcon(this.buttons.filterMove);
            }
            break;
        case ('voronoiRemove'):
            if (isEnabled) {
                this.addGlyphIcon(this.buttons.filterRemove);
            } else {
                this.removeGlyphIcon(this.buttons.filterRemove);
            }
            break;
        }
    };

    permaptoolbar.PerMapToolbar.prototype.handleEvent = function (eventType, event) {
        switch (eventType) {
        case ('buttonStatusChanged'):
            this.onButtonStatusChanged(event);
            break;
        default:
            console.warn('No event type ' + eventType + ' exists for toolbar.');
        }
    };

    permaptoolbar.PerMapToolbar.prototype.createListener = function () {
        return {
            'context': this,
            'onButtonStatusChanged': function (event) {
                if (event.buttonName === undefined ||
                    event.isEnabled === undefined ||
                    this.buttons.hasOwnProperty(event.buttonName)) {
                        console.warn('Button doesn\'t exist or not defined.');
                        return;
                }
                this.handleChange(event.buttonName, event.isEnabled);
            }
        };
    };

    permaptoolbar.PerMapToolbar.prototype.notifyListeners = function (callbackStr, event) {
        this.listeners.forEach(function (listenerObj) {
            if (listenerObj.hasOwnProperty(callbackStr)) {
                listenerObj[callbackStr].call(listenerObj.context, event);
            }
        }, this);
    };

    permaptoolbar.PerMapToolbar.prototype.registerListener = function (callbackObj) {
        this.listeners.push(callbackObj);
        return this;
    };

    return permaptoolbar;

});