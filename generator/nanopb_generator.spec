# -*- mode: python ; coding: utf-8 -*-


block_cipher = None

a = Analysis(
    ['nanopb_generator.py'],
    pathex=['.'],
    binaries=[],
    datas=[
        ('proto/*.proto', 'proto'),  # 包含 .proto 文件
        ('proto/*.py', 'proto'),     # 包含 proto 模块的 Python 文件
    ],
    hiddenimports=[
        'google.protobuf',
        'google.protobuf.text_format',
        'google.protobuf.descriptor_pb2',
        'google.protobuf.compiler.plugin_pb2',
        'google.protobuf.descriptor',
        'google.protobuf.message_factory',
        'google.protobuf.reflection',
        'grpc_tools.protoc',         # 可选依赖
        'grpc_tools.grpc_version',   # 可选依赖
    ],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
    noarchive=False,
    optimize=0,
)
pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.zipfiles,
    a.datas,
    [],
    name='nanopb_generator',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    console=True,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
)
