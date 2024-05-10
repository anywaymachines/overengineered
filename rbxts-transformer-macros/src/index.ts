import path from "path";
import ts from "typescript";

const TRANSFORMER_DIR = path.join(__dirname, "../");
const INDEX_FILE = path.join(TRANSFORMER_DIR, "index.d.ts");
const defineCallMacrosName = "$defineCallMacros";

type Macro = {
	exportDeclaration: ts.Declaration;
	methodDeclaration: ts.PropertyAssignment;
	sourceFile: ts.SourceFile;
};
type MacroListTypes = {
	CallMacros: Map<string, Macro>;
};
type MacroList = Map<ts.Symbol, MacroListTypes>;
type ImportInfo = {
	specifier: string;
	imports: Array<[string, ts.Identifier]>;
};

const newtr = (program: ts.Program, context: ts.TransformationContext) => {
	const typeChecker = program.getTypeChecker();
	const factory = ts.factory;

	/** Fix namespace function hoisting by moving any variable and inside namespace declarations to the bottom */
	const transformNamespaces = (file: ts.SourceFile): ts.SourceFile => {
		const fixNamespace = (node: ts.ModuleDeclaration): ts.ModuleDeclaration => {
			if ((node.flags & ts.NodeFlags.Namespace) === 0 || !node.body || !ts.isModuleBlock(node.body))
				return node;

			const functionDeclarations: ts.FunctionDeclaration[] = [];
			const namespaceDeclarations: ts.Statement[] = [];
			const variableDeclarations: ts.Statement[] = [];
			const anyDeclarations: ts.Statement[] = [];

			for (const child of node.body.statements) {
				if (ts.isFunctionDeclaration(child)) {
					functionDeclarations.push(child);
				}
				else if (ts.isModuleDeclaration(child)) {
					namespaceDeclarations.push(fixNamespace(child));
				}
				else if (ts.isStatement(child)) {
					variableDeclarations.push(child);
				}
				else {
					anyDeclarations.push(child);
				}
			}

			return factory.createModuleDeclaration(
				node.modifiers,
				node.name,
				factory.createModuleBlock([
					...functionDeclarations,
					...anyDeclarations,
					...namespaceDeclarations,
					...variableDeclarations,
				]),
				node.flags
			)
		}

		return ts.visitEachChild(file, node => {
			if (ts.isModuleDeclaration(node)) {
				return fixNamespace(node);
			}

			return node;
		}, context);
	}

	const transformCompileTime = (file: ts.SourceFile): ts.SourceFile => {
		const visit = (node: ts.Node): ts.Node => {
			if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === "$compileTime") {
				return factory.createNumericLiteral(Date.now() / 1000);
			}

			return ts.visitEachChild(node, visit, context);
		};
		
		return ts.visitEachChild(file, visit, context);
	}
	const transformLogs = (file: ts.SourceFile): ts.SourceFile => {
		let needsImport = false;
		const scopedBlocks = new Set<(ts.Block | ts.SourceFile)>();

		const constructLog = (expression: ts.CallExpression, name: string): ts.Node => {
			needsImport = true;

			const spt = file.fileName.split('/')
			const filename = spt[spt.length - 1];

			return factory.createCallExpression(
				factory.createPropertyAccessExpression(
					factory.createIdentifier('__logger'),
					factory.createIdentifier(`_${name}`),
				),
				expression.typeArguments,
				[
					factory.createStringLiteral(`\t [${filename}:${file.getLineAndCharacterOfPosition(expression.getStart()).line}]`),
					...expression.arguments,
				],
			);
		};
		const constructScope = (expression: ts.CallExpression): ts.Node => {
			needsImport = true;

			let parent = expression.parent;
			while (parent && !ts.isBlock(parent) && !ts.isSourceFile(parent)) {
				parent = parent.parent;
			}
			if (!parent) throw 'what';
			if (!ts.isBlock(parent) && !ts.isSourceFile(parent)) throw 'what';

			scopedBlocks.add(parent);

			return factory.createCallExpression(
				factory.createPropertyAccessExpression(
					factory.createIdentifier('__logger'),
					factory.createIdentifier(`beginScope`),
				),
				expression.typeArguments,
				expression.arguments,
			);
		};

		const visit = (node: ts.Node): ts.Node => {
			if (ts.isCallExpression(node) && ts.isIdentifier(node.expression)) {
				if (node.expression.text === "$log") {
					return constructLog(node, "info");
				}
				if (node.expression.text === "$warn") {
					return constructLog(node, "warn");
				}
				if (node.expression.text === "$err") {
					return constructLog(node, "err");
				}
			
				if (node.expression.text === "$beginScope") {
					return constructScope(node);
				}
			}

			return ts.visitEachChild(node, visit, context);
		};

		const addTryCatch = (statements: readonly ts.Statement[]): ts.TryStatement => {
			statements = [...statements];
			return factory.createTryStatement(
				factory.createBlock(statements),
				undefined,
				factory.createBlock([
					factory.createExpressionStatement(
						factory.createCallExpression(
							factory.createPropertyAccessExpression(
								factory.createIdentifier('__logger'),
								factory.createIdentifier(`endScope`),
							),
							undefined,
							undefined,
						),
					),
				]),
			);
		}

		const addEndScopes = (node: ts.Node): ts.Node => {
			if (ts.isBlock(node) || ts.isSourceFile(node)) {
				for (const child of node.statements) {
					if (ts.isExpressionStatement(child) && ts.isCallExpression(child.expression) && ts.isIdentifier(child.expression.expression) && child.expression.expression.text === '$beginScope') {
						needsImport = true;

						if (ts.isBlock(node)) {
							return addTryCatch((ts.visitEachChild(node, addEndScopes, context) as ts.Block).statements);
						}
						else if (ts.isSourceFile(node)) {
							if (true as boolean)
								throw 'Logger scoping outside of blocks is not supported!'
							return factory.updateSourceFile(
								node,
								[addTryCatch(ts.visitEachChild(node, addEndScopes, context).statements)],
								node.isDeclarationFile,
								node.referencedFiles,
								node.typeReferenceDirectives,
								node.hasNoDefaultLib,
								node.libReferenceDirectives,
							);
						}
					}
				}
			}

			return ts.visitEachChild(node, addEndScopes, context);
		};
		
		file = addEndScopes(file) as ts.SourceFile;
		file = ts.visitEachChild(file, visit, context);
		if (needsImport) {
			file = factory.updateSourceFile(
				file,
				[
					factory.createImportDeclaration(
						undefined,
						factory.createImportClause(
							false,
							undefined,
							factory.createNamedImports([
								factory.createImportSpecifier(
									false,
									factory.createIdentifier("Logger"),
									factory.createIdentifier("__logger"),
								),
							]),
						),
						factory.createStringLiteral("shared/Logger"),
					),
					...file.statements,
				],
				file.isDeclarationFile,
				file.referencedFiles,
				file.typeReferenceDirectives,
				file.hasNoDefaultLib,
				file.libReferenceDirectives,
			);
		}

		return file;
	}

	// DOES NOT WORK because the types are still being checked
	const transformObjects = (file: ts.SourceFile): ts.SourceFile => {
		const visit = (node: ts.Node): ts.Node => {
			if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression)
				&& ts.isIdentifier(node.expression.expression) && node.expression.expression.text === "Objects"
				&& ts.isIdentifier(node.expression.name) && node.expression.name.text === "pairs_"
			) {

				let newnode = factory.createCallExpression(
					factory.createIdentifier('pairs'),
					undefined,
					node.arguments,
				);
				newnode = ts.visitEachChild(newnode, visit, context);

				return newnode;
			}

			return ts.visitEachChild(node, visit, context);
		};
		
		return ts.visitEachChild(file, visit, context);
	}


	const functions = [transformNamespaces, transformCompileTime, transformLogs];
	return (files: Map<string, ts.SourceFile>): Map<string, ts.SourceFile> => {
		files.forEach((file, fileName) => {
			for (const func of functions) {
				file = func(file);
			}

			files.set(fileName, file);
		});

		createMacroTransformer(program, context)(files);
		return files;
	}
}

function createMacroTransformer(program: ts.Program, context: ts.TransformationContext) {
	const typeChecker = program.getTypeChecker();
	const macroList: MacroList = new Map();
	const importList = new Map<ts.Symbol, Array<ImportInfo>>();
	const factory = ts.factory;
	return transformFiles;

	function addImport(sourceFile: ts.SourceFile, specifier: string, importId: string): ts.Identifier {
		const symbol = typeChecker.getSymbolAtLocation(sourceFile);
		if (!symbol) throw "Could not find symbol for sourcefile";

		const imports = importList.get(symbol) ?? [];
		importList.set(symbol, imports);

		let existingImportInfo = imports.find((x) => x.specifier === specifier);
		if (existingImportInfo) {
			const existingImport = existingImportInfo.imports.find((x) => x[0] === importId);
			if (existingImport) {
				return existingImport[1];
			}
		} else {
			existingImportInfo = { specifier, imports: [] };
			imports.push(existingImportInfo);
		}

		const generatedUID = factory.createUniqueName("macro");
		existingImportInfo.imports.push([importId, generatedUID]);
		return generatedUID;
	}

	function transformFiles(files: Map<string, ts.SourceFile>): Map<string, ts.SourceFile> {
		for (const transformer of [defineMacroTransform, removeImportTransform, macroTransform, addImportTransform]) {
			files.forEach((file, fileName) => {
				file = transformer(file);
				files.set(fileName, file);
			});
		}
		if (false)
			macroList.forEach((map) => {
				map.CallMacros.forEach((decl, name) => {
					console.log(`Found call macro ${name} from ${decl.exportDeclaration.getSourceFile().fileName}`);
				});
			});
		return files;
	}

	function isDefineMacro(node: ts.Node): node is ts.CallExpression & { expression: ts.Identifier } {
		if (!ts.isCallExpression(node)) return false;
		if (!ts.isIdentifier(node.expression)) return false;

		if (node.expression.escapedText === defineCallMacrosName) {
			return true;
		}

		return false;
	}

	function defineMacroTransformInner(node: ts.Node): ts.Node {
		if (isDefineMacro(node)) {
			const declaration = ts.findAncestor(node, (element): element is ts.Declaration =>
				ts.isVariableStatement(element),
			);

			if (!declaration) throw "Define macros must be top-level and exported.";
			//if (!declaration.modifiers?.find((x) => ts.isExportModifier(x))) throw "Define macros must be exported.";
			if (!node.typeArguments || node.typeArguments.length > 1) throw "Expected 1 type argument.";
			if (!node.arguments || node.arguments.length > 1) throw "Expected 1 argument.";

			const argument = node.arguments[0];
			//if (!ts.isObjectLiteralExpression(argument)) throw "Expected object literal.";

			const typeArgument = node.typeArguments[0];
			if (!ts.isTypeReferenceNode(typeArgument)) throw "Expected type reference.";

			const type = typeChecker.getTypeAtLocation(typeArgument);
			if (!type) throw "Could not retrieve symbol for type.";

			const macros: MacroListTypes = macroList.get(type.symbol) ?? { CallMacros: new Map(), };
			macroList.set(type.symbol, macros);

			const macroMethods = new Array<ts.PropertyAssignment>();

			for (const method of typeChecker.getTypeAtLocation(argument).getProperties().map(p => p.getDeclarations()![0])) {
				//for (const method of argument.properties) {
				if (!ts.isPropertyAssignment(method)) throw "Expected method.";
				if (!method.initializer || !ts.isArrowFunction(method.initializer)) throw "Expected method.";
				if (!ts.isIdentifier(method.name)) throw "Expected identifier.";
				macros.CallMacros.set(method.name.text, {
					exportDeclaration: declaration,
					methodDeclaration: method,
					sourceFile: node.getSourceFile(),
				});
				macroMethods.push(method);
			}

			return factory.createObjectLiteralExpression(macroMethods, true);
		}
		return ts.visitEachChild(node, defineMacroTransformInner, context);
	}

	function defineMacroTransform(sourceFile: ts.SourceFile): ts.SourceFile {
		return ts.visitEachChild(sourceFile, defineMacroTransformInner, context);
	}

	function removeImportTransformInner(node: ts.Node) {
		if (ts.isImportDeclaration(node)) {
			const symbol = typeChecker.getSymbolAtLocation(node.moduleSpecifier);
			if (symbol && ts.isSourceFile(symbol.valueDeclaration!)) {
				const fileName = path.normalize(symbol.valueDeclaration.fileName);
				if (fileName === INDEX_FILE) {
					return undefined;
				}
			}
		}
		return node;
	}

	function removeImportTransform(sourceFile: ts.SourceFile): ts.SourceFile {
		return ts.visitEachChild(sourceFile, removeImportTransformInner, context);
	}

	function getNameFromAccessExpression(
		node: ts.ElementAccessExpression | ts.PropertyAccessExpression,
	): string | undefined {
		if (ts.isElementAccessExpression(node)) {
			return ts.isStringLiteral(node.argumentExpression) ? node.argumentExpression.text : undefined;
		} else {
			return ts.isIdentifier(node.name) ? node.name.text : undefined;
		}
	}

	function getMacroFromCallExpression(node: ts.CallExpression): Macro | undefined {
		const type = typeChecker.getTypeAtLocation(node.expression);
		if (type && type.symbol) {
			const declaration = type.symbol.valueDeclaration?.parent;
			if (declaration && ts.isInterfaceDeclaration(declaration)) {
				const parentSymbol = typeChecker.getTypeAtLocation(declaration.name);
				if (parentSymbol?.symbol) {
					const macros = macroList.get(parentSymbol.symbol);
					if (macros) {
						const propName = type.symbol.name;
						return macros.CallMacros.get(propName);
					}
				}
			}
		}
	}

	function getNameFromDeclaration(node: ts.Declaration): string | undefined {
		if (ts.isVariableStatement(node)) {
			const declaration = node.declarationList.declarations?.[0];
			if (!declaration) return;
			//if (!ts.isNamedDeclaration(declaration)) return;
			if (!ts.isIdentifier(declaration.name)) return;
			return declaration.name.text;
		}
	}

	function getLeftHandSideOfExpression(node: ts.Expression): ts.Expression {
		if (ts.isPropertyAccessExpression(node)) {
			return node.expression;
		} else if (ts.isElementAccessExpression(node)) {
			return node.expression;
		}
		return node;
	}

	function buildMacro(macro: Macro, node: ts.Expression) {
		if (!ts.isIdentifier(macro.methodDeclaration.name)) throw "Method declaration name must be identifier.";
		if (node.getSourceFile().fileName === macro.sourceFile.fileName) {
			const exportedName = getNameFromDeclaration(macro.exportDeclaration);
			if (!exportedName) throw new Error('Cannot use macros in the same file they\'re defined in.');

			return factory.createCallExpression(
				factory.createPropertyAccessExpression(factory.createIdentifier(exportedName), macro.methodDeclaration.name),
				undefined,
				ts.isCallExpression(node)
					? [getLeftHandSideOfExpression(node.expression), ...node.arguments]
					: [getLeftHandSideOfExpression(node)],
			);
		}

		const exportedName = getNameFromDeclaration(macro.exportDeclaration);
		if (exportedName) {
			const specifier = "./" + path.relative(
				path.dirname(node.getSourceFile().fileName),
				macro.sourceFile.fileName
			);

			const guid = addImport(node.getSourceFile(), specifier.split(".").slice(0, -1).join("."), exportedName);
			return factory.createCallExpression(
				factory.createPropertyAccessExpression(guid, macro.methodDeclaration.name),
				undefined,
				ts.isCallExpression(node)
					? [getLeftHandSideOfExpression(node.expression), ...node.arguments]
					: [getLeftHandSideOfExpression(node)],
			);
		}
	}

	function macroTransformInner(node: ts.Node): ts.Node {
		// call macros
		if (ts.isCallExpression(node)) {
			const macro = getMacroFromCallExpression(node);
			if (macro) {
				const macroExpression = buildMacro(macro, node);
				if (macroExpression) {
					return ts.visitEachChild(macroExpression, macroTransformInner, context);
				}
			}
		}

		return ts.visitEachChild(node, macroTransformInner, context);
	}

	function macroTransform(sourceFile: ts.SourceFile): ts.SourceFile {
		return ts.visitEachChild(sourceFile, macroTransformInner, context);
	}

	function addImportTransform(sourceFile: ts.SourceFile): ts.SourceFile {
		const symbol = typeChecker.getSymbolAtLocation(sourceFile);
		if (symbol) {
			const imports = importList.get(symbol);
			if (imports) {
				return factory.updateSourceFile(
					sourceFile,
					[
						...imports.map((importInfo) =>
							factory.createImportDeclaration(
								//undefined,
								undefined,
								factory.createImportClause(
									false,
									undefined,
									factory.createNamedImports(
										importInfo.imports.map((importData) =>
											factory.createImportSpecifier(
												false,
												factory.createIdentifier(importData[0]),
												importData[1],
											),
										),
									),
								),
								factory.createStringLiteral(importInfo.specifier),
							),
						),
						...sourceFile.statements,
					],
					sourceFile.isDeclarationFile,
					sourceFile.referencedFiles,
					sourceFile.typeReferenceDirectives,
					sourceFile.hasNoDefaultLib,
					sourceFile.libReferenceDirectives,
				);
			}
		}
		return sourceFile;
	}
}
export default function (program: ts.Program) {
	return (context: ts.TransformationContext) => {
		const transformer = newtr(program, context);
		let transformed: Map<string, ts.SourceFile>;
		return (file: ts.SourceFile) => {
			if (!transformed) transformed = transformer(new Map(program.getSourceFiles().map((x) => [x.fileName, x])));
			return transformed.get(file.fileName) ?? file;
		};
	};
}
