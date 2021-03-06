/*eslint-env mocha */
'use strict';

var assert = require('assert');
var Plugin = require('./');

describe('Plugin', function() {
  var plugin;
  this.timeout(10000); //eslint-disable-line no-magic-numbers

  beforeEach(() => {
    plugin = new Plugin({});
  });

  it('should be an object', () => {
    assert(plugin);
  });

  it('should have #compile method', () => {
    assert.equal(typeof plugin.compile, 'function');
  });

  it('should do nothing for no preset', (done) => {
    var content = 'var c = {};\nvar { a, b } = c;';

    plugin = new Plugin({ plugins: { babel: { presets: [] }}});
    plugin.compile({data: content, path: 'file.js'}).then(result => {
      assert(result.data.indexOf(content) !== -1);
      done();
    }, error => assert(!error));
  });

  it('should compile and produce valid result', (done) => {
    var content = 'var c = {};\nvar {a, b} = c;';
    var expected = 'var a = c.a;\nvar b = c.b;';

    plugin.compile({data: content, path: 'file.js'}).then(result => {
      assert(result.data.indexOf(expected) !== -1);
      done();
    }, error => assert(!error));
  });

  it('should load indicated plugins', (done) => {
    var content = 'var c = () => process.env.NODE_ENV;';
    var expected = '"use strict";\n\nvar c = function c() {\n  return undefined;\n};';

    plugin = new Plugin({ plugins: { babel: { plugins: ['transform-node-env-inline'] }}});
    plugin.compile({data: content, path: 'file.js'}).then(result => {
      assert(result.data.indexOf(expected) !== -1);
      done();
    }, error => assert(!error));
  });

  describe('custom file extensions & patterns', () => {
    var basicPlugin = new Plugin({
      plugins: {
        babel: {
          pattern: /\.(babel|es6|jsx)$/
        }
      }
    });
    var sourceMapPlugin = new Plugin({
      sourceMaps: true,
      plugins: {
        babel: {
          pattern: /\.(babel|es6|jsx)$/
        }
      }
    });
    var content = 'let a = 1';
    var path = 'app/file.es6';

    it('should handle custom file extensions', (done) => {
      basicPlugin.compile({data: content, path: path}).then(() => done(), error => assert(!error));
    });

    it('should properly link to source file in source maps', (done) => {
      sourceMapPlugin.compile({data: content, path: path}).then(result => {
        assert.doesNotThrow(() => JSON.parse(result.map));
        assert.equal(JSON.parse(result.map).sources.indexOf(path) !== -1, true);
        done();
      }, error => assert(!error));
    });

  });


  it('should produce source maps', (done) => {
    plugin = new Plugin({sourceMaps: true});

    var content = 'let a = 1';

    plugin.compile({data: content, path: 'file.js'}).then(result => {
      assert.doesNotThrow(() => JSON.parse(result.map));
      done();
    }, error => assert(!error));
  });

  it('should pass through content of ignored paths', (done) => {
    var content = 'asdf';

    plugin.compile({data: content, path: 'vendor/file.js'}).then(result => {
      assert.equal(content, result.data);
      done();
    }, error => assert(!error));
  });
});
