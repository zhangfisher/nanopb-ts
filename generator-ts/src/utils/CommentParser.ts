/**
 * Comment parser for .proto files
 * Extracts comments from proto file content and associates them with elements
 */

import { camelToSnakeCase } from './ReservedWords.js';

export interface CommentInfo {
  leading?: string;   // Comment before the element
  trailing?: string;  // Comment after the element on same line
  line?: number;      // Line number where the element is defined
}

export interface ProtoFileWithComments {
  content: string;
  comments: Map<string, CommentInfo>;
  lineMap: number[];  // Line number to character position mapping
}

/**
 * Parse comments from a .proto file
 * @param protoContent - The content of the .proto file
 * @returns Object with comment map and line mapping
 */
export function parseProtoComments(protoContent: string): ProtoFileWithComments {
  const lines = protoContent.split('\n');
  const comments = new Map<string, CommentInfo>();
  const lineMap: number[] = [];
  let charPos = 0;

  // Build line position map
  for (let i = 0; i < lines.length; i++) {
    lineMap[i] = charPos;
    charPos += lines[i].length + 1; // +1 for newline
  }

  let currentComment: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Skip empty lines
    if (!trimmed) {
      continue;
    }

    // Check for standalone comment lines (before elements)
    const standaloneComment = line.match(/^\/\/\s*(.+)$/);
    if (standaloneComment && !isCodeLine(trimmed)) {
      currentComment.push(standaloneComment[1].trim());
      continue;
    }

    // Check for multi-line comment blocks
    if (trimmed.startsWith('/*')) {
      const endIdx = line.indexOf('*/');
      if (endIdx > 0) {
        // Single-line multi-line comment: /* comment */
        const comment = line.substring(line.indexOf('/*') + 2, endIdx).trim();
        if (comment) {
          currentComment.push(comment);
        }
      } else {
        // Multi-line comment spanning multiple lines
        const restOfFile = lines.slice(i).join('\n');
        const endMatch = restOfFile.indexOf('*/');
        if (endMatch > 0) {
          const commentBlock = restOfFile.substring(
            restOfFile.indexOf('/*') + 2,
            endMatch
          ).trim();
          if (commentBlock) {
            currentComment.push(...commentBlock.split('\n').map(l => l.trim().replace(/^\*\s?/, '')));
          }
          // Skip to end of comment block
          const linesInComment = restOfFile.substring(0, endMatch + 2).split('\n').length;
          i += linesInComment - 1;
          continue;
        }
      }
    }

    // Check for trailing comments on code lines
    const trailingComment = line.match(/^(.+?)\/\/\s*(.+)$/);
    if (trailingComment) {
      const codePart = trailingComment[1].trim();
      const commentText = trailingComment[2].trim();

      // Try to extract element name from the code part
      const elementName = extractElementName(codePart);
      if (elementName) {
        const commentInfo: CommentInfo = {
          trailing: commentText,
          line: i + 1
        };

        // If we have accumulated comments, add them as leading
        if (currentComment.length > 0) {
          commentInfo.leading = currentComment.join('\n');
          currentComment = [];
        }

        // Store with both original name and potential protobufjs camelCase name
        comments.set(elementName, commentInfo);

        // Also try to store with camelCase version for protobufjs compatibility
        const camelCaseName = snakeToCamelCase(elementName);
        if (camelCaseName !== elementName) {
          comments.set(camelCaseName, commentInfo);
        }
      }
      continue;
    }

    // Look for proto elements and associate with accumulated comments
    const elementName = extractElementName(trimmed);
    if (elementName && currentComment.length > 0) {
      const commentInfo = {
        leading: currentComment.join('\n'),
        line: i + 1
      };

      comments.set(elementName, commentInfo);

      // Also try to store with camelCase version for protobufjs compatibility
      const camelCaseName = snakeToCamelCase(elementName);
      if (camelCaseName !== elementName) {
        comments.set(camelCaseName, commentInfo);
      }

      currentComment = [];
    }
  }

  return {
    content: protoContent,
    comments,
    lineMap
  };
}

/**
 * Extract element name from a proto code line
 */
function extractElementName(codeLine: string): string | null {
  // Pattern 1: Field definition - type name = number
  const fieldMatch = codeLine.match(/(\w+)\s+(\w+)\s*=\s*\d+/);
  if (fieldMatch) {
    return fieldMatch[2]; // Return field name
  }

  // Pattern 2: Message/Enum definition
  const messageMatch = codeLine.match(/(message|enum)\s+(\w+)/);
  if (messageMatch) {
    return messageMatch[2]; // Return message/enum name
  }

  // Pattern 3: Oneof definition
  const oneofMatch = codeLine.match(/oneof\s+(\w+)/);
  if (oneofMatch) {
    return oneofMatch[1]; // Return oneof name
  }

  return null;
}

/**
 * Convert field name to snake_case for consistent matching
 * NOTE: We keep the original field name for matching with protobufjs
 */
function toSnakeCase(name: string): string {
  return name; // Keep original name for matching
}

/**
 * Convert snake_case to camelCase for protobufjs compatibility
 */
function snakeToCamelCase(name: string): string {
  if (!name.includes('_')) {
    return name; // Already camelCase or single word
  }

  return name.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

/**
 * Check if a line is a code line (not just comment)
 */
function isCodeLine(line: string): boolean {
  const codeKeywords = [
    'message', 'enum', 'oneof', 'service', 'rpc',
    'syntax', 'package', 'import', 'option',
    'required', 'optional', 'repeated',
    'double', 'float', 'int32', 'int64', 'uint32', 'uint64',
    'sint32', 'sint64', 'fixed32', 'fixed64', 'sfixed32', 'sfixed64',
    'bool', 'string', 'bytes', 'map'
  ];

  return codeKeywords.some(keyword => line.includes(keyword));
}

/**
 * Get comment info for an element
 * @param parsedFile - Parsed proto file with comments
 * @param elementName - Name of the element to find comment for
 * @returns Comment info or undefined
 */
export function getCommentForElement(
  parsedFile: ProtoFileWithComments,
  elementName: string
): CommentInfo | undefined {
  return parsedFile.comments.get(elementName);
}

/**
 * Format comment for C code output
 * @param commentInfo - Comment information
 * @returns Formatted comment string
 */
export function formatCommentForC(commentInfo: CommentInfo): string {
  if (!commentInfo.leading && !commentInfo.trailing) {
    return '';
  }

  const parts: string[] = [];

  if (commentInfo.leading) {
    const lines = commentInfo.leading.split('\n');
    if (lines.length === 1) {
      parts.push(`/* ${lines[0]} */`);
    } else {
      parts.push('/*');
      parts.push(...lines.map(l => ` * ${l}`));
      parts.push(' */');
    }
  }

  if (commentInfo.trailing) {
    parts.push(`/* ${commentInfo.trailing} */`);
  }

  return parts.join(' ');
}