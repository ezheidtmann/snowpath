let assert = require('assert');
let { makeModelFromXMLFile } = require('./test_utils');

describe('nohrsc parsing', function () {
    describe('model', function () {
        let model = makeModelFromXMLFile('./fixtures/nohrsc_nsm_20200305.kml');
        it('shoud get a folder', function () {
            let folder = model.getFolderByName('Snow Depth');
            assert.notStrictEqual(folder, undefined)
        })
        it('should get sources', function () {
            let folder = model.getFolderByName('Snow Depth');
            let sources = model.getGroundOverlaysAsMBGLSources(folder);
            assert.equal(sources.length, 80);
        })
    })
})