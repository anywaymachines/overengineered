type Replace<T, TKey extends keyof T, TValue> = Omit<T, TKey> & { readonly [k in TKey]: TValue };
type ReplaceWith<T, TProps extends { readonly [k in keyof T | string]?: unknown }> = Reconstruct<
	Omit<T, keyof TProps & keyof T> & TProps
>;

type MakePartial<T, TKey extends keyof T> = Reconstruct<Omit<T, TKey> & { [k in TKey]?: T[k] }>;
