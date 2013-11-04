var fs = require('fs');
var archiver = require('archiver');
var path = require('path');
var handlebars = require('handlebars');
var uuid = require('node-uuid');

/**
 * Epub class for generating logical file organization
 * before calling generate to output a epub.
 * @param {obj} options Available options:
 *   - {string} title Book title
 */
var Epub = function (options) {

    this.MIMETYPE = 'mimetype';
    this.MIMETYPE_CONTENTS = 'application/epub+zip';

    options = options || {};

    this.title = options.title;
    this.lang = options.lang || 'en-us';
    this.uuid = options.uuid || uuid.v4();
    this.author = options.author || '';
    this.publisher = options.publisher || '';
    this.genre = options.genre || '';
    this.description = options.description || '';
    this.modified = new Date().toISOString();
    this.created = options.created || this.modified;

    // initialize file array
    this._files = [];
};

/**
 * Add file to include within the
 * @param {string} path Path to xhtml file
 * @param {string} name Name of file
 */
Epub.prototype.addFile = function (path, options) {
    options = options || {};
    name = options.name || path.split('/').pop();
    title = options.title || options.name;
    this._files.push({
        path: path,
        name: name,
        title: title,
        mimetype: this.mimetype(path),
        file: fs.createReadStream(path, {'flags': 'r'})
    });
};

/**
 * Return list of "chapters" in the current Book by filtering provided
 * files that match the xhtml mimetype.
 * @return {array} List of chapters in the current book
 */
Epub.prototype.chapters = function () {
    var _this = this;
    return this._files.filter(function (item) {
        return (_this.mimetype(item.path) === 'application/xhtml+xml') ? true : false;
    });
};

/**
 * Generate ePub from provided files to destination path.
 * @param {string} path [description]
 * @return {void}
 */
Epub.prototype.generate = function (path) {
    var archive = archiver('zip');
    var output = fs.createWriteStream(path);
    // Listener for completion
    output.on('close', function() {
        console.log('Your epub is ready.');
    });
    // When something bad happens
    archive.on('error', function(err) {
        throw err;
    });
    // Prepare to write
    archive.pipe(output);
    // Add mimetype
    archive.append(new Buffer(this.MIMETYPE_CONTENTS), { name: this.MIMETYPE, store: true });
    // Build container
    var containerTemplate = handlebars.compile(fs.readFileSync(__dirname + '/templates/container.xml', 'utf8'));
    archive.append(new Buffer(containerTemplate(this)), { name: 'META-INF/container.xml' });
    // Build OPF
    var opfTemplate = handlebars.compile(fs.readFileSync(__dirname + '/templates/epb.opf', 'utf8'));
    archive.append(new Buffer(opfTemplate(this)), { name: 'OPS/epb.opf' });
    // Build NCX
    var ncxTemplate = handlebars.compile(fs.readFileSync(__dirname + '/templates/epb.ncx', 'utf8'));
    archive.append(new Buffer(ncxTemplate(this)), { name: 'OPS/epb.ncx' });
    // Add TOC
    var tocTemplate = handlebars.compile(fs.readFileSync(__dirname + '/templates/toc.xhtml', 'utf8'));
    archive.append(new Buffer(tocTemplate(this)), { name: 'OPS/toc.xhtml' });
    // Add user files
    this._files.forEach(function (item) {
        archive.append(fs.createReadStream(item.path), { name: 'OPS/' + item.name });
    });
    archive.finalize(function(err, bytes) {
        if (err) {
            throw err;
        }
        console.log(bytes + ' total bytes');
    });
};

/**
 * Return valid ePub mimetype from provided filename.
 * @param {string} filename Filename to be added
 * @return {string} Valid epub mimetype
 */
Epub.prototype.mimetype = function (filename) {
    var extension = path.extname(filename).toLowerCase();
    var mimetype;
    switch (extension) {
        // chapter documents
        case '.xhtml':
        case '.html':
        case '.htm':
            mimetype = 'application/xhtml+xml';
            break;
        // style documents
        case '.css':
            mimetype = 'text/css';
            break;
        // media documents
        case '.png':
            mimetype = 'image/png ';
            break;
        case '.jpg':
        case '.jpeg':
            mimetype = 'image/jpeg';
            break;
        case '.gif':
            mimetype = 'image/gif';
            break;
        case '.svg':
            mimetype = 'image/svg+xml';
            break;
        // packaging documents
        case '.opf':
            mimetype = 'application/oebps-package+xml';
            break;
        case '.ncx':
            mimetype = 'application/x-dtbncx+xml';
            break;
        case '.ocf':
            mimetype = 'application/epub+zip';
            break;
        default:
            mimetype = 'text/plain';
    }
    return mimetype;
};

exports.Epub = Epub;
