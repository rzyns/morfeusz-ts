# Technical Notes and Known Limitations

## Memory Management

### Constructor Storage
The C++ implementation uses raw pointers for storing N-API class constructors in global storage:

```cpp
static std::map<std::string, Napi::FunctionReference*> constructors;
```

**Current Behavior:**
- Constructors are allocated once and persist for the lifetime of the module
- Memory is not explicitly freed when the module unloads
- In practice, this is minimal (only 2 allocations) and cleaned up when the process exits

**Potential Improvements:**
- Use `std::unique_ptr<Napi::FunctionReference>` for automatic cleanup
- Implement a NODE_API_MODULE finalizer to clean up on module unload
- Consider using N-API's environment instance data with proper cleanup callbacks

**Impact:**
- Low: Only affects long-running processes that repeatedly load/unload the module
- Typical Node.js applications load modules once at startup

### Morfeusz Instance Management
Morfeusz instances are properly managed through the wrapper destructor:

```cpp
MorfeuszInstanceWrapper::~MorfeuszInstanceWrapper() {
    if (morfeusz) {
        delete morfeusz;
        morfeusz = nullptr;
    }
}
```

This follows RAII principles correctly and instances are cleaned up when JavaScript objects are garbage collected.

## Thread Safety

As documented, Morfeusz instances are **NOT thread-safe**. This limitation comes from the underlying libmorfeusz2 library, not the bindings.

**Best Practice:**
```typescript
// Good: Separate instance per worker thread
import { Worker } from 'worker_threads';

// In main thread
const worker = new Worker('./worker.js');

// In worker.js
const morfeusz = MorfeuszFactory.createInstance();
// Use morfeusz only in this thread
```

## Exception Handling

The bindings properly convert C++ exceptions to JavaScript errors:

```cpp
try {
    morfeusz->analyse(text, results);
} catch (const MorfeuszException& e) {
    Napi::Error::New(env, e.what()).ThrowAsJavaScriptException();
    return env.Null();
}
```

C++ exceptions are enabled (`cflags!: ["-fno-exceptions"]`) to support the Morfeusz2 library's error handling.

## Performance Considerations

### String Conversions
The bindings perform UTF-8 string conversions between JavaScript and C++:

```cpp
std::string text = info[0].As<Napi::String>().Utf8Value();
```

For very large texts, consider:
- Processing in chunks
- Using the iterator-based API (when available)
- Caching IdResolver for repeated lookups

### IdResolver Caching
The IdResolver is created once per Morfeusz instance and cached:

```typescript
// Good: Cache resolver
const resolver = morfeusz.getIdResolver();
for (const id of ids) {
    const tag = resolver.getTag(id);
}

// Avoid: Getting resolver repeatedly
// for (const id of ids) {
//     const tag = morfeusz.getIdResolver().getTag(id);
// }
```

## Stub vs Production

The included stub implementation:
- ✅ Provides correct API signatures
- ✅ Allows development without libmorfeusz2
- ❌ Does not perform actual linguistic analysis
- ❌ Returns simplistic/dummy data

**Always use the real libmorfeusz2 for production.**

## Platform Compatibility

### Tested Platforms
- ✅ Linux (Ubuntu 22.04+)
- ⚠️ macOS (requires libmorfeusz2 from source)
- ⚠️ Windows (limited libmorfeusz2 support)

### Build Requirements
- Node.js 18+
- C++11 compiler
- Python 3.x (for node-gyp)
- libmorfeusz2-dev (production only)

## Future Improvements

### Potential Enhancements
1. **Smart Pointer Migration**: Replace raw pointers with `std::unique_ptr`
2. **Async API**: Add Promise-based async methods for large text processing
3. **Stream API**: Support Node.js streams for processing large files
4. **Iterator Support**: Expose ResultsIterator for memory-efficient analysis
5. **Module Finalizer**: Add proper cleanup on module unload
6. **Worker Thread Support**: Provide worker-thread-safe wrappers

### Contributions Welcome
See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on implementing these improvements.

## Debugging

### Enable Debug Builds
```bash
# Debug build with symbols
npm run build:native -- --debug

# Use with node --inspect
node --inspect test/test.js
```

### Common Issues

**Build fails with "morfeusz2.h not found":**
- Ensure libmorfeusz2-dev is installed, OR
- Use the included stub header (default configuration)

**Runtime errors about undefined symbols:**
- Verify binding.gyp includes `-lmorfeusz2` for production
- Check library path: `export LD_LIBRARY_PATH=/usr/local/lib:$LD_LIBRARY_PATH`

**Memory leaks in long-running processes:**
- Ensure Morfeusz instances are properly garbage collected
- Consider using WeakMap for caching
- Monitor with `node --expose-gc` and heap snapshots

## License

See [LICENSE](LICENSE) for details. The bindings use the same BSD-2-Clause license as Morfeusz2.
