import { ComponentEvents } from "shared/component/ComponentEvents";
import { DIContainer } from "shared/DI";
import { SlimSignal } from "shared/event/SlimSignal";

declare global {
	interface IHostedService extends IEnableableComponent, IDestroyableComponent {}

	interface GameHostBuilderDIContainer extends WriteonlyDIContainer {
		registerService<T extends abstract new (...args: never) => IHostedService>(service: T, name?: string): void;
	}
	type GameHostBuilder = HostBuilder;
	interface GameHost {
		readonly services: ReadonlyDIContainer;

		parent<T extends IEnableableComponent & IDestroyableComponent>(child: T): T;
		run(): void;
	}
}

export class HostedService implements IHostedService {
	protected readonly event: ComponentEvents;

	private readonly onEnabled = new SlimSignal();
	private readonly onDestroyed = new SlimSignal();

	private selfEnabled = false;
	private selfDestroyed = false;

	constructor() {
		this.event = new ComponentEvents(this);
	}

	isEnabled(): boolean {
		return this.selfEnabled;
	}
	isDestroyed(): boolean {
		return this.selfDestroyed;
	}

	onEnable(func: () => void): void {
		this.onEnabled.Connect(func);
	}
	onDestroy(func: () => void): void {
		this.onDestroyed.Connect(func);
	}

	enable(): void {
		if (this.isDestroyed()) return;
		if (this.isEnabled()) return;

		this.selfEnabled = true;
		this.onEnabled.Fire();
		this.onEnabled.destroy();
	}
	destroy(): void {
		if (this.selfDestroyed) return;

		this.selfDestroyed = true;
		this.onDestroyed.Fire();

		this.onEnabled.destroy();
		this.onDestroyed.destroy();
	}

	parent<T extends IEnableableComponent & IDestroyableComponent>(component: T): T {
		this.onEnable(() => component.enable());
		this.onDestroy(() => component.destroy());
		if (this.isEnabled()) component.enable();

		return component;
	}
}

type HostedServiceCtor = abstract new (...args: never) => IHostedService;
class DIContainerBuilder extends DIContainer implements GameHostBuilderDIContainer {
	readonly services: HostedServiceCtor[] = [];

	registerService<T extends HostedServiceCtor>(service: T, name?: string): void {
		this.registerSingletonClass(service, name);
		this.services.push(service);
	}
}

class HostBuilder implements GameHostBuilder {
	private readonly _services = new DIContainerBuilder();
	readonly services: GameHostBuilderDIContainer = this._services;

	build(): GameHost {
		const host = new Host(this._services);
		for (const service of this._services.services) {
			host.parent(host.services.resolveByClass(service));
		}

		return host;
	}
}
class Host extends HostedService implements GameHost {
	readonly services: ReadonlyDIContainer;

	constructor(services: ReadonlyDIContainer) {
		super();
		this.services = services;
	}

	private readonly parented: (IEnableableComponent & IDestroyableComponent)[] = [];
	parent<T extends IEnableableComponent & IDestroyableComponent>(component: T): T {
		$log(`[Host] Registering service ${getmetatable(component) ?? component}`);

		this.parented.push(component);
		return super.parent(component);
	}

	run() {
		for (const child of this.parented) {
			const meta = getmetatable(child) ?? child;

			$log(`[Host] Enabling service ${meta}`);
			child.enable();
			$log(`[Host] Enabled service ${meta}`);
		}

		this.enable();
	}
}

export namespace Game {
	export function createHost(): HostBuilder {
		return new HostBuilder();
	}
}
