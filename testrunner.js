'use strict';

var adapter = require('./Chengnuo.js');
var promisesAplusTests = require("promises-aplus-tests");

/*promisesAplusTests(adapter, function(err) {
    // All done; output is in the console. Or check `err` for number of failures.
    console.log(err);
});*/

let promise1 = adapter.resolved(1);
let promise2 = adapter.resolved(2);
let promise3 = adapter.deferred().promise;
setTimeout(function() {
    promise3.resolve(3);
}, 300);
let resolved = false;

adapter.all([promise1, promise2, promise3]).then(function(value) {
    console.log(value);
});