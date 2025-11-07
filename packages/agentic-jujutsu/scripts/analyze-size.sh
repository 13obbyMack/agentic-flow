#!/bin/bash
# Analyze WASM bundle sizes and provide optimization recommendations

set -e

echo "📊 WASM Bundle Size Analysis"
echo "═══════════════════════════════════════════════════════════"

if [ ! -d "pkg" ]; then
    echo "❌ Error: pkg/ directory not found. Run 'npm run build' first."
    exit 1
fi

# Function to get file size in bytes
get_size() {
    if [ -f "$1" ]; then
        stat -f%z "$1" 2>/dev/null || stat -c%s "$1" 2>/dev/null
    else
        echo "0"
    fi
}

# Function to format bytes
format_bytes() {
    local bytes=$1
    if [ $bytes -lt 1024 ]; then
        echo "${bytes}B"
    elif [ $bytes -lt 1048576 ]; then
        echo "$(awk "BEGIN {printf \"%.2f\", $bytes/1024}")KB"
    else
        echo "$(awk "BEGIN {printf \"%.2f\", $bytes/1048576}")MB"
    fi
}

total_size=0
target_count=0

echo ""
echo "📦 Bundle Sizes by Target:"
echo "───────────────────────────────────────────────────────────"

for target in web node bundler deno; do
    wasm_file="pkg/$target/agentic_jujutsu_bg.wasm"

    if [ -f "$wasm_file" ]; then
        size=$(get_size "$wasm_file")
        formatted=$(format_bytes $size)
        total_size=$((total_size + size))
        target_count=$((target_count + 1))

        # Check if size is within target (<200KB)
        if [ $size -lt 204800 ]; then
            status="✅"
        elif [ $size -lt 512000 ]; then
            status="⚠️ "
        else
            status="❌"
        fi

        printf "  %-12s %s %10s\n" "$target:" "$status" "$formatted"

        # Show JS glue code size
        js_file="pkg/$target/agentic_jujutsu.js"
        if [ -f "$js_file" ]; then
            js_size=$(get_size "$js_file")
            js_formatted=$(format_bytes $js_size)
            printf "    %-10s      %10s\n" "(+ JS glue)" "$js_formatted"
        fi
    fi
done

if [ $target_count -eq 0 ]; then
    echo "  ❌ No WASM files found"
    exit 1
fi

echo "───────────────────────────────────────────────────────────"
avg_size=$((total_size / target_count))
echo "  Average:              $(format_bytes $avg_size)"
echo ""

# Gzip compression analysis
echo "📦 Compressed Sizes (gzip):"
echo "───────────────────────────────────────────────────────────"

for target in web node bundler deno; do
    wasm_file="pkg/$target/agentic_jujutsu_bg.wasm"

    if [ -f "$wasm_file" ]; then
        # Create temporary gzipped file
        gzip -c "$wasm_file" > "/tmp/temp_$target.wasm.gz"
        gz_size=$(get_size "/tmp/temp_$target.wasm.gz")
        gz_formatted=$(format_bytes $gz_size)

        original_size=$(get_size "$wasm_file")
        ratio=$(awk "BEGIN {printf \"%.1f\", ($original_size - $gz_size) * 100 / $original_size}")

        printf "  %-12s %10s  (-%s%% compression)\n" "$target:" "$gz_formatted" "$ratio"

        rm "/tmp/temp_$target.wasm.gz"
    fi
done

echo ""

# Recommendations
echo "💡 Optimization Recommendations:"
echo "───────────────────────────────────────────────────────────"

if [ $avg_size -lt 102400 ]; then
    echo "  ✅ Excellent! Bundle size is <100KB"
elif [ $avg_size -lt 204800 ]; then
    echo "  ✅ Good! Bundle size is <200KB (target met)"
elif [ $avg_size -lt 512000 ]; then
    echo "  ⚠️  Acceptable, but could be optimized (<500KB)"
    echo ""
    echo "  Try these optimizations:"
    echo "    1. Enable wasm-opt: cargo install wasm-opt"
    echo "    2. Use opt-level = 'z' in Cargo.toml"
    echo "    3. Enable LTO (Link Time Optimization)"
    echo "    4. Strip debug symbols"
else
    echo "  ❌ Bundle is too large (>500KB)"
    echo ""
    echo "  Required optimizations:"
    echo "    1. Review dependencies in Cargo.toml"
    echo "    2. Use 'wasm-opt -Oz' for aggressive optimization"
    echo "    3. Consider code splitting"
    echo "    4. Remove unused features"
fi

echo ""
echo "🔧 Current Cargo.toml optimizations:"
echo "───────────────────────────────────────────────────────────"
if grep -q "opt-level.*z" Cargo.toml; then
    echo "  ✅ opt-level = 'z' (size optimization)"
else
    echo "  ⚠️  Consider adding opt-level = 'z'"
fi

if grep -q "lto.*true" Cargo.toml; then
    echo "  ✅ LTO enabled"
else
    echo "  ⚠️  Consider enabling LTO"
fi

if grep -q "strip.*true" Cargo.toml; then
    echo "  ✅ Debug symbols stripped"
else
    echo "  ⚠️  Consider stripping debug symbols"
fi

echo ""
echo "📝 Summary:"
echo "───────────────────────────────────────────────────────────"
echo "  Total targets:        $target_count"
echo "  Average WASM size:    $(format_bytes $avg_size)"
echo "  Target size:          <200KB"

if [ $avg_size -lt 204800 ]; then
    echo "  Status:               ✅ PASSED"
    exit 0
else
    echo "  Status:               ⚠️  NEEDS OPTIMIZATION"
    exit 0  # Don't fail build, just warn
fi
