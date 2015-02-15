/**
 *  This file is part of PerSE. PerSE is a visual analytics app for
 *  event periodicity detection and analysis.
 *  Copyright (C) 2015  Brian Swedberg
 */

define([
    'jquery',
    'papaparse',
    'colorbrewer',
    'data/metadata/builtinmetadata',
    'data/metadata/metadatabuilder',
    // plugin
    '$.calendars'
], function ($, Papa, colorbrewer, builtinmetadata, metadatabuilder) {

    var dataloader = {};

    dataloader.DataLoader = function () {
        this.listeners = [];
    };

    dataloader.DataLoader.prototype.processData = function (rawData, columns) {
        var data = [],
            cal = $.calendars.instance('gregorian');
        rawData.forEach(function (dataObj, index) {
            var processedObj = {};

            processedObj.julianDate = cal.newDate(
                rawData[index][columns.year],
                rawData[index][columns.month],
                rawData[index][columns.day]
            ).toJD();

            // add description
            processedObj.description = dataObj[columns.description];

            // stored as [lon, lat]
            processedObj.coord = [dataObj[columns.lonDD], dataObj[columns.latDD]];

            processedObj.attributes = {};
            columns.attributes.forEach(function (a) {
                processedObj.attributes[a] = dataObj[a];
            });

            data.push(processedObj);
        });

        return data;
    };

    dataloader.DataLoader.prototype.createMetadata = function (data, columns) {
        var beginDate = data[0].julianDate,
            endDate = data[0].julianDate,
            builder = new metadatabuilder.MetadataBuilder(),
            attributes = {},
            numericCount = 0,
            numericColorSchemes = ['Reds', 'YlGn', 'YlOrBr'];
        data.forEach(function (d) {
            beginDate = Math.min(d.julianDate, beginDate);
            endDate = Math.max(d.julianDate, endDate);
        });
        builder.setTemporal({beginJulianDate: beginDate, endJulianDate: endDate, id: 'julianDate'});
        builder.setGeospatial({id: 'coord'});
        builder.setDescriptionAttribute({id: 'description', label: columns.description});
        columns.attributes.forEach(function (a) {
            attributes[a] = {
                label: a,
                isNumeric: data.every(function (d) {
                    return !isNaN(parseFloat(d.attributes[a])) && isFinite(d.attributes[a]);
                })
            };
            if (!attributes[a].isNumeric) {
                attributes[a].uniqueValues = {};
                data.forEach(function (d, i) {
                    if (attributes[a].uniqueValues[d.attributes[a]]) {
                        attributes[a].uniqueValues[d.attributes[a]].count += 1;
                    } else {
                        attributes[a].uniqueValues[d.attributes[a]] = {
                            name: d.attributes[a],
                            count: 1,
                            color: colorbrewer.Set1['9'][i % 9]//randomColor({luminosity: 'light', hue: 'random'})
                        };
                    }
                });

                Object.keys(attributes[a].uniqueValues)
                    .sort(function (key1, key2) {return attributes[a].uniqueValues[key1].count - attributes[a].uniqueValues[key2].count; })
                    .forEach(function (k, i) {
                        attributes[a].uniqueValues[k].color = colorbrewer.Set1['9'][i % 9];
                    });

            } else {
                attributes[a].color = colorbrewer[numericColorSchemes[numericCount % numericColorSchemes.length]]['3'][1];
                attributes[a].colors = colorbrewer[numericColorSchemes[numericCount % numericColorSchemes.length]]['5'];
                attributes[a].extent = {min: data[0].attributes[a], max: data[0].attributes[a]};
                data.forEach(function (d) {
                    attributes[a].extent.min = Math.min(d.attributes[a], attributes[a].extent.min);
                    attributes[a].extent.max = Math.max(d.attributes[a], attributes[a].extent.max);
                });
            }
        });

        columns.attributes.forEach(function (a) {
            builder.addAttribute(attributes[a]);
        });

        builder.setAttribute();

        builder.setTotalEvents(data.length);

        return builder.build();
    };

    dataloader.DataLoader.prototype.setAttributeNames = function (data, metadata) {
        var attributeKeys = metadata.getMetadata().attribute.attributeKeys,
            attributes = metadata.getMetadata().attribute.attributes;

        return data.map(function (d) {
            var newAttr = {};
            Object.keys(d.attributes).forEach(function (a) {
                var id = attributeKeys.filter(function (p) {
                    return attributes[p].label === a;
                })[0];
                newAttr[id] = d.attributes[a];
            });
            d.attributes = newAttr;
            return d;
        });
    };

    dataloader.DataLoader.prototype.setBadValues = function (data, metadata) {
        var attributes = metadata.getMetadata().attribute.attributeKeys;
        return data.map(function (d) {
            var newAttr = {};
            Object.keys(d.attributes).forEach(function (a) {
                if (d.attributes[a] || d.attributes[a] === 0) {
                    newAttr[a] = d.attributes[a];
                } else {
                    if (attributes[a].isNumeric) {
                        newAttr[a] = 0;
                    } else {
                        newAttr[a] = 'unknown';
                    }
                }
            });
            d.attributes = newAttr;
            return d;
        });
    };

    dataloader.DataLoader.prototype.flattenAttributes = function (data) {
        return data.map(function (d) {
            Object.keys(d.attributes).forEach(function (a) {
                d[a] = d.attributes[a];
            });
            delete d.attributes;
            return d;
        });
    };

    dataloader.DataLoader.prototype.loadBuiltInData = function () {
        var that = this,
            dataSet = builtinmetadata.getRawDataMetadataNigeria0813(),
            callBackOnLoad,
            callBackOnError,
            config;

        callBackOnLoad = function (results) {
            var data = that.processData(results.data, dataSet.columns),
                metadata = that.createMetadata(data, dataSet.columns);
            data = that.setAttributeNames(data, metadata);
            data = that.setBadValues(data, metadata);
            data = that.flattenAttributes(data);
            that.notifyListeners('onLoad', {context: that, data: data, metadata: metadata});
        };

        callBackOnError = function (someError) {
            console.warn('There was an error in loading the built-in data set.');
            console.warn(someError);
        };

        config = {
            delimiter: '',
            header: true,
            dynamicTyping: true,
            preview: 0,
            step: undefined,
            encoding: '',
            worker: false,
            comments: false,
            complete: callBackOnLoad,
            error: callBackOnError,
            download: true,
            keepEmptyRows: false,
            chunk: undefined
        };

        Papa.parse(dataSet.fileName, config);
    };

    dataloader.DataLoader.prototype.notifyListeners = function (callbackStr, event) {
        this.listeners.forEach(function (listenerObj) {
            listenerObj[callbackStr].call(listenerObj.context, event);
        }, this);
    };

    dataloader.DataLoader.prototype.registerListener = function (callbackObj) {
        this.listeners.push(callbackObj);
    };

    return dataloader;

});