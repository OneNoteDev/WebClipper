export interface Options {
	times?: number;
	callOnSubscribe?: boolean;
}

export class SmartValue<T> {
	private t: T;
	private subscriptions: {
		func: (newValue: T) => void,
		times: number
	}[] = [];

	constructor(t?: T) {
		this.t = t;
	}

	public subscribe(func: (newValue: T) => void, options: Options = {}) {
		// Setup the defaults if they weren't specified
		if (options.times === undefined) {
			options.times = Infinity;
		}
		if (options.callOnSubscribe === undefined) {
			options.callOnSubscribe = true;
		}

		if (options.callOnSubscribe) {
			func(this.t);
		}
		if (options.times > 0) {
			this.subscriptions.push({ func: func, times: options.times });
		}
	}

	public unsubscribe(func: (newValue: T) => void) {
		for (let i = 0; i < this.subscriptions.length; i++) {
			if (func === this.subscriptions[i].func) {
				this.subscriptions.splice(i, 1);
				return;
			}
		}
	}

	public set(t: T): SmartValue<T> {
		if (this.t !== t) {
			this.t = t;
			this.notifySubscribers();
		}
		return this;
	}

	public get(): T {
		return this.t;
	}

	public forceUpdate() {
		this.notifySubscribers();
	}

	public equals(t: T): boolean {
		return this.t === t;
	}

	public toString(): string {
		return !this.t ? "undefined" : this.t.toString();
	}

	private notifySubscribers() {
		let numSubscribers = this.subscriptions.length;
		for (let i = 0; i < numSubscribers; i++) {
			this.subscriptions[i].times--;
			this.subscriptions[i].func(this.t);

			let noMoreExecutions = this.subscriptions[i] && this.subscriptions[i].times === 0;
			if (noMoreExecutions) {
				this.subscriptions.splice(i, 1);
			}

			// We check for undefined as the callback could have called unsubscribe
			if (!this.subscriptions[i] || noMoreExecutions) {
				numSubscribers--;
				i--;
			}
		}
	}

	// Subscribe to multiple SVs.
	// Example:
	// var appleColor: SmartValue<string>;
	// var appleCount: SmartValue<number>;
	// Subscribe( [appleColor, appleCount], function(color, count) { /*Do something*/});
	public static subscribe(values: SmartValue<any>[], func: (...args: any[]) => any) {
		for (let i = 0; i < values.length; i++) {
			values[i].subscribe(function() {
				let currValues: SmartValue<any>[] = [];
				for (let j = 0; j < values.length; j++) {
					currValues.push(values[j].get());
				}

				// ReSharper disable once SuspiciousThisUsage
				func.apply(this, currValues);
			});
		}
	}
}
