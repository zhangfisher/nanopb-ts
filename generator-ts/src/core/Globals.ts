/**
 * Global state and configuration for nanopb generator
 * Ported from nanopb_generator.py Globals class
 */

import { NanoPBOptions, GeneratorOptions, NamingStyle as INamingStyle } from '../types/nanopb-types.js';
import { NamingStyle, createNamingStyle } from '../naming/NamingStyle.js';
import { ProtoElement } from './ProtoElement.js';

/** Global generator state and configuration */
export class Globals {
  /** Singleton instance */
  private static instance: Globals;

  /** Generator options */
  public options: GeneratorOptions;

  /** Global nanopb options */
  public nanopbOptions: NanoPBOptions;

  /** Current naming style */
  public namingStyle: NamingStyle;

  /** Separate options from .options files [(namemask, options), ...] */
  public separateOptions: Array<[string, NanoPBOptions]> = [];

  /** Package name for current file */
  public packageName: string = '';

  /** Current filename being processed */
  public currentFilename: string = '';

  /** Generated files list for dependency tracking */
  public generatedFiles: Set<string> = new Set();

  /** Error callback flag */
  public errorCallback: boolean = false;

  /** Verbose output flag */
  public verbose: boolean = false;

  /** Proto3 syntax flag */
  public proto3: boolean = false;

  /** All proto elements for symbol table */
  public allElements: Map<string, ProtoElement> = new Map();

  /** Include paths for proto imports */
  public includePaths: string[] = [];

  /** Exclude paths for proto imports */
  public excludePaths: string[] = [];

  private constructor() {
    this.options = {
      inputFile: '',
      extension: '.pb',
      headerExtension: '.h',
      sourceExtension: '.c',
      cStyle: true,
      verbose: false,
    };

    this.nanopbOptions = {};
    this.namingStyle = createNamingStyle(true, false, '');
  }

  /**
   * Get the singleton instance
   * @returns Globals instance
   */
  static getInstance(): Globals {
    if (!Globals.instance) {
      Globals.instance = new Globals();
    }
    return Globals.instance;
  }

  /**
   * Reset the singleton instance (for testing)
   */
  static reset(): void {
    Globals.instance = new Globals();
  }

  /**
   * Set generator options
   * @param options - New generator options
   */
  setOptions(options: Partial<GeneratorOptions>): void {
    this.options = { ...this.options, ...options };

    // Update naming style if cStyle changed
    if (options.cStyle !== undefined) {
      this.namingStyle = createNamingStyle(
        this.options.cStyle,
        this.options.customStyle !== undefined,
        this.packageName,
        this.options.customStyle
      );
    }

    // Update verbosity
    if (options.verbose !== undefined) {
      this.verbose = options.verbose;
    }
  }

  /**
   * Set global nanopb options
   * @param options - New nanopb options
   */
  setNanoPBOptions(options: NanoPBOptions): void {
    this.nanopbOptions = { ...this.nanopbOptions, ...options };
  }

  /**
   * Get combined nanopb options with separate options applied
   * @param elementName - Name of element to get options for
   * @returns Combined options
   */
  getOptionsForElement(elementName: string): NanoPBOptions {
    let merged = { ...this.nanopbOptions };

    // Apply matching separate options
    for (const [namemask, options] of this.separateOptions) {
      if (this.matchNamemask(namemask, elementName)) {
        merged = { ...merged, ...options };
      }
    }

    return merged;
  }

  /**
   * Match a namemask pattern against an element name
   * @param namemask - Pattern to match (supports fnmatch-style patterns)
   * @param elementName - Element name to check
   * @returns True if pattern matches
   */
  private matchNamemask(namemask: string, elementName: string): boolean {
    // Convert fnmatch-style pattern to regex
    const regexPattern = namemask
      .replace(/\./g, '\\.') // Escape dots
      .replace(/\*/g, '.*')  // * becomes .*
      .replace(/\?/g, '.')   // ? becomes .
      .replace(/\[/g, '\\[') // Escape brackets
      .replace(/\]/g, '\\]');

    const regex = new RegExp(`^${regexPattern}$`);
    return regex.test(elementName);
  }

  /**
   * Set current package name
   * @param packageName - Package name
   */
  setPackageName(packageName: string): void {
    this.packageName = packageName;

    // Update naming style with new package prefix
    this.namingStyle = createNamingStyle(
      this.options.cStyle,
      this.options.customStyle !== undefined,
      packageName,
      this.options.customStyle
    );
  }

  /**
   * Set current filename being processed
   * @param filename - Current filename
   */
  setCurrentFilename(filename: string): void {
    this.currentFilename = filename;
  }

  /**
   * Add a generated file to the tracking set
   * @param filename - Generated filename
   */
  addGeneratedFile(filename: string): void {
    this.generatedFiles.add(filename);
  }

  /**
   * Check if a file has been generated
   * @param filename - Filename to check
   * @returns True if file was generated
   */
  isFileGenerated(filename: string): boolean {
    return this.generatedFiles.has(filename);
  }

  /**
   * Add a separate option from .options file
   * @param namemask - Name pattern mask
   * @param options - Options to apply to matching names
   */
  addSeparateOption(namemask: string, options: NanoPBOptions): void {
    this.separateOptions.push([namemask, options]);
  }

  /**
   * Clear all separate options
   */
  clearSeparateOptions(): void {
    this.separateOptions = [];
  }

  /**
   * Register a proto element in the symbol table
   * @param fullName - Fully qualified name
   * @param element - Proto element to register
   */
  registerElement(fullName: string, element: ProtoElement): void {
    this.allElements.set(fullName, element);
  }

  /**
   * Get a proto element from the symbol table
   * @param fullName - Fully qualified name
   * @returns Proto element or undefined
   */
  getElement(fullName: string): ProtoElement | undefined {
    return this.allElements.get(fullName);
  }

  /**
   * Check if an element exists in the symbol table
   * @param fullName - Fully qualified name
   * @returns True if element exists
   */
  hasElement(fullName: string): boolean {
    return this.allElements.has(fullName);
  }

  /**
   * Get all registered element names
   * @returns Array of element names
   */
  getAllElementNames(): string[] {
    return Array.from(this.allElements.keys());
  }

  /**
   * Clear the symbol table
   */
  clearElements(): void {
    this.allElements.clear();
  }

  /**
   * Set include paths for proto imports
   * @param paths - Array of include paths
   */
  setIncludePaths(paths: string[]): void {
    this.includePaths = [...paths];
  }

  /**
   * Add an include path
   * @param path - Include path to add
   */
  addIncludePath(path: string): void {
    if (!this.includePaths.includes(path)) {
      this.includePaths.push(path);
    }
  }

  /**
   * Set exclude paths for proto imports
   * @param paths - Array of exclude paths
   */
  setExcludePaths(paths: string[]): void {
    this.excludePaths = [...paths];
  }

  /**
   * Add an exclude path
   * @param path - Exclude path to add
   */
  addExcludePath(path: string): void {
    if (!this.excludePaths.includes(path)) {
      this.excludePaths.push(path);
    }
  }

  /**
   * Check if a path should be excluded
   * @param path - Path to check
   * @returns True if path should be excluded
   */
  isPathExcluded(path: string): boolean {
    return this.excludePaths.some(excludePath => path.startsWith(excludePath));
  }

  /**
   * Reset all state (for new generation run)
   */
  reset(): void {
    this.separateOptions = [];
    this.packageName = '';
    this.currentFilename = '';
    this.generatedFiles.clear();
    this.allElements.clear();
    this.includePaths = [];
    this.excludePaths = [];
    this.nanopbOptions = {};
    this.proto3 = false;
  }

  /**
   * Print verbose debug information
   * @param message - Message to print
   * @param args - Additional arguments for formatting
   */
  verboseLog(message: string, ...args: unknown[]): void {
    if (this.verbose) {
      console.log(`[nanopb-ts] ${message}`, ...args);
    }
  }

  /**
   * Get current generator state summary
   * @returns State summary object
   */
  getStateSummary(): object {
    return {
      options: this.options,
      nanopbOptions: this.nanopbOptions,
      packageName: this.packageName,
      currentFilename: this.currentFilename,
      generatedFilesCount: this.generatedFiles.size,
      registeredElementsCount: this.allElements.size,
      separateOptionsCount: this.separateOptions.length,
      proto3: this.proto3,
    };
  }
}
