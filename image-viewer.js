'use strict'

const React = require('react')
const dom = React.DOM
const map = require('lodash/map')
const isArray = require('lodash/isArray')

function PrettyJson({json}) {
	json = json.toJSON()
	return dom.dl(null,
		map(json, (v, k) => ([
			dom.dt(null, k),
			isArray(v)
				? v.map(val => dom.dd(null, val))
				: dom.dd(null, v)
		])))
}
PrettyJson = React.createFactory(PrettyJson)

function ImageViewer({image}) {
	if (!image) {
		return null
	}
	return dom.div({className: 'viewer'},
		dom.img({src: `file://${image.get('thumbPath')}`}),
		dom.br(),
		PrettyJson({json: image.get('keywords')}))
}
module.exports = React.createFactory(ImageViewer)
