interface IReadonlyComponent extends IDebuggableComponent {
	isEnabled(): boolean;
	isDestroyed(): boolean;

	onEnable(func: () => void): void;
	onDisable(func: () => void): void;
	onDestroy(func: () => void): void;
}
interface IComponent extends IReadonlyComponent {
	enable(): void;
	disable(): void;
	destroy(): void;
}

interface IDebuggableComponent {
	getDebugChildren(): readonly IDebuggableComponent[];
}
