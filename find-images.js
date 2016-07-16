'use strict'

const glob = require('glob')
const path = require('path')

const PHOTO_DIR = path.resolve(__dirname, '..', 'Photo Storage')

module.exports = glob.sync(path.join(PHOTO_DIR, '*', '*.jpg'))
