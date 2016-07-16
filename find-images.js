'use strict'

const glob = require('glob')
const path = require('path')
const PHOTO_DIR = require('./paths').PHOTO_DIR

module.exports = glob.sync(path.join(PHOTO_DIR, '*', '*.jpg'))
