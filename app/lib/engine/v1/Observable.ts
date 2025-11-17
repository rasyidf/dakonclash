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
      const filtered = handlers.filter(sub => sub !== callback);
      if (filtered.length > 0) {
        this.subscribers.set(event, filtered);
      } else {
        this.subscribers.delete(event as keyof T);
      }
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
    if (handlers) {
      handlers.forEach(callback => {
        try {
          callback(value as T[K]);
        } catch (err) {
          // Protect the publisher from subscriber errors
          // Subscribers are independent and should not break notification flow
          // eslint-disable-next-line no-console
          console.error('Observable subscriber error', err);
        }
      });
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
      const filtered = handlers.filter(sub => sub !== callback);
      if (filtered.length > 0) {
        this.subscribers.set(event, filtered);
      } else {
        this.subscribers.delete(event as keyof T);
      }
    }
  }

  public notify<K extends keyof T>(event: K, value: T[K]): void {
    const handlers = this.subscribers.get(event);
    if (handlers) {
      handlers.forEach(callback => {
        try {
          callback(value);
        } catch (err) {
          // eslint-disable-next-line no-console
          console.error('ObservableClass subscriber error', err);
        }
      });
    }
  }
}