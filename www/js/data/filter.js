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

define([],function () {

    var data = {};

    data.Filter = function (filterObj) {
        this.uniqueId = filterObj.uniqueId;
        this.property = filterObj.property;
        this.filterOn = filterObj.filterOn;
    };

    return data;

});