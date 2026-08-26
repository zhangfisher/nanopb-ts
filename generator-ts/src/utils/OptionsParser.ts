/**
 * .options file parser for nanopb generator
 * Parses nanopb-specific options from .options files
 */

import { NanoPBOptions } from '../types/nanopb-types.js';
import { readFileSync, existsSync } from 'fs';
import { resolve, isAbsolute } from 'path';

/** Parsed options entry with name mask and options */
export type OptionsEntry = [string, NanoPBOptions];

/** Options file parser for .options files */
export class OptionsParser {
  /**
   * Parse a .options file
   * @param filename - Path to .options file
   * @returns Array of [namemask, options] tuples
   */
  parseOptionsFile(filename: string): OptionsEntry[] {
    try {
      const content = readFileSync(filename, 'utf-8');
      return this.parseOptionsContent(content, filename);
    } catch (error) {
      throw new Error(`Failed to read options file ${filename}: ${error}`);
    }
  }

  /**
   * Parse options content from string
   * @param content - File content
   * @param filename - Filename for error messages
   * @returns Array of [namemask, options] tuples
   */
  parseOptionsContent(content: string, filename: string = '<unknown>'): OptionsEntry[] {
    const results: OptionsEntry[] = [];
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNumber = i + 1;

      // Skip empty lines and comments
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('//')) {
        continue;
      }

      try {
        const entry = this.parseOptionsLine(trimmed, filename, lineNumber);
        if (entry) {
          results.push(entry);
        }
      } catch (error) {
        console.warn(`Warning: Failed to parse line ${lineNumber} in ${filename}: ${error}`);
      }
    }

    return results;
  }

  /**
   * Parse a single options line
   * @param line - Line content
   * @param filename - Filename for error messages
   * @param lineNumber - Line number for error messages
   * @returns [namemask, options] tuple or null if line should be skipped
   */
  private parseOptionsLine(
    line: string,
    filename: string,
    lineNumber: number
  ): OptionsEntry | null {
    // Remove comments from the end of the line
    const commentIndex = line.indexOf('#');
    const commentIndex2 = line.indexOf('//');
    const commentPos = Math.min(
      commentIndex >= 0 ? commentIndex : Infinity,
      commentIndex2 >= 0 ? commentIndex2 : Infinity
    );

    let workingLine = commentPos < Infinity ? line.substring(0, commentPos).trim() : line.trim();

    if (!workingLine) {
      return null;
    }

    // Split into namemask and options parts
    const parts = workingLine.split(/\s+/);
    if (parts.length < 2) {
      throw new Error('Invalid line format');
    }

    const namemask = parts[0];
    const optionsText = parts.slice(1).join(' ');

    // Validate namemask
    this.validateNamemask(namemask, filename, lineNumber);

    // Parse options
    const options = this.parseOptionsText(optionsText);

    return [namemask, options];
  }

  /**
   * Validate a namemask pattern
   * @param namemask - Name mask to validate
   * @param filename - Filename for error messages
   * @param lineNumber - Line number for error messages
   */
  private validateNamemask(namemask: string, filename: string, lineNumber: number): void {
    // Check for invalid characters in namemask
    const validPattern = /^[A-Za-z0-9_.*?![\]]+$/;

    if (!validPattern.test(namemask)) {
      throw new Error(`Invalid namemask '${namemask}': contains invalid characters`);
    }

    // Check if namemask ends with .proto (invalid for options files)
    if (namemask.endsWith('.proto')) {
      throw new Error(`Invalid namemask '${namemask}': should not end with .proto`);
    }

    // Check for whitespace in namemask
    if (/\s/.test(namemask)) {
      throw new Error(`Invalid namemask '${namemask}': contains whitespace`);
    }
  }

  /**
   * Parse nanopb options from text format
   * @param optionsText - Options text (format: key:value key:value ...)
   * @returns NanoPBOptions object
   */
  private parseOptionsText(optionsText: string): NanoPBOptions {
    const options: NanoPBOptions = {};

    // Split by whitespace to get individual option specifications
    const optionSpecs = optionsText.split(/\s+/).filter(s => s.length > 0);

    for (const spec of optionSpecs) {
      // Parse key:value format
      const colonIndex = spec.indexOf(':');
      if (colonIndex === -1) {
        console.warn(`Invalid option specification: ${spec} (missing colon)`);
        continue;
      }

      const key = spec.substring(0, colonIndex);
      const value = spec.substring(colonIndex + 1);

      // Parse and set the option
      this.setOption(options, key, value);
    }

    return options;
  }

  /**
   * Set a single option in the options object
   * @param options - Options object to modify
   * @param key - Option key
   * @param value - Option value (as string)
   */
  private setOption(options: NanoPBOptions, key: string, value: string): void {
    // Map option names to their types and set them
    const numberOptions = [
      'maxSize',
      'maxLength',
      'maxCount',
      'type',
      'intSize',
      'enumIntSize',
      'mangleNames',
      'msgid',
      'descriptorSize',
    ];

    const booleanOptions = [
      'longNames',
      'packedStruct',
      'packedEnum',
      'noUnions',
      'skipMessage',
      'fixedLength',
      'fixedCount',
      'defaultOptional',
      'submsgCallback',
      'proto3MultipleFiles',
      'noDescriptor',
      'enumToString',
      'enumOriginalNames',
      'shortEnumNames',
      'enumValueCustom',
    ];

    const stringOptions = ['callbackDatatype', 'callbackFunction', 'customStyle'];

    const arrayOptions = ['include', 'exclude', 'includePath'];

    if (numberOptions.includes(key)) {
      (options as any)[this.camelize(key)] = this.parseNumber(value);
    } else if (booleanOptions.includes(key)) {
      (options as any)[this.camelize(key)] = this.parseBoolean(value);
    } else if (stringOptions.includes(key)) {
      (options as any)[this.camelize(key)] = value;
    } else if (arrayOptions.includes(key)) {
      if (!(options as any)[this.camelize(key)]) {
        (options as any)[this.camelize(key)] = [];
      }
      (options as any)[this.camelize(key)].push(value);
    } else {
      console.warn(`Unknown option: ${key}`);
    }
  }

  /**
   * Parse a number value
   * @param value - String value to parse
   * @returns Parsed number
   */
  private parseNumber(value: string): number {
    const parsed = parseInt(value, 10);
    if (isNaN(parsed)) {
      throw new Error(`Invalid number value: ${value}`);
    }
    return parsed;
  }

  /**
   * Parse a boolean value
   * @param value - String value to parse
   * @returns Parsed boolean
   */
  private parseBoolean(value: string): boolean {
    const lowerValue = value.toLowerCase();
    if (lowerValue === 'true' || lowerValue === '1' || lowerValue === 'yes') {
      return true;
    }
    if (lowerValue === 'false' || lowerValue === '0' || lowerValue === 'no') {
      return false;
    }
    throw new Error(`Invalid boolean value: ${value}`);
  }

  /**
   * Convert snake_case to camelCase
   * @param snakeCase - Snake case string
   * @returns Camel case string
   */
  private camelize(snakeCase: string): string {
    return snakeCase.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
  }

  /**
   * Load and parse an options file from a path
   * @param filePath - Path to .options file
   * @param searchPaths - Additional search paths
   * @returns Array of parsed options
   */
  loadOptionsFile(filePath: string, searchPaths: string[] = []): OptionsEntry[] {
    // Try to find the file
    let resolvedPath: string | null = null;

    // Try as absolute path first
    if (isAbsolute(filePath)) {
      if (existsSync(filePath)) {
        resolvedPath = filePath;
      }
    }

    // Try relative to current directory
    if (!resolvedPath) {
      const relativePath = resolve(process.cwd(), filePath);
      if (existsSync(relativePath)) {
        resolvedPath = relativePath;
      }
    }

    // Try in search paths
    if (!resolvedPath) {
      for (const searchPath of searchPaths) {
        const searchFilePath = resolve(searchPath, filePath);
        if (existsSync(searchFilePath)) {
          resolvedPath = searchFilePath;
          break;
        }
      }
    }

    if (!resolvedPath) {
      throw new Error(`Options file not found: ${filePath}`);
    }

    return this.parseOptionsFile(resolvedPath);
  }
}

/**
 * Create a singleton instance of the options parser
 * @returns OptionsParser instance
 */
export function createOptionsParser(): OptionsParser {
  return new OptionsParser();
}

/**
 * Parse options file content (convenience function)
 * @param content - Options file content
 * @returns Array of parsed options
 */
export function parseOptionsContent(content: string): OptionsEntry[] {
  const parser = new OptionsParser();
  return parser.parseOptionsContent(content);
}
