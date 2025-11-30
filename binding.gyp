{
  "targets": [
    {
      "target_name": "morfeusz2",
      "sources": [
        "native/morfeusz_wrapper.cpp"
      ],
      "include_dirs": [
        "<!@(node -p \"require('node-addon-api').include\")",
          "<!@(node -p \"(process.env.MORFEUSZ_PREFIX ? process.env.MORFEUSZ_PREFIX + '/include' : 'vendor/morfeusz2/include')\")",
          "/usr/local/include",
          "/usr/include"
      ],
        "libraries": [],
        "link_settings": {
          "libraries": ["-lmorfeusz2"],
          "library_dirs": ["<(module_root_dir)/vendor/morfeusz2/lib"],
          "ldflags": ["-Wl,-rpath,<(module_root_dir)/vendor/morfeusz2/lib"]
        },
      "cflags!": [ "-fno-exceptions" ],
      "cflags_cc!": [ "-fno-exceptions" ],
      "conditions": [
        ["OS=='mac'", {
          "xcode_settings": {
            "GCC_ENABLE_CPP_EXCEPTIONS": "YES",
            "CLANG_CXX_LIBRARY": "libc++",
            "MACOSX_DEPLOYMENT_TARGET": "10.15"
          }
        }],
        ["OS=='win'", {
          "msvs_settings": {
            "VCCLCompilerTool": {
              "ExceptionHandling": 1
            }
          }
        }]
      ]
    }
  ]
}
