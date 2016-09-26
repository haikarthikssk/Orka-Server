 /************************************************************************************************
 * orka-schedular.js - responsible for exectuing the task at intervals
 *  Singleton class
 ***********************************************************************************************/

;(function () {
  const orka = angular.module('orka')
  orka.service('orkaSchedular', function (generatorService, orkaNotifier, IPCbridge) {
    let taskList = {}

    this.addTask = (taskname, fn, time, repeat) => {
      let task = generatorService.TaskGenerator(taskname, fn, time, repeat)
      taskList[taskname] = task // add to task list
      IPCbridge.sendTaskCreated(taskname, {
        taskname,
        fn: `return ${fn.toString()}`,  // needs to be serialized ,so that we can construct it from disk
        time,
        repeat
      })
      orkaNotifier.notify('orkaEvents', {
        status: 'success',
        taskname,
        message: `Task ${taskname} created.`
      })
    }

    this.deleteTask = (taskname) => {
      if (taskList[taskname] !== undefined) {
        taskList[taskname].stop()
        delete taskList[taskname]
        IPCbridge.sendTaskDeleted(taskname)
        orkaNotifier.notify('orkaEvents', {
          status: 'success',
          taskname,
          message: `Task ${taskname} deleted.`
        })
      }
    }

    this.startTask = (taskname) => {
      if (this.isAvailable(taskname)) {
        this.getTask(taskname).run()
        orkaNotifier.notify('orkaEvents', {
          status: 'info',
          taskname,
          message: `Task ${taskname} is running.`
        })
      }
    }

    this.stopTask = (taskname) => {
      if (this.isAvailable(taskname)) {
        this.getTask(taskname).stop()
        orkaNotifier.notify('orkaEvents', {
          status: 'info',
          taskname,
          message: `Task ${taskname} is stopped.`
        })
      }
    }

    this.isAvailable = (taskname) => {
      return taskList[taskname] !== undefined
    }

    this.getTask = (taskname) => {
      return taskList[taskname]
    }

    this.isRunning = (taskname) => {
      return taskList[taskname].isRunning()
    }

    this.getAllTasks = () => {
      return taskList
    }
  })
  /**
   *
   * [orkaSchedularController] controls task creation, deletion and execution
   * The task will be executed at the specified interval. The commands will be sent to the clients
   * and executed. The results are obtained from the regular 'output' events.
   *
   */
  .controller('orkaSchedularController', function ($scope, orkaPi, orkaSchedular) {
    $scope.selectedTask = null

    $scope.getAllTasks = () => {
      return orkaSchedular.getAllTasks()
    }

    $scope.selectTask = (taskname) => {
      $scope.selectedTask = orkaSchedular.getTask(taskname)
    }

    $scope.deleteTask = (taskname) => {
      if ($scope.selectedTask !== null && taskname === $scope.selectedTask.name) {
        $scope.selectedTask = null
      }
      orkaSchedular.deleteTask(taskname)
    }

    $scope.toggleTask = (taskname) => {
      if (!orkaSchedular.isRunning(taskname)) {
        orkaSchedular.startTask(taskname)
      } else {
        orkaSchedular.stopTask(taskname)
      }
    }

    $scope.isRunning = (taskname) => {
      if (orkaSchedular.isAvailable(taskname)) {
        return orkaSchedular.isRunning(taskname)
      }
    }

    $scope.getClientsInfo = () => {
      return {
        no: orkaPi.getAllPiNames().length
      }
    }
  })
})()
