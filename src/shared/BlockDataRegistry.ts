import Objects from "shared/fixes/objects";

declare global {
	type AutoWeldColliderBlockShape = "none" | "cube";
	type BlockMirrorBehaviour = "offset90" | "offset180" | "offset270" | "normal" | "none" | "wedgeWing";
}

interface BlockSetupInformation {
	readonly name: string;
	readonly description: string;
	readonly autoWeldShape?: AutoWeldColliderBlockShape;
	readonly mirrorBehaviour?: BlockMirrorBehaviour;
	readonly required?: boolean;
	readonly limit?: number;
}

type BlockDataRegistry = Record<string, BlockSetupInformation>;
type BlockDataRegistryRegistry = { readonly [key: string]: BlockSetupInformation | BlockDataRegistryRegistry };

const flatten = (data: BlockDataRegistryRegistry): BlockDataRegistry => {
	const push = (result: BlockDataRegistry, key: string, item: BlockDataRegistryRegistry | BlockSetupInformation) => {
		if ("name" in item) {
			ret[key] = item as BlockSetupInformation;
		} else {
			for (const [nextkey, nextitem] of Objects.pairs(item)) {
				push(result, nextkey as string, nextitem);
			}
		}
	};

	const ret: BlockDataRegistry = {};
	for (const [key, item] of Objects.pairs(data)) {
		push(ret, key as string, item);
	}

	return ret;
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

const logic: Record<string, BlockDataRegistry> = {
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
			autoWeldShape: "cube",
		},
		operationnand: {
			name: '"NAND" Gate',
			description: "Returns true when both value are not true",
			autoWeldShape: "cube",
		},
		operationnor: {
			name: '"NOR" Gate',
			description: "Returns true when none of the values are true",
			autoWeldShape: "cube",
		},
		operationnot: {
			name: '"NOT" Gate',
			description: "Returns true when false is given, and vice versa",
			autoWeldShape: "cube",
		},
		operationor: {
			name: '"OR" Gate',
			description: "Returns true when any of the inputs are true",
			autoWeldShape: "cube",
		},
		operationxnor: {
			name: '"XNOR" Gate',
			description: "Returns true only if both inputs are the same",
			autoWeldShape: "cube",
		},
		operationxor: {
			name: '"XOR" Gate',
			description: "Returns true only if both inputs are not the same",
			autoWeldShape: "cube",
		},
		operationbuffer: {
			name: "Buffer",
			description: "Returns the same value it was given. Useful for logic organization",
			autoWeldShape: "none",
		},
		operationequals: {
			name: "Equals",
			description: "Returns true if two given values are the exact same",
			autoWeldShape: "cube",
		},
		operationgreaterthan: {
			name: "Greater Than",
			description: "Returns true if first value greater than second one",
			autoWeldShape: "cube",
		},
	},
	math: {
		operationadd: {
			name: "Addition",
			description: "Returns a sum of input values",
			autoWeldShape: "cube",
		},
		operationsub: {
			name: "Subtraction",
			description: "Returns the result of substruction of two given values",
			autoWeldShape: "cube",
		},
		operationmul: {
			name: "Multiplication",
			description: "Returns the result of multiplication of two given values",
			autoWeldShape: "cube",
		},
		operationdiv: {
			name: "Division",
			description: "Returns the result of division of two given values",
			autoWeldShape: "cube",
		},
		operationabs: {
			name: "Absolute",
			description: "Returns the modulus of incoming number",
			autoWeldShape: "cube",
		},
		operationclamp: {
			name: "Clamp",
			description: "Limits the output between max and min.",
			autoWeldShape: "cube",
		},
		operationmod: {
			name: "Mod",
			description: "Returns the remainder of a division",
			autoWeldShape: "cube",
		},
		operationround: {
			name: "Round",
			description: "Returns rounded input value",
			autoWeldShape: "cube",
		},
		operationsign: {
			name: "Sign",
			description: "Returns -1 if input value is less than zero, 1 if greater than zero and zero if equals zero",
			autoWeldShape: "cube",
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
			autoWeldShape: "cube",
		},
		operationnsqrt: {
			name: "Custom Degree Root",
			description: "Same as the square root but you're allowed to change the degree of it",
			autoWeldShape: "cube",
		},
		operationpow: {
			name: "Power",
			description: "Buffs input values",
			autoWeldShape: "cube",
		},
		operationtan: {
			name: "Tangent",
			description: "Calculates a tangent of input",
			autoWeldShape: "cube",
		},
		operationatan: {
			name: "Arctangent",
			description: "The opposite of the Tangent",
			autoWeldShape: "cube",
		},
		operationatan2: {
			name: "Arctangent 2",
			description: "No way they made a sequel",
			autoWeldShape: "cube",
		},
		operationsin: {
			name: "Sine",
			description: "Calculates a sine of input",
			autoWeldShape: "cube",
		},
		operationasin: {
			name: "Arcsine",
			description: "The opposite of the Sine",
			autoWeldShape: "cube",
		},
		operationcos: {
			name: "Cosine",
			description: "Calculates a cosine of input",
			autoWeldShape: "cube",
		},
		operationacos: {
			name: "Arccosine",
			description: "The opposite of the Cosine",
			autoWeldShape: "cube",
		},
		operationlog: {
			name: "Logarithm",
			description: "Calculates a logarithm of the input value with selected base",
			autoWeldShape: "cube",
		},
		operationlog10: {
			name: "Logarithm (10 base)",
			description: "Calculates a base 10 logarithm of the input value",
			autoWeldShape: "cube",
		},
		operationloge: {
			name: "Logarithm (natural)",
			description: "Returns a natural Logarithm of inputed value. Unlike it's evil artificial counterparts..",
			autoWeldShape: "cube",
		},
		operationdeg: {
			name: "Degrees",
			description: "Returns input value converted to degrees",
			autoWeldShape: "cube",
		},
		operationrad: {
			name: "Radians",
			description: "Returns input value converted to radians",
			autoWeldShape: "cube",
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
	},
};

/** Registry for the block information, for easier editing (compared to Roblox Studio) */
const registry: BlockDataRegistry = {
	...flatten(logic),
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
		description: "Good enough",
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
};

for (const [key, info] of Objects.pairs(registry)) {
	registry[key] = process(info);
}

export const BlockDataRegistry = registry;
