type EventHandler<T> = (value: T) => void;

interface EventMap {
  [key: string]: any;
}

export class Observable<T extends EventMap> {
  private subscribers: Map<keyof T, EventHandler<T[keyof T]>[]> = new Map();
  private values: Partial<T> = {};

  constructor(initialValues?: Partial<T>) {
    if (initialValues) {
      this.values = initialValues;
    }
  }

  public subscribe<K extends keyof T>(event: K, callback: EventHandler<T[K]>): () => void {
    if (!this.subscribers.has(event)) {
      this.subscribers.set(event, []);
    }
    const handlers = this.subscribers.get(event)!;
    handlers.push(callback as EventHandler<T[keyof T]>);

    return () => {
      this.unsubscribe(event, callback);
    };
  }

  public unsubscribe<K extends keyof T>(event: K, callback: EventHandler<T[K]>): void {
    const handlers = this.subscribers.get(event);
    if (handlers) {
      this.subscribers.set(event, handlers.filter(sub => sub !== callback));
    }
  }

  public set<K extends keyof T>(event: K, value: T[K]): void {
    this.values[event] = value;
    this.notifySubscribers(event);
  }

  public get<K extends keyof T>(event: K): T[K] | undefined {
    return this.values[event];
  }

  private notifySubscribers<K extends keyof T>(event: K): void {
    const handlers = this.subscribers.get(event);
    const value = this.values[event];
    if (handlers && value !== undefined) {
      handlers.forEach(callback => callback(value));
    }
  }
}

export class ObservableClass<T extends EventMap> {
  private subscribers: Map<keyof T, EventHandler<T[keyof T]>[]> = new Map();

  public subscribe<K extends keyof T>(event: K, callback: EventHandler<T[K]>): () => void {
    if (!this.subscribers.has(event)) {
      this.subscribers.set(event, []);
    }
    const handlers = this.subscribers.get(event)!;
    handlers.push(callback as EventHandler<T[keyof T]>);

    return () => {
      this.unsubscribe(event, callback);
    };
  }

  public unsubscribe<K extends keyof T>(event: K, callback: EventHandler<T[K]>): void {
    const handlers = this.subscribers.get(event);
    if (handlers) {
      this.subscribers.set(event, handlers.filter(sub => sub !== callback));
    }
  }

  public notify<K extends keyof T>(event: K, value: T[K]): void {
    const handlers = this.subscribers.get(event);
    if (handlers) {
      handlers.forEach(callback => callback(value));
    }
  }
}