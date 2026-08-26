/**
 * C reserved keywords and identifier utilities
 * Ported from nanopb_generator.py reserved words handling
 */

/** List of C reserved keywords */
const C_RESERVED_KEYWORDS = new Set([
  // C99 keywords
  'auto', 'break', 'case', 'char', 'const', 'continue', 'default', 'do',
  'double', 'else', 'enum', 'extern', 'float', 'for', 'goto', 'if',
  'int', 'long', 'register', 'return', 'short', 'signed', 'sizeof',
  'static', 'struct', 'switch', 'typedef', 'union', 'unsigned', 'void',
  'volatile', 'while',

  // C11 keywords
  '_Alignas', '_Alignof', '_Atomic', '_Generic', '_Imaginary',
  '_Noreturn', '_Static_assert', '_Thread_local',

  // Common compiler extensions
  'inline', 'restrict', '_Bool', '_Complex', '_Pragma',

  // Type names that should be avoided
  'size_t', 'ssize_t', 'int8_t', 'int16_t', 'int32_t', 'int64_t',
  'uint8_t', 'uint16_t', 'uint32_t', 'uint64_t', 'intptr_t', 'uintptr_t',
  'ptrdiff_t', 'wchar_t', 'char16_t', 'char32_t',

  // Nanopb specific types that should be avoided
  'pb_istream_t', 'pb_ostream_t', 'pb_msgdesc_t', 'pb_field_t',
  'pb_encoder_t', 'pb_decoder_t',
]);

/** Nanopb-specific reserved prefixes */
const NANOPB_PREFIXES = ['pb_', 'PB_', 'PB_'];

/**
 * Check if a word is a C reserved keyword
 * @param word - Word to check
 * @returns True if word is reserved
 */
export function isReservedKeyword(word: string): boolean {
  return C_RESERVED_KEYWORDS.has(word);
}

/**
 * Check if a word starts with a nanopb reserved prefix
 * @param word - Word to check
 * @returns True if word has nanopb prefix
 */
export function hasNanopbPrefix(word: string): boolean {
  return NANOPB_PREFIXES.some(prefix => word.startsWith(prefix));
}

/**
 * Make a safe C identifier by escaping reserved words
 * @param word - Original word
 * @returns Safe C identifier
 */
export function makeSafeIdentifier(word: string): string {
  if (isReservedKeyword(word) || hasNanopbPrefix(word)) {
    return `_${word}`;
  }
  return word;
}

/**
 * Validate if a string is a valid C identifier
 * @param identifier - Identifier to validate
 * @returns True if valid C identifier
 */
export function isValidCIdentifier(identifier: string): boolean {
  if (!identifier || identifier.length === 0) return false;

  // First character must be letter or underscore
  const firstChar = identifier[0];
  if (!/[a-zA-Z_]/.test(firstChar)) return false;

  // Remaining characters must be alphanumeric or underscore
  for (let i = 1; i < identifier.length; i++) {
    if (!/[a-zA-Z0-9_]/.test(identifier[i])) return false;
  }

  return true;
}

/**
 * Convert a string to a valid C identifier by replacing invalid characters
 * @param input - Input string
 * @param replacement - Replacement character for invalid chars (default '_')
 * @returns Valid C identifier
 */
export function toValidCIdentifier(input: string, replacement: string = '_'): string {
  if (!input || input.length === 0) return '_';

  let result = '';

  for (let i = 0; i < input.length; i++) {
    const char = input[i];

    if (i === 0) {
      // First character: letter or underscore only
      result += /[a-zA-Z_]/.test(char) ? char : replacement;
    } else {
      // Subsequent characters: alphanumeric or underscore
      result += /[a-zA-Z0-9_]/.test(char) ? char : replacement;
    }
  }

  // Ensure the result is not empty
  if (result.length === 0) {
    result = '_';
  }

  // Make safe if reserved keyword
  return makeSafeIdentifier(result);
}

/**
 * Convert camelCase or PascalCase to snake_case
 * @param input - Input string in camelCase or PascalCase
 * @returns snake_case string
 */
export function camelToSnakeCase(input: string): string {
  return input
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .toLowerCase();
}

/**
 * Convert snake_case to camelCase
 * @param input - Input string in snake_case
 * @returns camelCase string
 */
export function snakeToCamelCase(input: string): string {
  return input
    .split('_')
    .map((word, index) => {
      if (index === 0) {
        return word.toLowerCase();
      }
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join('');
}

/**
 * Convert snake_case to PascalCase
 * @param input - Input string in snake_case
 * @returns PascalCase string
 */
export function snakeToPascalCase(input: string): string {
  return input
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('');
}

/**
 * Generate a macro name from an identifier (UPPER_CASE)
 * @param identifier - Input identifier
 * @returns UPPER_CASE macro name
 */
export function toMacroName(identifier: string): string {
  return camelToSnakeCase(identifier).toUpperCase();
}

/**
 * Check if two identifiers are the same when considering C naming rules
 * @param id1 - First identifier
 * @param id2 - Second identifier
 * @returns True if identifiers would conflict in C
 */
export function areIdentifiersConflicting(id1: string, id2: string): boolean {
  return makeSafeIdentifier(id1) === makeSafeIdentifier(id2);
}

/**
 * Generate a unique identifier that doesn't conflict with existing ones
 * @param baseName - Desired base name
 * @param existingNames - Set of existing names to avoid
 * @returns Unique identifier
 */
export function generateUniqueIdentifier(baseName: string, existingNames: Set<string>): string {
  const safeBase = makeSafeIdentifier(baseName);
  let candidate = safeBase;
  let counter = 1;

  while (existingNames.has(candidate)) {
    candidate = `${safeBase}_${counter}`;
    counter++;
  }

  return candidate;
}

/**
 * Get all C reserved keywords as an array
 * @returns Array of C reserved keywords
 */
export function getReservedKeywords(): string[] {
  return Array.from(C_RESERVED_KEYWORDS);
}

/**
 * Get all nanopb reserved prefixes as an array
 * @returns Array of nanopb prefixes
 */
export function getNanopbPrefixes(): string[] {
  return [...NANOPB_PREFIXES];
}
