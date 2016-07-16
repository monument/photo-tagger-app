'use strict'

function ImageViewer({image}) {
	if (!image) {
		return null
	}
	return <div className='viewer'>
		<img src={`file://${image.get('thumbBase')}.jpg`} />
		<br/>
		<div>{JSON.stringify(image.getIn(['metadata', ...KEYPATH_TO_KEYWORDS]), null, 2)}</div>
	</div>
}
module.exports = ImageViewer
