'use strict'

const Immutable = require('immutable')
const bluebird = require('bluebird')
const pify = bluebird.promisify.bind(bluebird)

const xml2js = require('xml2js')
const parseXml = pify(xml2js.parseString.bind(xml2js))
const buildXml = new xml2js.Builder()

const path = require('path')
const fs = require('fs')
const readFilePromise = pify(fs.readFile)
const writeFilePromise = pify(fs.writeFile)

const KEYPATH_TO_KEYWORDS = require('./keypath')
const PHOTO_DIR = require('./paths').PHOTO_DIR


function splitInitialFilepath(filepath) {
	let relativePath = path.relative(PHOTO_DIR, filepath)
	let parts = path.parse(relativePath)
	return {directory: parts.dir, filename: parts.base, basename: parts.name}
}

function resolveMetadata(dir, basename) {
	return path.resolve(PHOTO_DIR, dir, `${basename}.xmp`)
}


function loadMetadata(filepath) {
	return readFilePromise(filepath, 'utf-8')
		.then(data => parseXml(data))
		.then(md => Immutable.fromJS(md))
}


module.exports.save = saveMetadata
function saveMetadata(immImage) {
	let data = buildXml.buildObject(immImage.get('metadata').toJSON())
	return writeFilePromise(immImage.get('metadataPath'), data, 'utf-8')
}


module.exports.load = loadData
function loadData(imagePath) {
	let {directory, filename, basename} = splitInitialFilepath(imagePath)

	let thumbnailPath = imagePath
	let metadataPath = resolveMetadata(directory, basename)

	return loadMetadata(metadataPath)
		.then(metadata =>
			Immutable.Map({
				thumbBase: thumbnailPath,
				metadataPath,
				metadata,
				directory
			}))
}
