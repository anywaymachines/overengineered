import { Objects } from "shared/fixes/objects";

/* eslint-disable @typescript-eslint/no-this-alias */
export class BigInt {
	private digits: Record<number, number> = {};
	private sign: "+" | "-" = "+";

	constructor(num?: number) {
		const tis = this;

		setmetatable<BigInt>(this, {
			...(getmetatable(this) ?? {}),
			__add: (lhs, rhs) => lhs.add(rhs),
			__unm: () => {
				if (tis.sign === "+") {
					tis.sign = "-";
				} else {
					tis.sign = "+";
				}

				return tis;
			},
			__sub: (lhs, rhs) => lhs.subtract(rhs),
			__mul: (lhs, rhs) => lhs.multiply(rhs),
			__div: (lhs, rhs) => {
				const [result] = lhs.divide(rhs);
				return result;
			},
			__mod: (lhs, rhs) => {
				const [, remainder] = lhs.divide(rhs);
				return remainder;
			},
			__pow: (lhs, rhs) => lhs.exponentiate(rhs),
		});

		if (num !== undefined) {
			const num_string = tostring(num);
			for (const [digit] of string.gmatch(num_string, "[0-9]")) {
				this.append(tonumber(digit)!);
			}
			if (string.sub(num_string, 1, 1) === "-") {
				this.sign = "-";
			}
		}
	}

	private digitsSize() {
		return Objects.asArray(this.digits).size();
	}
	private append(value: number) {
		Objects.asArray(this.digits).push(value);
	}
	private insert(index: number, value: number) {
		return Objects.asArray(this.digits).insert(index, value);
	}
	private remove(index: number) {
		return Objects.asArray(this.digits).remove(index);
	}

	// Return a new bigint with the same sign and digits
	clone(): BigInt {
		const newint = new BigInt();
		newint.sign = this.sign;

		newint.digits = { ...this.digits };
		return newint;
	}

	// Check the type of a big
	// Normally only runs when global variable "strict"===true, but checking can be
	// forced by supplying "true" as the second argument.
	check(force?: boolean): boolean {
		const big = this;
		if (force) {
			assert(big.digitsSize() > 0, "bigint is empty");
			assert(type(big.sign) === "string", "bigint is unsigned");
			for (const [_, digit] of pairs(big.digits)) {
				assert(type(digit) === "number", digit + " is not a number");
				assert(digit < 10, digit + " is greater than or equal to 10");
			}
		}

		return true;
	}

	// Return a new big with the same digits but with a positive sign (absolute value)
	abs(): BigInt {
		const big = this;

		big.check();
		const result = big.clone();
		result.sign = "+";
		return result;
	}

	// Convert a big to a number or string
	unserialize(output_type?: "number" | "string" | "n" | "s" | undefined, precision?: number): number | string {
		const big = this;
		big.check();

		let num = "";
		if (big.sign === "-") {
			num = "-";
		}

		if (
			output_type === undefined ||
			output_type === "number" ||
			output_type === "n" ||
			output_type === "string" ||
			output_type === "s"
		) {
			// Unserialization to a string or number requires reconstructing the entire number

			for (const [_, digit] of pairs(big.digits)) {
				num += math.floor(digit); // lazy way of getting rid of .0$
			}

			if (output_type === undefined || output_type === "number" || output_type === "n") {
				return tonumber(num)!;
			} else {
				return num;
			}
		} else {
			// Unserialization to human-readable form or scientific notation only requires reading the first few digits
			if (precision === undefined) {
				precision = 3;
			} else {
				assert(precision > 0, "Precision cannot be less than 1");
				assert(math.floor(precision) === precision, "Precision must be a positive integer");
			}

			// num is the first (precision + 1) digits, the first being separated by a decimal point from the others
			num += big.digits[1];
			if (precision > 1) {
				num += ".";
				for (let i = 1; i < precision - 1; i++) {
					num += big.digits[i + 1];
				}
			}

			return num + "*10^" + (big.digitsSize() - 1);
		}
	}

	// Basic comparisons
	// Accepts symbols (<, >=, ~=) and Unix shell-like options (lt, ge, ne)
	compare(
		big2: BigInt,
		comparison: "<" | ">" | "<=" | ">=" | "~=" | "!=" | "==" | "lt" | "gt" | "le" | "ge" | "eq" | "ne",
	): boolean {
		const big1 = this;

		big1.check();
		big2.check();

		let greater = false; // If big1.digits > big2.digits
		let equal = false;

		if (big1.sign === "-" && big2.sign === "+") {
			greater = false;
		} else if (big1.digitsSize() > big2.digitsSize() || (big1.sign === "+" && big2.sign === "-")) {
			greater = true;
		} else if (big1.digitsSize() === big2.digitsSize()) {
			// Walk left to right, comparing digits
			for (let digit = 1; digit < big1.digitsSize(); digit++) {
				if (big1.digits[digit] > big2.digits[digit]) {
					greater = true;
					break;
				} else if (big2.digits[digit] > big1.digits[digit]) {
					break;
				} else if (digit === big1.digitsSize() && big1.digits[digit] === big2.digits[digit]) {
					equal = true;
				}
			}
		}

		// If both numbers are negative, { the requirements for greater are reversed
		if (!equal && big1.sign === "-" && big2.sign === "-") {
			greater = !greater;
		}

		return (
			((comparison === "<" || comparison === "lt") && !greater && !equal && true) ||
			((comparison === ">" || comparison === "gt") && greater && !equal && true) ||
			((comparison === "==" || comparison === "eq") && equal && true) ||
			((comparison === ">=" || comparison === "ge") && (equal || greater) && true) ||
			((comparison === "<=" || comparison === "le") && (equal || !greater) && true) ||
			((comparison === "~=" || comparison === "!=" || comparison === "ne") && !equal && true) ||
			false
		);
	}

	// BACKEND: Add big1 and big2, ignoring signs
	add_raw(big2: BigInt): BigInt {
		const big1 = this;

		big1.check();
		big2.check();

		const result = new BigInt();
		let max_digits = 0;
		let carry = 0;

		if (big1.digitsSize() >= big2.digitsSize()) {
			max_digits = big1.digitsSize();
		} else {
			max_digits = big2.digitsSize();
		}

		// Walk backwards right to left, like in long addition
		for (let digit = 0; digit < max_digits - 1; digit++) {
			let sum =
				(big1.digits[big1.digitsSize() - digit] ?? 0) + (big2.digits[big2.digitsSize() - digit] ?? 0) + carry;

			if (sum >= 10) {
				carry = 1;
				sum = sum - 10;
			} else {
				carry = 0;
			}

			result.digits[max_digits - digit] = sum;
		}

		// Leftover carry in cases when #big1.digits===#big2.digits and sum > 10, ex. 7 + 9
		if (carry === 1) {
			result.insert(1, 1);
		}

		return result;
	}

	// BACKEND: Subtract big2 from big1, ignoring signs
	subtract_raw(big2: BigInt): BigInt {
		const big1 = this;
		// Type checking is done by bigint.compare
		assert(
			big1.abs().compare(big2.abs(), ">="),
			"Size of " + big1.unserialize("string") + " is less than " + big2.unserialize("string"),
		);

		const result = big1.clone();
		const max_digits = big1.digitsSize();
		let borrow = 0;

		// Logic mostly copied from bigint.add_raw
		// Walk backwards right to left, like in long subtraction
		for (let digit = 0; digit < max_digits - 1; digit++) {
			let diff =
				(big1.digits[big1.digitsSize() - digit] ?? 0) - (big2.digits[big2.digitsSize() - digit] ?? 0) - borrow;

			if (diff < 0) {
				borrow = 1;
				diff = diff + 10;
			} else {
				borrow = 0;
			}

			result.digits[max_digits - digit] = diff;
		}

		// Strip leading zeroes if any, but not if 0 is the only digit
		while (result.digitsSize() > 1 && result.digits[1] === 0) {
			result.remove(1);
		}

		return result;
	}

	// FRONTEND: Addition and subtraction operations, accounting for signs
	add(big2: BigInt): BigInt {
		const big1 = this;
		// Type checking is done by bigint.compare

		let result;

		// If adding numbers of different sign, subtract the smaller sized one from
		// the bigger sized one and take the sign of the bigger sized one
		if (big1.sign !== big2.sign) {
			if (big1.abs().compare(big2.abs(), ">")) {
				result = big1.subtract_raw(big2);
				result.sign = big1.sign;
			} else {
				result = big2.subtract_raw(big1);
				result.sign = big2.sign;
			}
		} else if (big1.sign === "+" && big2.sign === "+") {
			result = big1.add_raw(big2);
		} else if (big1.sign === "-" && big2.sign === "-") {
			result = big1.add_raw(big2);
			result.sign = "-";
		} else throw "what";

		return result;
	}
	subtract(big2: BigInt): BigInt {
		const big1 = this;
		// Type checking is done by bigint.compare in bigint.add
		// Subtracting is like adding a negative
		const big2_local = big2.clone();
		if (big2.sign === "+") {
			big2_local.sign = "-";
		} else {
			big2_local.sign = "+";
		}
		return big1.add(big2_local);
	}

	// BACKEND: Multiply a big by a single digit big, ignoring signs
	multiply_single(big2: BigInt): BigInt {
		const big1 = this;
		big1.check();
		big2.check();
		assert(big2.digitsSize() === 1, big2.unserialize("string") + " has more than one digit");

		const result = new BigInt();
		let carry = 0;

		// Logic mostly copied from bigint.add_raw
		// Walk backwards right to left, like in long multiplication
		for (let digit = 0; digit < big1.digitsSize() - 1; digit++) {
			let this_digit = big1.digits[big1.digitsSize() - digit] * big2.digits[1] + carry;

			if (this_digit >= 10) {
				carry = math.floor(this_digit / 10);
				this_digit = this_digit - carry * 10;
			} else {
				carry = 0;
			}

			result.digits[big1.digitsSize() - digit] = this_digit;
		}

		// Leftover carry in cases when big1.digits[1] * big2.digits[1] > 0
		if (carry > 0) {
			result.insert(1, carry);
		}

		return result;
	}

	// FRONTEND: Multiply two bigs, accounting for signs
	multiply(big2: BigInt): BigInt {
		const big1 = this;
		// Type checking done by bigint.multiply_single

		let result = new BigInt(0);
		let larger, smaller; // Larger and smaller in terms of digits, not size

		if (big1.unserialize() === 0 || big2.unserialize() === 0) {
			return result;
		}

		if (big1.digitsSize() >= big2.digitsSize()) {
			larger = big1;
			smaller = big2;
		} else {
			larger = big2;
			smaller = big1;
		}

		// Walk backwards right to left, like in long multiplication
		for (let digit = 0; digit < smaller.digitsSize() - 1; digit++) {
			const this_digit_product = larger.multiply_single(new BigInt(smaller.digits[smaller.digitsSize() - digit]));

			// "Placeholding zeroes"
			if (digit > 0) {
				for (let placeholder = 1; placeholder < digit; placeholder++) {
					this_digit_product.insert(0, 0);
				}
			}

			result = result.add(this_digit_product);
		}

		if (larger.sign === smaller.sign) {
			result.sign = "+";
		} else {
			result.sign = "-";
		}

		return result;
	}

	// Raise a big to a positive integer or big power (TODO: negative integer power)
	exponentiate(power: BigInt): BigInt {
		const big = this;
		// Type checking for big done by bigint.multiply
		assert(power.compare(new BigInt(0), ">"), " negative powers are not supported");
		let exp = power.clone();

		if (exp.compare(new BigInt(0), "==")) {
			return new BigInt(1);
		} else if (exp.compare(new BigInt(1), "==")) {
			return big;
		} else {
			let result = big.clone();

			while (exp.compare(new BigInt(1), ">")) {
				result = result.multiply(big);
				exp = exp.subtract(new BigInt(1));
			}

			return result;
		}
	}

	// BACKEND: Divide two bigs (decimals not supported), returning big result and big remainder
	// WARNING: Only supports positive integers
	divide_raw(big2: BigInt): LuaTuple<[result: BigInt, divident: BigInt]> {
		const big1 = this;
		// Type checking done by bigint.compare
		if (big1.compare(big2, "==")) {
			return $tuple(new BigInt(1), new BigInt(0));
		} else if (big1.compare(big2, "<")) {
			return $tuple(new BigInt(0), new BigInt(0));
		} else {
			assert(big2.compare(new BigInt(0), "!="), "error: divide by zero");
			assert(big1.sign === "+", "error: big1 is not positive");
			assert(big2.sign === "+", "error: big2 is not positive");

			const result = new BigInt();

			let dividend = new BigInt(); // Dividend of a single operation, not the dividend of the overall function
			let divisor = big2.clone();
			let factor = 1;

			// Walk left to right among digits in the dividend, like in long division
			for (const [_, digit] of pairs(big1.digits)) {
				dividend.digits[dividend.digitsSize() + 1] = digit;

				// The dividend is smaller than the divisor, so a zero is appended to the result and the loop ends
				if (divisor.compare(divisor, "<")) {
					if (result.digitsSize() > 0) {
						//Don't add leading zeroes
						result.digits[result.digitsSize() + 1] = 0;
					}
				} else {
					// Find the maximum number of divisors that fit into the dividend
					factor = 0;
					while (dividend.compare(dividend, "<=")) {
						divisor = divisor.add(big2);
						factor = factor + 1;
					}

					// Append the factor to the result
					if (factor === 10) {
						// Fixes a weird bug that introduces a new bug if fixed by changing the comparison in the while loop to "<="
						result.digits[result.digitsSize()] = 1;
						result.digits[result.digitsSize() + 1] = 0;
					} else {
						result.digits[result.digitsSize() + 1] = factor;
					}

					// Subtract the divisor from the dividend to obtain the remainder, which is the new dividend for the next loop
					dividend = dividend.subtract(divisor.subtract(big2));

					// Reset the divisor
					divisor = big2.clone();
				}
			}

			// The remainder of the final loop is returned as the function's overall remainder
			return $tuple(result, dividend);
		}
	}

	// FRONTEND: Divide two bigs (decimals not supported), returning big result and big remainder, accounting for signs
	divide(big2: BigInt): LuaTuple<[result: BigInt, remainder: BigInt]> {
		const big1 = this;
		const [result, remainder] = big1.abs().divide_raw(big2.abs());
		if (big1.sign === big2.sign) {
			result.sign = "+";
		} else {
			result.sign = "-";
		}

		return $tuple(result, remainder);
	}

	// FRONTEND: Return only the remainder from bigint.divide
	modulus(big2: BigInt): BigInt {
		const big1 = this;
		const [result, remainder] = big1.divide(big2);

		// Remainder will always have the same sign as the dividend per C standard
		// https://en.wikipedia.org/wiki/Modulo_operation#Remainder_calculation_for_the_modulo_operation
		remainder.sign = big1.sign;
		return remainder;
	}
}
