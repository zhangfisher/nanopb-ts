/**
 * Field class for handling protobuf message fields
 * Ported from nanopb_generator.py Field class
 */

import { ProtoElement } from './ProtoElement.js';
import { NanoPBOptions, FieldType, NamingStyle as INamingStyle } from '../types/nanopb-types.js';
import { NamingStyle } from '../naming/NamingStyle.js';
import { FieldDescriptorProto, SourceCodeLocation } from '../types/protobuf-types.js';
import { ProtoFieldType, FieldRule } from '../types/protobuf-types.js';
import { getCTypeInfo, getFieldAllocation, supportsIntSizeOverride } from '../utils/DataTypes.js';
import { getEncodedSize, getStringEncodedSize, getMessageEncodedSize } from '../utils/VarintUtils.js';

/** Field class for protobuf message fields */
export class Field extends ProtoElement {
  private fieldName: string;
  private fieldNumber: number;
  private protoType: ProtoFieldType;
  private fieldRule: FieldRule;
  private fieldDescriptor: FieldDescriptorProto;

  // Computed properties
  private allocationType: FieldType;
  private dataTypeInfo: any;
  private arraySize?: number;
  private maxSize?: number;

  // Oneof specific properties
  private oneofName?: string;
  private oneofIndex?: number;
  private parentMessageName?: string; // For nested message type resolution

  constructor(
    fieldName: string,
    fieldNumber: number,
    protoType: ProtoFieldType,
    fieldRule: FieldRule,
    options: NanoPBOptions,
    namingStyle: NamingStyle,
    sourceLocation?: SourceCodeLocation,
    path: number[] = [2, 0] // Default path for fields
  ) {
    super(path, options, namingStyle, sourceLocation);
    this.fieldName = fieldName;
    this.fieldNumber = fieldNumber;
    this.protoType = protoType;
    this.fieldRule = fieldRule;

    // Create field descriptor for compatibility
    this.fieldDescriptor = {
      name: fieldName,
      number: fieldNumber,
      label: fieldRule,
      type: protoType,
      options: {},
    };

    // Compute allocation type and data type info
    this.computeFieldProperties();
  }

  /**
   * Create Field from FieldDescriptorProto
   * @param fieldDesc - Field descriptor proto
   * @param options - Nanopb options
   * @param namingStyle - Naming style
   * @param sourceLocation - Source code location
   * @returns Field instance
   */
  static fromDescriptor(
    fieldDesc: FieldDescriptorProto,
    options: NanoPBOptions,
    namingStyle: NamingStyle,
    sourceLocation?: SourceCodeLocation
  ): Field {
    const field = new Field(
      fieldDesc.name,
      fieldDesc.number,
      fieldDesc.type as ProtoFieldType,
      fieldDesc.label as FieldRule,
      options,
      namingStyle,
      sourceLocation,
      [2, fieldDesc.number] // Path with field number
    );

    // Preserve the full field descriptor including typeName and comments
    field.fieldDescriptor = {
      ...fieldDesc,
      options: fieldDesc.options || {}
    };

    // Add comments if available from the descriptor
    if (fieldDesc.comments) {
      field.comments.set('leading', fieldDesc.comments);
    }

    return field;
  }

  /**
   * Compute field properties based on type and options
   */
  private computeFieldProperties(): void {
    // Get integer size override if specified
    const intSize = this.getOption('intSize');

    // Get C type information
    this.dataTypeInfo = getCTypeInfo(this.protoType, intSize);

    if (!this.dataTypeInfo) {
      throw new Error(`Unsupported field type: ${this.protoType}`);
    }

    // Determine allocation type based on options
    const explicitType = this.getOption('type');
    if (explicitType !== undefined && explicitType !== FieldType.FT_DEFAULT) {
      this.allocationType = explicitType;
    } else {
      // Auto-determine allocation type (when FT_DEFAULT or not specified)
      this.allocationType = this.determineDefaultAllocation();
    }

    // Set array size for repeated fields
    if (this.fieldRule === FieldRule.REPEATED) {
      const maxCount = this.getOption('maxCount');
      const fixedCount = this.getOption('fixedCount');
      if (fixedCount && maxCount) {
        this.arraySize = maxCount;
      }
    }

    // Set max size for strings/bytes
    if (this.protoType === ProtoFieldType.TYPE_STRING || this.protoType === ProtoFieldType.TYPE_BYTES) {
      const maxSize = this.getOption('maxSize');
      if (maxSize !== undefined) {
        this.maxSize = maxSize;
      }
    }
  }

  /**
   * Determine default allocation type based on field characteristics
   * @returns Default field allocation type
   */
  private determineDefaultAllocation(): FieldType {
    // For strings and bytes, default to CALLBACK allocation (matches Python version)
    // CALLBACK supports dynamic memory allocation and is more flexible
    if (this.protoType === ProtoFieldType.TYPE_STRING || this.protoType === ProtoFieldType.TYPE_BYTES) {
      if (this.fieldRule === FieldRule.REPEATED) {
        return FieldType.FT_CALLBACK; // Repeated strings use callbacks
      }
      return this.getOption('fallbackType') || FieldType.FT_CALLBACK;
    }

    // For messages, default to static or pointer based on size
    if (this.protoType === ProtoFieldType.TYPE_MESSAGE) {
      const maxSize = this.getOption('maxSize');
      if (maxSize && maxSize > 64) {
        return FieldType.FT_POINTER; // Large messages use pointers
      }
      return this.getOption('fallbackType') || FieldType.FT_STATIC;
    }

    // For repeated fields without fixed count
    if (this.fieldRule === FieldRule.REPEATED && !this.getOption('fixedCount')) {
      return FieldType.FT_POINTER;
    }

    // Default to static for simple types
    return FieldType.FT_STATIC;
  }

  /**
   * Get field name as C identifier
   * @returns C identifier
   */
  getCName(): string {
    return this.namingStyle.fieldName(this.fieldName);
  }

  /**
   * Get field name as C type name (for message fields)
   * @returns C type name
   */
  getCTypeName(): string {
    if (this.protoType === ProtoFieldType.TYPE_MESSAGE && this.fieldDescriptor.typeName) {
      // Extract the message type name and convert to C style
      // For nested messages, protobufjs gives us just the message name without parent prefix
      // We need to construct the qualified name by prepending parent message name
      const simpleTypeName = this.fieldDescriptor.typeName.split('.').pop() || '';

      // Check if this field belongs to a parent message (for nested message types)
      if (this.parentMessageName && !simpleTypeName.includes('_')) {
        // This is likely a nested message type, construct qualified name
        const qualifiedName = `${this.parentMessageName}_${simpleTypeName}`;
        return this.namingStyle.typeName(qualifiedName);
      }

      return this.namingStyle.typeName(simpleTypeName);
    }

    if (this.dataTypeInfo) {
      return this.dataTypeInfo.cType;
    }

    return 'void'; // Fallback
  }

  /**
   * Get field name as C macro name
   * @returns C macro name
   */
  getMacroName(): string {
    return this.namingStyle.defineName(this.fieldName);
  }

  /**
   * Get the protobuf type
   * @returns Protobuf field type
   */
  getProtoType(): ProtoFieldType {
    return this.protoType;
  }

  /**
   * Get the field rule (label)
   * @returns Field rule
   */
  getFieldRule(): FieldRule {
    return this.fieldRule;
  }

  /**
   * Get field number (tag)
   * @returns Field number
   */
  getFieldNumber(): number {
    return this.fieldNumber;
  }

  /**
   * Get allocation type
   * @returns Field allocation type
   */
  getAllocationType(): FieldType {
    return this.allocationType;
  }

  /**
   * Get field rule as string
   * @returns Field rule string
   */
  getRuleString(): string {
    // Oneof fields should always return ONEOF
    if (this.isOneof()) {
      return 'ONEOF';
    }

    switch (this.fieldRule) {
      case FieldRule.REQUIRED:
        return 'REQUIRED';
      case FieldRule.REPEATED:
        return 'REPEATED';
      case FieldRule.FIXARRAY:
        return 'FIXARRAY';
      case FieldRule.OPTIONAL:
        // For proto3, OPTIONAL fields (which are actually proto3 singular fields)
        // should be treated as SINGULAR in nanopb field descriptors
        // This matches Python nanopb generator behavior where proto3 fields don't have has_ flags
        if (!this.hasHasFlag()) {
          return 'SINGULAR';
        }
        return 'OPTIONAL';
      default:
        return 'SINGULAR';
    }
  }

  /**
   * Get allocation type as string
   * @returns Allocation type string
   */
  getAllocationString(): string {
    switch (this.allocationType) {
      case FieldType.FT_STATIC:
        return 'STATIC';
      case FieldType.FT_POINTER:
        return 'POINTER';
      case FieldType.FT_CALLBACK:
        return 'CALLBACK';
      case FieldType.FT_IGNORE:
        return 'IGNORE';
      case FieldType.FT_INLINE:
        return 'INLINE';
      default:
        return 'STATIC';
    }
  }

  /**
   * Get PB type string for field descriptor
   * @returns PB type string
   */
  getPBTypeString(): string {
    if (this.dataTypeInfo) {
      return this.dataTypeInfo.pbType;
    }
    return 'UNKNOWN';
  }

  /**
   * Check if field is a scalar type
   * @returns True if scalar type
   */
  isScalar(): boolean {
    return (
      this.protoType !== ProtoFieldType.TYPE_MESSAGE &&
      this.protoType !== ProtoFieldType.TYPE_STRING &&
      this.protoType !== ProtoFieldType.TYPE_BYTES &&
      this.protoType !== ProtoFieldType.TYPE_ENUM
    );
  }

  /**
   * Check if field is repeated
   * @returns True if repeated
   */
  isRepeated(): boolean {
    return this.fieldRule === FieldRule.REPEATED || this.fieldRule === FieldRule.FIXARRAY;
  }

  /**
   * Check if field has a "has" flag (proto2 optional)
   * @returns True if has has flag
   */
  hasHasFlag(): boolean {
    // Only proto2 OPTIONAL fields get has_ flags
    // proto3 SINGULAR fields do NOT get has_ flags (they're always present)
    // Check if this is a true proto2 optional field (has explicit rule)
    if (this.fieldRule !== FieldRule.OPTIONAL) {
      return false;
    }

    // For OPTIONAL fields, only add has_ flag if specifically configured
    // In proto3, most OPTIONAL fields are actually SINGULAR and don't need has_ flags
    return this.getOption('hasFlag') === true;
  }

  /**
   * Check if field should be ignored
   * @returns True if field should be ignored
   */
  isIgnored(): boolean {
    return this.allocationType === FieldType.FT_IGNORE;
  }

  /**
   * Check if field is part of a oneof
   * @returns True if field is oneof member
   */
  isOneof(): boolean {
    return this.oneofName !== undefined && this.oneofName !== null;
  }

  /**
   * Get the oneof name this field belongs to
   * @returns Oneof name or undefined
   */
  getOneofName(): string | undefined {
    return this.oneofName;
  }

  /**
   * Set the oneof information for this field
   * @param oneofName - Name of the oneof group
   * @param oneofIndex - Index of the oneof in the message
   */
  setOneof(oneofName: string, oneofIndex: number): void {
    this.oneofName = oneofName;
    this.oneofIndex = oneofIndex;
    this.fieldRule = FieldRule.ONEOF;
    this.fieldDescriptor.oneofIndex = oneofIndex;
  }

  /**
   * Set parent message name for nested message type resolution
   * @param parentName - Name of the parent message
   */
  setParentMessageName(parentName: string): void {
    this.parentMessageName = parentName;
  }

  /**
   * Get the union path for oneof fields
   * @returns Union path string like "(params,button_press,params.button_press)"
   */
  getOneofUnionPath(): string {
    if (!this.isOneof() || !this.oneofName) {
      return this.getCName();
    }

    // Format: (union_name,field_name,union.field_name)
    // Example: (params,button_press,params.button_press)
    const unionName = this.oneofName.replace(/^_/, ''); // Remove leading underscore
    const fieldName = this.getCName();
    const qualifiedField = `${unionName}.${fieldName}`;

    return `(${unionName},${fieldName},${qualifiedField})`;
  }

  /**
   * Calculate maximum encoded size for this field
   * @returns Maximum encoded size in bytes
   */
  calculateEncodedSize(): number {
    if (this.isIgnored()) {
      return 0;
    }

    if (this.protoType === ProtoFieldType.TYPE_STRING || this.protoType === ProtoFieldType.TYPE_BYTES) {
      const maxSize = this.maxSize || this.getOption('maxSize') || 0;
      return getStringEncodedSize(maxSize);
    }

    if (this.protoType === ProtoFieldType.TYPE_MESSAGE) {
      const maxSize = this.getOption('maxSize') || 0;
      return getMessageEncodedSize(maxSize);
    }

    if (this.isRepeated()) {
      const maxCount = this.arraySize || this.getOption('maxCount') || 0;
      return getEncodedSize(this.protoType) * maxCount;
    }

    return getEncodedSize(this.protoType);
  }

  /**
   * Generate FIELDLIST macro entry for field descriptor table
   * @returns FIELDLIST macro entry string
   */
  fieldlist(): string {
    // Format matches Python version exactly:
    // Regular field: X(a, ALLOCATION, RULE, PBTYPE, field_name, tag)
    // Oneof field: X(a, ALLOCATION, RULE, PBTYPE, (union_name,field_name,union.field_name), tag)
    const macroX = 'X';
    const macroA = 'a';

    if (this.isOneof()) {
      // Oneof fields use special format with union path
      const unionPath = this.getOneofUnionPath();
      return `${macroX}(${macroA}, ${this.getAllocationString().padEnd(9)} ${this.getRuleString().padEnd(9)} ${this.getPBTypeString().padEnd(9)} ${unionPath.padEnd(36)}   ${this.fieldNumber})`;
    }

    return `${macroX}(${macroA}, ${this.getAllocationString().padEnd(9)} ${this.getRuleString().padEnd(9)} ${this.getPBTypeString().padEnd(9)} ${this.getCName().padEnd(16)} ${this.fieldNumber})`;
  }

  /**
   * Generate header file code for this field
   * @returns Generator yielding header file content
   */
  *generateHeader(): Generator<string> {
    if (this.isIgnored()) {
      return; // Don't generate anything for ignored fields
    }

    const cType = this.getCTypeName();
    const cName = this.getCName();

    // Generate comment if present
    const comment = this.formatComments();
    if (comment) {
      yield comment + ' ';
    }

    // Generate field declaration
    if (this.isRepeated() && this.arraySize) {
      // Fixed-size array
      yield `${cType} ${cName}[${this.arraySize}];\n`;
    } else if (this.allocationType === FieldType.FT_POINTER) {
      // Pointer field
      yield `${cType} *${cName};\n`;
    } else if (this.allocationType === FieldType.FT_CALLBACK) {
      // Callback field - use pb_callback_t for dynamic memory allocation
      // This matches Python version behavior for strings and bytes
      yield `pb_callback_t ${cName};\n`;
    } else {
      // Static field
      yield `${cType} ${cName};\n`;
    }

    // Generate has flag if needed
    if (this.hasHasFlag()) {
      yield `bool has_${cName};\n`;
    }
  }

  /**
   * Generate source file code for this field
   * @returns Generator yielding source file content
   */
  *generateSource(): Generator<string> {
    // Fields typically don't have source file content
    // The field descriptor is generated at the message level
    return;
  }

  /**
   * Clone this field
   * @returns Cloned field
   */
  clone(): Field {
    const cloned = new Field(
      this.fieldName,
      this.fieldNumber,
      this.protoType,
      this.fieldRule,
      { ...this.options },
      this.namingStyle,
      this.sourceLocation,
      [...this.path]
    );
    cloned.arraySize = this.arraySize;
    cloned.maxSize = this.maxSize;
    return cloned;
  }

  /**
   * Validate field configuration
   * @throws Error if configuration is invalid
   */
  validate(): void {
    super.validate();

    // Validate field number
    if (this.fieldNumber <= 0) {
      throw new Error(`Invalid field number: ${this.fieldNumber} for field ${this.fieldName}`);
    }

    // Validate proto type
    if (this.protoType < 1 || this.protoType > 18) {
      throw new Error(`Invalid proto type: ${this.protoType} for field ${this.fieldName}`);
    }

    // Validate repeated fields
    if (this.isRepeated() && !this.arraySize && !this.getOption('maxCount')) {
      // Repeated fields should have max count for size calculation
      console.warn(`Warning: Repeated field ${this.fieldName} lacks max count`);
    }
  }
}
