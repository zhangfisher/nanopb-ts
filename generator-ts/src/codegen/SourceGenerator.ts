/**
 * Source file generator for nanopb
 * Generates .pb.c files from proto definitions
 */

import { Message, Enum, Field } from '../core/index.js';
import { NanoPBOptions } from '../types/nanopb-types.js';

/** Source file generator class */
export class SourceGenerator {
  /**
   * Generate complete source file content
   * @param messages - Array of messages to include
   * @param enums - Array of enums to include
   * @param headerName - Name of the header file (without extension)
   * @param options - Generator options
   * @returns Generated source file content
   */
  *generateSource(
    messages: Message[],
    enums: Enum[],
    headerName: string,
    options: NanoPBOptions = {}
  ): Generator<string> {
    // File header
    yield '/* Auto-generated nanopb source file */\n';
    yield '/* Do not edit! Your changes will be lost. */\n';
    yield '/* Generator: nanopb-generator-ts */\n';
    yield '/* Version: 1.0.0-dev */\n\n';

    // Include corresponding header
    yield `#include "${headerName}.pb.h"\n\n`;

    // Generate default values for messages if needed
    const hasDefaults = this.hasDefaultValues(messages);
    if (hasDefaults && !options.noDescriptor) {
      yield '/* Default values for message fields */\n';
      yield* this.generateDefaultValues(messages);
      yield '\n';
    }

    // Generate field descriptor definitions using PB_BIND macro
    if (!options.noDescriptor) {
      yield '/* Field descriptors */\n';
      yield* this.generateFieldDescriptors(messages);
      yield '\n';
    }

    // Generate enum functions (enum_to_string, validation)
    yield '/* Enum functions */\n';
    for (const enumType of enums) {
      yield* enumType.generateSource();
      yield '\n';
    }

    // Generate message callback functions if needed
    if (this.hasCallbacks(messages)) {
      yield '/* Message callback functions */\n';
      yield* this.generateCallbackFunctions(messages);
      yield '\n';
    }

    // Generate additional nanopb-specific functions
    yield* this.generateNanopbFunctions(messages, enums);
  }

  /**
   * Check if any message has default values
   * @param messages - Messages to check
   * @returns True if any message has defaults
   */
  private hasDefaultValues(messages: Message[]): boolean {
    for (const message of messages) {
      for (const field of message.getFields()) {
        if (field['fieldDescriptor']?.defaultValue !== undefined) {
          return true;
        }
      }
    }
    return false;
  }

  /**
   * Check if any message uses callback fields
   * @param messages - Messages to check
   * @returns True if any message uses callbacks
   */
  private hasCallbacks(messages: Message[]): boolean {
    for (const message of messages) {
      for (const field of message.getFields()) {
        if (field.getAllocationType() === 1) { // FT_CALLBACK
          return true;
        }
      }
    }
    return false;
  }

  /**
   * Generate default values for message fields
   * @param messages - Messages with defaults
   * @returns Generator yielding default value definitions
   */
  *generateDefaultValues(messages: Message[]): Generator<string> {
    for (const message of messages) {
      for (const field of message.getFields()) {
        const defaultValue = field['fieldDescriptor']?.defaultValue;
        if (defaultValue !== undefined && defaultValue !== '') {
          const macroName = message.getMacroName();
          const fieldName = field.getCName();

          // Generate default value as encoded bytes
          yield `const uint8_t ${macroName}_${fieldName}_default[] = {`;

          // TODO: Encode default value to bytes
          yield `/* Default value: ${defaultValue} */\n`;
          yield `};\n`;
        }
      }
    }
  }

  /**
   * Generate field descriptor definitions
   * @param messages - Messages to generate descriptors for
   * @returns Generator yielding field descriptor definitions
   */
  *generateFieldDescriptors(messages: Message[]): Generator<string> {
    for (const message of messages) {
      const macroName = message.getMacroName();
      const cTypeName = message.getCTypeName();
      const width = message.requiredDescriptorWidth();
      const widthString = width === 1 ? 'AUTO' : width.toString();

      // Generate PB_BIND macro call
      yield `/* Field descriptors for ${message.getName()} */\n`;
      yield `PB_BIND(${macroName}, ${cTypeName}_t, ${widthString})\n`;
    }
  }

  /**
   * Generate callback functions for messages with callback fields
   * @param messages - Messages to generate callbacks for
   * @returns Generator yielding callback function definitions
   */
  *generateCallbackFunctions(messages: Message[]): Generator<string> {
    for (const message of messages) {
      for (const field of message.getFields()) {
        if (field.getAllocationType() === 1) { // FT_CALLBACK
          const cTypeName = message.getCTypeName();
          const cName = field.getCName();
          const callbackType = field.getOption('callbackDatatype') || 'void*';

          yield `/* Callback function for ${message.getName()}.${field.fieldName} */\n`;
          yield `static bool ${cTypeName}_${cName}_callback(${cTypeName}_t *msg, ${callbackType} *arg) {\n`;
          yield `    /* Callback implementation */\n`;
          yield `    return false; // Placeholder\n`;
          yield `}\n`;
        }
      }
    }
  }

  /**
   * Generate nanopb-specific functions
   * @param messages - Messages to generate functions for
   * @param enums - Enums to generate functions for
   * @returns Generator yielding additional functions
   */
  *generateNanopbFunctions(messages: Message[], enums: Enum[]): Generator<string> {
    // Generate encode/decode functions if using custom allocators
    const hasCustomAllocator = messages.some(m =>
      m.getFields().some(f => f.getAllocationType() === 4) // FT_POINTER
    );

    if (hasCustomAllocator) {
      yield '/* Custom allocator functions */\n';
      yield '/* TODO: Implement custom allocator */\n';
      yield '\n';
    }

    // Generate message validation functions
    for (const message of messages) {
      yield* this.generateValidationFunction(message);
      yield '\n';
    }
  }

  /**
   * Generate message validation function
   * @param message - Message to generate validation for
   * @returns Generator yielding validation function
   */
  *generateValidationFunction(message: Message): Generator<string> {
    const cTypeName = message.getCTypeName();
    const macroName = message.getMacroName();

    yield `/* Validation function for ${message.getName()} */\n`;
    yield `bool ${cTypeName}_validate(const ${cTypeName}_t *msg) {\n`;
    yield '    /* TODO: Implement validation */\n';
    yield '    return true; // Placeholder\n';
    yield '}\n';
  }

  /**
   * Generate size information
   * @param message - Message to generate size info for
   * @returns Generator yielding size information
   */
  *generateSizeInfo(message: Message): Generator<string> {
    const size = message.calculateEncodedSize();
    const macroName = message.getMacroName();

    yield `/* Size information for ${message.getName()} */\n`;
    yield `#define ${macroName}_size ${size}\n`;
  }
}

/**
 * Create source generator instance
 * @returns SourceGenerator instance
 */
export function createSourceGenerator(): SourceGenerator {
  return new SourceGenerator();
}