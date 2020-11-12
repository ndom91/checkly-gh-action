'use strict'

const core = require('@actions/core')
const { promises: fs } = require('fs')

const main = async () => {
  const path = core.getInput('path')
  const result = await fs.readFile(path, 'utf8')
  core.setOutput('result', result)
}

main().catch(err => core.setFailed(err.message))
