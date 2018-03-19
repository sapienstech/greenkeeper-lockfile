#!/usr/bin/env node

'use strict'

const exec = require('child_process').execSync
const url = require('url')
const fs = require('fs')

const config = require('./lib/config')
const info = require('./ci-services')()

const env = process.env

module.exports = function upload () {
  if (!info.branchName) {
    return console.error('No branch details set, so assuming not a Greenkeeper branch')
  }

  // legacy support
  if (config.branchPrefix === 'greenkeeper/' && info.branchName.startsWith('greenkeeper-')) {
    config.branchPrefix = 'greenkeeper-'
  }

  if (!info.branchName.startsWith(config.branchPrefix)) {
    return console.error(`'${info.branchName}' is not a Greenkeeper branch`)
  }

  const isInitial = info.branchName === (config.branchPrefix + 'initial') ||
    info.branchName === (config.branchPrefix + 'update-all')

  if (isInitial) {
    return console.error('Not running on the initial Greenkeeper branch. Will only run on Greenkeeper branches that update a specific dependency')
  }

  if (!info.firstPush) {
    return console.error('Only running on first push of a new branch')
  }

  if (!info.uploadBuild) {
    return console.error('Only uploading on one build job')
  }

  let remote = `git@github.com:${info.repoSlug}`
  if (info.gitUrl) remote = info.gitUrl

  const err = fs.openSync('gk-lockfile-git-push.err', 'w')

  exec(`git remote add gk-origin ${remote}`)
  exec(`git push gk-origin HEAD:${info.branchName}`, {
    stdio: [
      'pipe',
      'pipe',
      err
    ]
  })
}

if (require.main === module) module.exports()
