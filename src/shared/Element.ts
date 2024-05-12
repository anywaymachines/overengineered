import { Objects } from "shared/fixes/objects";

export type ElementProperties<T extends Instance> = Partial<ExcludeMembers<T, "Name">>;

export namespace Element {
	export function create<
		T extends keyof CreatableInstances,
		const TChildren extends Readonly<Record<string, Instance>>,
	>(this: void, instanceType: T, properties?: ElementProperties<CreatableInstances[T]>): CreatableInstances[T];
	export function create<
		T extends keyof CreatableInstances,
		const TChildren extends Readonly<Record<string, Instance>>,
	>(
		this: void,
		instanceType: T,
		properties?: ElementProperties<CreatableInstances[T]>,
		children?: TChildren,
	): CreatableInstances[T] & { [k in keyof TChildren]: TChildren[k] };
	export function create<
		T extends keyof CreatableInstances,
		const TChildren extends Readonly<Record<string, Instance>>,
	>(
		this: void,
		instanceType: T,
		properties?: ElementProperties<CreatableInstances[T]>,
		children?: TChildren,
	): CreatableInstances[T] & { [k in keyof TChildren]: TChildren[k] } {
		const instance = new Instance(instanceType);

		if (properties !== undefined) {
			Objects.assign(instance, properties);
		}

		if (children) {
			for (const [name, child] of pairs(children)) {
				child.Name = name as string;
				child.Parent = instance;
			}
		}

		return instance as CreatableInstances[T] & { [k in keyof TChildren]: TChildren[k] };
	}

	export function newFont(this: void, font: Enum.Font, weight: Enum.FontWeight) {
		const f = Font.fromEnum(font);
		f.Weight = weight;

		return f;
	}
}
