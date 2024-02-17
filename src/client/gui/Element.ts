import { Element as elem, ElementProperties as elemProps } from "shared/Element";

export type ElementProperties<T extends Instance> = elemProps<T>;
export const Element = elem;
