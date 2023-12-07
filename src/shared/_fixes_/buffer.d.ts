type buffer = {} & Symbol;
declare const buffer: {
	create(this: void, size: number): buffer;
	copy(this: void, target: buffer, targetOffset: number, source: buffer, sourceOffset?: number, count?: number): void;

	fromstring(this: void, str: string): buffer;

	fromstring(this: void, b: buffer, str: string): buffer;
	tostring(this: void, b: buffer): string;

	readi8(this: void, b: buffer, offset: number): number;
	readu8(this: void, b: buffer, offset: number): number;
	readi16(this: void, b: buffer, offset: number): number;
	readu16(this: void, b: buffer, offset: number): number;
	readi32(this: void, b: buffer, offset: number): number;
	readu32(this: void, b: buffer, offset: number): number;
	readf32(this: void, b: buffer, offset: number): number;
	readf64(this: void, b: buffer, offset: number): number;

	writei8(this: void, b: buffer, offset: number, value: number): void;
	writeu8(this: void, b: buffer, offset: number, value: number): void;
	writei16(this: void, b: buffer, offset: number, value: number): void;
	writeu16(this: void, b: buffer, offset: number, value: number): void;
	writei32(this: void, b: buffer, offset: number, value: number): void;
	writeu32(this: void, b: buffer, offset: number, value: number): void;
	writef32(this: void, b: buffer, offset: number, value: number): void;
	writef64(this: void, b: buffer, offset: number, value: number): void;

	readstring(this: void, b: buffer, offset: number, count: number): string;
	writestring(this: void, b: buffer, offset: number, value: string, count?: number): void;
	fill(this: void, b: buffer, offset: number, value: number, count?: number): void;

	tostring(this: void, b: buffer): string;
};
