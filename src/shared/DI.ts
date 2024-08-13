type IRegistration<T> = {
	get(di: ReadonlyDIContainer): T;
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
	function injectable(...args: unknown[]): void;
	function inject(...args: unknown[]): void;
	function tryInject(...args: unknown[]): void;
}

type DepsCreatable<TSelf, TArgs extends readonly unknown[]> = {
	readonly prototype: unknown;
	_depsCreate(...args: [...TArgs, deps: ReadonlyDIContainer]): TSelf;
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
	container: ReadonlyDIContainer,
): ConstructorResult<TCtor> => {
	const isDeps = (clazz: unknown): clazz is DepsCreatable<ConstructorResult<TCtor>, TArgs> =>
		typeIs(clazz, "table") && "_depsCreate" in clazz;
	const isInject = (
		instance: ConstructorResult<TCtor>,
	): instance is typeof instance & { _inject(di: DIContainer): void } => "_inject" in instance;

	const instance = isDeps(clazz)
		? clazz._depsCreate(...[...(args ?? ([] as unknown as TArgs)), container])
		: new (clazz as unknown as new (...args: TArgs) => ConstructorResult<TCtor>)(
				...(args ?? ([] as unknown as TArgs)),
			);

	if (isInject(instance)) {
		const scope = container.beginScope();
		scope.registerSingleton(instance, getSymbol(clazz));

		instance._inject(scope);
	}

	return instance;
};

type ConstructorResult<T extends abstract new (...args: never) => unknown> = T extends abstract new (
	...args: never
) => infer TRes
	? TRes & defined
	: never;

export type DIRegistrationContext<T> = {
	onInit<TThis>(this: TThis, func: (value: T, di: DIContainer) => void): TThis;
};
export type DISingletonClassRegistrationContext<T extends abstract new (...args: never) => unknown> =
	DIRegistrationContext<ConstructorResult<T>> & {
		withArgs<TThis>(
			this: TThis,
			args:
				| ((di: ReadonlyDIContainer) => Partial<[...ConstructorParameters<T>]>)
				| Partial<[...ConstructorParameters<T>]>,
		): TThis;
	};
type D = DIContainer;
export class DIContainer {
	readonly registrations = new Map<string, IRegistration<unknown>>();

	constructor() {
		this.registerSingleton(this);
		this.registerSingleton<ReadonlyDIContainer>(this);
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

		let savedArgs:
			| Partial<[...ConstructorParameters<T>]>
			| ((di: ReadonlyDIContainer) => Partial<[...ConstructorParameters<T>]>)
			| undefined = undefined;
		const reg = this.registerSingletonFunc((di) => {
			const args = typeIs(savedArgs, "function") ? savedArgs(di) : savedArgs;
			return instantiateClass(clazz, args, di);
		}, name);

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
		const onInit: ((value: T, di: DIContainer) => void)[] = [];
		const selv = this;

		this.registrations.set(name, {
			get(ctx) {
				if (created) return created;

				created = func(ctx);
				for (const func of onInit) {
					func(created, selv);
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

	registerTransientFunc<T extends defined>(func: (ctx: ReadonlyDIContainer) => T, name?: string): void {
		this.assertNotNull(func, name);
		if (this.registrations.get(name)) {
			throw `Dependency ${name} is already registered`;
		}

		this.registrations.set(name, {
			get(ctx) {
				return func(ctx);
			},
		});
	}
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	registerTransientClass<T extends abstract new (...args: any) => unknown>(clazz: T, name?: string): void {
		name ??= getSymbol(clazz);
		this.assertNotNull(clazz, name);
		if (this.registrations.get(name)) {
			throw `Dependency ${name} is already registered`;
		}

		this.registrations.set(name, {
			get(di) {
				return instantiateClass(clazz, [], di);
			},
		});
	}

	tryResolve<T extends defined>(name: string): T | undefined {
		return this.registrations.get(name)?.get(this) as T;
	}
	resolve<T extends defined>(name?: string): T {
		assert(name);
		const registration = this.registrations.get(name);
		if (!registration) {
			throw `Dependency ${name} is not registered`;
		}

		return registration.get(this) as T;
	}
	resolveByClass<T extends abstract new (...args: any[]) => unknown>(clazz: T, name?: string): ConstructorResult<T> {
		return this.resolve<ConstructorResult<T>>(name ?? getSymbol(clazz));
	}

	resolveForeignClass<T extends abstract new (...args: any[]) => unknown>(
		clazz: T,
		args?: Partial<readonly [...ConstructorParameters<T>]>,
	): T extends abstract new (...args: any[]) => infer R ? R : never {
		return instantiateClass(clazz as never, args, this);
	}

	beginScope(): DIContainer {
		return new DIContainerScope(this);
	}
}
class DIContainerScope extends DIContainer {
	constructor(private readonly parent: DIContainer) {
		super();
	}

	tryResolve<T extends defined>(name: string): T | undefined {
		return super.tryResolve<T>(name) ?? this.parent.tryResolve<T>(name);
	}
	resolve<T extends defined>(name: string): T {
		return super.tryResolve<T>(name) ?? this.parent.resolve<T>(name);
	}
}
