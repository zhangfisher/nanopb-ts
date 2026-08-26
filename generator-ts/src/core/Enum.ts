/**
 * Enum class for handling protobuf enumerations
 * Ported from nanopb_generator.py Enum class
 */

import { ProtoElement } from './ProtoElement.js';
import { NanoPBOptions, NamingStyle as INamingStyle } from '../types/nanopb-types.js';
import { NamingStyle } from '../naming/NamingStyle.js';
import { EnumDescriptorProto, EnumValueDescriptorProto, SourceCodeLocation } from '../types/protobuf-types.js';

/** Enum value descriptor */
export interface EnumValue {
  name: string;
  number: number;
  comments: Map<string, string>;
}

/** Enum class for protobuf enumerations */
export class Enum extends ProtoElement {
  private enumName: string;
  private values: EnumValue[];
  private enumDescriptor: EnumDescriptorProto;

  constructor(
    enumName: string,
    values: EnumValue[],
    options: NanoPBOptions,
    namingStyle: NamingStyle,
    sourceLocation?: SourceCodeLocation,
    path: number[] = [2] // Default path for enums
  ) {
    super(path, options, namingStyle, sourceLocation);
    this.enumName = enumName;
    this.values = values;

    // Create enum descriptor for compatibility
    this.enumDescriptor = {
      name: enumName,
      value: values.map(v => ({
        name: v.name,
        number: v.number,
        options: {},
      })),
      options: {},
    };
  }

  /**
   * Create Enum from EnumDescriptorProto
   * @param enumDesc - Enum descriptor proto
   * @param options - Nanopb options
   * @param namingStyle - Naming style
   * @param sourceLocation - Source code location
   * @returns Enum instance
   */
  static fromDescriptor(
    enumDesc: EnumDescriptorProto,
    options: NanoPBOptions,
    namingStyle: NamingStyle,
    sourceLocation?: SourceCodeLocation
  ): Enum {
    const values: EnumValue[] = enumDesc.value.map((valDesc: EnumValueDescriptorProto) => ({
      name: valDesc.name,
      number: valDesc.number,
      comments: new Map(),
    }));

    return new Enum(
      enumDesc.name,
      values,
      options,
      namingStyle,
      sourceLocation
    );
  }

  /**
   * Get enum name as C identifier
   * @returns C identifier
   */
  getCName(): string {
    return this.namingStyle.makeIdentifier(this.enumName);
  }

  /**
   * Get enum name as C type name
   * @returns C type name
   */
  getCTypeName(): string {
    return this.namingStyle.typeName(this.enumName);
  }

  /**
   * Get enum name as C macro name
   * @returns C macro name
   */
  getMacroName(): string {
    return this.namingStyle.defineName(this.enumName);
  }

  /**
   * Get enum values
   * @returns Array of enum values
   */
  getValues(): EnumValue[] {
    return [...this.values];
  }

  /**
   * Get enum name
   * @returns Enum name
   */
  getName(): string {
    return this.enumName;
  }

  /**
   * Calculate maximum encoded size for this enum
   * @returns Maximum encoded size in bytes
   */
  calculateEncodedSize(): number {
    return 4; // Enums are encoded as int32, max 4 bytes for varint
  }

  /**
   * Check if this enum should use long names
   * @returns True if using long names
   */
  useLongNames(): boolean {
    return this.hasOption('longNames') || this.hasOption('shortEnumNames') === false;
  }

  /**
   * Generate header file code for this enum
   * @returns Generator yielding header file content
   */
  *generateHeader(): Generator<string> {
    const cTypeName = this.getCTypeName();

    // Generate comment if present
    const comment = this.formatComments();
    if (comment) {
      yield comment + '\n';
    }

    // Generate enum definition
    yield `typedef enum _${cTypeName} {\n`;

    for (const value of this.values) {
      const valueComment = value.comments.get('leading');
      if (valueComment) {
        yield `    /* ${valueComment} */\n`;
      }

      const enumValueName = this.namingStyle.enumValueName(this.enumName, value.name);
      yield `    ${enumValueName} = ${value.number},\n`;
    }

    yield `} ${cTypeName}_t;\n`;
  }

  /**
   * Generate enum_to_string function if requested
   * @returns Generator yielding enum_to_string function code
   */
  *generateEnumToString(): Generator<string> {
    if (!this.hasOption('enumToString')) {
      return;
    }

    const cTypeName = this.getCTypeName();
    const macroName = this.getMacroName();

    yield `/* Enum value to string conversion */\n`;
    yield `const char *${cTypeName}_name(${cTypeName}_t value) {\n`;
    yield `    switch (value) {\n`;

    for (const value of this.values) {
      const enumValueName = this.namingStyle.enumValueName(this.enumName, value.name);
      yield `        case ${enumValueName}: return \"${value.name}\";\n`;
    }

    yield `        default: return \"unknown\";\n`;
    yield `    }\n`;
    yield `}\n`;
  }

  /**
   * Generate enum validation function if requested
   * @returns Generator yielding enum validation function code
   */
  *generateEnumValidation(): Generator<string> {
    if (!this.hasOption('enumToString')) {
      return;
    }

    const cTypeName = this.getCTypeName();

    yield `/* Enum validation function */\n`;
    yield `bool ${cTypeName}_valid(${cTypeName}_t value) {\n`;
    yield `    switch (value) {\n`;

    for (const value of this.values) {
      const enumValueName = this.namingStyle.enumValueName(this.enumName, value.name);
      yield `        case ${enumValueName}:\n`;
    }

    yield `            return true;\n`;
    yield `        default:\n`;
    yield `            return false;\n`;
    yield `    }\n`;
    yield `}\n`;
  }

  /**
   * Generate source file code for this enum
   * @returns Generator yielding source file content
   */
  *generateSource(): Generator<string> {
    // Generate enum_to_string function if requested
    yield* this.generateEnumToString();

    // Generate enum validation function if requested
    yield* this.generateEnumValidation();
  }

  /**
   * Get the minimum enum value
   * @returns Minimum value
   */
  getMinValue(): number {
    return Math.min(...this.values.map(v => v.number));
  }

  /**
   * Get the maximum enum value
   * @returns Maximum value
   */
  getMaxValue(): number {
    return Math.max(...this.values.map(v => v.number));
  }

  /**
   * Check if enum values are contiguous
   * @returns True if values form a contiguous range
   */
  isContiguous(): boolean {
    const sorted = [...this.values].sort((a, b) => a.number - b.number);
    for (let i = 0; i < sorted.length - 1; i++) {
      if (sorted[i + 1].number - sorted[i].number !== 1) {
        return false;
      }
    }
    return true;
  }

  /**
   * Get the number of enum values
   * @returns Number of values
   */
  getValueCount(): number {
    return this.values.length;
  }

  /**
   * Find a value by number
   * @param number - Value number to find
   * @returns Enum value or undefined
   */
  findValueByNumber(number: number): EnumValue | undefined {
    return this.values.find(v => v.number === number);
  }

  /**
   * Find a value by name
   * @param name - Value name to find
   * @returns Enum value or undefined
   */
  findValueByName(name: string): EnumValue | undefined {
    return this.values.find(v => v.name === name);
  }

  /**
   * Clone this enum
   * @returns Cloned enum
   */
  clone(): Enum {
    const cloned = new Enum(
      this.enumName,
      this.values.map(v => ({ ...v })),
      { ...this.options },
      this.namingStyle,
      this.sourceLocation,
      [...this.path]
    );
    return cloned;
  }

  /**
   * Validate enum configuration
   * @throws Error if configuration is invalid
   */
  validate(): void {
    super.validate();

    // Check for duplicate values
    const numbers = new Set<number>();
    for (const value of this.values) {
      if (numbers.has(value.number)) {
        throw new Error(`Duplicate enum value number: ${value.number} in ${this.enumName}`);
      }
      numbers.add(value.number);
    }

    // Check for duplicate names
    const names = new Set<string>();
    for (const value of this.values) {
      if (names.has(value.name)) {
        throw new Error(`Duplicate enum value name: ${value.name} in ${this.enumName}`);
      }
      names.add(value.name);
    }
  }
}
