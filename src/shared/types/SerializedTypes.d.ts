type SerializedCFrame = readonly [number, number, number, readonly [number, number, number]];
type SerializedColor = string;
type SerializedVector = readonly [number, number, number];
type SerializedVector2 = readonly [x: number, y: number];

type SerializedUDim = readonly [scale: number, offset: number];
type SerializedUDim2 = readonly [x: SerializedUDim, y: SerializedUDim];

type SerializedEnum = number;
