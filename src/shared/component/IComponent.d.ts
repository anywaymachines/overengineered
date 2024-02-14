interface IComponent {
	isEnabled(): boolean;
	isDestroyed(): boolean;

	onEnable(func: () => void): void;
	onDisable(func: () => void): void;
	onDestroy(func: () => void): void;

	enable(): void;
	disable(): void;
	destroy(): void;
}
