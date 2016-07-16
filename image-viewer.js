'use strict'

function ImageViewer({image}) {
	if (!image) {
		return null
	}
	return <div className='viewer'>
		<img src={`file://${image.get('thumbPath')}`} />
		<br/>
		<div>{JSON.stringify(image.get('keywords'), null, 2)}</div>
	</div>
}
module.exports = ImageViewer
