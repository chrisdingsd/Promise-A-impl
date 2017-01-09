'use strict';

var _states = {
    PENDING: 0,
    FULFILLED: 1,
    REJECTED: 2
};

var _run = function(fn) {
    setTimeout(fn, 0);
}

var _isFunction = function(val) {
    return val && typeof val === 'function';
}

var _isObject = function(val) {
    return val && typeof val === 'object';
}

var _isArray = function(val) {
    return val && Array.isArray(val);
}

var _isPromise = function(val) {
    return val && val instanceof Chengnuo
}

var _fulfillFallBack = function(value) {
    return value;
}

var _rejectFallBack = function(reason) {
    throw reason;
}

function Chengnuo(fn) {
    var self = this;

    self.state = _states.PENDING;
    self.value = null; // fullfilled value or rejected reason
    self.handlers = {
        fulfill: null,
        reject: null
    };

    //just for testing
    self.verbose = false;

    self.promiseQueue = [];

    if (_isFunction(fn)) {
        fn(function(val) {
            Resolve(self, val);
        }, function(reason) {
            self.reject(reason);
        });
    }
}

var fulfill = function(val) {
    if (this.state === _states.FULFILLED ||
        this.state !== _states.PENDING) {
        return;
    }

    if (this.verbose) {
        console.log('fulfilled!!!yay!');
    }

    this.state = _states.FULFILLED;
    this.value = val;
    this.handle();
}

var reject = function(reason) {
    if (this.state === _states.REJECTED ||
        this.state !== _states.PENDING) {
        return;
    }

    if (this.verbose) {
        console.log('rejected!!!boo!');
    }

    this.state = _states.REJECTED;
    this.value = reason;
    this.handle();
}

//resolve is the process of getting fulfilled or rejected with another promise or plain value
function Resolve(promise, x) {
    if (promise === x) {
        promise.reject(new TypeError('Promise cannot resolve itself.'));
    } else if (_isPromise(x)) {
        if (x.state === _states.PENDING) {
            x.then(function(val) {
                Resolve(promise, val);
            }, function(reason) {
                promise.reject(reason);
            });
        } else if (x.state === _states.FULFILLED) {
            promise.fulfill(x.value);
        } else if (x.state === _states.REJECTED) {
            promise.reject(x.value);
        }
    } else {
        try {
            var then = _getThenable(x);
            if (then) {
                _doResolve.call(x, then, promise);
                return;
            }
            //if it's plain value, fulfill promise
            promise.fulfill(x);
        } catch (e) {
            promise.reject(e);
        }
    }
}

function _getThenable(x) {
    if (_isFunction(x) || _isObject(x)) {
        var then = x.then;
        if (_isFunction(then)) {
            return then;
        }
    }
    return null;
}

function _doResolve(then, promise) {
    var done = false;
    var self = this;
    try {
        then.call(self, function(value) {
            if (done) {
                return;
            }
            done = true;
            Resolve(promise, value);
        }, function(reason) {
            if (done) {
                return;
            }
            done = true;
            promise.reject(reason);
        });
    } catch (e) {
        if (done) {
            return;
        }
        done = true;
        promise.reject(e);
    }
}

var handle = function() {
    var self = this;
    if (self.state === _states.PENDING) {
        return;
    }

    _run(function() {
        while (self.promiseQueue.length) {
            var promise = self.promiseQueue.shift();
            var handler = null;
            var value;

            if (self.state === _states.FULFILLED) {
                handler = promise.handlers.fulfill || _fulfillFallBack;
            }
            if (self.state === _states.REJECTED) {
                handler = promise.handlers.reject || _rejectFallBack;
            }

            try {
                value = handler(self.value);
            } catch (e) {
                promise.reject(e);
                continue;
            }
            //Let's resolve next then-promise
            Resolve(promise, value);
        }
    });


}


var then = function(onFulfilled, onRejected) {
    var promise = new Chengnuo();
    if (_isFunction(onFulfilled)) {
        promise.handlers.fulfill = onFulfilled;
    }
    if (_isFunction(onRejected)) {
        promise.handlers.reject = onRejected;
    }

    this.promiseQueue.push(promise);
    this.handle();

    return promise;
}

//Because 'catch' is a reserved keyword...
var catchReject = function(onRejected) {
    return this.then(null, onRejected);
}

var all = function(promises) {
    var promise = new Chengnuo();
    if (_isArray(promises) && promises.length > 0) {
        var values = new Array(promises.length);
        var rejected = false;
        var processed = 0;
        promises.forEach(function(item, i) {
            var tempPromise = new Chengnuo(function(resolve) {
                resolve(item);
            });
            tempPromise.then(function(value) {
                if (!rejected) {
                    values[i] = value;
                    processed++;
                    if (processed === promises.length) {
                        Resolve(promise, values);
                    }
                }
            }, function(reason) {
                rejected = true;
                promise.reject(reason);
            });
        });
    } else {
        Resovle(promise, []);
    }
    return promise;
}

Chengnuo.prototype.fulfill = fulfill;
Chengnuo.prototype.reject = reject;
Chengnuo.prototype.then = then;
Chengnuo.prototype.handle = handle;
Chengnuo.prototype.catch = catchReject;
Chengnuo.all = all;

module.exports = {
    resolved: function(value) {
        return new Chengnuo(function(resolve) {
            resolve(value);
        });
    },
    rejected: function(reason) {
        return new Chengnuo(function(resolve, reject) {
            reject(reason);
        })
    },
    deferred: function() {
        var resolve, reject;

        return {
            promise: new Chengnuo(function(rslv, rjct) {
                resolve = rslv;
                reject = rjct;
            }),
            resolve: resolve,
            reject: reject
        };
    },
    all: all
}