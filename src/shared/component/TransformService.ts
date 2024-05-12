import { ObjectOverlayStorage } from "shared/component/ObjectOverlayStorage";
import {
	TransformContainer,
	type TransformBuilder,
	type TransformProps,
	type TweenableProperties,
} from "shared/component/Transform";
import { Objects } from "shared/fixes/objects";

type State<T extends object> = { readonly [k in TweenableProperties<T>]?: T[k] };
export namespace TransformService {
	const transforms = new Map<object, TransformContainer<object>>();
	export const commonProps = {
		quadOut02: { style: "Quad", direction: "Out", duration: 0.2 },
	} as const satisfies Record<string, TransformProps>;

	export function run<T extends object>(
		instance: T,
		setup: (transform: TransformBuilder<T>, instance: T) => void,
	): void {
		transforms.get(instance)?.finish();

		const container = new TransformContainer(instance);
		transforms.set(instance, container);
		container.run((transform, instance) => {
			setup(transform, instance);
			transform.then().func(() => {
				container.destroy();
				transforms.delete(instance);
			});
		});
		container.enable();
	}
	export function finish(instance: object) {
		transforms.get(instance)?.finish();
	}
	export function cancel(instance: object) {
		const transform = transforms.get(instance);
		if (!transform) return;

		transform.cancel();
		transform.destroy();
		transforms.delete(instance);
	}

	export function stateMachineFunc<
		T extends object,
		TStates extends { readonly [k in string]: (builder: TransformBuilder<T>) => void },
	>(
		instance: T,
		states: TStates,
		setupStart?: (transform: TransformBuilder<T>, state: keyof TStates) => void,
		setupEnd?: (transform: TransformBuilder<T>, state: keyof TStates) => void,
	): { readonly [k in keyof TStates]: () => void } {
		const result: Partial<Readonly<Record<keyof TStates, () => void>>> = {};
		for (const [name, state] of pairs(states)) {
			result[name] = () => {
				const setup = (tr: TransformBuilder<T>) => {
					if (setupStart) {
						setupStart(tr, name);
						tr.then();
					}

					state(tr);

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
	export function stateMachine<T extends object, TStates extends { readonly [k in string]: State<T> }>(
		instance: T,
		props: TransformProps,
		states: TStates,
		setupStart?: (transform: TransformBuilder<T>, state: keyof TStates) => void,
		setupEnd?: (transform: TransformBuilder<T>, state: keyof TStates) => void,
	): { readonly [k in keyof TStates & string]: () => void } {
		return stateMachineFunc(
			instance,
			Objects.fromEntries(
				Objects.entriesArray(states).map(
					([k, state]) =>
						[
							k as keyof TStates & string,
							(tr: TransformBuilder<T>) => {
								for (const [key, value] of pairs(state)) {
									tr.transform(key as TweenableProperties<T>, value as never, props);
								}
							},
						] as const,
				),
			),
			setupStart,
			setupEnd,
		);
	}
	export function boolStateMachine<T extends object>(
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
	export function lazyBoolStateMachine<T extends object>(
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

	export function multi<T>(...states: ((value: T) => void)[]): (value: T) => void {
		return (value: T) => {
			for (const state of states) {
				state(value);
			}
		};
	}

	export function overlay<T extends object, TInstance extends T>(
		instance: TInstance,
		defaultValues: T,
		props: TransformProps,
	) {
		return new ObjectOverlayStorage(defaultValues, (vis) =>
			TransformService.run(instance, (tr) => tr.transformMulti(vis, props)),
		);
	}
}
