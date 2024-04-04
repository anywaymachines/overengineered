import {
	TransformContainer,
	type TransformBuilder,
	type TransformProps,
	type TweenableProperties,
} from "shared/component/Transform";
import Objects from "shared/fixes/objects";

const commonProps: Readonly<Record<string, TransformProps>> = {
	quadOut02: { style: "Quad", direction: "Out", duration: 0.2 },
};

type State<T extends Instance> = { readonly [k in TweenableProperties<T>]?: T[k] };
export class TransformService {
	static readonly commonProps = commonProps;
	private static readonly transforms = new Map<object, TransformContainer<Instance>>();

	static run<T extends Instance>(instance: T, setup: (transform: TransformBuilder<T>, instance: T) => void) {
		this.transforms.get(instance)?.finish();

		const container = new TransformContainer(instance);
		this.transforms.set(instance, container);
		container.run((transform, instance) => {
			setup(transform, instance);
			transform.then().func(() => {
				container.destroy();
				this.transforms.delete(instance);
			});
		});
		container.enable();
	}
	static cancel(instance: object) {
		const transform = this.transforms.get(instance);
		if (!transform) return;

		transform.cancel();
		transform.destroy();
		this.transforms.delete(instance);
	}

	static stateMachine<T extends Instance, TStates extends { readonly [k in string]: State<T> }>(
		instance: T,
		props: TransformProps,
		states: TStates,
		setupStart?: (transform: TransformBuilder<T>, state: keyof TStates) => void,
		setupEnd?: (transform: TransformBuilder<T>, state: keyof TStates) => void,
	): { readonly [k in keyof TStates]: () => void } {
		const result: Partial<Readonly<Record<keyof TStates, () => void>>> = {};
		for (const [name, state] of Objects.pairs(states)) {
			result[name] = () => {
				const setup = (tr: TransformBuilder<T>) => {
					if (setupStart) {
						setupStart(tr, name);
						tr.then();
					}

					for (const [key, value] of Objects.pairs(state)) {
						tr.transform(key as never, value as never, props);
					}

					if (setupEnd) {
						tr.then();
						setupEnd(tr, name);
					}
				};

				TransformService.run(instance, setup);
			};
		}

		return result as Readonly<Record<keyof TStates, () => void>>;
	}
	static boolStateMachine<T extends Instance>(
		instance: T,
		props: TransformProps,
		trueState: State<T>,
		falseState: State<T>,
		setupStart?: (transform: TransformBuilder<T>, state: boolean) => void,
		setupEnd?: (transform: TransformBuilder<T>, state: boolean) => void,
	): (value: boolean) => void {
		const sm = TransformService.stateMachine(
			instance,
			props,
			{ true: trueState, false: falseState },
			setupStart && ((tr, state) => setupStart?.(tr, state === "true")),
			setupEnd && ((tr, state) => setupEnd?.(tr, state === "true")),
		);
		return (value) => (value ? sm.true() : sm.false());
	}
	static lazyBoolStateMachine<T extends Instance>(
		instance: T,
		props: TransformProps,
		trueState: State<T>,
		falseState: State<T>,
		setupStart?: (transform: TransformBuilder<T>, state: boolean) => void,
		setupEnd?: (transform: TransformBuilder<T>, state: boolean) => void,
	): (value: boolean) => void {
		let cache: (value: boolean) => void;
		return () =>
			(cache ??= TransformService.boolStateMachine(instance, props, trueState, falseState, setupStart, setupEnd));
	}

	static multi<T>(...states: ((value: T) => void)[]): (value: T) => void {
		return (value: T) => {
			for (const state of states) {
				state(value);
			}
		};
	}
}
