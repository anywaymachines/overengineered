import { SlimSignal } from "shared/event/SlimSignal";

declare global {
	interface IReadonlyEnableableComponent {
		isEnabled(): boolean;
		onEnable(func: () => void): void;
	}
	interface IReadonlyDisableableComponent {
		onDisable(func: () => void): void;
	}
	interface IReadonlyDestroyableComponent {
		isDestroyed(): boolean;
		onDestroy(func: () => void): void;
	}
	interface IReadonlyComponent
		extends IReadonlyEnableableComponent,
			IReadonlyDisableableComponent,
			IReadonlyDestroyableComponent {}

	interface IEnableableComponent {
		enable(): void;
	}
	interface IDisableableComponent {
		disable(): void;
	}
	interface IDestroyableComponent {
		destroy(): void;
	}
	interface IWriteonlyComponent extends IEnableableComponent, IDisableableComponent, IDestroyableComponent {}

	interface IComponent extends IReadonlyComponent, IWriteonlyComponent {}

	interface IDebuggableComponent {
		getDebugChildren(): readonly object[];
	}
}

export class DestroyableComponent implements IDestroyableComponent, IReadonlyDestroyableComponent {
	private readonly onDestroyed = new SlimSignal();

	private selfDestroyed = false;

	isDestroyed(): boolean {
		return this.selfDestroyed;
	}

	onDestroy(func: () => void): void {
		this.onDestroyed.Connect(func);
	}

	destroy(): void {
		if (this.selfDestroyed) return;

		this.selfDestroyed = true;
		this.onDestroyed.Fire();

		this.dispose();
	}

	protected dispose() {
		this.onDestroyed.destroy();
	}
}
export class ComponentBase extends DestroyableComponent {
	private readonly onEnabled = new SlimSignal();
	private readonly onDisabled = new SlimSignal();

	private selfEnabled = false;

	isEnabled(): boolean {
		return this.selfEnabled;
	}

	onEnable(func: () => void): void {
		this.onEnabled.Connect(func);
	}
	onDisable(func: () => void): void {
		this.onDisabled.Connect(func);
	}

	enable(): void {
		if (this.isDestroyed() || this.selfEnabled) return;

		this.selfEnabled = true;
		this.onEnabled.Fire();
	}
	disable(): void {
		if (this.isDestroyed() || !this.selfEnabled) return;

		this.selfEnabled = false;
		this.onDisabled.Fire();
	}
	destroy(): void {
		if (this.isDestroyed()) return;

		this.disable();
		super.destroy();
	}

	protected dispose(): void {
		super.dispose();

		this.onEnabled.destroy();
		this.onDisabled.destroy();
	}
}
