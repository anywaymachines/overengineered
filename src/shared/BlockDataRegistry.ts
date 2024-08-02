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

type GenericBlockDataRegistry = Record<string, BlockSetupInformation>;

const flatten = <T extends Partial<Record<string, GenericBlockDataRegistry>>>(
	data: T,
): { [kk in { [k in keyof T]: keyof T[k] }[keyof T]]: BlockSetupInformation } => {
	const ret: Partial<Record<string, BlockSetupInformation>> = {};
	for (const [, items] of pairs(data)) {
		for (const [key, value] of pairs(items as GenericBlockDataRegistry)) {
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
		impulsegenerator: {
			name: "Impulse Generator",
			description: "A signal generator. Generates meander (a fancy way of saying square-shaped signal).",
		},
		singleimpulse: {
			name: "Single Impulse",
			description: "Converts a bit into a pulse",
		},
		delayblock: {
			name: "Delay Block",
			description: "Returns same value you gave it but with delay",
			autoWeldShape: "cube",
		},
		and: {
			name: "AND Gate",
			description: "Returns true when both inputs are true",
		},
		nand: {
			name: "NAND Gate",
			description: "Returns true when both value are not true",
		},
		nor: {
			name: "NOR Gate",
			description: "Returns true when none of the values are true",
		},
		not: {
			name: "NOT Gate",
			description: "Returns true when false is given, and vice versa",
		},
		or: {
			name: "OR Gate",
			description: "Returns true when any of the inputs are true",
		},
		xnor: {
			name: "XNOR Gate",
			description: "Returns true only if both inputs are the same",
		},
		xor: {
			name: "XOR Gate",
			description: "Returns true only if both inputs are not the same",
		},
		buffer: {
			name: "Buffer",
			description: "Returns the same value it was given. Useful for logic organization",
			autoWeldShape: "none",
		},
		equals: {
			name: "Equals",
			description: "Returns true if two given values are the exact same",
		},
		notequals: {
			name: "NOT Equals",
			description: "Returns true if values are not the same",
		},
		greaterthan: {
			name: "Greater Than",
			description: "Returns true if first value greater than second one",
		},
		greaterthanorequals: {
			name: "Greater Than or Equals",
			description: "Returns true if the first value greater than second one",
		},
		lessthanorequals: {
			name: "Less Than or Equals",
			description: "Returns true if the first value equal to or lesser than second one",
		},
		lessthan: {
			name: "Less Than",
			description: "Returns true if the first value or lesser than second one",
		},
	},
	byte: {
		bytemaker: {
			name: "Byte Maker",
			description: "Makes bytes from bits and pieces",
		},
		bytesplitter: {
			name: "Byte Splitter",
			description: "Another one bytes to bits",
		},
		bytetonumber: {
			name: "Byte To Number",
			description: "Numbers the bytes! Oh, wait.. no.. It converts Bytes to numbers!",
		},
		numbertobyte: {
			name: "Number to Byte",
			description: "Converts number value to the byte value! It's like clamping number between 0 and 255.",
		},
		bytexor: {
			name: "Byte XOR",
			description: "It's the same XOR operation but for each bit of input bytes.",
		},
		bytexnor: {
			name: "Byte XNOR",
			description: "It's the same XNOR operation but for each bit of input bytes.",
		},
		byteand: {
			name: "Byte AND",
			description: "It's the same AND operation but for each bit of input bytes.",
		},
		bytenand: {
			name: "Byte NAND",
			description: "It's the same NAND operation but for each bit of input bytes.",
		},
		byteor: {
			name: "Byte OR",
			description: "It's the same OR operation but for each bit of input bytes.",
		},
		bytenor: {
			name: "Byte NOR",
			description: "It's the same NOR operation but for each bit of input bytes.",
		},
		byterotateright: {
			name: "Byte Rotate Right",
			description: "It rotates the byte right! Don't ask me, don't know either",
		},
		byterotateleft: {
			name: "Byte Rotate Left",
			description: "It rotates the left! Don't ask me, don't know either",
		},
		byteshiftright: {
			name: "Byte Shift Right",
			description: "Shifts bits to right!",
		},
		byteshiftleft: {
			name: "Byte Shift Left",
			description: "Shifts bits to left!",
		},
		bytearithmeticshiftright: {
			name: "Byte Arithmetic Shift Right",
			description: "Honestly, I have ZERO idea what it does, Maks made it.",
		},
		bytenot: {
			name: "Byte NOT",
			description: "It's the same NOT operation but for each bit of input bytes.",
		},
		byteneg: {
			name: "Byte NEGATE",
			description: "Negates the input byte.",
		},
	},
	math: {
		add: {
			name: "Addition",
			description: "Returns a sum of input values",
		},
		sub: {
			name: "Subtraction",
			description: "Returns the result of substruction of two given values",
		},
		mul: {
			name: "Multiplication",
			description: "Returns the result of multiplication of two given values",
		},
		div: {
			name: "Division",
			description: "Returns the result of division of two given values",
		},
		abs: {
			name: "Absolute",
			description: "Returns the modulus of incoming number",
		},
		clamp: {
			name: "Clamp",
			description: "Limits the output between max and min.",
		},
		mod: {
			name: "Mod",
			description: "Returns the remainder of a division",
		},
		round: {
			name: "Round",
			description: "Returns rounded input value",
		},
		floor: {
			name: "Floor",
			description: "N/A",
		},
		ceil: {
			name: "Ceil",
			description: "N/A",
		},
		sign: {
			name: "Sign",
			description: "Returns -1 if input value is less than zero, 1 if greater than zero and zero if equals zero",
		},
	},
	trigonometry: {
		pi: {
			name: "Pi",
			description: `So called "free thinkers" will make a thousand PIe jokes as soon as they'll see the PI constant..`,
			autoWeldShape: "cube",
		},
		e: {
			name: "Euler's number (e)",
			description: "Very useful constant you'll probably never use if you doesn't already know what it is",
			autoWeldShape: "cube",
		},
		rand: {
			name: "Random",
			description: `Returns a "random" value between chosen minimum and maximum`,
			autoWeldShape: "cube",
		},

		sqrt: {
			name: "Square Root",
			description: "Square the root out of input value",
		},
		nsqrt: {
			name: "Custom Degree Root",
			description: "Same as the square root but you're allowed to change the degree of it",
		},
		pow: {
			name: "Power",
			description: "Buffs input values",
		},
		tan: {
			name: "Tangent",
			description: "Calculates a tangent of input",
		},
		atan: {
			name: "Arctangent",
			description: "The opposite of the Tangent",
		},
		atan2: {
			name: "Arctangent 2",
			description: "No way they made a sequel",
		},
		sin: {
			name: "Sine",
			description: "Calculates a sine of input",
		},
		asin: {
			name: "Arcsine",
			description: "The opposite of the Sine",
		},
		cos: {
			name: "Cosine",
			description: "Calculates a cosine of input",
		},
		acos: {
			name: "Arccosine",
			description: "The opposite of the Cosine",
		},
		log: {
			name: "Logarithm",
			description: "Calculates a logarithm of the input value with selected base",
		},
		log10: {
			name: "Logarithm (10 base)",
			description: "Calculates a base 10 logarithm of the input value",
		},
		loge: {
			name: "Logarithm (natural)",
			description: "Returns a natural Logarithm of inputed value. Unlike it's evil artificial counterparts..",
		},
		deg: {
			name: "Degrees",
			description: "Returns input value converted to degrees",
		},
		rad: {
			name: "Radians",
			description: "Returns input value converted to radians",
		},
	},
	vector3: {
		vec3combiner: {
			name: "Vector3 Combiner",
			description: "Returns a vector combined from input values",
		},
		vec3splitter: {
			name: "Vector3 Splitter",
			description: "Returns splitted input vector",
		},
		vec3objectworldtransformer: {
			name: "Vector3 Object/World Transformer",
			description: "Converts a vector into the world/object coordinate space of the other vector",
		},
	},
	number: {
		constant: {
			name: "Constant",
			description: "Always returns the value you've set",
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
		altimeter: {
			name: "Altimeter",
			description: "Returns current height",
		},
		anglesensor: {
			name: "Angle Sensor",
			description: "Returns it's angle",
		},
		keysensor: {
			name: "Keyboard Sensor",
			description: "Returns true when the chosen button is pressed",
		},
		ownerlocator: {
			name: "Owner Locator",
			description: "Maks, delete this ####",
		},
		ownercameralocator: {
			name: "Owner Camera Locator",
			description: "Returns owner camera position and direction",
		},
		mousesensor: {
			name: "Mouse Sensor",
			description: "Returns the cursor position, relative to the screen",
		},
		radarsection: {
			name: "Radar Section",
			description: "Returns the closest object that got into the block's sight",
			limit: 400,
		},
		tpscounter: {
			name: "TPS Counter",
			description: "Returns the Ticks per Second number",
		},
	},
} satisfies Record<string, GenericBlockDataRegistry>;

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
	truss: {
		name: "Truss",
		description: "This is a truss structure. You can climb it, and it's also cool.",
		mirrorBehaviour: "none",
		autoWeldShape: "cube",
	},
	ball: {
		name: "Ball",
		description: "it could be a cannon ball.. Or anything else, really..",
		mirrorBehaviour: "none",
	},
	halfball: {
		name: "Half Ball",
		description: "It's rolling around.. half of the time..",
		mirrorBehaviour: "offset180",
	},
	cone: {
		name: "Cone",
		description: "Filled with weird geometry jokes. Sadly, no ice cream",
		mirrorBehaviour: "normal",
	},
	halfcone: {
		name: "Half Cone",
		description: "As half as much geometry jokes in this one. Still no ice cream tho...",
		mirrorBehaviour: "normal",
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
		limit: 16,
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
	bearingshaft: {
		name: "Bearing Shaft",
		description: "A shaft that bears",
	},
	bracedshaft: {
		name: "Braced Shaft",
		description: "A shaft with adjustable braces",
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
	smallhingeblock: {
		name: "Small hinge",
		description: "Smaller hinge. La rotación compacta",
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
	sidewaysservo: {
		name: "Sideways servo",
		description: "Servo but sideways and with some degree of freedom",
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
	speedometer: {
		name: "Speedometer",
		description: "Returns the current velocity",
	},
	masssensor: {
		name: "Mass Sensor",
		description: "Returns the current contraption/assembly mass",
	},
	gravitysensor: {
		name: "Gravity Sensor",
		description: "Returns the current gravity acceleration in m/s²",
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
		name: "Driver Seat",
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
		description: "circle",
	},
	bigwheel: {
		name: "Big wheel",
		description: "Wheel. Big one.",
	},
	smalloldwheel: {
		name: "Small old wheel",
		description: "smol ol whel",
	},
	oldwheel: {
		name: "Old wheel",
		description: "A ginormous old wheel",
	},
	bigoldwheel: {
		name: "Big old wheel",
		description: "Old wheel. Big one.",
	},
	wing1x1: {
		name: "Wing 1x1",
		description: "A part with advanced aerodynamic properties",
		mirrorBehaviour: "wedgeWing",
	},
	wing1x2: {
		name: "Wing 1x2",
		description: "A part with advanced aerodynamic properties but a bit longer",
		mirrorBehaviour: "wedgeWing",
	},
	wing1x3: {
		name: "Wing 1x3",
		description: "A part with advanced aerodynamic properties but two bits longer",
		mirrorBehaviour: "wedgeWing",
	},
	wing1x4: {
		name: "Wing 1x4",
		description: "A part with advanced aerodynamic properties but the joke is overused",
		mirrorBehaviour: "wedgeWing",
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
	},
	halfwedge1x2: {
		name: "Half Wedge 1x2",
		description: "A wedge 1x2, but it's.. half.. the size?",
	},
	halfwedge1x3: {
		name: "Half Wedge 1x3",
		description: "A wedge 1x3, but it's.. half.. the size?",
	},
	halfwedge1x4: {
		name: "Half Wedge 1x4",
		description: "A wedge 1x4, but it's.. half.. the size?",
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
} satisfies GenericBlockDataRegistry;

export const BlockDataRegistry: { readonly [id in BlockId]: BlockSetupInformation } = registry;

declare global {
	type BlockId = string & keyof typeof registry;
}
export type BlockId = string & keyof typeof registry;

for (const [key, info] of pairs(registry)) {
	(registry as Writable<GenericBlockDataRegistry>)[key] = process(info);
}
