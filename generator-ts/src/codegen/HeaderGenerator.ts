/**
 * Header file generator for nanopb
 * Generates .pb.h files from proto definitions
 */

import { Message, Enum, Field } from '../core/index.js';
import { Globals } from '../core/Globals.js';
import { NanoPBOptions } from '../types/nanopb-types.js';

/** Header file generator class */
export class HeaderGenerator {
  private globals: Globals;

  constructor() {
    this.globals = Globals.getInstance();
  }

  /**
   * Generate complete header file content
   * @param messages - Array of messages to include
   * @param enums - Array of enums to include
   * @param headerName - Name of the header file (without extension)
   * @param options - Generator options
   * @returns Generated header file content
   */
  *generateHeader(
    messages: Message[],
    enums: Enum[],
    headerName: string,
    options: NanoPBOptions = {}
  ): Generator<string> {
    const macroName = this.toMacroName(headerName);

    // File header
    yield '/* Auto-generated nanopb header */\n';
    yield `/* Do not edit! Your changes will be lost. */\n`;
    yield `/* Generator: nanopb-generator-ts */\n`;
    yield `/* Version: 1.0.0-dev */\n\n`;

    // Header guard
    yield `#ifndef PB_${macroName}_INCLUDED\n`;
    yield `#define PB_${macroName}_INCLUDED\n\n`;

    // Include pb.h
    yield '#include "pb.h"\n\n';

    // Generate nested enums first
    for (const enumType of enums) {
      yield* this.generateEnum(enumType);
      yield '\n';
    }

    // Generate messages with nested types
    const sortedMessages = this.sortMessagesByDependency(messages);
    for (const message of sortedMessages) {
      yield* this.generateMessageStruct(message);
      yield '\n';
    }

    // Generate field descriptor declarations
    for (const message of sortedMessages) {
      yield* this.generateMessageDescriptors(message);
      yield '\n';
    }

    // Generate size constants (if not disabled)
    if (!options.noDescriptor) {
      yield '/* Message sizes */\n';
      for (const message of sortedMessages) {
        const size = message.calculateEncodedSize();
        if (size > 0) {
          yield `#define ${message.getMacroName()}_size ${size}\n`;
        }
      }
      yield '\n';
    }

    // Header guard end
    yield '#endif\n';
  }

  /**
   * Generate enum definition
   * @param enumType - Enum to generate
   * @returns Generator yielding enum definition
   */
  *generateEnum(enumType: Enum): Generator<string> {
    const cTypeName = enumType.getCTypeName();

    // Add comment if present
    const comment = enumType.formatComments();
    if (comment) {
      yield comment + '\n';
    }

    yield `typedef enum _${cTypeName} {\n`;

    for (const value of enumType.getValues()) {
      const valueComment = value.comments.get('leading');
      if (valueComment) {
        yield `    /* ${valueComment} */\n`;
      }

      const enumValueName = enumType.getNamingStyle().enumValueName(enumType.getName(), value.name);
      yield `    ${enumValueName} = ${value.number},\n`;
    }

    yield `} ${cTypeName}_t;\n`;
  }

  /**
   * Generate message struct definition
   * @param message - Message to generate
   * @returns Generator yielding struct definition
   */
  *generateMessageStruct(message: Message): Generator<string> {
    // Use the Message class's own struct generation which now handles Oneof correctly
    yield* message.generateStruct();
  }

  /**
   * Generate nested message struct (indented)
   * @param message - Nested message
   * @param indentLevel - Indentation level
   * @returns Generator yielding nested struct definition
   */
  *generateNestedMessageStruct(message: Message, indentLevel: number = 1): Generator<string> {
    const indent = '    '.repeat(indentLevel);
    const cTypeName = message.getCTypeName();

    yield `${indent}typedef struct _${cTypeName} {\n`;

    // Use the Message class's own struct generation which now handles Oneof correctly
    // We need to indent the content from generateStruct()
    const structGenerator = message.generateStruct();
    let chunk = structGenerator.next();
    while (!chunk.done) {
      // Indent each line (except the opening/closing braces which are already handled)
      const line = chunk.value;
      if (line.includes('typedef struct')) {
        yield line; // Skip the typedef line, we already have it
      } else if (line.includes('}')) {
        yield line.trim(); // Closing brace
      } else if (line.trim().length > 0) {
        yield `${indent}    ${line.trimStart()}`;
      }
      chunk = structGenerator.next();
    }

    yield `${indent}} ${cTypeName}_t;\n`;
  }

  /**
   * Generate field declaration
   * @param field - Field to generate
   * @returns Generator yielding field declaration
   */
  *generateFieldDeclaration(field: Field): Generator<string> {
    const cType = field.getCTypeName();
    const cName = field.getCName();

    // Generate comment if present
    const comment = field.formatComments();
    if (comment) {
      yield comment + ' ';
    }

    if (field.isRepeated() && field['arraySize']) {
      // Fixed-size array
      yield `${cType} ${cName}[${field['arraySize']}];`;
    } else if (field.getAllocationType() === 4) { // FT_POINTER
      // Pointer field
      yield `${cType} *${cName};`;
    } else if (field.getAllocationType() === 1) { // FT_CALLBACK
      // Callback field - use pb_callback_t for dynamic memory allocation
      // This matches Python nanopb generator behavior for strings/bytes
      yield `pb_callback_t ${cName};`;
    } else {
      // Static field
      yield `${cType} ${cName};`;
    }
  }

  /**
   * Generate message field descriptors
   * @param message - Message to generate descriptors for
   * @returns Generator yielding field descriptor definitions
   */
  *generateMessageDescriptors(message: Message): Generator<string> {
    const macroName = message.getMacroName();

    // Generate FIELDLIST macro declaration
    yield message.fieldsDeclaration();
    yield '\n';

    // Generate field descriptor declaration
    yield `extern const pb_msgdesc_t ${macroName}_msg;\n`;
  }

  /**
   * Convert identifier to macro name format
   * @param identifier - Input identifier
   * @returns Macro name (UPPER_CASE)
   */
  private toMacroName(identifier: string): string {
    return identifier
      .replace(/([a-z])([A-Z])/g, '$1_$2')  // Insert underscore before caps
      .toUpperCase();                          // Convert to upper case
  }

  /**
   * Sort messages by dependency to ensure proper ordering
   * @param messages - Messages to sort
   * @returns Sorted messages array
   */
  private sortMessagesByDependency(messages: Message[]): Message[] {
    // Simple dependency sorting - nested messages first
    const sorted: Message[] = [];
    const processed = new Set<string>();

    const processMessage = (message: Message) => {
      if (processed.has(message.getName())) {
        return;
      }

      // Process nested messages first
      for (const nested of message.getNestedMessages()) {
        processMessage(nested);
      }

      sorted.push(message);
      processed.add(message.getName());
    };

    for (const message of messages) {
      processMessage(message);
    }

    return sorted;
  }
}

/**
 * Create header generator instance
 * @returns HeaderGenerator instance
 */
export function createHeaderGenerator(): HeaderGenerator {
  return new HeaderGenerator();
}