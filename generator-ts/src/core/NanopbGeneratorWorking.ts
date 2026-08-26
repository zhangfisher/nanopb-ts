/**
 * Main Nanopb Generator class - Working version
 * Orchestrates the complete proto to C code generation process
 */

import { ProtoParserWorking } from '../proto/ProtoParserWorking.js';
import { HeaderGenerator } from '../codegen/HeaderGenerator.js';
import { SourceGenerator } from '../codegen/SourceGenerator.js';
import { OptionsParser } from '../utils/OptionsParser.js';
import { Globals } from './Globals.js';
import { NamingStyleC, createNamingStyle } from '../naming/NamingStyle.js';
import { Message, Enum } from './index.js';
import { GeneratorOptions, NanoPBOptions } from '../types/nanopb-types.js';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, basename } from 'path';

/** Main nanopb generator class */
export class NanopbGeneratorWorking {
  private globals: Globals;
  private protoParser: ProtoParserWorking;
  private optionsParser: OptionsParser;
  private headerGenerator: HeaderGenerator;
  private sourceGenerator: SourceGenerator;

  constructor() {
    this.globals = Globals.getInstance();
    this.protoParser = new ProtoParserWorking();
    this.optionsParser = new OptionsParser();
    this.headerGenerator = new HeaderGenerator();
    this.sourceGenerator = new SourceGenerator();
  }

  /**
   * Generate C code from proto file
   * @param protoFile - Path to .proto file
   * @param options - Generator options
   * @returns Generation result with file info
   */
  async generate(protoFile: string, options: GeneratorOptions = {}): Promise<GenerationResult> {
    try {
      // Setup global options
      this.setupGeneratorOptions(options);

      this.globals.verboseLog(`Starting generation for: ${protoFile}`);

      // Parse options file if specified
      if (options.optionsFile) {
        await this.loadOptionsFile(options.optionsFile);
      }

      // Parse proto file
      const descriptor = await this.protoParser.parseFile(
        protoFile,
        options.optionsPaths || []
      );

      console.log(`Parsed package: ${descriptor.package}`);
      console.log(`Messages found: ${descriptor.messageType?.length || 0}`);
      console.log(`Enums found: ${descriptor.enumType?.length || 0}`);

      // CRITICAL: Set package name in globals for naming style to use
      this.globals.setPackageName(descriptor.package);

      // Create naming style with proper package prefix
      const namingStyle = createNamingStyle(
        options.cStyle !== false,
        true, // Always use long names with package prefix like Python version
        descriptor.package,
        options.customStyle
      );

      // Extract messages and enums from descriptor
      const messages = this.extractMessages(descriptor, namingStyle);
      const enums = this.extractEnums(descriptor, namingStyle);

      console.log(`Created ${messages.length} Message objects`);
      console.log(`Created ${enums.length} Enum objects`);

      // Generate output file names
      const outputFiles = this.generateOutputFilenames(protoFile, options);

      // Ensure output directory exists
      this.ensureOutputDirectory(options.outputDir);

      // Generate header file
      const headerContent = Array.from(
        this.headerGenerator.generateHeader(messages, enums, outputFiles.baseName)
      ).join('');
      const headerPath = join(options.outputDir || '.', outputFiles.headerName);
      writeFileSync(headerPath, headerContent);

      // Generate source file
      const sourceContent = Array.from(
        this.sourceGenerator.generateSource(messages, enums, outputFiles.baseName)
      ).join('');
      const sourcePath = join(options.outputDir || '.', outputFiles.sourceName);
      writeFileSync(sourcePath, sourceContent);

      this.globals.verboseLog(`Generated files: ${headerPath}, ${sourcePath}`);

      return {
        headerFile: headerPath,
        sourceFile: sourcePath,
        messagesCount: messages.length,
        enumsCount: enums.length,
        success: true,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        headerFile: '',
        sourceFile: '',
      };
    }
  }

  /**
   * Setup generator options in global state
   * @param options - Generator options
   */
  private setupGeneratorOptions(options: GeneratorOptions): void {
    this.globals.setOptions({
      inputFile: options.inputFile,
      outputDir: options.outputDir,
      extension: options.extension || '.pb',
      headerExtension: options.headerExtension || '.h',
      sourceExtension: options.sourceExtension || '.c',
      optionsFile: options.optionsFile,
      optionsPaths: options.optionsPaths || [],
      excludePaths: options.excludePaths || [],
      cStyle: options.cStyle !== false,
      customStyle: options.customStyle,
      verbose: options.verbose || false,
    });
  }

  /**
   * Load and parse options file
   * @param optionsFile - Path to .options file
   */
  private async loadOptionsFile(optionsFile: string): Promise<void> {
    try {
      this.globals.verboseLog(`Loading options file: ${optionsFile}`);

      const options = this.optionsParser.parseOptionsFile(optionsFile);

      // Add options to global state
      for (const [namemask, opts] of options) {
        this.globals.addSeparateOption(namemask, opts);
      }

      this.globals.verboseLog(`Loaded ${options.length} option entries`);
    } catch (error) {
      throw new Error(`Failed to load options file: ${error}`);
    }
  }

  /**
   * Extract messages from descriptor
   * @param descriptor - File descriptor proto
   * @param namingStyle - Naming style to use
   * @returns Array of Message objects
   */
  private extractMessages(descriptor: any, namingStyle: NamingStyleC): Message[] {
    const messages: Message[] = [];
    const processedMessageKeys = new Set<string>(); // Track already processed messages

    const messageTypes = descriptor.messageType || [];
    console.log(`Processing ${messageTypes.length} top-level message types`);

    for (const msgDesc of messageTypes) {
      this.extractMessagesFromMessage(msgDesc, messages, namingStyle, 0, '', processedMessageKeys);
    }

    console.log(`Total messages extracted: ${messages.length}`);
    return messages;
  }

  /**
   * Recursively extract messages from message and its nested messages
   * @param msgDesc - Message descriptor
   * @param messages - Array to accumulate message objects
   * @param namingStyle - Naming style to use
   * @param depth - Recursion depth for logging
   * @param parentPath - Parent message path for qualified message names
   * @param processedMessageKeys - Set of already processed message keys for deduplication
   */
  private extractMessagesFromMessage(msgDesc: any, messages: Message[], namingStyle: NamingStyleC, depth: number, parentPath: string = '', processedMessageKeys: Set<string> = new Set()): void {
    const indent = '  '.repeat(depth);

    // Build qualified message name (like we do for enums)
    const qualifiedMsgName = parentPath ? `${parentPath}_${msgDesc.name}` : msgDesc.name;

    // Check for duplicates
    const messageKey = qualifiedMsgName;
    if (processedMessageKeys.has(messageKey)) {
      console.log(`${indent}⊝ Skipping duplicate message: ${messageKey}`);
      return;
    }
    processedMessageKeys.add(messageKey);

    console.log(`${indent}Creating Message from: ${msgDesc.name}`);
    console.log(`${indent}Qualified name: ${qualifiedMsgName}`);

    // Modify message descriptor to use qualified name
    const qualifiedMsgDesc = {
      ...msgDesc,
      name: qualifiedMsgName
    };

    const messageOptions = this.globals.getOptionsForElement(msgDesc.name);
    const message = Message.fromDescriptor(qualifiedMsgDesc, messageOptions, namingStyle);
    messages.push(message);

    // Recursively process nested messages
    const nestedMessages = msgDesc.nestedType || [];
    if (nestedMessages.length > 0) {
      console.log(`${indent}Processing ${nestedMessages.length} nested messages in ${msgDesc.name}`);
      for (const nestedMsg of nestedMessages) {
        this.extractMessagesFromMessage(nestedMsg, messages, namingStyle, depth + 1, qualifiedMsgName, processedMessageKeys);
      }
    }
  }

  /**
   * Extract enums from descriptor
   * @param descriptor - File descriptor proto
   * @param namingStyle - Naming style to use
   * @returns Array of Enum objects
   */
  private extractEnums(descriptor: any, namingStyle: NamingStyleC): Enum[] {
    const enums: Enum[] = [];
    const processedEnumKeys = new Set<string>(); // Track already processed enums

    const enumTypes = descriptor.enumType || [];
    console.log(`Processing ${enumTypes.length} top-level enum types`);

    for (const enumDesc of enumTypes) {
      const enumKey = enumDesc.name;
      if (processedEnumKeys.has(enumKey)) {
        console.log(`  ⊝ Skipping duplicate enum: ${enumKey}`);
        continue;
      }
      processedEnumKeys.add(enumKey);

      console.log(`  Creating Enum from: ${enumDesc.name}`);
      const enumOptions = this.globals.getOptionsForElement(enumDesc.name);
      const enumType = Enum.fromDescriptor(enumDesc, enumOptions, namingStyle);
      enums.push(enumType);
    }

    // Also extract nested enums from messages (recursively)
    const messageTypes = descriptor.messageType || [];
    console.log(`Processing ${messageTypes.length} message types for nested enums`);

    for (const msgDesc of messageTypes) {
      this.extractEnumsFromMessage(msgDesc, enums, namingStyle, 0, processedEnumKeys, '');
    }

    console.log(`Total enums extracted: ${enums.length}`);
    return enums;
  }

  /**
   * Recursively extract enums from message and its nested messages
   * @param msgDesc - Message descriptor
   * @param enums - Array to accumulate enum objects
   * @param namingStyle - Naming style to use
   * @param depth - Recursion depth for logging
   * @param processedEnumKeys - Set of already processed enum keys for deduplication
   * @param parentPath - Parent message path for qualified enum names
   */
  private extractEnumsFromMessage(msgDesc: any, enums: Enum[], namingStyle: NamingStyleC, depth: number, processedEnumKeys: Set<string>, parentPath: string = ''): void {
    const indent = '  '.repeat(depth);

    // Build current message path with proper PascalCase
    const currentPath = parentPath ? `${parentPath}_${msgDesc.name}` : msgDesc.name;

    // Debug: show what this message contains
    const nestedEnums = msgDesc.enumType || [];
    const nestedMessages = msgDesc.nestedType || [];

    if (depth === 0) {
      console.log(`${indent}Message ${msgDesc.name}: ${nestedEnums.length} nested enums, ${nestedMessages.length} nested messages`);
      if (nestedEnums.length > 0) {
        console.log(`${indent}  Nested enum names: ${nestedEnums.map((e: any) => e.name).join(', ')}`);
      }
      // Debug: show all properties
      const allProps = Object.keys(msgDesc).filter(k => !k.startsWith('_') &&
!['options','parsedOptions'].includes(k));
      console.log(`${indent}  All properties: ${allProps.join(', ')}`);
    }

    // Process direct nested enums with qualified names
    if (nestedEnums.length > 0) {
      console.log(`${indent}Processing ${nestedEnums.length} nested enums from ${msgDesc.name}`);
      for (const enumDesc of nestedEnums) {
        // Create qualified enum name (preserve underscores like Python version)
        const qualifiedEnumName = `${currentPath}_${enumDesc.name}`;
        const enumKey = qualifiedEnumName;

        if (processedEnumKeys.has(enumKey)) {
          console.log(`${indent}  ⊝ Skipping duplicate enum: ${enumKey}`);
          continue;
        }
        processedEnumKeys.add(enumKey);

        console.log(`${indent}  Creating Enum from: ${qualifiedEnumName}`);
        console.log(`${indent}    Original enumDesc.name: "${enumDesc.name}"`);
        console.log(`${indent}    Qualified enum name: "${qualifiedEnumName}"`);

        // Modify enum descriptor to use qualified name
        const qualifiedEnumDesc = {
          ...enumDesc,
          name: qualifiedEnumName
        };

        const enumOptions = this.globals.getOptionsForElement(enumDesc.name);
        const enumType = Enum.fromDescriptor(qualifiedEnumDesc, enumOptions, namingStyle);
        enums.push(enumType);
      }
    }

    // Recursively process nested messages
    if (nestedMessages.length > 0) {
      console.log(`${indent}Processing ${nestedMessages.length} nested messages in ${msgDesc.name}`);
      for (const nestedMsg of nestedMessages) {
        this.extractEnumsFromMessage(nestedMsg, enums, namingStyle, depth + 1, processedEnumKeys, currentPath);
      }
    }
  }

  /**
   * Generate output file names from proto file
   * @param protoFile - Original proto file path
   * @param options - Generator options
   * @returns Generated file names
   */
  private generateOutputFilenames(protoFile: string, options: GeneratorOptions): OutputFiles {
    const baseName = basename(protoFile, '.proto');

    const extension = options.extension || '.pb';
    const headerExtension = options.headerExtension || '.h';
    const sourceExtension = options.sourceExtension || '.c';

    return {
      baseName: baseName + extension,
      headerName: baseName + extension + headerExtension,
      sourceName: baseName + extension + sourceExtension,
    };
  }

  /**
   * Ensure output directory exists
   * @param outputDir - Output directory path
   */
  private ensureOutputDirectory(outputDir?: string): void {
    if (outputDir && !existsSync(outputDir)) {
      mkdirSync(outputDir, { recursive: true });
    }
  }
}

/** Generation result interface */
export interface GenerationResult {
  success: boolean;
  error?: string;
  headerFile?: string;
  sourceFile?: string;
  messagesCount?: number;
  enumsCount?: number;
}

/** Output files interface */
interface OutputFiles {
  baseName: string;
  headerName: string;
  sourceName: string;
}

/**
 * Create working nanopb generator instance
 * @returns NanopbGeneratorWorking instance
 */
export function createWorkingNanopbGenerator(): NanopbGeneratorWorking {
  return new NanopbGeneratorWorking();
}
