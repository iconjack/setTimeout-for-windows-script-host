/*
    Windows Scripting Host doesn't provide  setTimeout  and  clearTimeout.
    This serves as a replacement. 

    To use:

    Set up all the deferred actions you like with the usual setTimeout calls
       setTimeout(function() {
         // do something
       }, 200);

    Then call  setTimeout.queue.run(). 
    Deferred actions can spawn more deferred actions.
    If the queue ever runs dry, it will stop running and return.
    Remember, javascript is single-threaded. If you put more
    functions in the queue, call the run method again.
*/


function setTimeout(func, delay) {
  var when = new Date().getTime() + delay;
  return setTimeout.queue.add(func, when);
}

function clearTimeout(timer) {
  setTimeout.queue.del(timer);
} 


// A queue object, with methods  add, del, run.
// Tied to setTimeout to keep it out of the global namespace.

setTimeout.queue = function() {
  var store = [];
  var nextid = 0;

  return {
    add: function(func, when) {
      store.push({id: nextid, func: func, when: when});
      return nextid++;
    },

    del: function(id) {
      for (var i = 0; i < store.length; i++) {
        if (store[i].id == id) {
          store.splice(i, 1);
        }
      }
    },

    run: function() {
      while (store.length > 0) {
        var now = new Date().getTime();
        for (var i = 0; i < store.length; i++) {
          var item = store[i];

          if (now > item.when) {
            setTimeout.queue.del(item.id);
            item.func();         //  <---- actually invoke the function here

            // Note: we can't continue looping through the queue here, 
            // because we removed one of the items. The loop limit is
            // now incorrect. Easiest thing to do is restart the loop.

            break;
          }

          // We burn a millisecond here to throttle the looping.
          // Otherwise it will loop on the order of 200,000 times per sec.

          WScript.Sleep(1);
        }
      }
    }
  }
}();

setTimeout.test = function() {
  function echo(x) {
    return function() {
      WScript.Echo(x);
    }
  }

  WScript.Echo('You should see: C,A,D,N,M');

  setTimeout(echo('A'), 500);
  var b = setTimeout(echo('B'), 1220);
  setTimeout(echo('C'), 300);
  setTimeout(echo('D'), 1000);
  clearTimeout(b);

  setTimeout(function() {
    WScript.Echo('N');
    setTimeout(function() {
      WScript.Echo('M');
    }, 100)
  }, 1300)

  setTimeout.queue.run();
  WScript.Echo('done');
}

/////  setTimeout.test();   // uncomment to run test
