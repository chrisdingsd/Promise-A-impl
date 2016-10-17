'use strict';

let chai = require('chai');
const assert = chai.assert;

let sinon = require('sinon');
let Chengnuo = require('./Chengnuo.js');

describe('test Chengnuo all function', function() {
    it('resolve after all promise resolved', function(done) {
        let promise1 = Chengnuo.resolved(1);
        let promise2 = Chengnuo.resolved(2);
        let defer = Chengnuo.deferred();
        let promise3 = defer.promise;
        setTimeout(function() {
            defer.resolve(3);
        }, 500);
        let resolved = false;

        Chengnuo.all([promise1, promise2, promise3]).then(function(value) {
            assert.deepEqual(value, [1, 2, 3]);
            done();
        }).catch(done);
    })

    it('reject after one promise rejected', function(done) {
        let promise1 = Chengnuo.resolved(1);
        let promise2 = Chengnuo.rejected(2);
        let promise3 = Chengnuo.deferred().promise;
        let resolved = false;

        Chengnuo.all([promise1, promise2]).then(function(value) {
            resolved = true;
        }, function() {
            assert.equal(resolved, false);
            done();
        });
    })
})