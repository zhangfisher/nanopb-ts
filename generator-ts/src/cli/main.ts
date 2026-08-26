#!/usr/bin/env bun
/**
 * Main CLI entry point for nanopb TypeScript generator
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { Globals } from '../core/Globals.js';

const program = new Command();

// Get global instance
const globals = Globals.getInstance();

// Setup CLI
program
  .name('nanopb-generator-ts')
  .description('TypeScript version of nanopb generator - Protocol Buffers to C code generator')
  .version('1.0.0-dev');

program
  .argument('[input...]', 'Input proto files')
  .option('-D, --output-dir <dir>', 'Output directory for generated files')
  .option('-e, --extension <ext>', 'File extension for generated files', '.pb')
  .option('-H, --header-extension <ext>', 'Header file extension', '.h')
  .option('-S, --source-extension <ext>', 'Source file extension', '.c')
  .option('-f, --options-file <file>', 'Options file name')
  .option('-I, --options-path <path>', 'Search path for options files', [])
  .option('-x, --exclude <path...>', 'Exclude paths')
  .option('-C, --c-style', 'Use C naming conventions', true)
  .option('--verbose', 'Verbose output')
  .action((inputs, options) => {
    if (inputs.length === 0) {
      console.log(chalk.yellow('No input files specified. Use --help for usage information.'));
      process.exit(0);
    }

    // Setup global options
    globals.setOptions({
      inputFile: inputs[0],
      outputDir: options.outputDir,
      extension: options.extension,
      headerExtension: options.headerExtension,
      sourceExtension: options.sourceExtension,
      optionsFile: options.optionsFile,
      optionsPaths: Array.isArray(options.optionsPath) ? options.optionsPath : [options.optionsPath],
      excludePaths: options.exclude || [],
      cStyle: options.cStyle,
      verbose: options.verbose,
    });

    console.log(chalk.green('nanopb TypeScript Generator v1.0.0-dev'));
    console.log(chalk.gray('======================================'));

    console.log(chalk.blue('Input files:'), inputs);
    console.log(chalk.blue('Output directory:'), options.outputDir || 'current directory');
    console.log(chalk.blue('File extension:'), options.extension);

    if (options.verbose) {
      console.log(chalk.gray('\nGlobal state:'), globals.getStateSummary());
    }

    console.log(chalk.yellow('\n⚠️  Core generation functionality under development'));
    console.log(chalk.yellow('This is a working framework - implementation in progress.'));

    // TODO: Implement actual proto file processing and code generation
    console.log(chalk.gray('\nNext steps:'));
    console.log(chalk.gray('1. Implement proto file parsing (protobufjs integration)'));
    console.log(chalk.gray('2. Implement core element classes (Enum, Field, Message)'));
    console.log(chalk.gray('3. Implement code generation (header/source)'));
    console.log(chalk.gray('4. Add comprehensive testing'));
  });

// Parse command line arguments
await program.parseAsync(process.argv);
