/**
 * Proto file parser using protobufjs
 * Integrates protobufjs for .proto file parsing and descriptor extraction
 */

import protobuf from 'protobufjs';
import { FileDescriptorProto, FileDescriptorSet, FieldDescriptorProto } from '../types/protobuf-types.js';
import { Globals } from '../core/Globals.js';
import { readFileSync, existsSync } from 'fs';
import { resolve, isAbsolute, join } from 'path';

/** Proto file parser using protobufjs library */
export class ProtoParser {
  private globals: Globals;
  private protobuf: typeof protobuf;

  constructor() {
    this.globals = Globals.getInstance();
    this.protobuf = protobuf;
  }

  /**
   * Parse a single proto file
   * @param protoFile - Path to .proto file
   * @param includePaths - Additional include paths for imports
   * @returns FileDescriptorProto
   */
  async parseFile(protoFile: string, includePaths: string[] = []): Promise<FileDescriptorProto> {
    try {
      // Setup include paths
      const paths = [
        ...this.globals.includePaths,
        ...includePaths,
        process.cwd(),
      ];

      // Resolve proto file path
      const protoPath = this.resolveProtoFile(protoFile, paths);

      this.globals.verboseLog(`Parsing proto file: ${protoPath}`);

      // Read proto file content
      const fs = require('fs');
      const protoContent = fs.readFileSync(protoPath, 'utf-8');

      // Parse proto content using protobuf.parse
      const parsed = this.protobuf.parse(protoContent);

      // Extract the actual root from the parsed result
      const root = parsed.root || parsed;

      // Convert to FileDescriptorProto
      const descriptor = this.rootToDescriptor(root, protoFile);

      this.globals.setCurrentFilename(protoFile);

      return descriptor;
    } catch (error) {
      throw new Error(`Failed to parse proto file ${protoFile}: ${error}`);
    }
  }

  /**
   * Parse multiple proto files
   * @param protoFiles - Array of proto file paths
   * @param includePaths - Additional include paths
   * @returns Array of FileDescriptorProto
   */
  async parseFiles(
    protoFiles: string[],
    includePaths: string[] = []
  ): Promise<FileDescriptorProto[]> {
    const descriptors: FileDescriptorProto[] = [];

    for (const protoFile of protoFiles) {
      const descriptor = await this.parseFile(protoFile, includePaths);
      descriptors.push(descriptor);
    }

    return descriptors;
  }

  /**
   * Load a proto file and return FileDescriptorSet
   * @param protoFile - Path to .proto file
   * @param includePaths - Additional include paths
   * @returns FileDescriptorSet
   */
  async loadFileDescriptorSet(
    protoFile: string,
    includePaths: string[] = []
  ): Promise<FileDescriptorSet> {
    const descriptor = await this.parseFile(protoFile, includePaths);

    // Load all dependencies to create complete descriptor set
    const allDescriptors: FileDescriptorProto[] = [descriptor];

    for (const dependency of descriptor.dependency) {
      try {
        const depDescriptor = await this.parseFile(dependency, includePaths);
        allDescriptors.push(depDescriptor);
      } catch (error) {
        this.globals.verboseLog(`Warning: Could not load dependency ${dependency}: ${error}`);
      }
    }

    return {
      file: allDescriptors,
    };
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

  /**
   * Convert protobufjs Root to FileDescriptorProto
   * @param root - Protobufjs Root object
   * @param filename - Original filename
   * @returns FileDescriptorProto
   */
  private rootToDescriptor(root: protobuf.Root, filename: string): FileDescriptorProto {
    // Get the package name
    const packageName = root.package || '';

    // Extract nested types
    const nestedTypes: FileDescriptorProto[] = [];
    const messages: FileDescriptorProto[] = [];
    const enums: any[] = [];

    // Process all nested types
    const nestedArray = root.nestedArray || [];
    nestedArray?.forEach((nested: any) => {
      if (nested && nested.constructor && nested.constructor.name === 'Type') {
        messages.push(this.messageToDescriptor(nested));
      } else if (nested && nested.constructor && nested.constructor.name === 'Enum') {
        enums.push(this.enumToDescriptor(nested));
      } else if (nested && nested.constructor && nested.constructor.name === 'Namespace') {
        // Handle nested namespaces
        const nestedDescriptor = this.namespaceToDescriptor(nested);
        if (nestedDescriptor) {
          nestedTypes.push(nestedDescriptor);
        }
      }
    });

    // Get dependencies
    const dependencies: string[] = [];
    root.dependencies?.forEach((dep: string) => {
      if (!dependencies.includes(dep)) {
        dependencies.push(dep);
      }
    });

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
      options: this.getFileOptions(root),
    };
  }

  /**
   * Convert protobufjs Message to DescriptorProto
   * @param message - Protobufjs Message object
   * @returns DescriptorProto
   */
  private messageToDescriptor(message: any): FileDescriptorProto {
    const fields: FieldDescriptorProto[] = [];
    const oneofs: any[] = [];

    // Process fields
    message.fieldsArray?.forEach((field: any) => {
      fields.push(this.fieldToDescriptor(field));
    });

    // Process oneofs
    message.oneofsArray?.forEach((oneof: any) => {
      oneofs.push({
        name: oneof.name,
        options: {},
      });
    });

    // Process nested types
    const nestedTypes: FileDescriptorProto[] = [];
    const nestedEnums: any[] = [];
    message.nestedArray?.forEach((nested: any) => {
      if (nested && nested.constructor?.name === 'Type') {
        nestedTypes.push(this.messageToDescriptor(nested));
      } else if (nested && nested.constructor?.name === 'Enum') {
        nestedEnums.push(this.enumToDescriptor(nested));
      }
    });

    return {
      name: message.name,
      field: fields,
      nestedType: nestedTypes,
      enumType: nestedEnums,
      oneofDecl: oneofs,
      options: this.getMessageOptions(message),
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
      options: this.getFieldOptions(field),
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
    if (field.partOf) {
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
      options: this.getEnumOptions(enumType),
    };
  }

  /**
   * Get protobuf label (field rule) from field
   * @param field - Protobufjs Field
   * @returns Label number
   */
  private getLabel(field: protobuf.Field): number {
    if (field.repeated) return 2; // REPEATED
    if (field.required) return 1; // REQUIRED
    if (field.optional) return 0; // OPTIONAL
    return 0; // Default to OPTIONAL for proto3
  }

  /**
   * Get file options from protobufjs root
   * @param root - Protobufjs Root object
   * @returns File options
   */
  private getFileOptions(root: protobuf.Root): any {
    return {
      // Add default file options
      deprecated: false,
    };
  }

  /**
   * Get message options from protobufjs message
   * @param message - Protobufjs Message object
   * @returns Message options
   */
  private getMessageOptions(message: protobuf.Type): any {
    return {
      deprecated: false,
    };
  }

  /**
   * Get field options from protobufjs field
   * @param field - Protobufjs Field object
   * @returns Field options
   */
  private getFieldOptions(field: protobuf.Field): any {
    return {
      deprecated: false,
      packed: field.packed !== undefined ? field.packed : undefined,
    };
  }

  /**
   * Get enum options from protobufjs enum
   * @param enumType - Protobufjs Enum object
   * @returns Enum options
   */
  private getEnumOptions(enumType: protobuf.Enum): any {
    return {
      deprecated: false,
      allowAlias: enumType.valuesArray?.length !== new Set(enumType.valuesArray?.map((v: any) => v.id)).size,
    };
  }

  /**
   * Convert protobufjs Namespace to descriptor (if it contains types)
   * @param namespace - Protobufjs Namespace object
   * @returns DescriptorProto or undefined
   */
  private namespaceToDescriptor(namespace: protobuf.Namespace): FileDescriptorProto | undefined {
    const messages: FileDescriptorProto[] = [];
    const enums: any[] = [];

    namespace.nestedArray?.forEach((nested: any) => {
      if (nested instanceof protobuf.Type) {
        messages.push(this.messageToDescriptor(nested));
      } else if (nested instanceof protobuf.Enum) {
        enums.push(this.enumToDescriptor(nested));
      }
    });

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
}

/**
 * Create a singleton instance of the proto parser
 * @returns ProtoParser instance
 */
export function createProtoParser(): ProtoParser {
  return new ProtoParser();
}
