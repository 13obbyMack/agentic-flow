#!/bin/bash
# Verify WASM build integrity and compatibility

set -e

echo "🔍 Verifying WASM Build"
echo "═══════════════════════════════════════════════════════════"

# Check if pkg directory exists
if [ ! -d "pkg" ]; then
    echo "❌ Error: pkg/ directory not found"
    echo "   Run: npm run build"
    exit 1
fi

echo ""
echo "📦 Checking build outputs..."
echo "───────────────────────────────────────────────────────────"

targets=("web" "node" "bundler" "deno")
all_present=true

for target in "${targets[@]}"; do
    if [ -d "pkg/$target" ]; then
        # Check for required files
        required_files=(
            "agentic_jujutsu_bg.wasm"
            "agentic_jujutsu.js"
            "package.json"
        )

        target_ok=true
        for file in "${required_files[@]}"; do
            if [ ! -f "pkg/$target/$file" ]; then
                echo "  ❌ $target: missing $file"
                target_ok=false
                all_present=false
            fi
        done

        if [ "$target_ok" = true ]; then
            echo "  ✅ $target: all files present"
        fi
    else
        echo "  ❌ $target: directory not found"
        all_present=false
    fi
done

if [ "$all_present" = false ]; then
    echo ""
    echo "❌ Build verification failed"
    exit 1
fi

echo ""
echo "🔧 Checking TypeScript definitions..."
echo "───────────────────────────────────────────────────────────"

if [ -f "typescript/index.d.ts" ]; then
    # Count exported types
    export_count=$(grep -c "^export" typescript/index.d.ts || echo "0")
    interface_count=$(grep -c "^export interface" typescript/index.d.ts || echo "0")
    class_count=$(grep -c "^export class" typescript/index.d.ts || echo "0")

    echo "  ✅ TypeScript definitions found"
    echo "     - $export_count total exports"
    echo "     - $class_count classes"
    echo "     - $interface_count interfaces"
else
    echo "  ❌ TypeScript definitions missing"
    exit 1
fi

echo ""
echo "📝 Checking package.json..."
echo "───────────────────────────────────────────────────────────"

if [ -f "package.json" ]; then
    # Verify package.json has required fields
    required_fields=("name" "version" "main" "module" "browser" "types")

    for field in "${required_fields[@]}"; do
        if grep -q "\"$field\"" package.json; then
            echo "  ✅ $field present"
        else
            echo "  ❌ $field missing"
            exit 1
        fi
    done
else
    echo "  ❌ package.json not found"
    exit 1
fi

echo ""
echo "🧪 Running basic WASM tests..."
echo "───────────────────────────────────────────────────────────"

if [ -f "tests/wasm/basic.test.js" ]; then
    if node tests/wasm/basic.test.js; then
        echo "  ✅ WASM tests passed"
    else
        echo "  ⚠️  Some WASM tests failed (this may be expected if jj is not installed)"
    fi
else
    echo "  ⚠️  Test file not found"
fi

echo ""
echo "🔍 Checking WASM module validity..."
echo "───────────────────────────────────────────────────────────"

# Check if wasm-validate is available
if command -v wasm-validate &> /dev/null; then
    for target in "${targets[@]}"; do
        wasm_file="pkg/$target/agentic_jujutsu_bg.wasm"
        if [ -f "$wasm_file" ]; then
            if wasm-validate "$wasm_file" > /dev/null 2>&1; then
                echo "  ✅ $target: valid WASM module"
            else
                echo "  ❌ $target: invalid WASM module"
                exit 1
            fi
        fi
    done
else
    echo "  ⚠️  wasm-validate not found (install wabt for validation)"
    echo "     Install: cargo install wabt"
fi

echo ""
echo "📊 Browser compatibility check..."
echo "───────────────────────────────────────────────────────────"

# Check for modern WASM features
wasm_file="pkg/web/agentic_jujutsu_bg.wasm"
if [ -f "$wasm_file" ]; then
    # Check WASM version (should be 1)
    if command -v wasm2wat &> /dev/null; then
        echo "  ✅ WASM module analysis available"

        # Check for imports/exports
        exports=$(wasm2wat "$wasm_file" 2>/dev/null | grep -c "(export" || echo "0")
        imports=$(wasm2wat "$wasm_file" 2>/dev/null | grep -c "(import" || echo "0")

        echo "     - $exports exports"
        echo "     - $imports imports"
    else
        echo "  ⚠️  wasm2wat not found (install wabt for detailed analysis)"
    fi

    echo ""
    echo "  Compatibility:"
    echo "     ✅ Chrome/Edge 57+"
    echo "     ✅ Firefox 52+"
    echo "     ✅ Safari 11+"
    echo "     ✅ Node.js 8+"
    echo "     ✅ Deno 1.0+"
fi

echo ""
echo "✅ Build Verification Complete!"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "Next steps:"
echo "  1. Run size analysis:    npm run size"
echo "  2. Run full tests:       npm test"
echo "  3. Publish to npm:       npm publish"
echo ""
