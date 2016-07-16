'use strict'

const tail = require('lodash/tail')
const Immutable = require('immutable')
const bluebird = require('bluebird')
const pify = bluebird.promisify.bind(bluebird)

const xml2js = require('xml2js')
const parseXml = pify(xml2js.parseString.bind(xml2js))
const xmlBuilder = new xml2js.Builder()

const path = require('path')
const fs = require('fs')
const readFilePromise = pify(fs.readFile)
const writeFilePromise = pify(fs.writeFile)

const KEYPATH_TO_KEYWORDS = require('./keypath')
const PHOTO_DIR = require('./paths').PHOTO_DIR

const simpleKeys = Immutable.List(['Size', 'Shape', 'Material', 'Finish', 'Color', 'Style', 'Category'])
const listKeys = Immutable.List(['Attributes', 'Considerations', 'Keywords'])


function splitInitialFilepath(filepath) {
	let relativePath = path.relative(PHOTO_DIR, filepath)
	let parts = path.parse(relativePath)
	return {directory: parts.dir, filename: parts.base, basename: parts.name}
}

function resolveMetadata(dir, basename) {
	return path.resolve(PHOTO_DIR, dir, `${basename}.xmp`)
}


function extractKeywords(xmp) {
	let meta = xmp.getIn(['x:xmpmeta', 'rdf:RDF', 0, 'rdf:Description', 0])
	let subject = meta.get('dc:subject', Immutable.List()).get(0, Immutable.Map())
	let bag = subject.get('rdf:Bag', Immutable.List()).get(0, Immutable.Map())
	if (!Immutable.Map.isMap(bag)) {
		bag = Immutable.Map({'rdf:li': Immutable.List()})
	}
	let li = bag.get('rdf:li', Immutable.List())
	return li
}

function keywordListToMap(keywords) {
	let mapped = keywords
		.groupBy(kw => kw.split('|')[0])
		.map(val => val.flatMap(v => tail(v.split('|'))))
		.map((val, key) => simpleKeys.includes(key) ? val.first() : val)

	return mapped
}

function keywordMapToList(keywords) {
	return keywords.reduce((list, val, key) => {
		return Immutable.List.isList(val)
			// if it's a list, add all of the keywords to the overall list
			? list.concat(val.map(v => `${key}|${v}`))
			// otherwise, just add the single one
			: list.push(`${key}|${val}`)
	}, Immutable.List())
}


function readMetadata(filepath) {
	return readFilePromise(filepath, 'utf-8')
		.then(parseXml)
		.then(Immutable.fromJS)
}


function loadMetadata(filepath) {
	return readMetadata(filepath)
		.then(extractKeywords)
		.then(keywordListToMap)
}


function updateXmp(xmp, newKeywords) {
	let meta = xmp.mergeDeepIn(['x:xmpmeta', 'rdf:RDF', 0, 'rdf:Description', 0, 'dc:subject', 0, 'rdf:Bag', 0], Immutable.Map({'rdf:li': Immutable.List()}))
	return meta.setIn(KEYPATH_TO_KEYWORDS, newKeywords)
}

function sortKeywords(xmp) {
	return xmp.updateIn(KEYPATH_TO_KEYWORDS, kw => kw.sort())
}

function buildXml(xmpObject) {
	return xmlBuilder.buildObject(xmpObject.toJSON())
}

function saveMetadata(immImage) {
	console.time('saveMetadata')
	let filepath = immImage.get('metadataPath')
	let keywords = keywordMapToList(immImage.get('keywords'))

	return readMetadata(filepath)
		.then(data => updateXmp(data, keywords))
		.then(sortKeywords)
		.then(buildXml)
		.then(xmlString =>
			writeFilePromise(filepath, xmlString + '\n', 'utf-8'))
		.then(res => {
			console.timeEnd('saveMetadata')
			return res
		})
}
module.exports.save = saveMetadata


function loadData(imagePath) {
	console.time('loadData')
	let {directory, filename, basename} = splitInitialFilepath(imagePath)

	let metadataPath = resolveMetadata(directory, basename)

	return loadMetadata(metadataPath)
		.then(keywords =>
			Immutable.Map({
				thumbPath: imagePath,
				metadataPath,
				keywords,
				directory
			}))
		.then(res => {
			console.timeEnd('loadData')
			return res
		})
}
module.exports.load = loadData
