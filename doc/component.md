# Component system
***TEST BECAUSE I DontT KNOW HOW T OwwriTE DOudemdENTATIOn***


* [Definition](#Definition)
* Component types
  * [ComponentBase](#ComponentBase)
  * [ComponentContainer](#ComponentContainer)
  * [Component](#Component)
  * [Control](#Control)


# Definition
Component is a base part of the component system.

# ComponentEventHolder
Is used to subscribe to any kind of event with the ability to disable their handling at any time. Automatically reregisters the events on input type change.
```ts
const event = new ComponentEventHolder()
event.subscribe(RunService.Heartbeat, () => print("Heartbeat!"));

event.enable() // starts printing 'Heartbeat!'
event.disable() // stops printing 'Heartbeat!'
event.enable() // starts printing 'Heartbeat!'
event.destroy() // stops printing 'Heartbeat!' forever
```

You should not use this class directly, instead use any of the Component classes.

# ComponentBase
The base of any component. Holds an instance of `ComponentEventHolder` and automatically manages it.

**Important:**
Only use `this.event` in the constructor or any function that is only invoked once;
Only use `this.eventHolder` and `this.inputHandler` anywhere else.

# ComponentContainer
A `ComponentBase` that has children.

Usage:
```ts
const container = new ComponentContaier();
const child = new ComponentBase();
container.add(child);
container.remove(child);
```
All the children of this component are automatically enabled/disabled/destroyed with this one.

# Component
A `ComponentContainer` that manages an `Instance`.

The provided `Instance` would be destroyed with the component, and, likewise, this component would be destroyed with the `Instance`.

# Control
A `Component` that manages a `GuiObject`.

Provides methods to show and hide the `GuiObject`.
