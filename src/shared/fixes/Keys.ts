export const Keys: { readonly [k in KeyCode]: Enum.KeyCode } = asObject(
	Enum.KeyCode.GetEnumItems().mapToMap((e) => $tuple(e.Name, e)),
);
