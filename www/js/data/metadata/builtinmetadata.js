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

define([], function () {

    var builtindata = {};

    /*
    builtindata.getRawDataMetadataYemen = function () {
        return {
            fileName: './dataset/default_data_v3.txt',
            columns: {
                year: 'year',
                month: 'month',
                day: 'day',
                latDD: 'latitude',
                lonDD: 'longitude',
                attributes: ['primary_name', 'secondary_name']
            }
        };
    };*/

    builtindata.getRawDataMetadataNigeria0813 = function () {
        return {
            fileName: './dataset/ACLED_Nigeria_08_13.txt',
            columns: {
                year: 'YEAR',
                month: 'MONTH',
                day: 'DAY',
                latDD: 'LATITUDE',
                lonDD: 'LONGITUDE',
                attributes: ['EVENT_TYPE', 'ACTOR1', 'FATALITIES']
            }
        };
    };

    return builtindata;
});