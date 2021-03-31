
declare module 'comlink-loader!*' {
  class WebpackWorker extends Worker {
    constructor();

    // Add any custom functions to this class.
    // Make note that the return type needs to be wrapped in a promise.
    handle(type: string, id: number|number[]|undefined): any;
    
    getStatus(type: string): any;
  }

  export = WebpackWorker;
}
