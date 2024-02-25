type BlockInformation = {
	readonly name: string;
	readonly description: string;
};

/** Registry for the block names and descriptions, for easier editing (compared to Roblox Studio) */
export const BlockDataRegistry: Readonly<Record<string, BlockInformation>> = {
	accelerometer: {
		name: "Accelerometer",
		description: "Returns acceleration",
	},
	altimeter: {
		name: "Altimeter",
		description: "Returns current height",
	},
	anchorblock: {
		name: "Anchor",
		description: "An immovable block",
	},
	anglesensor: {
		name: "Angle Sensor",
		description: "Returns it's angle",
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
		description: "The convex corner wedge, but concave",
	},
	concaveprism: {
		name: "Concave Prism",
		description: "The convex prism, but concave",
	},
	constant: {
		name: "Constant",
		description: "Always returns the value you've set",
	},
	convexcornerwedge: {
		name: "Convex Corner Wedge",
		description: "The concave corner wedge, but convex",
	},
	convexprism: {
		name: "Convex Prism",
		description: "The concave prism, but convex",
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
		description: "A no-so-simple cyllinder",
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
		description: "Detaches connected parts on a button press",
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
		description: "I still have no idea how did they manage to pump helium into soap",
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
		description: "This name was chosen just to make the searching more inconvenient",
	},
	keysensor: {
		name: "Key Sensor",
		description: "Returns true when the chosen button is pressed",
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
		description: "A magnet. Attracts to different polarity, repels from same polarity",
	},
	motorblock: {
		name: "Motor",
		description: "Rotates attached blocks",
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
		description: "Returns the same value it was given. Useful for logic organization",
	},
	operationclamp: {
		name: "Clamp",
		description: "Limits the output between max and min.",
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
		description: "Returns the remainder of a division",
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
		description: "Returns -1 if input value is less than zero, 1 if greater than zero and zero if equals zero",
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
		description: "Maks, delete this ####",
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
		description: "Returns an input value only when told to",
	},
	rocketengine: {
		name: "Rocket Engine",
		description: "Engines your rocket into the space and onto the ground",
	},
	rope: {
		name: "Rope",
		description: "A very VERY robust rope",
	},
	screen: {
		name: "Screen",
		description: "Display all your data for everyone to see!",
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
		description: "A cog for your machinery. Does it even work?",
	},
	smallrocketengine: {
		name: "Small Rocket Engine",
		description: "Smaller brother of a rocket engine",
	},
	smallwheel: {
		name: "Small Wheel",
		description: "smol whel",
	},
	speedometer: {
		name: "Speedometer",
		description: "Returns the current velocity",
	},
	stackmemory: {
		name: "Stack",
		description: "Storage for your stacked data. Allows to store up to 32 values",
	},
	suspensionblock: {
		name: "Suspension",
		description: "Sus pension spring",
	},
	tetrahedron: {
		name: "Tetrahedron",
		description: "MAKS STOP NAMING BLOCKS LIKE THAT",
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
