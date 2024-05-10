import { Objects, pairs_ } from "shared/fixes/objects";

export type AutoWeldColliderBlockShape = "none" | "cube";
export type BlockMirrorBehaviour = "offset90" | "offset180" | "offset270" | "normal" | "none" | "wedgeWing";

interface BlockSetupInformation {
	readonly name: string;
	readonly description: string;
	readonly autoWeldShape?: AutoWeldColliderBlockShape;
	readonly mirrorBehaviour?: BlockMirrorBehaviour;
	readonly mirrorReplacementId?: string;
	readonly required?: boolean;
	readonly limit?: number;
}

type BlockDataRegistry = Record<string, BlockSetupInformation>;

const flatten = <T extends Record<string, BlockDataRegistry>>(
	data: T,
): { [kk in { [k in keyof T]: keyof T[k] }[keyof T]]: BlockSetupInformation } => {
	const ret: Partial<Record<string, BlockSetupInformation>> = {};
	for (const [, items] of Objects.pairs_(data)) {
		for (const [key, value] of pairs_(items as BlockDataRegistry)) {
			ret[key] = value;
		}
	}

	return ret as never;
};
const process = (block: BlockSetupInformation): BlockSetupInformation => {
	if (![".", "!", "?", " "].includes(block.description.sub(block.description.size()))) {
		return {
			...block,
			description: block.description + ".",
		};
	}

	return block;
};

const logic = {
	gate: {
		counter: {
			name: "Counter",
			description: "Returns a previous value plus step value.",
			autoWeldShape: "cube",
		},
		delayblock: {
			name: "Delay Block",
			description: "Returns same value you gave it but with delay",
			autoWeldShape: "cube",
		},
		operationand: {
			name: '"AND" Gate',
			description: "Returns true when both inputs are true",
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
		operationxnor: {
			name: '"XNOR" Gate',
			description: "Returns true only if both inputs are the same",
		},
		operationxor: {
			name: '"XOR" Gate',
			description: "Returns true only if both inputs are not the same",
		},
		operationbuffer: {
			name: "Buffer",
			description: "Returns the same value it was given. Useful for logic organization",
			autoWeldShape: "none",
		},
		operationequals: {
			name: "Equals",
			description: "Returns true if two given values are the exact same",
		},
		operationnotequals: {
			name: "NOT Equals",
			description: "N/A", // TODO: @samlovebutter
		},
		operationgreaterthan: {
			name: "Greater Than",
			description: "Returns true if first value greater than second one",
		},
		operationgreaterthanorequals: {
			name: "Greater Than or Equals",
			description: "N/A", // TODO: @samlovebutter
		},
		operationlessthanorequals: {
			name: "Less Than or Equals",
			description: "N/A", // TODO: @samlovebutter
		},
		operationlessthan: {
			name: "Less Than",
			description: "N/A", // TODO: @samlovebutter
		},
	},
	byte: {
		bytemaker: {
			name: "Byte Maker",
			description: "N/A", // TODO: @samlovebutter
		},
		bytesplitter: {
			name: "Byte Splitter",
			description: "N/A", // TODO: @samlovebutter
		},
		operationbytexor: {
			name: "Byte XOR",
			description: "N/A", // TODO: @samlovebutter
		},
		operationbytexnor: {
			name: "Byte XNOR",
			description: "N/A", // TODO: @samlovebutter
		},
		operationbyteand: {
			name: "Byte AND",
			description: "N/A", // TODO: @samlovebutter
		},
		operationbytenand: {
			name: "Byte NAND",
			description: "N/A", // TODO: @samlovebutter
		},
		operationbyteor: {
			name: "Byte OR",
			description: "N/A", // TODO: @samlovebutter
		},
		operationbytenor: {
			name: "Byte NOR",
			description: "N/A", // TODO: @samlovebutter
		},
		operationbyterotateright: {
			name: "Byte Rotate Right",
			description: "N/A", // TODO: @samlovebutter
		},
		operationbyterotateleft: {
			name: "Byte Rotate Left",
			description: "N/A", // TODO: @samlovebutter
		},
		operationbyteshiftright: {
			name: "Byte Shift Right",
			description: "N/A", // TODO: @samlovebutter
		},
		operationbyteshiftleft: {
			name: "Byte Shift Left",
			description: "N/A", // TODO: @samlovebutter
		},
		operationbytearithmeticshiftright: {
			name: "Byte Arithmetic Shift Right",
			description: "N/A", // TODO: @samlovebutter
		},
		operationbytenot: {
			name: "Byte NOT",
			description: "N/A", // TODO: @samlovebutter
		},
		operationbyteneg: {
			name: "Byte NEGATE",
			description: "N/A", // TODO: @samlovebutter
		},
	},
	math: {
		operationadd: {
			name: "Addition",
			description: "Returns a sum of input values",
		},
		operationsub: {
			name: "Subtraction",
			description: "Returns the result of substruction of two given values",
		},
		operationmul: {
			name: "Multiplication",
			description: "Returns the result of multiplication of two given values",
		},
		operationdiv: {
			name: "Division",
			description: "Returns the result of division of two given values",
		},
		operationabs: {
			name: "Absolute",
			description: "Returns the modulus of incoming number",
		},
		operationclamp: {
			name: "Clamp",
			description: "Limits the output between max and min.",
		},
		operationmod: {
			name: "Mod",
			description: "Returns the remainder of a division",
		},
		operationround: {
			name: "Round",
			description: "Returns rounded input value",
		},
		operationfloor: {
			name: "Floor",
			description: "N/A",
		},
		operationceil: {
			name: "Ceil",
			description: "N/A",
		},
		operationsign: {
			name: "Sign",
			description: "Returns -1 if input value is less than zero, 1 if greater than zero and zero if equals zero",
		},
	},
	trigonometry: {
		operationpi: {
			name: "Pi",
			description: `So called "free thinkers" will make a thousand PIe jokes as soon as they'll see the PI constant..`,
			autoWeldShape: "cube",
		},
		operatione: {
			name: "Euler's number (e)",
			description: "Very useful constant you'll probably never use if you doesn't already know what it is",
			autoWeldShape: "cube",
		},
		operationrand: {
			name: "Random",
			description: `Returns a "random" value between chosen minimum and maximum`,
			autoWeldShape: "cube",
		},

		operationsqrt: {
			name: "Square Root",
			description: "Square the root out of input value",
		},
		operationnsqrt: {
			name: "Custom Degree Root",
			description: "Same as the square root but you're allowed to change the degree of it",
		},
		operationpow: {
			name: "Power",
			description: "Buffs input values",
		},
		operationtan: {
			name: "Tangent",
			description: "Calculates a tangent of input",
		},
		operationatan: {
			name: "Arctangent",
			description: "The opposite of the Tangent",
		},
		operationatan2: {
			name: "Arctangent 2",
			description: "No way they made a sequel",
		},
		operationsin: {
			name: "Sine",
			description: "Calculates a sine of input",
		},
		operationasin: {
			name: "Arcsine",
			description: "The opposite of the Sine",
		},
		operationcos: {
			name: "Cosine",
			description: "Calculates a cosine of input",
		},
		operationacos: {
			name: "Arccosine",
			description: "The opposite of the Cosine",
		},
		operationlog: {
			name: "Logarithm",
			description: "Calculates a logarithm of the input value with selected base",
		},
		operationlog10: {
			name: "Logarithm (10 base)",
			description: "Calculates a base 10 logarithm of the input value",
		},
		operationloge: {
			name: "Logarithm (natural)",
			description: "Returns a natural Logarithm of inputed value. Unlike it's evil artificial counterparts..",
		},
		operationdeg: {
			name: "Degrees",
			description: "Returns input value converted to degrees",
		},
		operationrad: {
			name: "Radians",
			description: "Returns input value converted to radians",
		},
	},
	vector3: {
		operationvec3combiner: {
			name: "Vector3 Combiner",
			description: "Returns a vector combined from input values",
			autoWeldShape: "cube",
		},
		operationvec3splitter: {
			name: "Vector3 Splitter",
			description: "Returns splitted input vector",
			autoWeldShape: "cube",
		},
	},
	number: {
		constant: {
			name: "Constant",
			description: "Always returns the value you've set",
			autoWeldShape: "cube",
		},
		multiplexer: {
			name: "Multiplexer",
			description: "Outputs values depending on the incoming boolean",
			autoWeldShape: "cube",
		},
	},
	output: {
		lamp: {
			name: "Lamp",
			description: "A simple lamp. Turns on when true is passed and turns off when false is passed",
			autoWeldShape: "cube",
		},
		screen: {
			name: "Screen",
			description: "Display all your data for everyone to see!",
			autoWeldShape: "cube",
		},
		laser: {
			name: "Laser pointer",
			description: "shoot beem boom target!",
			autoWeldShape: "cube",
		},
	},
	sensors: {
		accelerometer: {
			name: "Accelerometer",
			description: "Returns acceleration",
			autoWeldShape: "cube",
		},
		altimeter: {
			name: "Altimeter",
			description: "Returns current height",
			autoWeldShape: "cube",
		},
		anglesensor: {
			name: "Angle Sensor",
			description: "Returns it's angle",
			autoWeldShape: "cube",
		},
		keysensor: {
			name: "Key Sensor",
			description: "Returns true when the chosen button is pressed",
			autoWeldShape: "cube",
		},
		lidarsensor: {
			name: "Lidar Sensor",
			description: "Returns the distance to the object it's looking at",
			autoWeldShape: "cube",
			mirrorBehaviour: "normal",
		},
		ownerlocator: {
			name: "Owner Locator",
			description: "Maks, delete this ####",
			autoWeldShape: "cube",
		},
		radarsection: {
			name: "Radar Section",
			description: "Returns the closest object that got into the block's sight",
			limit: 40,
		},
	},
} as const satisfies Record<string, BlockDataRegistry>;

/** Registry for the block information, for easier editing (compared to Roblox Studio) */
const registry = {
	...flatten(logic),
	piston: {
		name: "Piston",
		description: "No Pi jokes here. It just moves stuff..",
	},
	ballast: {
		name: "Ballast",
		description: "(Un)managable weight of existence. Now in compact form!",
	},
	anchorblock: {
		name: "Anchor",
		description: "An immovable block",
	},
	ballinsocket: {
		name: "Ball in Socket",
		description: "Ball socket for your mechanical ingenuities",
	},
	block: {
		name: "Block",
		description: "Makes you question why every engineering game has it",
		mirrorBehaviour: "none",
	},
	ball: {
		name: "Ball",
		description: "it could be a cannon ball.. Or anything else, really..",
	},
	halfball: {
		name: "Half Ball",
		description: "It's rolling around.. half of the time..",
		mirrorBehaviour: "offset180",
	},
	concavecornerwedge: {
		name: "Concave Corner Wedge",
		description: "The convex corner wedge, but concave",
		mirrorBehaviour: "offset270",
	},
	concaveprism: {
		name: "Concave Prism",
		description: "The convex prism, but concave",
		mirrorBehaviour: "offset180",
	},
	convexcornerwedge: {
		name: "Convex Corner Wedge",
		description: "The concave corner wedge, but convex",
		mirrorBehaviour: "offset270",
	},
	convexprism: {
		name: "Convex Prism",
		description: "The concave prism, but convex",
		mirrorBehaviour: "offset180",
	},
	pyramid: {
		name: "Pyramid",
		description: "triangel",
	},
	halfblock: {
		name: "Half Block",
		description: "Like a block, but with a small caveat....",
	},
	leddisplay: {
		name: "Display",
		description: "Simple 8x8 pixel display. Wonder what can you do with it..",
	},
	sevensegmentdisplay: {
		name: "7-Segment Display",
		description: "Simple 7-Segment display. Opcode viewer? OwO",
	},
	cornerwedge1x1: {
		name: "Corner Wedge 1x1",
		description: "A simple corner wedge",
		mirrorBehaviour: "offset270",
	},
	cornerwedge2x1: {
		name: "Corner Wedge 2x1",
		description: "A simple coorner wedge",
		mirrorBehaviour: "offset270",
	},
	cornerwedge3x1: {
		name: "Corner Wedge 3x1",
		description: "A simple cooorner wedge",
		mirrorBehaviour: "offset270",
	},
	cornerwedge4x1: {
		name: "Corner Wedge 4x1",
		description: "A simple coooorner wedge",
		mirrorBehaviour: "offset270",
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
		mirrorBehaviour: "offset270",
	},
	innertetra: {
		name: "Inner Tetra",
		description: "This name was chosen just to make the searching more inconvenient",
		mirrorBehaviour: "offset270",
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
	passengerseat: {
		name: "Passenger Seat",
		description: "Allow your friends to have immesurable fun with you",
	},
	randomaccessmemory: {
		name: "RAM",
		description: "An addressed memory. Allows you to store up to 256 values",
	},
	readonlymemory: {
		name: "ROM",
		description: "A programmable memory. Allows you to read values you've written in",
		limit: 1,
	},
	relay: {
		name: "Relay",
		description: "Returns an input value only when told to",
	},
	rocketengine: {
		name: "Rocket Engine",
		description: "Engines your rocket into the space and onto the ground",
		mirrorBehaviour: "offset180",
	},
	rope: {
		name: "Rope",
		description: "A very VERY robust rope",
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
		mirrorBehaviour: "offset180",
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
		mirrorBehaviour: "offset90",
	},
	tetraround: {
		name: "Tetra Round",
		description: "A rounded version of the tetrahedron",
		mirrorBehaviour: "offset270",
	},
	tnt: {
		name: "TNT",
		description: "A box of explosives. DO NOT HIT!",
		limit: 200,
	},
	cylindricaltnt: {
		name: "Cylindrical TNT",
		description: "Not a boxed version",
		limit: 200,
	},
	sphericaltnt: {
		name: "Spherical TNT",
		description: "Catch this anarchid-man!",
		limit: 200,
	},
	vehicleseat: {
		name: "Vehicle Seat",
		description: "A seat for your vehicle. Allows you to control your contraption",
		required: true,
		limit: 1,
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
		mirrorBehaviour: "wedgeWing",
	},
	wedgewing1x2: {
		name: "Wedge Wing 1x2",
		description: "A wedge shaped wing but longer",
		mirrorBehaviour: "wedgeWing",
	},
	wedgewing1x3: {
		name: "Wedge Wing 1x3",
		description: "A wedge shaped wing but much longer",
		mirrorBehaviour: "wedgeWing",
	},
	wedgewing1x4: {
		name: "Wedge Wing 1x4",
		description: "A humongously long wedge shaped wing",
		mirrorBehaviour: "wedgeWing",
	},
	wheel: {
		name: "Wheel",
		description: "A ginormous wheel",
	},
	wing1x1: {
		name: "Wing 1x1",
		description: "A part with advanced aerodynamic properties",
		mirrorBehaviour: "none",
	},
	wing1x2: {
		name: "Wing 1x2",
		description: "A part with advanced aerodynamic properties but a bit longer",
		mirrorBehaviour: "none",
	},
	wing1x3: {
		name: "Wing 1x3",
		description: "A part with advanced aerodynamic properties but two bits longer",
		mirrorBehaviour: "none",
	},
	wing1x4: {
		name: "Wing 1x4",
		description: "A part with advanced aerodynamic properties but the joke is overused",
		mirrorBehaviour: "none",
	},
	wingrounding: {
		name: "Wing Rounding",
		description: "A wing rounding. Literally rounds your wing",
	},
	wingsharpening: {
		name: "Wing Sharper",
		description: "An evil brother of the wing rounding",
	},
	beam2x1: {
		name: "Beam 2x1",
		description: "A block, but 2x1!",
	},
	beam3x1: {
		name: "Beam 3x1",
		description: "A block, but 3x1!",
	},
	beam4x1: {
		name: "Beam 4x1",
		description: "A block, but 4x1!",
	},
	halfcornerwedge1x1: {
		name: "Half Corner Wedge 1x1",
		description: "A corner wedge 1x1, but it's.. half.. the size?",
		mirrorBehaviour: "offset270",
		mirrorReplacementId: "halfcornerwedge1x1mirrored",
	},
	halfcornerwedge2x1: {
		name: "Half Corner Wedge 2x1",
		description: "A corner wedge 2x1, but it's.. half.. the size?",
		mirrorBehaviour: "offset270",
		mirrorReplacementId: "halfcornerwedge2x1mirrored",
	},
	halfcornerwedge3x1: {
		name: "Half Corner Wedge 3x1",
		description: "A corner wedge 3x1, but it's.. half.. the size?",
		mirrorBehaviour: "offset270",
		mirrorReplacementId: "halfcornerwedge3x1mirrored",
	},
	halfcornerwedge4x1: {
		name: "Half Corner Wedge 4x1",
		description: "It stopped making any sense..",
		mirrorBehaviour: "offset270",
		mirrorReplacementId: "halfcornerwedge4x1mirrored",
	},

	halfcornerwedge1x1mirrored: {
		name: "Half Corner Wedge 1x1 (Mirrored)",
		description: "Same halved corner wedge, but mirrored!",
		mirrorBehaviour: "offset270",
		mirrorReplacementId: "halfcornerwedge1x1",
	},
	halfcornerwedge2x1mirrored: {
		name: "Half Corner Wedge 2x1 (Mirrored)",
		description: "Same halved corner wedge, but mirrored!",
		mirrorBehaviour: "offset270",
		mirrorReplacementId: "halfcornerwedge2x1",
	},
	halfcornerwedge3x1mirrored: {
		name: "Half Corner Wedge 3x1 (Mirrored)",
		description: "Same halved corner wedge, but mirrored!",
		mirrorBehaviour: "offset270",
		mirrorReplacementId: "halfcornerwedge3x1",
	},
	halfcornerwedge4x1mirrored: {
		name: "Half Corner Wedge 4x1 (Mirrored)",
		description: "Same halved corner wedge, but mirrored!",
		mirrorBehaviour: "offset270",
		mirrorReplacementId: "halfcornerwedge4x1",
	},

	halfwedge1x1: {
		name: "Half Wedge 1x1",
		description: "A wedge 1x1, but it's.. half.. the size?",
		mirrorBehaviour: "offset180",
	},
	halfwedge1x2: {
		name: "Half Wedge 1x2",
		description: "A wedge 1x2, but it's.. half.. the size?",
		mirrorBehaviour: "offset180",
	},
	halfwedge1x3: {
		name: "Half Wedge 1x3",
		description: "A wedge 1x3, but it's.. half.. the size?",
		mirrorBehaviour: "offset180",
	},
	halfwedge1x4: {
		name: "Half Wedge 1x4",
		description: "A wedge 1x4, but it's.. half.. the size?",
		mirrorBehaviour: "offset180",
	},
	radiotransmitter: {
		name: "Radio Transmitter",
		description: "Transmits data over air! True magic for a caveman!",
		limit: 10,
	},
	radioreciever: {
		name: "Radio Reciever",
		description: "Love is in the air? Wrong! Radio wave radia-tion!",
		limit: 10,
	},
} as const satisfies BlockDataRegistry;

export const BlockDataRegistry: BlockDataRegistry = registry;
export type BlockId = keyof typeof registry;

for (const [key, info] of Objects.pairs_(BlockDataRegistry)) {
	BlockDataRegistry[key] = process(info);
}
