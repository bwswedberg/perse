/**
 *  This file is part of PerSE. PerSE is a visual analytics app for
 *  event periodicity detection and analysis.
 *  Copyright (C) 2015  Brian Swedberg
 */

// cd www; r.js -o config/buildconfig.js
// http://tech.pro/blog/1639/using-rjs-to-optimize-your-requirejs-project
// next build needs something above ol 3.3.0 becaause rbush 1.3.4 breaks require optimizer.
// ----> see https://github.com/mourner/rbush/pull/29

({
    baseUrl: '../js',
    name: 'main',
    mainConfigFile: '../js/main.js',
    out: '../dist/main.js',
    preserveLicenseComments: false,
    removeCombined: true,
    findNestedDependencies: true,
    optimize: 'uglify2'
})