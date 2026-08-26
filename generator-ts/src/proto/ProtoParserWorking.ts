/**
 * Working Proto file parser using protobufjs (Fixed version)
 */

import protobuf from 'protobufjs';
import { FileDescriptorProto, FieldDescriptorProto } from '../types/protobuf-types.js';
import { Globals } from '../core/Globals.js';
import { readFileSync, existsSync } from 'fs';
import { resolve, isAbsolute } from 'path';
import { parseProtoComments, getCommentForElement, formatCommentForC } from '../utils/CommentParser.js';
import { camelToSnakeCase } from '../utils/ReservedWords.js';

/** Working Proto file parser with correct protobufjs API usage */
export class ProtoParserWorking {
  private globals: Globals;

  constructor() {
    this.globals = Globals.getInstance();
  }

  /**
   * Parse a single proto file content (Working version)
   * @param protoContent - Proto file content
   * @param filename - Original filename
   * @returns FileDescriptorProto
   */
  parseContentWorking(protoContent: string, filename: string): FileDescriptorProto {
    // Parse comments from proto content
    const parsedComments = parseProtoComments(protoContent);
    console.log(`Parsed ${parsedComments.comments.size} comments from proto file`);

    // Parse proto content using protobuf.parse
    const parsed = protobuf.parse(protoContent);

    // Extract package name from top level
    const packageName = parsed.package || '';

    this.globals.verboseLog(`Parsing proto with package: ${packageName}`);

    // Get the actual Root object
    const root = parsed.root || parsed;

    // Initialize collections
    const messages: FileDescriptorProto[] = [];
    const enums: any[] = [];
    const nestedTypes: FileDescriptorProto[] = [];

    // Access package-specific types by navigating nested namespace structure
    let packageNested = null;
    let navigationFailed = false;

    if (packageName && root.nested) {
      // Handle multi-level package names like "google.protobuf" by navigating the nested structure
      const packageParts = packageName.split('.');
      let currentNamespace: any = root;

      console.log(`🔍 Navigating package path: ${packageName}, parts: ${packageParts.join(', ')}`);

      for (const part of packageParts) {
        if (currentNamespace.nested && currentNamespace.nested[part]) {
          console.log(`  ✓ Successfully navigated to: ${part}`);
          currentNamespace = currentNamespace.nested[part];
        } else {
          // Package navigation failed
          console.log(`  ❌ Failed to find part: ${part} in ${Object.keys(currentNamespace.nested || {}).join(', ')}`);
          navigationFailed = true;
          break;
        }
      }

      // If we successfully navigated all parts, this is our package namespace
      if (!navigationFailed && currentNamespace !== root) {
        packageNested = currentNamespace;
        console.log(`✅ Successfully navigated to package namespace with ${Object.keys(packageNested.nested || {}).length} nested items`);
      } else {
        console.log(`⚠️ Package navigation failed, falling back to root level processing`);
      }
    }

    if (packageNested) {
      console.log(`📦 Processing package namespace with ${Object.keys(packageNested).length} items`);

      // Iterate through all types in the package
      for (const typeName of Object.keys(packageNested)) {
        const typeDef = packageNested[typeName];

        // Skip internal properties
        if (typeName.startsWith('_') || ['options', 'parsedOptions', 'name', 'parent',
            'resolved', 'comment', 'filename', 'nested', '_nestedArray'].includes(typeName)) {
          continue;
        }

        console.log(`🔄 Processing type: ${typeName}`);

        // Fallback to direct property checks FIRST (more reliable)
        // Check if it's a message type (has fieldsArray)
        if (typeDef.fieldsArray && Array.isArray(typeDef.fieldsArray)) {
          console.log(`  -> ✅ Detected as Message via direct check with ${typeDef.fieldsArray.length} fields`);
          messages.push(this.convertProtobufjsType(typeDef, root, packageName, parsedComments));
          continue;
        }
        // Check if it's an enum (using helper method)
        else if (this.isEnumObject(typeDef)) {
          console.log(`  -> ✅ Detected as Enum via direct check`);
          enums.push(this.convertProtobufjsEnum(typeDef));
          continue;
        }

        // Use lookup methods as fallback for type resolution (not for structure)
        try {
          // Try to lookup as enum first
          const asEnum = root.lookupEnum(`${packageName}.${typeName}`);
          if (asEnum) {
            console.log(`  -> ✅ Detected as Enum via lookupEnum`);
            enums.push(this.convertProtobufjsEnum(asEnum));
            continue;
          }
        } catch (e) {
          // Not an enum, try message
        }

        try {
          // Try to lookup as message
          const asMessage = root.lookupType(`${packageName}.${typeName}`);
          if (asMessage && asMessage.fieldsArray && asMessage.fieldsArray.length > 0) {
            console.log(`  -> ✅ Detected as Message via lookupType with ${asMessage.fieldsArray.length} fields`);
            messages.push(this.convertProtobufjsType(asMessage, root, packageName, parsedComments));
            continue;
          }
        } catch (e) {
          // Not a message either
        }

        // Handle nested namespace
        if (typeDef.nested && typeof typeDef.nested === 'object' && Object.keys(typeDef.nested).length > 0) {
          console.log(`  -> 🔍 Detected as Namespace, processing recursively (${Object.keys(typeDef.nested).length} nested items)`);
          const namespaceResult = this.processNamespace(typeDef, root, packageName, parsedComments);
          if (namespaceResult.messages) {
            messages.push(...namespaceResult.messages);
          }
          if (namespaceResult.enums) {
            enums.push(...namespaceResult.enums);
          }
        }
        // Handle nested namespace
        else if (typeDef.nested && typeof typeDef.nested === 'object' && Object.keys(typeDef.nested).length > 0) {
          console.log(`  -> 🔍 Detected as Namespace, processing recursively (${Object.keys(typeDef.nested).length} nested items)`);
          const namespaceResult = this.processNamespace(typeDef, root, packageName);
          if (namespaceResult.messages) {
            messages.push(...namespaceResult.messages);
          }
          if (namespaceResult.enums) {
            enums.push(...namespaceResult.enums);
          }
        }
      }
    } else {
      // No package, look for types directly in root
      this.globals.verboseLog('No package, looking for types at root level');

      const nestedArray = root.nestedArray || [];
      for (const nested of nestedArray) {
        // Skip internal properties
        if (nested.name?.startsWith('_')) {
          continue;
        }

        // Check if it's a message type
        if (nested.fieldsArray && Array.isArray(nested.fieldsArray)) {
          messages.push(this.convertProtobufjsType(nested, root, '', parsedComments));
        }
        // Check if it's an enum
        else if (this.isEnumObject(nested)) {
          enums.push(this.convertProtobufjsEnum(nested));
        }
        // Handle nested namespace
        else if (nested.nested && typeof nested.nested === 'object') {
          const namespaceResult = this.processNamespace(nested, root, '');
          if (namespaceResult.messages) {
            messages.push(...namespaceResult.messages);
          }
          if (namespaceResult.enums) {
            enums.push(...namespaceResult.enums);
          }
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
   * @param root - Root protobufjs object for type lookup
   * @param packageName - Current package name for qualified names
   * @returns DescriptorProto
   */
  private convertProtobufjsType(type: any, root: any, packageName: string, parsedComments?: any): FileDescriptorProto {
    const fields: FieldDescriptorProto[] = [];
    const nestedTypes: FileDescriptorProto[] = [];
    const nestedEnums: any[] = [];

    console.log(`Converting Type ${type.name} with ${type.fieldsArray?.length || 0} fields`);

    // Convert oneof declarations first (needed for field processing)
    const oneofDecls: any[] = [];
    if (type.oneofsArray && Array.isArray(type.oneofsArray)) {
      for (const oneof of type.oneofsArray) {
        // Skip internal oneofs with underscore prefix if they're not real oneofs
        if (oneof.name && !oneof.name.startsWith('_')) {
          oneofDecls.push({
            name: oneof.name,
            options: oneof.options || {}
          });
        }
        // Handle internal oneofs (like _level, _message, params)
        else if (oneof.name) {
          const cleanName = oneof.name.replace(/^_/, '');
          oneofDecls.push({
            name: cleanName,
            options: oneof.options || {}
          });
        }
      }
    }

    console.log(`Found ${oneofDecls.length} oneof declarations: ${oneofDecls.map(o => o.name).join(', ')}`);

    // Process fields first (needed for debugging)
    if (type.fieldsArray) {
      console.log(`Processing ${type.fieldsArray.length} fields for message ${type.name}`);
      for (const field of type.fieldsArray) {
        fields.push(this.convertProtobufjsField(field, root, packageName, oneofDecls, parsedComments));
      }
    }

    // Process nested types recursively
    if (type.nestedArray) {
      console.log(`Processing ${type.nestedArray.length} nested items in message ${type.name}`);

      for (const nested of type.nestedArray) {
        // Skip internal properties
        if (nested.name?.startsWith('_')) {
          console.log(`  Skipping internal: ${nested.name}`);
          continue;
        }

        console.log(`  Checking nested item: ${nested.name}, type: ${nested.constructor?.name}`);

        // Check if it's a message type
        if (nested.fieldsArray && Array.isArray(nested.fieldsArray)) {
          console.log(`    -> Message with ${nested.fieldsArray.length} fields`);
          nestedTypes.push(this.convertProtobufjsType(nested, root, packageName, parsedComments));
        }
        // Check if it's an enum
        else if (this.isEnumObject(nested)) {
          console.log(`    -> ✅ Enum detected: ${nested.name}`);
          const convertedEnum = this.convertProtobufjsEnum(nested);
          nestedEnums.push(convertedEnum);
          console.log(`    -> ✅ Added enum ${convertedEnum.name} to nestedEnums (total: ${nestedEnums.length})`);
        }
        // Handle nested namespace
        else if (nested.nested && typeof nested.nested === 'object') {
          console.log(`    -> Namespace with ${Object.keys(nested.nested).length} items`);
          const namespaceResult = this.processNamespace(nested, root, packageName, parsedComments);
          if (namespaceResult.messages) {
            nestedTypes.push(...namespaceResult.messages);
          }
          if (namespaceResult.enums) {
            nestedEnums.push(...namespaceResult.enums);
          }
        }
        else {
          console.log(`    -> ❓ Unknown type (not message, not enum): ${nested.name}`);
          console.log(`    -> Object keys: ${Object.keys(nested).filter(k => !k.startsWith('_')).join(', ')}`);
          // Try to determine what this is
          if (nested.values && typeof nested.values === 'object') {
            console.log(`    -> This has 'values' property, might be an enum!`);
          }
        }
      }
    }

    return {
      name: type.name,
      field: fields,
      nestedType: nestedTypes,
      enumType: nestedEnums,
      oneofDecl: oneofDecls,
      options: {},
    };
  }

  /**
   * Convert protobufjs Enum to EnumDescriptorProto
   * @param enumType - Protobufjs Enum object (from lookupEnum or direct access)
   * @returns EnumDescriptorProto
   */
  private convertProtobufjsEnum(enumType: any): any {
    const values = [];

    // Debug: check enum structure
    console.log(`🔍 convertProtobufjsEnum called, name: ${enumType.name}, constructor: ${enumType.constructor?.name}`);
    if (!enumType.name) {
      console.log(`⚠️ Enum missing name property! Keys: ${Object.keys(enumType).filter(k => !k.startsWith('_')).join(', ')}`);
    }

    // Handle both lookupEnum result and direct namespace access
    if (enumType.values && typeof enumType.values === 'object') {
      // From lookupEnum - has values object with both forward and reverse mappings
      for (const key of Object.keys(enumType.values)) {
        // Skip numeric keys (the reverse mappings)
        if (!/^\d+$/.test(key)) {
          values.push({
            name: key,
            number: enumType.values[key],
            options: {},
          });
        }
      }
    } else {
      // Direct namespace access - enum values are properties directly on the object
      for (const key of Object.keys(enumType)) {
        // Skip internal properties
        if (key.startsWith('_') || ['options', 'parsedOptions', 'name', 'parent',
            'resolved', 'comment', 'filename', 'nested', '_nestedArray'].includes(key)) {
          continue;
        }

        // Check if it looks like an enum value
        if (key === key.toUpperCase() && typeof enumType[key] === 'number' && enumType[key] >= 0) {
          values.push({
            name: key,
            number: enumType[key],
            options: {},
          });
        }
      }
    }

    // Sort by number value to ensure consistent ordering
    values.sort((a, b) => a.number - b.number);

    // Determine enum name - use existing name or infer from value names
    let enumName = enumType.name;
    if (!enumName && values.length > 0) {
      // Try to infer enum name from value name patterns
      const firstValueName = values[0].name;

      // Pattern: "EDITION_UNKNOWN" -> "Edition"
      if (firstValueName.startsWith('EDITION_')) {
        enumName = 'Edition';
      }
      // Pattern: "VISIBILITY_UNSET" -> "SymbolVisibility"
      else if (firstValueName.startsWith('VISIBILITY_')) {
        enumName = 'SymbolVisibility';
      }
      // Pattern: "TYPE_DOUBLE" -> "Type"
      else if (firstValueName.includes('_')) {
        const prefix = firstValueName.split('_')[0];
        enumName = prefix.charAt(0).toUpperCase() + prefix.slice(1).toLowerCase();
      }
      // Fallback: just use the prefix
      else {
        enumName = 'Unknown';
      }

      console.log(`📝 Inferred enum name: ${enumName} from value pattern ${firstValueName}`);
    }

    // Fix enum name case: convert from snake_case or camelCase to PascalCase
    if (enumName) {
      enumName = enumName
        .split(/[_\s]/)
        .map(part => {
          // Check if part is all uppercase (like "EDITION") - keep it
          if (part === part.toUpperCase()) {
            return part;
          }
          // Otherwise convert to PascalCase
          return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
        })
        .join('');
    }

    console.log(`Converting Enum ${enumName} with ${values.length} values`);

    // Post-process: ensure enum name uses proper PascalCase
    if (enumName) {
      console.log(`🔍 Original enum name for case fix: "${enumName}"`);

      // Split by underscore and fix each part
      enumName = enumName.split('_')
        .map(part => {
          console.log(`  Processing part: "${part}"`);

          if (part.length > 1) {
            let fixed = part;

            // Handle specific patterns for compound words
            const compoundPatterns = [
              { pattern: /Jsonformat/, replacement: 'JsonFormat' },
              { pattern: /Symbolvisibility/, replacement: 'SymbolVisibility' },
              { pattern: /Enumtype/, replacement: 'EnumType' },
              { pattern: /Fieldpresence/, replacement: 'FieldPresence' },
              { pattern: /Messageencoding/, replacement: 'MessageEncoding' },
              { pattern: /Repeatedfieldencoding/, replacement: 'RepeatedFieldEncoding' },
              { pattern: /Utf8validation/, replacement: 'Utf8Validation' },
              { pattern: /Enforcenamingstyle/, replacement: 'EnforceNamingStyle' },
              { pattern: /Defaultsymbolvisibility/, replacement: 'DefaultSymbolVisibility' },
              { pattern: /Ctype/, replacement: 'CType' },
              { pattern: /Jstype/, replacement: 'JSType' },
              { pattern: /Optionretention/, replacement: 'OptionRetention' },
              { pattern: /Optiontargettype/, replacement: 'OptionTargetType' },
              { pattern: /Optimizemode/, replacement: 'OptimizeMode' },
              { pattern: /Idempotencylevel/, replacement: 'IdempotencyLevel' },
              { pattern: /Verificationstate/, replacement: 'VerificationState' },
            ];

            // Try to match known patterns
            for (const { pattern, replacement } of compoundPatterns) {
              if (pattern.test(fixed)) {
                fixed = replacement;
                break;
              }
            }

            // Generic camelCase to PascalCase conversion
            if (fixed === part) {
              // Insert uppercase before each uppercase letter that follows a lowercase letter
              fixed = part.replace(/([a-z])([A-Z])/g, '$1_$2');

              // If underscores were inserted, convert to PascalCase
              if (fixed.includes('_')) {
                fixed = fixed.split('_')
                  .map(subpart => subpart.charAt(0).toUpperCase() + subpart.slice(1).toLowerCase())
                  .join('');
              }
            }

            console.log(`    Processed "${part}" -> "${fixed}"`);
            return fixed;
          }

          console.log(`    Kept as: "${part}"`);
          return part;
        })
        .join('_');

      console.log(`📝 Fixed enum name case to: ${enumName}`);
    }

    return {
      name: enumName,
      value: values,
      options: {},
    };
  }

  /**
   * Convert protobufjs Field to FieldDescriptorProto
   * @param field - Protobufjs Field object
   * @param root - Root protobufjs object for type lookup
   * @param packageName - Current package name for qualified names
   * @param oneofDecls - Array of oneof declarations for the message
   * @param parsedComments - Parsed comments from proto file
   * @returns FieldDescriptorProto
   */
  private convertProtobufjsField(
    field: any,
    root: any,
    packageName: string,
    oneofDecls: any[] = [],
    parsedComments?: any
  ): FieldDescriptorProto {
    console.log(`🔧 convertProtobufjsField called for ${field.name}, parsedComments: ${!!parsedComments}`);

    // First, try to resolve custom types (enum/message) before checking basic types
    let fieldType = this.getFieldType(field.type);
    let typeName = undefined;

    // Check if it's a custom type (enum/message) regardless of basic type result
    try {
      const qualifiedName = packageName ? `${packageName}.${field.type}` : field.type;

      // Try as enum first
      try {
        const asEnum = root.lookupEnum(qualifiedName);
        if (asEnum) {
          fieldType = 14; // TYPE_ENUM
          typeName = field.type;
          console.log(`Field ${field.name} uses enum type: ${field.type}`);
        }
      } catch (e) {
        // Not an enum, try as message
      }

      // If still not an enum, try as message (or if field.type looks like a message)
      if (fieldType !== 14) {
        try {
          const asMessage = root.lookupType(qualifiedName);
          if (asMessage) {
            fieldType = 11; // TYPE_MESSAGE
            typeName = field.type;
            console.log(`Field ${field.name} uses message type: ${field.type}`);
          }
        } catch (e) {
          // Not a message type, keep original field type
        }
      }
    } catch (e) {
      // Lookup failed, keep the original field type
      console.log(`Failed to resolve type ${field.type} for field ${field.name}`);
    }

    const fieldDescriptor: FieldDescriptorProto = {
      name: field.name,
      number: field.id,
      label: this.getFieldLabel(field),
      type: fieldType,
      options: {},
    };

    // Add comments if available
    if (parsedComments) {
      // Try both camelCase and snake_case names for matching
      const camelCaseName = field.name;
      const snakeCaseName = camelToSnakeCase(field.name);

      let comment = getCommentForElement(parsedComments, camelCaseName);
      if (!comment) {
        comment = getCommentForElement(parsedComments, snakeCaseName);
      }

      if (comment) {
        fieldDescriptor.comments = comment.trailing || comment.leading || '';
        console.log(`✅ Field ${field.name}: Added comment "${fieldDescriptor.comments}"`);
      } else {
        console.log(`❌ Field ${field.name}: No comment found (tried: "${camelCaseName}", "${snakeCaseName}")`);
      }
    }

    // Add type name for message and enum types
    if (typeName) {
      fieldDescriptor.typeName = typeName;
    }

    // Add default value if present
    if (field.defaultValue !== undefined && field.defaultValue !== null) {
      fieldDescriptor.defaultValue = String(field.defaultValue);
    }

    // Add oneof index if field is in a oneof
    if (field.partOf && oneofDecls.length > 0) {
      // Extract the oneof name from the partOf string
      // partOf format: "OneOf .package.Message._oneof_name" or "OneOf .package.Message.oneof_name"
      const fullOneofName = String(field.partOf).split('.').pop();
      // Remove leading underscore if present
      const oneofName = fullOneofName?.replace(/^_/, '');

      if (oneofName) {
        console.log(`Field ${field.name} is part of oneof: ${oneofName}`);

        // Find the oneof index
        const oneofIndex = oneofDecls.findIndex(decl => decl.name === oneofName);

        if (oneofIndex !== -1) {
          fieldDescriptor.oneofName = oneofName;
          fieldDescriptor.oneofIndex = oneofIndex;
          console.log(`  -> Set oneofName: ${oneofName}, oneofIndex: ${oneofIndex}`);
        } else {
          console.log(`  -> Oneof ${oneofName} not found in declarations: ${oneofDecls.map(o => o.name).join(', ')}`);
        }
      }
    }

    return fieldDescriptor;
  }

  /**
   * Get field label from protobufjs field
   * @param field - Protobufjs Field
   * @returns Label number
   */
  private getFieldLabel(field: any): number {
    if (field.rule) {
      const ruleMap: Record<string, number> = {
        'required': 1,
        'optional': 0,
        'repeated': 2,
      };
      return ruleMap[field.rule] || 0;
    }
    return 0; // Default to OPTIONAL
  }

  /**
   * Get field type from protobufjs field type string
   * @param typeString - Type string
   * @returns Field type number
   */
  private getFieldType(typeString: string): number {
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

    return typeMap[typeString] || 0;
  }

  /**
   * Process namespace to extract nested types
   * @param namespace - Protobufjs Namespace object
   * @param root - Root protobufjs object for type lookup
   * @param packageName - Current package name for qualified names
   * @param parsedComments - Parsed comments from proto file
   * @returns Object with messages and enums arrays
   */
  private processNamespace(namespace: any, root: any, packageName: string, parsedComments?: any): { messages: FileDescriptorProto[]; enums: any[] } {
    const messages: FileDescriptorProto[] = [];
    const enums: any[] = [];

    const nestedArray = namespace.nestedArray || [];
    console.log(`🔍 processNamespace: Processing ${nestedArray.length} nested items in namespace ${namespace.name || '(anonymous)'}`);

    for (const nested of nestedArray) {
      // Skip internal properties
      if (nested.name?.startsWith('_')) {
        console.log(`  ⊝ Skipping internal property: ${nested.name}`);
        continue;
      }

      console.log(`  🔍 Checking nested item: ${nested.name}`);

      // Check if it's a message type
      if (nested.fieldsArray && Array.isArray(nested.fieldsArray)) {
        console.log(`    -> Message with ${nested.fieldsArray.length} fields`);
        messages.push(this.convertProtobufjsType(nested, root, packageName, parsedComments));
      }
      // Check if it's an enum
      else if (this.isEnumObject(nested)) {
        console.log(`    -> Enum`);
        enums.push(this.convertProtobufjsEnum(nested));
      }
      // Handle nested namespace recursively
      else if (nested.nested && typeof nested.nested === 'object' && Object.keys(nested.nested).length > 0) {
        console.log(`    -> Recursive namespace with ${Object.keys(nested.nested).length} items`);
        const result = this.processNamespace(nested, root, packageName, parsedComments);
        messages.push(...result.messages);
        enums.push(...result.enums);
      }
    }

    console.log(`🔍 processNamespace: Found ${messages.length} messages, ${enums.length} enums`);
    return { messages, enums };
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

      // Parse content using working method
      return this.parseContentWorking(protoContent, protoFile);
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

  /**
   * Check if an object is an enum (has uppercase properties with numeric values)
   * @param obj - Object to check
   * @returns True if object appears to be an enum
   */
  private isEnumObject(obj: any): boolean {
    if (!obj || typeof obj !== 'object') return false;

    // First check for protobufjs enum signature (has 'values' property)
    if (obj.values && typeof obj.values === 'object') {
      return true;
    }

    let enumValueCount = 0;
    for (const key of Object.keys(obj)) {
      // Skip internal properties
      if (key.startsWith('_') || ['options', 'parsedOptions', 'name', 'parent',
          'resolved', 'comment', 'filename', 'nested', '_nestedArray', 'valuesById', 'comments', 'valuesOptions', 'reserved'].includes(key)) {
        continue;
      }

      // Check if it looks like an enum value (uppercase name, numeric value)
      if (key === key.toUpperCase() && typeof obj[key] === 'number' && obj[key] >= 0) {
        enumValueCount++;
      }
    }

    return enumValueCount > 0;
  }
}

/**
 * Create working parser instance
 * @returns ProtoParserWorking instance
 */
export function createWorkingProtoParser(): ProtoParserWorking {
  return new ProtoParserWorking();
}