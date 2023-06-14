# llvm-builder-helper

This help build c code using obfuscate, build and install llvm using this command

```
cmake -S llvm -B build -G Ninja -DLLVM_ENABLE_PROJECTS="clang" -DLLVM_TARGETS_TO_BUILD="X86" -DCMAKE_BUILD_TYPE="Debug" -DBUILD_SHARED_LIBS=ON -DLLVM_USE_LINKER=gold -DLLVM_OPTIMIZED_TABLEGEN=ON -DCMAKE_C_COMPILER="/usr/bin/clang" -DCMAKE_CXX_COMPILER="/usr/bin/clang++" -DLLVM_INSTALL_UTILS=ON -DCMAKE_INSTALL_PREFIX=<llvm>

ninja -C build install
```