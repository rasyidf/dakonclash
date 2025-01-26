
export class Observable<T> {
  private subscribers: Array<(value: T) => void> = [];
  private value: T;

  constructor(value: T) {
    this.value = value;
  }

  public subscribe(callback: (value: T) => void): () => void {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter(sub => sub !== callback);
    };
  }

  public set(value: T): void {
    this.value = value;
    this.notifySubscribers();
  }

  public get(): T {
    return this.value;
  }

  private notifySubscribers(): void {
    this.subscribers.forEach(callback => callback(this.value));
  }
}

export class ObservableClass<T> {
  private subscribers: Array<(value: T) => void> = [];
  public subscribe(callback: (value: T) => void): () => void {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter(sub => sub !== callback);
    };
  }

  public notify(
    value: T,
  ): void {
    this.subscribers.forEach(callback => callback(value));
  }
}