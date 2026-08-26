/**
 * Naming style interface and base implementations
 * Ported from nanopb_generator.py NamingStyle classes
 */

import { NamingStyle as INamingStyle } from '../types/nanopb-types.js';
import {
  toValidCIdentifier,
  makeSafeIdentifier,
  camelToSnakeCase,
  snakeToPascalCase,
  toMacroName
} from '../utils/ReservedWords.js';

/** Base naming style class */
export abstract class NamingStyle implements INamingStyle {
  protected useLongNames: boolean;
  protected packagePrefix: string;

  constructor(useLongNames: boolean = false, packagePrefix: string = '') {
    this.useLongNames = useLongNames;
    this.packagePrefix = packagePrefix;
  }

  /**
   * Convert any name to a valid C identifier
   * @param name - Original name
   * @returns Valid C identifier
   */
  abstract makeIdentifier(name: string): string;

  /**
   * Generate type name (struct/enum name)
   * @param name - Original name
   * @returns C type name
   */
  abstract typeName(name: string): string;

  /**
   * Generate macro/define name
   * @param name - Original name
   * @returns Macro name
   */
  abstract defineName(name: string): string;

  /**
   * Generate field name in struct
   * @param name - Original name
   * @returns Field name
   */
  abstract fieldName(name: string): string;

  /**
   * Generate enum type name
   * @param name - Original name
   * @returns Enum type name
   */
  abstract enumName(name: string): string;

  /**
   * Generate enum value name
   * @param enumName - Parent enum name
   * @param valueName - Original value name
   * @returns Enum value name
   */
  abstract enumValueName(enumName: string, valueName: string): string;

  /**
   * Apply package prefix if using long names
   * @param name - Base name
   * @returns Name with optional package prefix
   */
  protected applyPrefix(name: string): string {
    if (this.useLongNames && this.packagePrefix) {
      // Convert package name from dot notation to underscore notation for C
      // e.g., "google.protobuf" -> "google_protobuf"
      const safePackagePrefix = this.packagePrefix.replace(/\./g, '_');
      return `${safePackagePrefix}_${name}`;
    }
    return name;
  }

  /**
   * Get the name without the last component (for message-to-enum relationships)
   * @param name - Full name
   * @returns Name without last component
   */
  protected getBaseName(name: string): string {
    const parts = name.split('.');
    if (parts.length > 1) {
      return parts.slice(0, -1).join('.');
    }
    return name;
  }
}

/** C language naming style (default nanopb style) */
export class NamingStyleC extends NamingStyle {
  constructor(useLongNames: boolean = false, packagePrefix: string = '') {
    super(useLongNames, packagePrefix);
  }

  makeIdentifier(name: string): string {
    return makeSafeIdentifier(toValidCIdentifier(name));
  }

  typeName(name: string): string {
    // Convert to PascalCase, but preserve underscores for compound names
    // e.g., "ExtensionRangeOptions_VerificationState" -> "ExtensionRangeOptions_VerificationState"
    const safeName = this.makeIdentifier(name);

    // Check if this is a compound name (contains underscores)
    if (safeName.includes('_')) {
      // Process each part separately to preserve PascalCase per part
      return this.applyPrefix(
        safeName.split('_')
          .map(part => {
            // If part is all lowercase, convert to PascalCase
            if (part === part.toLowerCase()) {
              return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
            }
            // Otherwise keep original casing (likely already PascalCase)
            // Don't modify already PascalCase parts
            return part;
          })
          .join('_')
      );
    }

    // Simple name, convert to PascalCase
    const pascalName = this.toPascalCase(safeName);
    return this.applyPrefix(pascalName);
  }

  defineName(name: string): string {
    // Convert to UPPER_CASE and apply prefix
    const safeName = this.makeIdentifier(name);
    const macroName = toMacroName(safeName);
    return this.applyPrefix(macroName);
  }

  fieldName(name: string): string {
    // Field names use snake_case to match Python nanopb generator
    // e.g., buttonPress -> button_press, keyId -> key_id
    const safeName = this.makeIdentifier(name);
    return camelToSnakeCase(safeName);
  }

  enumName(name: string): string {
    // Enums are similar to type names
    return this.typeName(name);
  }

  enumValueName(enumName: string, valueName: string): string {
    // Format: ENUMNAME_VALUE_NAME
    const safeEnumName = this.makeIdentifier(enumName);
    const safeValueName = this.makeIdentifier(valueName);
    const macroEnumName = toMacroName(safeEnumName);
    const macroValueName = toMacroName(safeValueName);
    return `${macroEnumName}_${macroValueName}`;
  }

  /**
   * Convert identifier to PascalCase
   * @param identifier - Input identifier
   * @returns PascalCase string
   */
  private toPascalCase(identifier: string): string {
    // If already PascalCase (starts with uppercase, contains only letters and no underscores)
    // just return it as-is
    if (/^[A-Z][a-zA-Z0-9]*$/.test(identifier)) {
      return identifier;
    }

    // Otherwise convert from snake_case or other formats
    return identifier
      .split('_')
      .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join('');
  }
}

/** Original protobuf naming style (preserves original names) */
export class NamingStyleOriginal extends NamingStyle {
  constructor(useLongNames: boolean = false, packagePrefix: string = '') {
    super(useLongNames, packagePrefix);
  }

  makeIdentifier(name: string): string {
    return toValidCIdentifier(name);
  }

  typeName(name: string): string {
    // Preserve original case, just ensure it's valid
    return this.applyPrefix(toValidCIdentifier(name));
  }

  defineName(name: string): string {
    // Convert to uppercase for macros
    const safeName = toValidCIdentifier(name);
    return this.applyPrefix(toMacroName(safeName));
  }

  fieldName(name: string): string {
    // Preserve original field name
    return toValidCIdentifier(name);
  }

  enumName(name: string): string {
    // Preserve original enum name
    return this.typeName(name);
  }

  enumValueName(enumName: string, valueName: string): string {
    // Format: ENUMNAME_VALUENAME (preserving case)
    const safeEnumName = toValidCIdentifier(enumName);
    const safeValueName = toValidCIdentifier(valueName);
    const macroEnumName = toMacroName(safeEnumName);
    return `${macroEnumName}_${safeValueName.toUpperCase()}`;
  }
}

/** Custom naming style (user-provided transformations) */
export class NamingStyleCustom extends NamingStyle {
  private customTransform: (name: string) => string;

  constructor(
    useLongNames: boolean = false,
    packagePrefix: string = '',
    customTransform: (name: string) => string = (name) => name
  ) {
    super(useLongNames, packagePrefix);
    this.customTransform = customTransform;
  }

  makeIdentifier(name: string): string {
    return makeSafeIdentifier(this.customTransform(toValidCIdentifier(name)));
  }

  typeName(name: string): string {
    const transformed = this.customTransform(name);
    return this.applyPrefix(toValidCIdentifier(transformed));
  }

  defineName(name: string): string {
    const transformed = this.customTransform(name);
    return this.applyPrefix(toMacroName(toValidCIdentifier(transformed)));
  }

  fieldName(name: string): string {
    const transformed = this.customTransform(name);
    return toValidCIdentifier(transformed);
  }

  enumName(name: string): string {
    return this.typeName(name);
  }

  enumValueName(enumName: string, valueName: string): string {
    const safeEnumName = this.makeIdentifier(enumName);
    const safeValueName = this.makeIdentifier(valueName);
    const macroEnumName = toMacroName(safeEnumName);
    const macroValueName = toMacroName(safeValueName);
    return `${macroEnumName}_${macroValueName}`;
  }
}

/**
 * Create appropriate naming style based on options
 * @param cStyle - Whether to use C style naming
 * @param useLongNames - Whether to use long names with package prefix
 * @param packagePrefix - Package prefix for long names
 * @param customStyle - Custom style transformation function
 * @returns Appropriate naming style instance
 */
export function createNamingStyle(
  cStyle: boolean = true,
  useLongNames: boolean = false,
  packagePrefix: string = '',
  customStyle?: (name: string) => string
): NamingStyle {
  if (customStyle) {
    return new NamingStyleCustom(useLongNames, packagePrefix, customStyle);
  }

  if (cStyle) {
    return new NamingStyleC(useLongNames, packagePrefix);
  }

  return new NamingStyleOriginal(useLongNames, packagePrefix);
}
