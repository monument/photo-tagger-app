'use strict'

const map = require('lodash/map')
const isArray = require('lodash/isArray')

function PrettyJson({json}) {
	json = json.toJSON()
	return <dl>
		{map(json, (v, k) => ([
			<dt>{k}</dt>,
			isArray(v)
				? v.map(val => <dd>{val}</dd>)
				: <dd>{v}</dd>
		]))}
	</dl>
}

function ImageViewer({image}) {
	if (!image) {
		return null
	}
	return <div className='viewer'>
		<img src={`file://${image.get('thumbPath')}`} />
		<br/>
		<PrettyJson json={image.get('keywords')} />
	</div>
}
module.exports = ImageViewer
