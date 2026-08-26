/**
 * Main Nanopb Generator class
 * Orchestrates the complete proto to C code generation process
 */

import { ProtoParserFixed } from '../proto/ProtoParserFixed.js';
import { HeaderGenerator } from '../codegen/HeaderGenerator.js';
import { SourceGenerator } from '../codegen/SourceGenerator.js';
import { OptionsParser } from '../utils/OptionsParser.js';
import { Globals } from './Globals.js';
import { NamingStyleC, createNamingStyle } from '../naming/NamingStyle.js';
import { Message, Enum } from './index.js';
import { GeneratorOptions, NanoPBOptions } from '../types/nanopb-types.js';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { dirname, join, resolve, basename } from 'path';

/** Main nanopb generator class */
export class NanopbGenerator {
  private globals: Globals;
  private protoParser: ProtoParserFixed;
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

      // Create naming style
      const namingStyle = createNamingStyle(
        options.cStyle !== false,
        this.globals.packageName,
        options.customStyle
      );

      // Extract messages and enums from descriptor
      const messages = this.extractMessages(descriptor, namingStyle);
      const enums = this.extractEnums(descriptor, namingStyle);

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

    const messageTypes = descriptor.messageType || [];
    for (const msgDesc of messageTypes) {
      const messageOptions = this.globals.getOptionsForElement(msgDesc.name);
      const message = Message.fromDescriptor(msgDesc, messageOptions, namingStyle);
      messages.push(message);
    }

    // Process nested types recursively
    const nestedTypes = descriptor.nestedType || [];
    for (const nestedDesc of nestedTypes) {
      if (nestedDesc.field && nestedDesc.field.length > 0) {
        const nestedOptions = this.globals.getOptionsForElement(nestedDesc.name);
        const nestedMessage = Message.fromDescriptor(nestedDesc, nestedOptions, namingStyle);
        messages.push(nestedMessage);
      }
    }

    return messages;
  }

  /**
   * Extract enums from descriptor
   * @param descriptor - File descriptor proto
   * @param namingStyle - Naming style to use
   * @returns Array of Enum objects
   */
  private extractEnums(descriptor: any, namingStyle: NamingStyleC): Enum[] {
    const enums: Enum[] = [];

    const enumTypes = descriptor.enumType || [];
    for (const enumDesc of enumTypes) {
      const enumOptions = this.globals.getOptionsForElement(enumDesc.name);
      const enumType = Enum.fromDescriptor(enumDesc, enumOptions, namingStyle);
      enums.push(enumType);
    }

    // Also extract nested enums from messages
    const messageTypes = descriptor.messageType || [];
    for (const msgDesc of messageTypes) {
      const nestedEnums = msgDesc.enumType || [];
      for (const enumDesc of nestedEnums) {
        const enumOptions = this.globals.getOptionsForElement(enumDesc.name);
        const enumType = Enum.fromDescriptor(enumDesc, enumOptions, namingStyle);
        enums.push(enumType);
      }
    }

    return enums;
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

  /**
   * Generate multiple proto files
   * @param protoFiles - Array of proto file paths
   * @param options - Generator options
   * @returns Array of generation results
   */
  async generateMultiple(
    protoFiles: string[],
    options: GeneratorOptions = {}
  ): Promise<GenerationResult[]> {
    const results: GenerationResult[] = [];

    for (const protoFile of protoFiles) {
      const result = await this.generate(protoFile, options);
      results.push(result);

      if (!result.success) {
        this.globals.verboseLog(`Failed to generate ${protoFile}: ${result.error}`);
      }
    }

    return results;
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
 * Create nanopb generator instance
 * @returns NanopbGenerator instance
 */
export function createNanopbGenerator(): NanopbGenerator {
  return new NanopbGenerator();
}
