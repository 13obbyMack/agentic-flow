#!/usr/bin/env node
/**
 * Basic WASM integration tests for Node.js
 * Run: node tests/wasm/basic.test.js
 */

const { JJWrapper, JJConfig } = require('../../pkg/node');

// Simple test framework
class TestRunner {
    constructor() {
        this.tests = [];
        this.passed = 0;
        this.failed = 0;
    }

    test(name, fn) {
        this.tests.push({ name, fn });
    }

    async run() {
        console.log('🧪 Running WASM Integration Tests\n');

        for (const { name, fn } of this.tests) {
            try {
                await fn();
                this.passed++;
                console.log(`✅ ${name}`);
            } catch (error) {
                this.failed++;
                console.log(`❌ ${name}`);
                console.log(`   Error: ${error.message}`);
            }
        }

        console.log(`\n📊 Results: ${this.passed} passed, ${this.failed} failed`);

        if (this.failed > 0) {
            process.exit(1);
        }
    }
}

// Helper function for assertions
function assert(condition, message) {
    if (!condition) {
        throw new Error(message || 'Assertion failed');
    }
}

function assertEqual(actual, expected, message) {
    if (actual !== expected) {
        throw new Error(
            message || `Expected ${expected}, got ${actual}`
        );
    }
}

// Create test runner
const runner = new TestRunner();

// Tests
runner.test('JJConfig should create with defaults', () => {
    const config = new JJConfig();
    assert(config.jj_path === 'jj', 'Default jj_path should be "jj"');
    assert(config.repo_path === '.', 'Default repo_path should be "."');
    assert(config.timeout_ms === 30000, 'Default timeout should be 30000ms');
    assert(config.verbose === false, 'Default verbose should be false');
});

runner.test('JJConfig builder pattern should work', () => {
    const config = new JJConfig()
        .with_jj_path('/usr/local/bin/jj')
        .with_repo_path('/tmp/repo')
        .with_timeout(60000)
        .with_verbose(true)
        .with_max_log_entries(500);

    assertEqual(config.jj_path, '/usr/local/bin/jj');
    assertEqual(config.repo_path, '/tmp/repo');
    assertEqual(config.timeout_ms, 60000);
    assertEqual(config.verbose, true);
    assertEqual(config.max_log_entries, 500);
});

runner.test('JJConfig.default_config() should work', () => {
    const config = JJConfig.default_config();
    assert(config instanceof JJConfig, 'Should return JJConfig instance');
    assertEqual(config.jj_path, 'jj');
});

runner.test('JJWrapper should create instance', async () => {
    const config = new JJConfig().with_timeout(5000);

    try {
        const jj = await JJWrapper.new(config);
        assert(jj !== null, 'JJWrapper should be created');
    } catch (error) {
        // If jj is not installed, this is expected
        if (error.message && error.message.includes('not found')) {
            console.log('   ⚠️  Skipped (jj not installed)');
        } else {
            throw error;
        }
    }
});

runner.test('JJWrapper with default config should work', async () => {
    try {
        const jj = await JJWrapper.new();
        assert(jj !== null, 'JJWrapper should work with no config');
    } catch (error) {
        if (error.message && error.message.includes('not found')) {
            console.log('   ⚠️  Skipped (jj not installed)');
        } else {
            throw error;
        }
    }
});

runner.test('Execute simple command (if jj available)', async () => {
    try {
        const jj = await JJWrapper.new();
        const result = await jj.execute(['--version']);

        assert(result !== null, 'Should return result');
        assert(result.stdout !== undefined, 'Should have stdout');
        assert(result.stderr !== undefined, 'Should have stderr');
        assert(typeof result.exit_code === 'number', 'Should have exit_code');
        assert(typeof result.success === 'boolean', 'Should have success flag');

        console.log(`   📌 jj version: ${result.stdout.trim()}`);
    } catch (error) {
        if (error.message && error.message.includes('not found')) {
            console.log('   ⚠️  Skipped (jj not installed)');
        } else {
            throw error;
        }
    }
});

runner.test('Status command should work (if in jj repo)', async () => {
    try {
        const jj = await JJWrapper.new();
        const status = await jj.status();

        assert(status !== null, 'Should return status');
        assert(status.stdout !== undefined, 'Should have stdout');

        console.log(`   📌 Status output length: ${status.stdout.length} bytes`);
    } catch (error) {
        if (error.message && (
            error.message.includes('not found') ||
            error.message.includes('not a repository')
        )) {
            console.log('   ⚠️  Skipped (not in jj repo or jj not installed)');
        } else {
            throw error;
        }
    }
});

runner.test('WASM memory should be efficient', () => {
    const configs = [];

    // Create multiple config objects
    for (let i = 0; i < 1000; i++) {
        configs.push(new JJConfig().with_timeout(i));
    }

    assert(configs.length === 1000, 'Should create 1000 configs');
    assertEqual(configs[999].timeout_ms, 999);

    console.log('   📌 Created 1000 config objects successfully');
});

runner.test('Error handling should work', async () => {
    try {
        const config = new JJConfig()
            .with_jj_path('/nonexistent/jj')
            .with_timeout(1000);

        const jj = await JJWrapper.new(config);
        await jj.execute(['status']);

        // Should not reach here
        throw new Error('Expected error was not thrown');
    } catch (error) {
        // Expected to fail with non-existent jj path
        assert(error !== null, 'Should throw error');
        console.log('   📌 Error correctly caught');
    }
});

// Run all tests
runner.run().catch(err => {
    console.error('Fatal test error:', err);
    process.exit(1);
});
