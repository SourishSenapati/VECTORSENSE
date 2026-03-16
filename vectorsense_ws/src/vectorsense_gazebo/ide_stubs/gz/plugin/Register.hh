// IDE-only stub: gz/plugin/Register.hh
// On Linux this header contains the real Gazebo plugin registration machinery.
// Here we provide a no-op so clangd can parse GasLeakPlugin.cpp on Windows.
#pragma once

// GZ_ADD_PLUGIN: validate the class type exists, then produce nothing.
// Cannot use ##-pasting because the class name is namespace-qualified (::).
#define GZ_ADD_PLUGIN(_classname, ...)                           \
  namespace gz_plugin_stub {                                     \
    static void _register() { (void)sizeof(_classname); }       \
  }
