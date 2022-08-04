// promise的三种状态
const PEDDIND = 'pedding'
const SUCCESS = 'success'
const REJECTED = 'rejected'

function resolvePromise(self, i, resolve, reject) {
  if (self == i) {
    return reject('type error')
  }
  if (i instanceof MyPromise) {
    i.then(resolve, reject)
  } else {
    resolve(i)
  }
}

class MyPromise {
  constructor(executor) {
    try {
      executor(this.resolve, this.reject)
    } catch (err) {
      // console.log(err)
      this.reject(err)
    }
  }

  // 存储成功回调函数
  onSuccessCallBack = []
  // onSuccessCallBack = null (保证then中的回调函数都i执行，改用数组)

  // 存储失败回调函数
  onFailCallBack = []
  // onFailCallBack = null (保证then中的回调函数都i执行，改用数组)

  // 初始状态时pedding
  status = PEDDIND
  // 成功之后值
  value = null
  // 失败原因
  resson = null

  static resolve (parameter){
    if (parameter instanceof MyPromise) {
      return parameter
    }

    return new MyPromise(resolve => {
      resolve(parameter)
    })
  }

  static reject (reason) {
    return new MyPromise((_, reject) => {
      reject(reason)
    })
  }

  // 更新成功后状态
   resolve = (value) => {
    // 状态是等待执行的时候才能更新
    if (this.status === PEDDIND) {
      this.status = SUCCESS
      this.value = value
      // 如果有成功回调函数，就执行成功回调函数
      while (this.onSuccessCallBack.length) {
        this.onSuccessCallBack.shift()(value)
      }
    }
  }
  // 更新失败后状态
  reject = (reason) => {
    if (this.status === PEDDIND) {
      this.status = REJECTED
      this.reason = reason
      // 如果有失败回调函数，就执行失败回调函数
      while (this.onFailCallBack.length) {
        this.onFailCallBack.shift()(reason)
      }
    }
  }

  then(onSuccess, onFail) {
    // then中的参数可以默认不传
    onSuccess = typeof onSuccess === 'function' ? onSuccess : value => value
    onFail = typeof onFail === 'function' ? onFail : reason => { throw reason }
    const promise2 = new MyPromise((resolve, reject) => {
      // 如果成功了，就执行成功回调函数
      if (this.status === SUCCESS) {
        // 创建微任务的技术方案：https://developer.mozilla.org/zh-CN/docs/Web/API/queueMicrotask
        queueMicrotask(() => {
          try {
            const callback = onSuccess(this.value)
            resolvePromise(promise2, callback, resolve, reject)
          } catch (e) {
            reject(e)
          }
        })
        return
      }
      // 如果失败了，就执行失败回调函数
      if (this.status === REJECTED) {
        queueMicrotask(() => {
          try {
            const failCallback = onFail(this.reason)
            resolvePromise(promise2, failCallback, resolve, reject)
          }catch(err){
            reject(err)
          }
        })
        return
      }

      // 如果是等待状态，就把成功和失败回调函数存储起来
      if (this.status === PEDDIND) {
        // this.onSuccessCallBack.push(onSuccess)
        this.onSuccessCallBack.push(() => {
          queueMicrotask(() => {
            try {
              const cb = onSuccess(this.value)
              resolvePromise(promise2, cb, resolve, reject)
            }catch(err){
              reject(err)
            }
          })
        })
        this.onFailCallBack.push(() => {
          queueMicrotask(() => {
            try{
              const cb = onFail(this.reason)
              resolvePromise(promise2, cb, resolve, reject)
            }catch(err){
              reject(err)
            }
          })
        })
      }
    })
    return promise2
  }
}



MyPromise.resolve().then(() => {
  console.log(0);
  return MyPromise.resolve(4);
}).then((res) => {
  console.log(res)
})

MyPromise.resolve().then(() => {
  console.log(1);
}).then(() => {
  console.log(2);
}).then(() => {
  console.log(3);
}).then(() => {
  console.log(5);
}).then(() =>{
  console.log(6);
})




