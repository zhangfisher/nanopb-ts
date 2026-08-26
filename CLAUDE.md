# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Nanopb is a small code-size Protocol Buffers implementation in ANSI C, designed for memory-constrained systems like microcontrollers. It consists of:

1. **Core library** (pb_common.c, pb_encode.c, pb_decode.c, pb.h) - Runtime encoding/decoding
2. **Generator** (generator/nanopb_generator.py) - Converts .proto files to C code (.pb.c/.pb.h)
3. **Test suite** (tests/) - Comprehensive testing using SCons

## Build and Development Commands

### Testing
```bash
# Run all tests (requires SCons)
cd tests
scons

# Use specific compiler (e.g., clang)
scons CC=clang CXX=clang++

# Run tests for embedded platforms
scons PLATFORM=STM32  # STM32 discovery board
scons PLATFORM=AVR    # simavr AVR simulator
```

### Protocol Buffer Code Generation
```bash
# Generate .pb.c and .pb.h from .proto files
python generator/nanopb_generator.py myprotocol.proto

# Or using protoc with nanopb plugin
generator-bin/protoc --nanopb_out=. myprotocol.proto

# For binary packages, use pre-built generator
generator-bin/nanopb_generator myprotocol.proto
```

### Dependencies
```bash
# Install required Python packages
pip install --upgrade protobuf grpcio-tools

# SCons for testing
pip install scons
# or
sudo apt install scons
```

## Architecture

### Core Library Structure
- **pb_common.c/h** - Common utilities, stream initialization
- **pb_encode.c/h** - Protocol Buffers encoding (writes to pb_ostream)
- **pb_decode.c/h** - Protocol Buffers decoding (reads from pb_istream)
- **pb.h** - Main public header with field definitions and macros

The core library is designed to be portable ANSI C with minimal dependencies. It uses callback-based streams (pb_ostream/pb_istream) to avoid buffering entire messages in memory.

### Generator Architecture
The generator (generator/nanopb_generator.py) is a Python tool that:

1. Parses .proto files using Google Protocol Buffers Python library
2. Generates C struct definitions matching message schema
3. Creates encoding/decoding tables with field descriptors
4. Supports nanopb-specific options via .options files

Key generator files:
- `nanopb_generator.py` - Main generator entry point
- `proto/nanopb_pb2.py` - Nanopb-specific Protocol Buffer definitions
- `proto/_utils.py` - Protoc invocation utilities

### Field Descriptor System
The generator creates static field descriptor arrays that define message structure for runtime:
- Data type mappings (datatypes dictionary in generator)
- Field encoding/decoding callbacks
- Message nesting and callback handling
- Size calculations for encoded format

### Build System Support
Nanopb supports multiple build systems with integration rules:
- **Makefiles**: `extra/nanopb.mk` (see examples/simple)
- **CMake**: `extra/FindNanopb.cmake` (see examples/cmake*)
- **Bazel**: BUILD.bazel files
- **Conan**: conanfile.py
- **Meson**: meson.build
- **PlatformIO/Zephyr**: Platform-specific integrations

## Development Workflow

When modifying nanopb core:
1. Make changes to pb_common.c, pb_encode.c, or pb_decode.c
2. Run `cd tests && scons` to verify changes
3. Test with multiple compilers: `scons CC=clang CXX=clang++`

When modifying generator:
1. Update generator/nanopb_generator.py or related files
2. Test by regenerating .pb.c files from test .proto files
3. Verify with: `python generator/nanopb_generator.py test_file.proto`

When adding new features:
1. Check if feature requires generator changes or just runtime changes
2. For runtime features: modify pb_encode.c/pb_decode.c and add field types
3. For generator features: update nanopb_pb2.proto and regenerate nanopb_pb2.py

## Platform Testing
The test suite includes support for embedded platforms:
- **STM32**: Real hardware testing `scons PLATFORM=STM32`
- **AVR**: Simulator testing with simavr `scons PLATFORM=AVR`
- Native desktop: Default testing without PLATFORM flag

## Documentation References
- Full documentation: https://jpa.kapsi.fi/nanopb/docs/
- Forum: https://groups.google.com/forum/#!forum/nanopb
- Issue tracker: https://github.com/nanopb/nanopb/issues
