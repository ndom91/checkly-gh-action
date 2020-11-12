'use strict'

const core = require('@actions/core')
const yamlLint = require('yaml-lint')
const fetch = require('isomorphic-unfetch')
const { promises: fs } = require('fs')

if (!process.env.CHECKLY_API_KEY) {
  core.setFailed('CHECKLY_API_KEY missing!')
}

const main = async () => {
  const path = core.getInput('path')
  // Read specified Checks definition
  const result = await fs.readFile(path, 'utf8')

  // Lint Yaml
  yamlLint
    .lint(result)
    .then(() => {
      // Valid Yaml
      core.info('✅ valid YAML')

      // Mocked API Returning User Details + Credits Available
      const checklyApi =
        'https://run.mocky.io/v3/3674bfa7-7065-4a19-b5e1-20ea1dbb38df'
      fetch(checklyApi, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': process.env.CHECKLY_API_KEY
        }
      })
        .then(res => res.json())
        .then(data => {
          if (data.credits.available > 0) {
            core.info('Credit check success')
          }
        })
      core.setOutput('result', result)
    })
    .catch(err => {
      // Invalid Yaml
      console.error(err)
      core.setFailed('❌ Invalid YAML', err)
    })
}

main().catch(err => core.setFailed(err.message))
