'use strict'

const React = require('react')

const xor = require('lodash/xor')
const Immutable = require('immutable')

const Config = require('electron-config');
const config = new Config({defaults: {selectedIndex: 0}});

const KEYPATH_TO_KEYWORDS = require('./keypath')
const ImageTagger = require('./image-tagger')
const ImageViewer = require('./image-viewer')

const allImages = require('./find-images')

const metadataTools = require('./metadata')
const {load, save} = metadataTools


function replaceKey(immutableImg, key, value) {
	let keywords = immutableImg.get('keywords')
	let updated = keywords.set(key, value)
	let newImage = immutableImg.set('keywords', updated)
	return newImage
}

function updateKey(immutableImg, key, value) {
	let keywords = immutableImg.get('keywords')
	let only = keywords.get(key)

	// use xor to "toggle" values in the array:
	// - if they exist in both args, they're removed from the result.
	// - else, they're added.
	let attributes = Immutable.List(xor(only.toArray(), [value]))
	let updated = only.set(key, attributes)

	let newImage = immutableImg.set('keywords', updated)
	return newImage
}

function copyMetadata(fromImage, toImage) {
	return toImage.merge('keywords', fromImage.get('keywords'))
}


class App extends React.Component {
	constructor() {
		super()
		this.state = {
			selectedIndex: null,
			imagePaths: Immutable.List(allImages),
			image: null,
			ready: false,
		}
	}

	componentDidMount() {
		this.onChangeImage(config.get('selectedIndex'))
	}

	onChangeImage(newIndex) {
		if (newIndex < 0 || newIndex >= this.state.imagePaths.size) {
			return false
		}

		this.setState(() => ({ready: false}))
		let imagePath = this.state.imagePaths.get(newIndex)

		load(imagePath).then(data => {
			console.log(data)
			config.set('selectedIndex', newIndex)

			this.setState(state => ({
				selectedIndex: newIndex,
				image: data,
				lastImage: state.image,
				ready: true,
			}))
		})
	}

	replaceKey(key, newValue) {
		this.setState(state => {
			let newImage = replaceKey(state.image, key, newValue)
			save(newImage)
			return {image: newImage}
		})
	}

	updateKey(key, newValue) {
		this.setState(state => {
			let newImage = updateKey(state.image, key, newValue)
			save(newImage)
			return {image: newImage}
		})
	}

	copyFromPrevious() {
		this.setState(state => {
			let newImage = copyMetadata(state.lastImage, state.image)
			save(newImage)
			return {image: newImage}
		})
	}


	changeCategory(value) { this.replaceKey('Category', value) }
	changeMaterial(value) { this.replaceKey('Material', value) }
	changeSize(value) { this.replaceKey('Size', value) }
	changeShape(value) { this.replaceKey('Shape', value) }
	changeStyle(value) { this.replaceKey('Style', value) }
	changeColor(value) { this.replaceKey('Color', value) }
	changeFinish(value) { this.replaceKey('Finish', value) }

	changeAttributes(value) { this.updateKey('Attributes', value) }
	changeConsiderations(value) { this.updateKey('Considerations', value) }
	changeKeywords(value) { this.updateKey('Keywords', value) }

	onChangeMetadata(key) {
		return ev => this[`change${key}`](ev.target.value)
	}

	render() {
		let {selectedIndex, image: selectedImage, lastImage} = this.state
		let count = this.state.imagePaths.size

		return (
			<div className='app-container'>
				<header className='header'>
					<p>{selectedIndex + 1} of {count}</p>
					<div className='controls'>
						<button
							onClick={this.copyFromPrevious.bind(this)}
							disabled={!(selectedIndex == 0 || selectedIndex == count - 1 || lastImage)}
						>
							Copy Metadata from Last
						</button>

						<button
							onClick={() => this.onChangeImage(selectedIndex - 1)}
							disabled={!(selectedIndex - 1 >= 0)}
						>
							Back
						</button>

						<button
							onClick={() => this.onChangeImage(selectedIndex + 1)}
							disabled={!(selectedIndex + 1 < count)}
						>
							Next
						</button>
					</div>
				</header>
				<ImageViewer image={selectedImage} />
				<ImageTagger
					image={selectedImage}
					onChangeMetadata={this.onChangeMetadata.bind(this)}
				/>
			</div>
		)
	}
}
module.exports = App
