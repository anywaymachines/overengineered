# Component system

Component is a something that can be enabled, disabled and destroyed:
```ts
interface IComponent {
	enable(): void;
	disable(): void;
	destroy(): void;
}
```

It also provides methods to observe its state:
```ts
interface IReadonlyComponent {
	isEnabled(): boolean;
	isDestroyed(): boolean;

	onEnable(func: () => void): void;
	onDisable(func: () => void): void;
	onDestroy(func: () => void): void;
}
```

The very basic implementation of `IComponent` is `ComponentBase` – but this class is internal, not for public usage.


# Helper types

## [ComponentEvents](../src/shared/component/ComponentEvents.ts)

ComponentEvents is a storage and auto-subscriber for signals. It gets a state (enabled/disabled/destroyed) from the provided `IComponent` and uses it to subscribe to the events on enable, unsubscribe from them on disable, and clear everything out on destroy.

Direct usage:
```ts
const component = new Component();
const events = new ComponentEvents(component);
events.subscribe(UserInputService.Heartbeat, (dt) => print("Heartbeat"));

component.enable(); // starts printing 'Heartbeat'
component.disable(); // stops printing 'Heartbeat'
component.destroy(); // stops printing 'Heartbeat' forever
```

Most notable methods:
```ts
/** Register an event */
subscribe<T extends Callback = Callback>(signal: RBXScriptSignal<T>, callback: T): void;

/** Subscribe to an observable value changed event */
subscribeObservable2<T>(observable: ReadonlyObservableValue<T>, callback: (value: T, prev: T) => void, executeOnEnable = false, executeImmediately = false): void
```

You should not use this class directly, but only by accessing the `Component.events` property.


## [ComponentChildren](../src/shared/component/ComponentChildren.ts)

Storage for components that needs to be enabled/disabled/destroyed with the other (parent) component. Added children just start copying the parent component state.

Any removed child would be destroyed.


## [ComponentChild](../src/shared/component/ComponentChild.ts)

The same as [ComponentChildren](#componentchildren) but can store only 0 or 1 child.


## [ComponentInstance](../src/shared/component/ComponentInstance.ts)

Handles the destruction of the provided `Instance`, along with the component – on destruction of either the instance or the component, destroys both.



# Component types

## [Component](../src/shared/component/Component.ts)

A default component implementation.
Includes the
```ts
readonly event: ComponentEvents
```
property, and provides a method to parent another components to this one, using
```ts
protected parent<T extends IComponent>(child: T): T;
```
(see [ComponentChildren](#componentchildren) for the explanation)


## [ContainerComponent](../src/shared/component/ContainerComponent.ts)

A [Component](#component) with the built-in [ComponentChildren](#componentchildren) and methods to simplify its usage.


## [InstanceComponent](../src/shared/component/InstanceComponent.ts)

A [ContainerComponent](#containercomponent) with the built-in [ComponentInstance](#componentinstance) and methods to simplify its usage.


## Client components

All of the `Component` types have their client counterparts – [ClientComponent](../src/client/component/ClientComponent.ts), [ClientContainerComponent](../src/client/component/ClientContainerComponent.ts), [ClientInstanceComponent](../src/client/component/ClientInstanceComponent.ts).

They replace the `event` property type with [ClientComponentEvents](#clientcomponentevents) and provide `prepare\*\*\*` methods to override.

## [ClientComponentEvents](../src/client/component/ClientComponentEvents.ts)

Extends [ComponentEvents](#componentevents) to include methods for handling user input.
