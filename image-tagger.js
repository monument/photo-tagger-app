'use strict'

const React = require('react')

const startCase = require('lodash/startCase')
const isArray = require('lodash/isArray')
const Immutable = require('immutable')
const cx = require('classnames')

const CATEGORIES = ['Monument', 'Bench', 'Inscription', 'Statue', 'Reference', 'WIP', 'Other']
const MATERIALS = ['Granite', 'Bronze', 'Marble', 'Other']
const SIZES = ['Single', 'Double', 'Family', 'Monumental']

const DETAIL_LIST = ['Shape', 'Style', 'Color', 'Finish', 'Attributes', 'Considerations']

const DETAILS = {
	granite: {
		shape: {
			$type: 'or',
			$options: ['Serp Top', 'Flat Marker', 'Cross', 'Flat Top', 'Heart', 'Double Heart', 'Teardrop', 'Flame', 'Gothic', 'Custom', 'Boulder', 'Other'],
		},
		style: {
			$type: 'or',
			$options: ['Upright', 'Slant', 'Flat', 'Bevel', 'VA Marker'],
		},
		color: {
			$type: 'or',
			$options: ['Black', 'Gray', 'Rose', 'Pink', 'Mahogany', 'Red', 'Green', 'Blue', 'Other'],
		},
		finish: {
			$type: 'or',
			$dependsOn: 'style',
			'upright': ['Polish 2', 'Polish 3', 'All Polish', 'Flamed', 'Frosted', 'Sawn', 'Other'],
			'slant': ['Polish Slant Face', 'Polish 3', 'All Polish', 'Flamed', 'Frosted', 'Sawn', 'Other'],
			'bevel': ['Polish Face', 'All Polish', 'Flamed', 'Frosted', 'Sawn', 'Other'],
			'flat': ['Polish Flat Top', 'Flamed', 'Frosted', 'Sawn', 'Other'],
			'va marker': ['Normal', 'Other'],
		},
		attributes: {
			$type: 'and',
			$options: [
				'Porcelain Photo',
				'Laser Etching',
				'Gold Leaf',
				'Shape Carving',
				'US Metalcraft Vase',
				'Bronze Vase',
				'Granite Vase',
				'Other',
			],
		},
		considerations: {
			$type: 'and',
			$options: ['Website', 'Brochure', 'Editing'],
		},
	},
	bronze: {
		shape: null,
		style: {
			$type: 'or',
			$options: ['Flat', 'VA Marker', 'Upright'],
		},
		color: null,
		finish: {
			$type: 'or',
			$dependsOn: 'style',
			upright: ['Normal', 'Other'],
			flat: ['Normal', 'Other'],
			'va marker': ['Normal', 'Other'],
		},
		attributes: {
			$type: 'and',
			$options: [
				'Bronze Montage',
				'Bronze Vase',
				'Other',
			],
		},
		considerations: {
			$type: 'and',
			$options: ['Website', 'Brochure', 'Editing'],
		},
	},
	marble: {
		shape: {$type: 'or', $options: ['Serp Top', 'Cross', 'Heart', 'Double Heart', 'Teardrop', 'Flame', 'Gothic', 'Other']},
		style: {$type: 'or', $options: ['Upright', 'Flat', 'VA Marker']},
		color: {$type: 'or', $options: ['White', 'Other']},
		finish: {
			$type: 'or',
			$dependsOn: 'style',
			upright: ['Normal', 'Rock Pitch', 'Other'],
			flat: ['Normal', 'Other'],
			'va marker': ['Normal', 'Other'],
		},
		attributes: {
			$type: 'and',
			$options: [
				'Other',
			],
		},
		considerations: {
			$type: 'and',
			$options: ['Website', 'Brochure', 'Editing'],
		},
	},
	other: {
		shape: null,
		style: null,
		color: null,
		finish: null,
		attributes: {
			$type: 'and',
			$options: [
				'Porcelain Photo',
				'Laser Etching',
				'Gold Leaf',
				'Shape Carving',
				'US Metalcraft Vase',
				'Bronze Vase',
				'Granite Vase',
				'Other',
			],
		},
		considerations: {
			$type: 'and',
			$options: ['Website', 'Brochure', 'Editing'],
		},
	},
}

function Selector(props) {
	let {type, title, selected, options, onChange, warning} = props
	let inputType = type === 'and'
		? 'checkbox'
		: 'radio'

	// console.log(options, selected)

	return (
		<div className={`selector ${inputType}`}>
			<h2>{title}</h2>
			<div className='contents'>
				{warning
					? <p className='warning'>{warning}</p>
					: options.map(val => {
						let isChecked = Immutable.List.isList(selected)
							? selected.includes(val)
							: val === selected

						return <label key={val} className={cx('option', {selected: isChecked})}>
							<input
								type={inputType}
								value={val}
								name={title}
								checked={isChecked}
								onChange={onChange}
							/>
							<p>{val}</p>
						</label>
					})}
			</div>
		</div>
	)
}
Selector.defaultProps = {
	options: [],
}

//

function ImageTagger(props) {
	let {image, onChangeMetadata} = props
	if (!image) {
		return null
	}
	let keywords = image.get('keywords')

	return (
		<form className='tagger'>
			<Selector
				type='or'
				title='Category'
				selected={keywords.get('Category')}
				options={CATEGORIES}
				onChange={onChangeMetadata('Category')}
			/>
			<Selector
				type='or'
				title='Material'
				selected={keywords.get('Material')}
				options={MATERIALS}
				onChange={onChangeMetadata('Material')}
			/>
			<Selector
				type='or'
				title='Size'
				selected={keywords.get('Size')}
				options={SIZES}
				onChange={onChangeMetadata('Size')}
			/>
			{DETAIL_LIST.map(title => {
				let selected = DETAILS[material.toLowerCase()]
				let possibilities = selected[title.toLowerCase()]
				if (!possibilities) {
					return null
				}

				let type = possibilities.$type
				let options = possibilities.$options

				if (possibilities.$dependsOn) {
					let dependsOn = image.getIn(['keywords', possibilities.$dependsOn])
					if (dependsOn) {
						dependsOn = dependsOn.toLowerCase()
					}
					options = possibilities[dependsOn]
				}

				if (!options) {
					options = null
				}

				return <Selector
					key={title}
					type={type}
					title={title}
					selected={keywords.get(title)}
					options={options}
					warning={!options && possibilities.$dependsOn ? `Please select a ${possibilities.$dependsOn.toLowerCase()}` : false}
					onChange={onChangeMetadata(title)}
				/>
			})}
		</form>
	)
}
module.exports = ImageTagger
