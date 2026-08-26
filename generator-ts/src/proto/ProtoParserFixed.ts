/**
 * Fixed and improved Proto file parser using protobufjs
 */

import protobuf from 'protobufjs';
import { FileDescriptorProto, FileDescriptorSet, FieldDescriptorProto } from '../types/protobuf-types.js';
import { Globals } from '../core/Globals.js';
import { readFileSync, existsSync } from 'fs';
import { resolve, isAbsolute } from 'path';

/** Improved Proto file parser with better protobufjs integration */
export class ProtoParserFixed {
  private globals: Globals;

  constructor() {
    this.globals = Globals.getInstance();
  }

  /**
   * Parse a single proto file content
   * @param protoContent - Proto file content
   * @param filename - Original filename
   * @returns FileDescriptorProto
   */
  parseContent(protoContent: string, filename: string): FileDescriptorProto {
    // Parse proto content using protobuf.parse
    const parsed = protobuf.parse(protoContent);

    // Extract the actual root from the parsed result
    const root = parsed.root || parsed;

    // Get package name
    const packageName = root.package || '';

    this.globals.verboseLog(`Parsing proto with package: ${packageName}`);

    // Extract messages and enums from root.nested[packageName]
    const messages: FileDescriptorProto[] = [];
    const enums: any[] = [];
    const nestedTypes: FileDescriptorProto[] = [];

    // Access nested types
    const nested = root.nested;
    if (nested && packageName && nested[packageName]) {
      const packageNested = nested[packageName];

      // Process all types in the package
      for (const typeName of Object.keys(packageNested)) {
        const typeDef = packageNested[typeName];

        if (typeDef.constructor?.name === 'Type') {
          messages.push(this.typeToDescriptor(typeDef));
        } else if (typeDef.constructor?.name === 'Enum') {
          enums.push(this.enumToDescriptor(typeDef));
        } else if (typeDef.constructor?.name === 'Namespace') {
          // Handle nested namespace
          const namespaceDescriptor = this.namespaceToDescriptor(typeDef);
          if (namespaceDescriptor) {
            nestedTypes.push(namespaceDescriptor);
          }
        }
      }
    } else {
      // No package, look for types directly in root
      const nestedArray = root.nestedArray || [];
      for (const nested of nestedArray) {
        if (nested.constructor?.name === 'Type') {
          messages.push(this.typeToDescriptor(nested));
        } else if (nested.constructor?.name === 'Enum') {
          enums.push(this.enumToDescriptor(nested));
        }
      }
    }

    // Build dependencies list
    const dependencies: string[] = [];
    // TODO: Extract dependencies from proto imports

    return {
      name: filename,
      package: packageName,
      dependency: dependencies,
      publicDependency: [],
      weakDependency: [],
      messageType: messages,
      enumType: enums,
      extension: [],
      nestedType: nestedTypes,
      options: {},
    };
  }

  /**
   * Convert protobufjs Type to DescriptorProto
   * @param type - Protobufjs Type object
   * @returns DescriptorProto
   */
  private typeToDescriptor(type: any): FileDescriptorProto {
    const fields: FieldDescriptorProto[] = [];
    const nestedTypes: FileDescriptorProto[] = [];
    const nestedEnums: any[] = [];

    // Process fields
    if (type.fieldsArray) {
      for (const field of type.fieldsArray) {
        fields.push(this.fieldToDescriptor(field));
      }
    }

    // Process nested types
    if (type.nestedArray) {
      for (const nested of type.nestedArray) {
        if (nested.constructor?.name === 'Type') {
          nestedTypes.push(this.typeToDescriptor(nested));
        } else if (nested.constructor?.name === 'Enum') {
          nestedEnums.push(this.enumToDescriptor(nested));
        }
      }
    }

    return {
      name: type.name,
      field: fields,
      nestedType: nestedTypes,
      enumType: nestedEnums,
      oneofDecl: [],
      options: {},
    };
  }

  /**
   * Convert protobufjs Enum to EnumDescriptorProto
   * @param enumType - Protobufjs Enum object
   * @returns EnumDescriptorProto
   */
  private enumToDescriptor(enumType: any): any {
    const values = enumType.valuesArray?.map((value: any) => ({
      name: value.name,
      number: value.id,
      options: {},
    })) || [];

    return {
      name: enumType.name,
      value: values,
      options: {},
    };
  }

  /**
   * Convert protobufjs Field to FieldDescriptorProto
   * @param field - Protobufjs Field object
   * @returns FieldDescriptorProto
   */
  private fieldToDescriptor(field: any): FieldDescriptorProto {
    const fieldDescriptor: FieldDescriptorProto = {
      name: field.name,
      number: field.id,
      label: this.getLabel(field),
      type: this.getProtoFieldType(field.type),
      options: {},
    };

    // Add type name for message and enum types
    if (field.type === 'message' || field.type === 'enum') {
      if (field.resolvedType) {
        fieldDescriptor.typeName = field.resolvedType.fullName;
      }
    }

    // Add default value if present
    if (field.defaultValue !== undefined) {
      fieldDescriptor.defaultValue = String(field.defaultValue);
    }

    // Add oneof index if field is in a oneof
    if (field.partOf && field.parent) {
      const oneofIndex = field.parent.oneofsArray?.findIndex(
        (o: any) => o.name === field.partOf
      );
      if (oneofIndex !== undefined && oneofIndex >= 0) {
        fieldDescriptor.oneofIndex = oneofIndex;
      }
    }

    return fieldDescriptor;
  }

  /**
   * Get protobuf label (field rule) from field
   * @param field - Protobufjs Field
   * @returns Label number
   */
  private getLabel(field: any): number {
    if (field.repeated) return 2; // REPEATED
    if (field.required) return 1; // REQUIRED
    if (field.optional) return 0; // OPTIONAL
    return 0; // Default to OPTIONAL for proto3
  }

  /**
   * Get protobuf field type from string
   * @param typeString - Type string from protobufjs
   * @returns ProtoFieldType number
   */
  private getProtoFieldType(typeString: string): number {
    const typeMap: Record<string, number> = {
      'double': 1,
      'float': 2,
      'int64': 3,
      'uint64': 4,
      'int32': 5,
      'fixed64': 6,
      'fixed32': 7,
      'bool': 8,
      'string': 9,
      'message': 11,
      'bytes': 12,
      'uint32': 13,
      'enum': 14,
      'sfixed32': 15,
      'sfixed64': 16,
      'sint32': 17,
      'sint64': 18,
    };

    return typeMap[typeString] || 0; // Default to 0 if unknown
  }

  /**
   * Convert protobufjs Namespace to descriptor (if it contains types)
   * @param namespace - Protobufjs Namespace object
   * @returns DescriptorProto or undefined
   */
  private namespaceToDescriptor(namespace: any): FileDescriptorProto | undefined {
    const messages: FileDescriptorProto[] = [];
    const enums: any[] = [];

    const nestedArray = namespace.nestedArray || [];
    for (const nested of nestedArray) {
      if (nested.constructor?.name === 'Type') {
        messages.push(this.typeToDescriptor(nested));
      } else if (nested.constructor?.name === 'Enum') {
        enums.push(this.enumToDescriptor(nested));
      }
    }

    if (messages.length === 0 && enums.length === 0) {
      return undefined;
    }

    return {
      name: namespace.name,
      field: [],
      messageType: messages,
      enumType: enums,
      options: {},
    };
  }

  /**
   * Parse a proto file
   * @param protoFile - Path to .proto file
   * @param includePaths - Additional include paths
   * @returns FileDescriptorProto
   */
  async parseFile(protoFile: string, includePaths: string[] = []): Promise<FileDescriptorProto> {
    try {
      // Resolve proto file path
      const protoPath = this.resolveProtoFile(protoFile, includePaths);
      this.globals.verboseLog(`Parsing proto file: ${protoPath}`);

      // Read proto file content
      const protoContent = readFileSync(protoPath, 'utf-8');

      // Parse content
      return this.parseContent(protoContent, protoFile);
    } catch (error) {
      throw new Error(`Failed to parse proto file ${protoFile}: ${error}`);
    }
  }

  /**
   * Resolve proto file path using include paths
   * @param protoFile - Proto filename
   * @param includePaths - Array of include paths to search
   * @returns Resolved file path
   */
  private resolveProtoFile(protoFile: string, includePaths: string[]): string {
    // Try as absolute path
    if (isAbsolute(protoFile)) {
      if (existsSync(protoFile)) {
        return protoFile;
      }
    }

    // Try relative to current directory
    const relativePath = resolve(process.cwd(), protoFile);
    if (existsSync(relativePath)) {
      return relativePath;
    }

    // Try in each include path
    for (const includePath of includePaths) {
      const searchPath = resolve(includePath, protoFile);
      if (existsSync(searchPath)) {
        return searchPath;
      }
    }

    // If not found, return original and let protobufjs handle the error
    return protoFile;
  }
}

/**
 * Create improved parser instance
 * @returns ProtoParserFixed instance
 */
export function createImprovedProtoParser(): ProtoParserFixed {
  return new ProtoParserFixed();
}