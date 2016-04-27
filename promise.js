var PENDING = 0;
var FULFILLED = 1;
var REJECTED = 2;

function Promise(fn){
    
    var state = PENDING;
    
    //FULLFILLED value or REJECTED error 
    var value = null;
    
    var handlers = [];
    
    function fulfilled(result){
        state = FULFILLED;
        value = result;
    }
    
    function rejected(error){
        state = REJECTED;
        value = error;
    }
    
    //resolve is the process of getting fulfilled or rejected with another promise or plain value
    function resolve(result) {
        try{
            var then = getThenable(result);
            if(then){
                doResolve(then.bind(result), resolve, reject);
                return;
            }
            //if it's plain value, fulfill promise
            fulfill(result);
        } catch(e){
            reject(e);
        }
    }
    
    function handle(handler){
        if(state === PENDING){
            handlers.push(handler);
        } else {
            if(state === FULFILLED && typeof handler.onFulfilled === 'function'){
                handler.onFulfilled(value);
            }
            if(state === REJECTED && typeof handler.onRejected === 'function'){
                handler.onRejected(value);
            }
        }
    }
    
    this.done = function(onFulfilled, onRejected){
        setTimeout(function(){
            handle({
               onFulfilled: onFulfilled,
               onRejected: onRejected 
            });
        }, 0);
    };
    
    this.then = function(onFulfilled, onRejected){
        var self = this;
        return new Promise(function(resolve, reject){
            return self.done(function(result){
                if(typeof onFulfilled === 'function'){
                    try{
                        return resolve(onFulfilled(result));
                    } catch(ex){
                        return reject(ex);
                    }
                } else {
                    return reject(result);
                }
            }, function(error){
                if(typeof onRejected === 'function'){
                    try{
                        return resolve(onRejected(result));
                    } catch(ex){
                        return reject(ex);
                    }
                } else {
                    return reject(result);
                }
            });
        });
    }
    
    doResolve(fn, resolve, reject);
    
    // if value is a promise, return it's then; or return null;
    function getThenable(value) {
        var type = typeof value;
        if(value && (type === 'object' || type === 'function')){
            var then = value.then;
            if(typeof then === 'function'){
                return then;
            }
        }
        return null;
    }
    
    function doResolve(fn, onFulfilled, onRejected){
        var done = false;
        try{
            fn(function(value){
                if(done) {
                    return;
                }
                done = true;
                onFulfilled(value);
            }, function(reason){
                if(done){
                    return;
                }
                done = true;
                onRejected(reason);
            });
        } catch(e){
            if(done) {
                return;
            }
            done = true;
            onRejected(e);
        }
    }
    
    
}