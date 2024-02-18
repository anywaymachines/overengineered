type BlockData = {
	readonly name: string;
	readonly description: string;
};

export const BlockDataRegistry: Readonly<Record<string, BlockData>> = {
	accelerometer: {
		name: "Accelerometer",
		description: "Returns acceleration",
	},
	altimeter: {
		name: "Altimeter",
		description: "Returns current heigth",
	},
	anchorblock: {
		name: "Anchor",
		description: "Makes your contraption immovable",
	},
	anglesensor: {
		name: "Angle Sensor",
		description: "Returns angle it's rotated to",
	},
	ballinsocket: {
		name: "Ball in Socket",
		description: "Ball socket for your mechanical ingenuities",
	},
	block: {
		name: "Block",
		description: "Makes you question why every engineering game has it",
	},
	concavecornerwedge: {
		name: "Concave Corner Wedge",
		description: "A corner wedge but concave",
	},
	concaveprism: {
		name: "Concave Prism",
		description: "A prism but concave",
	},
	constant: {
		name: "Constant",
		description: "Always returns the value you've set",
	},
	convexcornerwedge: {
		name: "Convex Corner Wedge",
		description: "A corner wedge but convex",
	},
	convexprism: {
		name: "Convex Prism",
		description: "A prism but convex",
	},
	cornerwedge1x1: {
		name: "Corner Wedge 1x1",
		description: "A simple corner wedge",
	},
	cornerwedge2x1: {
		name: "Corner Wedge 2x1",
		description: "A simple coorner wedge",
	},
	cornerwedge3x1: {
		name: "Corner Wedge 3x1",
		description: "A simple cooorner wedge",
	},
	cornerwedge4x1: {
		name: "Corner Wedge 4x1",
		description: "A simple coooorner wedge",
	},
	counter: {
		name: "Counter",
		description: "Returns a previous value plus step value.",
	},
	cylinder1x1: {
		name: "Cylinder 1x1",
		description: "A simple cyllinder",
	},
	cylinder1x2: {
		name: "Cylinder 1x2",
		description: "A longer cyllinder",
	},
	cylinder2x1: {
		name: "Cylinder 2x1",
		description: "A wider sibling of 1x1 cyllinder",
	},
	cylinder2x2: {
		name: "Cylinder 2x2",
		description: "A bigger sibling of 2x1 cyllinder",
	},
	delayblock: {
		name: "Delay Block",
		description: "Returns same value you gave it but with delay",
	},
	disconnectblock: {
		name: "Disconnector",
		description: "Detaches both parts it connected to",
	},
	driveshaft: {
		name: "Driveshaft",
		description: "A shaft that drives",
	},
	halfcylinder1x1: {
		name: "Half Cylinder 1x1",
		description: "A half of a sibling of 1x1 cyllinder",
	},
	halfcylinder1x2: {
		name: "Half Cylinder 1x2",
		description: "A bigger half of a sibling of 1x1 cyllinder",
	},
	halfcylinder2x1: {
		name: "Half Cylinder 2x1",
		description: "Same as 1x2 half cyllinder but wider",
	},
	halfcylinder2x2: {
		name: "Half Cylinder 2x2",
		description: "Same as 1x2 half cyllinder but wider and longer",
	},
	heliumblock: {
		name: "Helium",
		description: "I have no idea how did they manage to pump helium in this block of soap",
	},
	hingeblock: {
		name: "Hinge",
		description: "A simple hinge. Allows things to rotate in one plane",
	},
	innercorner: {
		name: "Inner Corner",
		description: "An inner corner. Some long time ago it was called an Inner Wedge.. Those were the times!",
	},
	innertetra: {
		name: "Inner Tetra",
		description: "We chose this name to make the search of this block more inconvenient",
	},
	keysensor: {
		name: "Key Sensor",
		description: "Returns true value when the chosen button is pressed",
	},
	lamp: {
		name: "Lamp",
		description: "A simple lamp. Turns on when true is passed and turns off when false is passed",
	},
	lidarsensor: {
		name: "Lidar Sensor",
		description: "Returns the distance to the object it's looking at",
	},
	logicmemory: {
		name: "Memory Cell",
		description: "Stores the value you gave it",
	},
	magnet: {
		name: "Magnet",
		description: "A magnet. Attracts to different polarity, detracts from same polarity",
	},
	motorblock: {
		name: "Motor",
		description: "Moves things it's attached to",
	},
	multiplexer: {
		name: "Multiplexer",
		description: "Outputs values depending on the incoming boolean",
	},
	operationabs: {
		name: "Absolute",
		description: "Returns the modulus of incoming number",
	},
	operationadd: {
		name: "Addition",
		description: "Returns a sum of input values",
	},
	operationand: {
		name: '"AND" Gate',
		description: "Returns true when both inputs are true",
	},
	operationbuffer: {
		name: "Buffer",
		description: "Returns same value it was given. Useful for logic organization",
	},
	operationclamp: {
		name: "Clamp",
		description: "Works as buffer but limits output to max/min.",
	},
	operationdeg: {
		name: "Degrees",
		description: "Returns input value converted to degrees",
	},
	operationdiv: {
		name: "Division",
		description: "Returns the result of division of two given values",
	},
	operationequals: {
		name: "Equals",
		description: "Returns true if two given values are the exact same",
	},
	operationgreaterthan: {
		name: "Greater Than",
		description: "Returns true if first value greater than second one",
	},
	operationmod: {
		name: "Mod",
		description: "Returns the remainder of the division",
	},
	operationmul: {
		name: "Multiplication",
		description: "Returns the result of multiplication of two given values",
	},
	operationnand: {
		name: '"NAND" Gate',
		description: "Returns true when both value are not true",
	},
	operationnor: {
		name: '"NOR" Gate',
		description: "Returns true when none of the values are true",
	},
	operationnot: {
		name: '"NOT" Gate',
		description: "Returns true when false is given, and vice versa",
	},
	operationor: {
		name: '"OR" Gate',
		description: "Returns true when any of the inputs are true",
	},
	operationrad: {
		name: "Radians",
		description: "Returns input value converted to radians",
	},
	operationround: {
		name: "Round",
		description: "Returns rounded input value",
	},
	operationsign: {
		name: "Sign",
		description: "Returns -1 if input value lesser than zero, 1 if greater than zero and zero if equals zero",
	},
	operationsub: {
		name: "Subtraction",
		description: "Returns the result of substruction of two given values",
	},
	operationvec3combiner: {
		name: "Vector3 Combiner",
		description: "Returns a vector combined from input values",
	},
	operationvec3splitter: {
		name: "Vector3 Splitter",
		description: "Returns splitted input vector",
	},
	operationxnor: {
		name: '"XNOR" Gate',
		description: "Returns true only if both inputs are the same",
	},
	operationxor: {
		name: '"XOR" Gate',
		description: "Returns true only if both inputs are not the same",
	},
	ownerlocator: {
		name: "Owner Locator",
		description: "Maks delete this ####",
	},
	passengerseat: {
		name: "Passenger Seat",
		description: "Allow your friends to have immesurable fun with you",
	},
	randomaccessmemory: {
		name: "RAM",
		description: "An addressed memory. Allows you to store up to 256 values",
	},
	relay: {
		name: "Relay",
		description: "Returns an input value when told to",
	},
	rocketengine: {
		name: "Rocket Engine",
		description: "Engines your rocket to the space and beyond",
	},
	rope: {
		name: "Rope",
		description: "A very VERY robust rope",
	},
	screen: {
		name: "Screen",
		description: "Display your data here for everyone to see!",
	},
	servomotorblock: {
		name: "Servo",
		description: "A configurable motor. Rotates to desired angle",
	},
	shaft: {
		name: "Shaft",
		description: "A long thin pipe",
	},
	smallgear: {
		name: "Small Gear",
		description: "A cog for your machinery",
	},
	smallrocketengine: {
		name: "Small Rocket Engine",
		description: "Smaller brother of a rocket engine",
	},
	smallwheel: {
		name: "Small Wheel",
		description: "A wheel. Just a smaller one.",
	},
	speedometer: {
		name: "Speedometer",
		description: "Returns the current velocity",
	},
	stackmemory: {
		name: "Stack",
		description: "A queue for your data. Allows to store up to 16 values",
	},
	suspensionblock: {
		name: "Suspension",
		description: "A spring",
	},
	tetrahedron: {
		name: "Tetrahedron",
		description: "Damn you Maks, I don't like name you gave these blocks!",
	},
	tetraround: {
		name: "Tetra Round",
		description: "A rounded version of the tetrahedron",
	},
	tnt: {
		name: "TNT",
		description: "A box of explosives. DO NOT HIT!",
	},
	vehicleseat: {
		name: "Vehicle Seat",
		description: "A seat for your vehicle. Allows you to control your contraption",
	},
	wedge1x1: {
		name: "Wedge 1x1",
		description: "A simple wedge",
	},
	wedge1x2: {
		name: "Wedge 1x2",
		description: "A longer wedge",
	},
	wedge1x3: {
		name: "Wedge 1x3",
		description: "A longer longer wedge",
	},
	wedge1x4: {
		name: "Wedge 1x4",
		description: "A loooonger wedge",
	},
	wedgewing1x1: {
		name: "Wedge Wing 1x1",
		description: "A wedge shaped wing",
	},
	wedgewing1x2: {
		name: "Wedge Wing 1x2",
		description: "A wedge shaped wing but longer",
	},
	wedgewing1x3: {
		name: "Wedge Wing 1x3",
		description: "A wedge shaped wing but much longer",
	},
	wedgewing1x4: {
		name: "Wedge Wing 1x4",
		description: "A humongously long wedge shaped wing",
	},
	wheel: {
		name: "Wheel",
		description: "A ginormous wheel",
	},
	wing1x1: {
		name: "Wing 1x1",
		description: "A part with advanced aerodynamic properties",
	},
	wing1x2: {
		name: "Wing 1x2",
		description: "A part with advanced aerodynamic properties but a bit longer",
	},
	wing1x3: {
		name: "Wing 1x3",
		description: "A part with advanced aerodynamic properties but two bits longer",
	},
	wing1x4: {
		name: "Wing 1x4",
		description: "A part with advanced aerodynamic properties but the joke is overused",
	},
	wingrounding: {
		name: "Wing Rounding",
		description: "A wing rounding. Literally rounds your wing",
	},
	wingsharpening: {
		name: "Wing Sharper",
		description: "An evil brother of the wing rounding",
	},
};
