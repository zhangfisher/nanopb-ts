/**
 * Base class for all protobuf elements
 * Ported from nanopb_generator.py ProtoElement class
 */

import { NanoPBOptions, NamingStyle as INamingStyle } from '../types/nanopb-types.js';
import { NamingStyle } from '../naming/NamingStyle.js';
import { SourceCodeLocation } from '../types/protobuf-types.js';

/** Base class for all protobuf elements (messages, enums, fields, etc.) */
export abstract class ProtoElement {
  /** Full path to this element in the protobuf descriptor tree */
  protected path: number[];

  /** Comments associated with this element, indexed by path */
  protected comments: Map<string, string>;

  /** Nanopb options for this element */
  protected options: NanoPBOptions;

  /** Naming style for code generation */
  protected namingStyle: NamingStyle;

  /** Source code location for comment extraction */
  protected sourceLocation?: SourceCodeLocation;

  constructor(
    path: number[],
    options: NanoPBOptions = {},
    namingStyle: NamingStyle,
    sourceLocation?: SourceCodeLocation
  ) {
    this.path = path;
    this.options = { ...options }; // Clone options to avoid mutations
    this.namingStyle = namingStyle;
    this.comments = new Map();
    this.sourceLocation = sourceLocation;

    // Extract comments from source location if available
    this.extractComments();
  }

  /**
   * Extract comments from source code info
   */
  protected extractComments(): void {
    if (!this.sourceLocation) return;

    const { leadingComments, trailingComments } = this.sourceLocation;

    if (leadingComments) {
      this.comments.set('leading', leadingComments.trim());
    }

    if (trailingComments) {
      this.comments.set('trailing', trailingComments.trim());
    }
  }

  /**
   * Get the nanopb options for this element
   * @returns Current options
   */
  getOptions(): NanoPBOptions {
    return { ...this.options };
  }

  /**
   * Set nanopb options for this element
   * @param options - New options to apply
   */
  setOptions(options: NanoPBOptions): void {
    this.options = { ...this.options, ...options };
  }

  /**
   * Merge additional options into existing options
   * @param options - Options to merge
   */
  mergeOptions(options: NanoPBOptions): void {
    this.options = { ...this.options, ...options };
  }

  /**
   * Get the naming style used by this element
   * @returns Current naming style
   */
  getNamingStyle(): NamingStyle {
    return this.namingStyle;
  }

  /**
   * Set the naming style for this element
   * @param namingStyle - New naming style
   */
  setNamingStyle(namingStyle: NamingStyle): void {
    this.namingStyle = namingStyle;
  }

  /**
   * Get a comment for this element
   * @param commentType - Type of comment ('leading', 'trailing', etc.)
   * @returns Comment string or undefined
   */
  getComment(commentType: string): string | undefined {
    return this.comments.get(commentType);
  }

  /**
   * Check if this element has any comments
   * @returns True if element has comments
   */
  hasComments(): boolean {
    return this.comments.size > 0;
  }

  /**
   * Format comments for C code output
   * @returns Formatted comment string
   */
  formatComments(): string {
    const leading = this.comments.get('leading');
    const trailing = this.comments.get('trailing');

    if (leading && trailing) {
      return `/* ${leading} */ ${trailing}`;
    } else if (leading) {
      return `/* ${leading} */`;
    } else if (trailing) {
      return `/* ${trailing} */`;
    }

    return '';
  }

  /**
   * Get the path to this element in the descriptor tree
   * @returns Path array
   */
  getPath(): number[] {
    return [...this.path];
  }

  /**
   * Check if a specific option is enabled
   * @param optionKey - Option key to check
   * @returns True if option is truthy
   */
  hasOption(optionKey: keyof NanoPBOptions): boolean {
    return !!this.options[optionKey];
  }

  /**
   * Get a specific option value with default
   * @param optionKey - Option key to get
   * @param defaultValue - Default value if option not set
   * @returns Option value or default
   */
  getOption<T extends keyof NanoPBOptions>(
    optionKey: T,
    defaultValue?: NanoPBOptions[T]
  ): NanoPBOptions[T] | undefined {
    const value = this.options[optionKey];
    return value !== undefined ? value : defaultValue;
  }

  /**
   * Abstract method to generate header file code
   * Each subclass must implement this
   * @returns Generator yielding header file content
   */
  abstract *generateHeader(): Generator<string>;

  /**
   * Abstract method to generate source file code
   * Each subclass must implement this
   * @returns Generator yielding source file content
   */
  abstract *generateSource(): Generator<string>;

  /**
   * Get the name of this element as a valid C identifier
   * @returns C identifier
   */
  abstract getCName(): string;

  /**
   * Get the name of this element as a C type name
   * @returns C type name
   */
  abstract getCTypeName(): string;

  /**
   * Get the name of this element as a C macro name
   * @returns C macro name
   */
  abstract getMacroName(): string;

  /**
   * Calculate the encoded size for this element
   * @returns Maximum encoded size in bytes
   */
  abstract calculateEncodedSize(): number;

  /**
   * Validate this element's configuration
   * @throws Error if configuration is invalid
   */
  validate(): void {
    // Default implementation - subclasses can override
    if (this.path.length === 0) {
      throw new Error('ProtoElement must have a valid path');
    }
  }

  /**
   * Create a deep copy of this element
   * @returns Cloned element
   */
  abstract clone(): ProtoElement;
}
