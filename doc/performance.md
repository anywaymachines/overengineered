# Performance knowledge
... you also write something ig

# Signal connections

Subscribing to a lot of signals is bad.
You should not do this:
```ts
for (let i = 0; i < 1_000_000; i++) {
	UserInputService.InputBegan.Connect((input) => {
		if (input.UserInputType !== Enum.UserInputType.Keyboard) return;
		if (input.KeyCode !== Enum.KeyCode.B) return;
	});
}
```

Instead do this:
```ts
const callbacks: ((input: InputObject) => void)[] = [];
UserInputService.InputBegan.Connect((input) => {
	for (const callback of callbacks) {
		callback(input);
	}
});

for (let i = 0; i < 1_000_000; i++) {
	callbacks.push((input) => {
		if (input.UserInputType !== Enum.UserInputType.Keyboard) return;
		if (input.KeyCode !== Enum.KeyCode.B) return;
	});
}
```
