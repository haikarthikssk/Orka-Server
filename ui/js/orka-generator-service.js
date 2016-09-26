 /************************************************************************************************
 * orka-generator-service.js -  generates colorcodes, Names and Task
 *  Singleton class
  ***********************************************************************************************/

;(function () {
  'use strict'
  const orka = angular.module('orka')
  orka.service('generatorService', function (orkaPi, $timeout, $interval) {
    let color = ColorGenerator()
    let nameGenerator = NameGenerator()
    this.TaskGenerator = TaskGenerator

    this.getNextColor = () => {
      return color.next().value
    }

    this.getNextName = (prefix) => {
      let name
      while ((name = nameGenerator.next(prefix).value) === undefined);
      return name
    }

    /**
     * return random color from predefined colors
     */
    function *ColorGenerator () {
      let awesomeColors = [
        '#00ff00',
        '#ff0000',
        '#ff00ff',
        '#00ff00',
        '#00ff00',
        '#00ff00',
        '#00ff00'
      ]
      while (true) {
        yield awesomeColors[Math.floor(Math.random() * awesomeColors.length)]
      }
    }
    /**
     * returns a unique name.
     */
    function *NameGenerator () {
      let index = 1
      while (true) {
        var prefix = yield
        yield `${prefix}${index}`
        index++
      }
    }
    /**
     * TaskGenerator will create a task with the passed function.The task will be executed at every interval
     * @param {string}   taskName [Name of the task]
     * @param {Function} fn       [The function to be executed]
     * @param {integer}   interval interval at which the task will be executed
     * @param {integer}   repeat  whether to execute only one or repeat
     */
    function TaskGenerator (taskName, fn, interval, repeat) {
      let promise = null
      let task = null
      let _running = false

      function start () {
        task = Task(fn)
        _running = true
        if (repeat) {
          promise = $interval(function () {
            task.next(true) // execute the function
          }, interval, false) // don't call $apply everytime. degrades performance
        }
        else {
          promise = $timeout(function () {
            task.next(true)
            stop()
          }, interval, true) // call $apply once
        }
      }

      function stop () {
        if (!_running) {
          return
        }
        if (repeat) {
          $interval.cancel(promise)
        }
        else {
          $timeout.cancel(promise)
        }
        task.next(false)
        _running = false
      }

      function done () {
        return _running
      }
      return {
        name: taskName,
        type: repeat === true ? 'interval' : 'timeout',
        run: start,
        interval: interval,
        command: fn,
        stop: stop,
        isRunning: done
      }
    }
    // ES6 generator function
    function *Task (fn) {
      if (typeof fn !== 'function') {
        throw new Error(`${fn} is not a function`)
      }
      let continueExec = true
      while (continueExec) {
        continueExec = yield
        console.log('executing', fn)
        fn()
      }
    }
  })
})()
