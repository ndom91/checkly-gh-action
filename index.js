'use strict'

import { Queue } from 'bullmq'
const core = require('@actions/core')
const yamlLint = require('yaml-lint')
const yaml = require('js-yaml')
const fetch = require('isomorphic-unfetch')
const { promises: fs } = require('fs')

if (!process.env.CHECKLY_API_KEY) {
  core.setFailed('CHECKLY_API_KEY missing!')
}

const main = async () => {
  const path = core.getInput('path')
  // Read specified Checks definition
  const checkYaml = await fs.readFile(path, 'utf8')

  // Lint Yaml
  yamlLint
    .lint(checkYaml)
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
        .then(async data => {
          // Check if User can even add Checks
          if (data.credits.available > 0) {
            core.info(
              `✅ User ${data.identity.username} has ${data.credits.available} credits remaining`
            )
            // Create a new Queue
            const macQueue = new Queue('macQueue', {
              connection: {
                host: process.env.REDIS_HOST,
                port: process.env.REDIS_PORT,
                password: process.env.REDIS_PW
              }
            })
            if (core.isDebug()) {
              core.info('✅ Redis Connected')
            }

            // Add Json to Queue
            const checkJson = yaml.safeLoad(checkYaml, 'utf8')
            const result = await macQueue.add(
              'checkly:ndo',
              JSON.stringify(checkJson, null, 2)
            )
            core.setOutput('result', result)
          }
        })
    })
    .catch(err => {
      // Invalid Yaml
      console.error(err)
      core.setFailed('❌ Invalid YAML', err)
    })
}

main().catch(err => core.setFailed(err.message))
