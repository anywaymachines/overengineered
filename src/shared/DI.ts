type IRegistration<T> = {
	readonly get: () => T;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ConstructorParameters<T extends abstract new (...args: any) => any> = T extends new (...args: infer P) => any
	? P
	: never;

declare global {
	type DIContainer = D;
	type ReadonlyDIContainer = Pick<
		DIContainer,
		"beginScope" | "tryResolve" | (`resolve${string}` & keyof DIContainer)
	>;
	type WriteonlyDIContainer = Pick<DIContainer, `register${string}` & keyof DIContainer>;

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	function injectable(selv: { readonly prototype: unknown; new (...args: any): unknown }): void;
	function inject(selv: { readonly prototype: unknown }, paramName: string | undefined, paramIndex: number): void;
}

type DepsCreatable<TSelf, TArgs extends readonly unknown[]> = {
	readonly prototype: unknown;
	_depsCreate(...args: [...TArgs, deps: DIContainer]): TSelf;
};

const getSymbol = <T extends object>(obj: T): string => {
	const meta = getmetatable(obj) as { __csymbol?: string; __index?: object };
	const s = meta.__csymbol;
	if (s !== undefined) return s;

	if (!meta.__index) {
		const mmeta = getmetatable(meta);
		assert(mmeta);

		return getSymbol(mmeta);
	}

	assert(meta.__index !== obj);
	return getSymbol(meta.__index);
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const instantiateClass = <TCtor extends abstract new (...args: TArgs) => unknown, TArgs extends readonly unknown[]>(
	clazz: TCtor,
	args: TArgs | undefined,
	container: DIContainer,
): ConstructorResult<TCtor> => {
	const isDeps = (clazz: unknown): clazz is DepsCreatable<ConstructorResult<TCtor>, TArgs> =>
		typeIs(clazz, "table") && "_depsCreate" in clazz;

	if (isDeps(clazz)) {
		return clazz._depsCreate(...[...(args ?? ([] as unknown as TArgs)), container]);
	}

	return new (clazz as unknown as new (...args: TArgs) => ConstructorResult<TCtor>)(
		...(args ?? ([] as unknown as TArgs)),
	);
};

type ConstructorResult<T extends abstract new (...args: never) => unknown> = T extends abstract new (
	...args: never
) => infer TRes
	? TRes & defined
	: never;

export type DIRegistrationContext<T> = {
	onInit<TThis>(this: TThis, func: (value: T) => void): TThis;
};
export type DISingletonClassRegistrationContext<T extends abstract new (...args: never) => unknown> =
	DIRegistrationContext<ConstructorResult<T>> & {
		withArgs<TThis>(this: TThis, args: Partial<[...ConstructorParameters<T>]>): TThis;
	};
type D = DIContainer;
export class DIContainer {
	private readonly registrations = new Map<string, IRegistration<unknown>>();

	constructor() {
		this.registerSingleton(this);
	}

	private assertNotNull<T>(value: T, name: string | undefined): asserts name is string {
		if (name === undefined) {
			throw `Name is null when registering ${value}`;
		}
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	registerSingletonClass<T extends abstract new (...args: any) => unknown>(
		clazz: T,
		name?: string,
	): DISingletonClassRegistrationContext<T> {
		name ??= getSymbol(clazz);

		let savedArgs: Partial<[...ConstructorParameters<T>]> | undefined = undefined;
		const reg = this.registerSingletonFunc(() => instantiateClass(clazz, savedArgs, this), name);

		return {
			onInit(func) {
				reg.onInit(func);
				return this;
			},
			withArgs(args) {
				savedArgs = args;
				return this;
			},
		};
	}
	registerSingleton<T extends defined>(value: T, name?: string): DIRegistrationContext<T> {
		name ??= getSymbol(value);
		return this.registerSingletonFunc(() => value, name);
	}
	registerSingletonFunc<T extends defined>(
		func: (ctx: ReadonlyDIContainer) => T,
		name?: string,
	): DIRegistrationContext<T> {
		name ??= getSymbol(func);
		this.assertNotNull(func, name);
		if (this.registrations.get(name)) {
			throw `Dependency ${name} is already registered`;
		}

		let created: T | undefined;
		const onInit: ((value: T) => void)[] = [];

		this.registrations.set(name, {
			get: () => {
				if (created) return created;

				created = func(this);
				for (const func of onInit) {
					func(created);
				}

				return created;
			},
		});

		return {
			onInit(func) {
				onInit.push(func);
				return this;
			},
		};
	}

	registerTransientFunc<T extends defined>(func: (ctx: DIContainer) => T, name?: string): void {
		this.assertNotNull(func, name);
		if (this.registrations.get(name)) {
			throw `Dependency ${name} is already registered`;
		}

		this.registrations.set(name, { get: () => func(this) });
	}
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	/*registerTransientClass<T extends abstract new (...args: any) => unknown>(clazz: T, name?: string): void {
		name ??= getSymbol(clazz);
		this.assertNotNull(clazz, name);
		if (this.registrations.get(name)) {
			throw `Dependency ${name} is already registered`;
		}

		const args: [] | undefined = undefined;

		this.registrations.set(name, {
			get: () => instantiateClass(clazz, args, this),
		});
	}*/

	tryResolve<T extends defined>(name: string): T | undefined {
		return this.registrations.get(name)?.get() as T;
	}
	resolve<T extends defined>(name?: string): T {
		assert(name);
		const registration = this.registrations.get(name);
		if (!registration) {
			throw `Dependency ${name} is not registered`;
		}

		return registration.get() as T;
	}
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	resolveByClass<T extends abstract new (...args: any) => unknown>(clazz: T, name?: string) {
		return this.resolveClass<T>(name ?? getSymbol(clazz));
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	resolveClass<T extends abstract new (...args: never) => unknown>(
		name?: string,
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
	): T extends abstract new (...args: never) => infer R ? R : never {
		assert(name);
		const registration = this.registrations.get(name);
		if (!registration) {
			throw `Dependency ${name} is not registered`;
		}

		return registration.get() as never;
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	resolveForeignClass<T extends abstract new (...args: any) => unknown>(
		clazz: T,
		args?: Partial<readonly [...ConstructorParameters<T>]>,
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
	): T extends abstract new (...args: any) => infer R ? R : never {
		return instantiateClass(clazz as never, args, this);
	}

	beginScope(): DIContainer {
		return new IDIContainerScope(this);
	}
}
export class IDIContainerScope extends DIContainer {
	constructor(private readonly parent: DIContainer) {
		super();
	}

	tryResolve<T extends defined>(name: string): T | undefined {
		return super.tryResolve<T>(name) ?? this.parent.tryResolve<T>(name);
	}
	resolve<T extends defined>(name: string): T {
		return this.tryResolve(name) ?? super.resolve(name);
	}
}
