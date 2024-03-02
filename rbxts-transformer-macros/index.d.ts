type MacroList<T> = { readonly [key: string]: (this: T, ...args: any[]) => unknown };

export function $defineCallMacros<T, R extends MacroList<T> = MacroList<T>>(macros: R): R;
export function $definePropMacros<T, R extends MacroList<T> = MacroList<T>>(macros: R): R;
