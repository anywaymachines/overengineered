type IRegistration<T> = {
	readonly get: (...args: unknown[]) => T;
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
const instantiateClass = <T, TCtor extends abstract new (...args: TArgs) => T, TArgs extends readonly unknown[]>(
	clazz: TCtor,
	args: TArgs | undefined,
	container: DIContainer,
): T => {
	const isDeps = (clazz: unknown): clazz is DepsCreatable<T, TArgs> =>
		typeIs(clazz, "table") && "_depsCreate" in clazz;

	if (isDeps(clazz)) {
		return clazz._depsCreate(...[...(args ?? ([] as unknown as TArgs)), container]);
	}

	return new (clazz as unknown as new (...args: TArgs) => T)(...(args ?? ([] as unknown as TArgs)));
};

type D = DIContainer;
export class DIContainer {
	private readonly registrations = new Map<string, IRegistration<unknown>>();

	constructor() {
		this.registerSingleton(this);
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	registerSingletonClass<T extends abstract new (...args: any) => unknown>(clazz: T, name?: string): void {
		name ??= getSymbol(clazz);
		assert(name);
		if (this.registrations.get(name)) {
			throw `Dependency ${name} is already registered`;
		}

		let created: unknown | undefined;
		this.registrations.set(name, {
			get: (args) => (created ??= instantiateClass(clazz, args as [] | undefined, this)),
		});
	}
	registerSingleton<T extends defined>(value: T, name?: string): void {
		name ??= getSymbol(value);
		assert(name);
		if (this.registrations.get(name)) {
			throw `Dependency ${name} is already registered`;
		}

		this.registrations.set(name, { get: () => value });
	}

	registerTransient<T extends defined>(func: (ctx: DIContainer) => T, name?: string): void {
		assert(name);
		if (this.registrations.get(name)) {
			throw `Dependency ${name} is already registered`;
		}

		this.registrations.set(name, { get: () => func(this) });
	}
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	registerTransientClass<T extends abstract new (...args: any) => unknown>(clazz: T, name?: string): void {
		name ??= getSymbol(clazz);
		assert(name);
		if (this.registrations.get(name)) {
			throw `Dependency ${name} is already registered`;
		}

		this.registrations.set(name, {
			get: (args) => instantiateClass(clazz, args as [] | undefined, this),
		});
	}

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
		name ??= getSymbol(clazz);
		return this.resolveClass<T>([] as never, name);
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	resolveClass<T extends abstract new (...args: never) => unknown>(
		args: Partial<[...ConstructorParameters<T>]>,
		name?: string,
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
	): T extends abstract new (...args: never) => infer R ? R : never {
		assert(name);
		const registration = this.registrations.get(name);
		if (!registration) {
			throw `Dependency ${name} is not registered`;
		}

		return registration.get(args) as never;
	}

	regResolve<T extends abstract new (...args: never) => unknown>(
		clazz: T,
		args?: Partial<[...ConstructorParameters<T>]>,
	): T extends abstract new (...args: never) => infer R ? R : never {
		const name = getSymbol(clazz);
		this.registerSingletonClass(clazz);

		return this.resolveClass(args as never, name) as never;
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
