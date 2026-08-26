/**
 * Message class for handling protobuf messages
 * Ported from nanopb_generator.py Message class
 */

import { ProtoElement } from './ProtoElement.js';
import { Enum } from './Enum.js';
import { Field } from './Field.js';
import { NanoPBOptions, NamingStyle as INamingStyle, DescriptorSize } from '../types/nanopb-types.js';
import { NamingStyle } from '../naming/NamingStyle.js';
import { DescriptorProto, SourceCodeLocation } from '../types/protobuf-types.js';
import { Globals } from './Globals.js';

/** Message class for protobuf messages */
export class Message extends ProtoElement {
  private messageName: string;
  private fields: Field[];
  private enums: Enum[];
  private nestedMessages: Message[];
  private oneofs: string[];
  private oneofDecls: any[]; // Full oneof declaration objects
  private messageDescriptor: DescriptorProto;

  constructor(
    messageName: string,
    fields: Field[],
    enums: Enum[],
    nestedMessages: Message[],
    oneofs: string[],
    oneofDecls: any[] = [],
    options: NanoPBOptions,
    namingStyle: NamingStyle,
    sourceLocation?: SourceCodeLocation,
    path: number[] = [2] // Default path for messages
  ) {
    super(path, options, namingStyle, sourceLocation);
    this.messageName = messageName;
    this.fields = fields;
    this.enums = enums;
    this.nestedMessages = nestedMessages;
    this.oneofs = oneofs;
    this.oneofDecls = oneofDecls;

    // Create message descriptor for compatibility
    this.messageDescriptor = {
      name: messageName,
      field: fields.map(f => f['fieldDescriptor']),
      enumType: enums.map(e => e['enumDescriptor']),
      nestedType: nestedMessages.map(m => m['messageDescriptor']),
      oneofDecl: oneofDecls.length > 0 ? oneofDecls : oneofs.map(name => ({ name, options: {} })),
      options: {},
    };
  }

  /**
   * Create Message from DescriptorProto
   * @param msgDesc - Message descriptor proto
   * @param options - Nanopb options
   * @param namingStyle - Naming style
   * @param sourceLocation - Source code location
   * @returns Message instance
   */
  static fromDescriptor(
    msgDesc: DescriptorProto,
    options: NanoPBOptions,
    namingStyle: NamingStyle,
    sourceLocation?: SourceCodeLocation
  ): Message {
    const globals = Globals.getInstance();

    // Create fields and handle oneof information
    const fields: Field[] = [];
    msgDesc.field?.forEach((fieldDesc, index) => {
      const fieldOptions = globals.getOptionsForElement(
        `${msgDesc.name}.${fieldDesc.name}`
      );
      const field = Field.fromDescriptor(
        fieldDesc,
        { ...options, ...fieldOptions },
        namingStyle,
        sourceLocation
      );

      // Set parent message name for nested message type resolution
      field.setParentMessageName(msgDesc.name);

      // Check if field is part of a oneof using oneofName
      if (fieldDesc.oneofName && msgDesc.oneofDecl) {
        // Find the oneof index by matching the name
        const oneofIndex = msgDesc.oneofDecl.findIndex(
          oneofDecl => oneofDecl.name === fieldDesc.oneofName
        );

        if (oneofIndex !== -1) {
          const oneofDecl = msgDesc.oneofDecl[oneofIndex];
          field.setOneof(oneofDecl.name, oneofIndex);
          console.log(`Field ${fieldDesc.name} is oneof member: ${oneofDecl.name} at index ${oneofIndex}`);
        }
      }

      fields.push(field);
    });

    // Create enums
    const enums: Enum[] = [];
    msgDesc.enumType?.forEach((enumDesc, index) => {
      const enumOptions = globals.getOptionsForElement(enumDesc.name);
      const enumType = Enum.fromDescriptor(
        enumDesc,
        { ...options, ...enumOptions },
        namingStyle,
        sourceLocation
      );
      enums.push(enumType);
    });

    // Don't create nested messages here - they are handled separately
    // by the generator to avoid duplication
    const nestedMessages: Message[] = [];

    // Extract oneof declarations
    const oneofDecls: any[] = msgDesc.oneofDecl || [];
    const oneofs: string[] = oneofDecls.map(oneof => oneof.name);

    return new Message(
      msgDesc.name,
      fields,
      enums,
      nestedMessages,
      oneofs,
      oneofDecls, // Pass full oneof declarations
      options,
      namingStyle,
      sourceLocation,
      [2] // Path for messages
    );
  }

  /**
   * Get message name as C identifier
   * @returns C identifier
   */
  getCName(): string {
    return this.namingStyle.makeIdentifier(this.messageName);
  }

  /**
   * Get message name as C type name
   * @returns C type name
   */
  getCTypeName(): string {
    return this.namingStyle.typeName(this.messageName);
  }

  /**
   * Get message name as C macro name
   * @returns C macro name
   */
  getMacroName(): string {
    return this.namingStyle.defineName(this.messageName);
  }

  /**
   * Get all fields in this message
   * @returns Array of fields
   */
  getFields(): Field[] {
    return [...this.fields];
  }

  /**
   * Get all enums in this message
   * @returns Array of enums
   */
  getEnums(): Enum[] {
    return [...this.enums];
  }

  /**
   * Get all nested messages
   * @returns Array of nested messages
   */
  getNestedMessages(): Message[] {
    return [...this.nestedMessages];
  }

  /**
   * Get all oneof names
   * @returns Array of oneof names
   */
  getOneofs(): string[] {
    return [...this.oneofs];
  }

  /**
   * Get message name
   * @returns Message name
   */
  getName(): string {
    return this.messageName;
  }

  /**
   * Find a field by name
   * @param name - Field name to find
   * @returns Field or undefined
   */
  findField(name: string): Field | undefined {
    return this.fields.find(f => f.fieldName === name);
  }

  /**
   * Find a field by number
   * @param number - Field number to find
   * @returns Field or undefined
   */
  findFieldByNumber(number: number): Field | undefined {
    return this.fields.find(f => f.fieldNumber === number);
  }

  /**
   * Find an enum by name
   * @param name - Enum name to find
   * @returns Enum or undefined
   */
  findEnum(name: string): Enum | undefined {
    return this.enums.find(e => e.enumName === name);
  }

  /**
   * Find a nested message by name
   * @param name - Message name to find
   * @returns Message or undefined
   */
  findNestedMessage(name: string): Message | undefined {
    return this.nestedMessages.find(m => m.messageName === name);
  }

  /**
   * Get all fields including nested ones
   * @returns Array of all fields
   */
  getAllFields(): Field[] {
    const allFields: Field[] = [...this.fields];
    for (const nested of this.nestedMessages) {
      allFields.push(...nested.getAllFields());
    }
    return allFields;
  }

  /**
   * Get all enums including nested ones
   * @returns Array of all enums
   */
  getAllEnums(): Enum[] {
    const allEnums: Enum[] = [...this.enums];
    for (const nested of this.nestedMessages) {
      allEnums.push(...nested.getAllEnums());
    }
    return allEnums;
  }

  /**
   * Calculate required descriptor width
   * @returns Required descriptor width (1, 2, 4, or 8)
   */
  requiredDescriptorWidth(): number {
    // Check if any field requires wider descriptors
    let maxWidth = 1;

    for (const field of this.fields) {
      if (field.isIgnored()) {
        continue;
      }

      // Check if field needs wider descriptor based on size
      const encodedSize = field.calculateEncodedSize();
      if (encodedSize > 255) {
        maxWidth = Math.max(maxWidth, 2);
      }
      if (encodedSize > 65535) {
        maxWidth = Math.max(maxWidth, 4);
      }
    }

    return maxWidth;
  }

  /**
   * Calculate maximum encoded size for this message
   * @returns Maximum encoded size in bytes
   */
  calculateEncodedSize(): number {
    let totalSize = 0;

    for (const field of this.fields) {
      if (field.isIgnored()) {
        continue;
      }
      totalSize += field.calculateEncodedSize();
    }

    return totalSize;
  }

  /**
   * Generate FIELDLIST macro declaration
   * @returns FIELDLIST macro declaration string
   */
  fieldsDeclaration(): string {
    const macroName = this.getMacroName();
    const macroX = 'X';
    const macroA = 'a';

    let result = `#define ${macroName}_FIELDLIST(${macroX}, ${macroA}) \\\n`;

    // Sort fields by tag number (required by pb_common.c)
    const sortedFields = [...this.fields].sort((a, b) => a.fieldNumber - b.fieldNumber);

    // Generate field entries
    const fieldEntries = sortedFields.map(f => f.fieldlist());
    result += fieldEntries.join(' \\\n');

    return result + '\n';
  }

  /**
   * Generate struct definition
   * @returns Generator yielding struct definition
   */
  *generateStruct(): Generator<string> {
    const cTypeName = this.getCTypeName();

    console.log(`DEBUG: generateStruct() for ${cTypeName}`);
    console.log(`DEBUG: Oneof groups:`, Object.keys(this.getOneofGroups()));

    // Generate comment if present
    const comment = this.formatComments();
    if (comment) {
      yield comment + '\n';
    }

    yield `typedef struct _${cTypeName} {\n`;

    // NOTE: Both nested enums and nested messages are now generated globally
    // in the header file to avoid duplication. They are not generated inside the struct.

    // Generate oneof unions and which_ variables first
    const oneofGroups = this.getOneofGroups();
    console.log(`DEBUG: Oneof groups found:`, Object.keys(oneofGroups));

    for (const [oneofName, oneofFields] of Object.entries(oneofGroups)) {
      console.log(`DEBUG: Generating union for ${oneofName} with ${oneofFields.length} fields`);
      if (oneofFields.length > 0) {
        yield* this.generateOneofUnion(oneofName, oneofFields);
      }
    }

    // Generate regular fields (excluding oneof fields)
    for (const field of this.fields) {
      console.log(`DEBUG: Processing field ${field.fieldName}, isOneof: ${field.isOneof()}`);
      if (!field.isOneof()) {
        yield '    ';
        yield* field.generateHeader();
      }
    }

    yield `} ${cTypeName}_t;\n`;
  }

  /**
   * Get oneof field groups
   * @returns Object mapping oneof names to arrays of fields
   */
  getOneofGroups(): Record<string, any[]> {
    const groups: Record<string, any[]> = {};

    for (const field of this.fields) {
      if (field.isOneof() && field.getOneofName()) {
        const oneofName = field.getOneofName()!;
        if (!groups[oneofName]) {
          groups[oneofName] = [];
        }
        groups[oneofName].push(field);
      }
    }

    return groups;
  }

  /**
   * Generate oneof union structure
   * @param oneofName - Name of the oneof group
   * @param oneofFields - Array of fields in this oneof
   * @returns Generator yielding union definition
   */
  *generateOneofUnion(oneofName: string, oneofFields: any[]): Generator<string> {
    // Clean up oneof name (remove leading underscore)
    const cleanOneofName = oneofName.replace(/^_/, '');
    const whichVarName = `which_${cleanOneofName}`;

    // Generate which_ variable
    yield `    pb_size_t ${whichVarName};\n`;

    // Generate union definition
    yield `    union _${this.getCTypeName()}_${cleanOneofName} {\n`;

    for (const field of oneofFields) {
      const cType = field.getCTypeName();
      const cName = field.getCName();
      yield `        ${cType} ${cName};\n`;
    }

    yield `    } ${cleanOneofName};\n`;
  }

  /**
   * Generate header file code for this message
   * @returns Generator yielding header file content
   */
  *generateHeader(): Generator<string> {
    const cTypeName = this.getCTypeName();
    const macroName = this.getMacroName();

    // Generate struct definition
    yield* this.generateStruct();

    // Generate FIELDLIST macro
    yield this.fieldsDeclaration();

    // Generate field descriptor declaration
    yield `extern const pb_msgdesc_t ${macroName}_msg;\n`;

    // Generate size constant if requested
    if (!this.hasOption('noDescriptor')) {
      yield `#define ${macroName}_size ${this.calculateEncodedSize()}\n`;
    }
  }

  /**
   * Generate source file code for this message
   * @returns Generator yielding source file content
   */
  *generateSource(): Generator<string> {
    const cTypeName = this.getCTypeName();
    const macroName = this.getMacroName();

    // Generate include for corresponding header
    yield `#include "${cTypeName}.pb.h"\n`;

    // Generate field descriptor definition
    const width = this.requiredDescriptorWidth();
    const widthString = width === 1 ? 'AUTO' : width.toString();

    yield `/* Default values for fields */\n`;
    yield `PB_BIND(${macroName}, ${cTypeName}_t, ${widthString})\n`;

    // Generate enum functions
    for (const enumType of this.enums) {
      yield* enumType.generateSource();
      yield '\n';
    }
  }

  /**
   * Clone this message
   * @returns Cloned message
   */
  clone(): Message {
    const cloned = new Message(
      this.messageName,
      this.fields.map(f => f.clone()),
      this.enums.map(e => e.clone()),
      this.nestedMessages.map(m => m.clone()),
      [...this.oneofs],
      [...this.oneofDecls], // Clone oneof declarations
      { ...this.options },
      this.namingStyle,
      this.sourceLocation,
      [...this.path]
    );
    return cloned;
  }

  /**
   * Validate message configuration
   * @throws Error if configuration is invalid
   */
  validate(): void {
    super.validate();

    // Validate all fields
    for (const field of this.fields) {
      field.validate();
    }

    // Validate all enums
    for (const enumType of this.enums) {
      enumType.validate();
    }

    // Check for duplicate field numbers
    const fieldNumbers = new Set<number>();
    for (const field of this.fields) {
      if (fieldNumbers.has(field.fieldNumber)) {
        throw new Error(`Duplicate field number: ${field.fieldNumber} in message ${this.messageName}`);
      }
      fieldNumbers.add(field.fieldNumber);
    }

    // Check for duplicate field names
    const fieldNames = new Set<string>();
    for (const field of this.fields) {
      if (fieldNames.has(field.fieldName)) {
        throw new Error(`Duplicate field name: ${field.fieldName} in message ${this.messageName}`);
      }
      fieldNames.add(field.fieldName);
    }
  }
}
