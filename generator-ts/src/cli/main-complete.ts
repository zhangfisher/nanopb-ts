#!/usr/bin/env bun
/**
 * Main CLI entry point for nanopb TypeScript generator
 * Updated to use the complete generator pipeline
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { createWorkingNanopbGenerator } from '../core/NanopbGeneratorWorking.js';
import { Globals } from '../core/Globals.js';
import { existsSync } from 'fs';

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
  .option('-I, --options-path <path...>', 'Search path for options files', [])
  .option('-x, --exclude <path...>', 'Exclude paths')
  .option('-C, --c-style', 'Use C naming conventions', true)
  .option('--custom-style <style>', 'Custom naming style transformation')
  .option('--no-descriptor', 'Skip descriptor generation')
  .option('--verbose', 'Verbose output')
  .action(async (inputs, options) => {
    if (inputs.length === 0) {
      console.log(chalk.yellow('No input files specified. Use --help for usage information.'));
      process.exit(0);
    }

    try {
      // Setup generator options
      const generatorOptions = {
        inputFile: inputs[0],
        outputDir: options.outputDir,
        extension: options.extension,
        headerExtension: options.headerExtension,
        sourceExtension: options.sourceExtension,
        optionsFile: options.optionsFile,
        optionsPaths: Array.isArray(options.optionsPath) ? options.optionsPath : [],
        excludePaths: Array.isArray(options.exclude) ? options.exclude : [],
        cStyle: options.cStyle,
        customStyle: options.customStyle,
        noDescriptor: options.noDescriptor,
        verbose: options.verbose,
      };

      // Create generator
      const generator = createWorkingNanopbGenerator();

      console.log(chalk.green('🚀 Nanopb TypeScript Generator v1.0.0-dev'));
      console.log(chalk.gray('=' .repeat(50)));

      console.log(chalk.blue('Input files:'), inputs);
      console.log(chalk.blue('Output directory:'), options.outputDir || 'current directory');

      if (options.verbose) {
        console.log(chalk.gray('\nGenerator options:'));
        console.log(chalk.gray(JSON.stringify(generatorOptions, null, 2)));
      }

      // Generate each proto file
      console.log(chalk.gray('\n' + '=' .repeat(50)));
      console.log(chalk.blue('Starting code generation...\n'));

      for (const protoFile of inputs) {
        if (!existsSync(protoFile)) {
          console.log(chalk.red(`❌ Error: File not found: ${protoFile}`));
          continue;
        }

        console.log(chalk.cyan(`📝 Processing: ${protoFile}`));

        const result = await generator.generate(protoFile, generatorOptions);

        if (result.success) {
          console.log(chalk.green(`✅ Generated:`));
          console.log(`   📄 ${result.headerFile}`);
          console.log(`   📄 ${result.sourceFile}`);
          console.log(chalk.gray(`   📊 Messages: ${result.messagesCount}, Enums: ${result.enumsCount}`));
        } else {
          console.log(chalk.red(`❌ Failed: ${protoFile}`));
          console.log(chalk.red(`   Error: ${result.error}`));
        }
      }

      console.log(chalk.gray('\n' + '=' .repeat(50)));
      console.log(chalk.green('✨ Generation complete!'));

    } catch (error) {
      console.error(chalk.red('❌ Fatal error:'), error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

// Parse command line arguments
await program.parseAsync(process.argv);