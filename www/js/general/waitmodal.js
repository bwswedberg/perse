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

    var waitmodal = {};

    waitmodal.createWaitModal = function () {
        var span = $('<span>').attr({'class': 'sr-only'}).text('100% Complete'),
            bar = $('<div>').attr({'class': 'progress-bar progress-bar-striped active', 'role': 'progressbar', 'aria-valuenow': '100', 'aria-valuemin': '0', 'aria-valuemax': '100', 'style': 'width: 100%'}).append(span),
            pBar = $('<div>').attr({'class': 'progress'}).append(bar),
            modalTitle = $('<div>').attr({'class': 'modal-title'}).append($('<h1>').text('Loading...')),
            modalHeader = $('<div>').attr({'class': 'modal-header'}).append(modalTitle),
            modalBody = $('<div>').attr({'class': 'modal-body'}).append(pBar),
            modalContent = $('<div>').attr({'class': 'modal-content'}).append(modalHeader, modalBody),
            modalDialog =  $('<div>').attr({'class': 'modal-dialog'}).append(modalContent),
            modal = $('<div>').attr({'class': 'modal fade'}).append(modalDialog);

        return modal;
    };

    return waitmodal;

});