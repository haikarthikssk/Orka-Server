/************************************************************************************************
* orka-Notification-service.js - publishes the event to the subscribers
*  Singleton class - publishers/subscriber model
************************************************************************************************/
// To-Do define a better messaging Format which supports custom templates
;(function () {
  const orka = angular.module('orka')

  orka.service('orkaNotifier', function () {
    /*
      Supported Events
     */
    let subscribers = {
      'alerts': [],
      'commandOutput': [],
      'stats': [],
      'orkaEvents': [],
      'logs': []
    }

    this.subscribe = (event, subscriber) => {
      if (Object.keys(subscribers).indexOf(event) === -1) { // if subscribed for unknown event
        throw new Error('Subscription not supported!')
      }

      if (subscribers[event].indexOf(subscriber) === -1) {
        if (subscriber.hasOwnProperty('getNotified')) {     // client should inherit getNotified method
          subscribers[event].push(subscriber)
          return true
        } else {
          throw new Error('Doesn\'t inherit  getNotified function!.')
        }
      }
      throw new Error('Already Subscribed!.')
    }

    this.unSubscribe = (event, subscriber) => {
      if (Object.keys(subscribers).indexOf(event) === -1) {
        throw new Error('Subscription not supported!')
      }

      if (subscribers[event].indexOf(subscriber) !== -1) {
        subscribers[event].pop(subscriber)
        return true
      }

      throw new Error('Subscriber not found!')
    }

    // notify the event to all subscribers
    this.notify = (event, data) => {
      if (Object.keys(subscribers).indexOf(event) === -1) {
        throw new Error('Subscription not supported!')
      }
      for (let subscriber in subscribers[event]) {
        subscribers[event][subscriber].getNotified(event, data)
      }
    }
  })
})()
