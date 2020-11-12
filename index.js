'use strict'

const RSMQPromise = require('rsmq-promise')
const yaml = require('js-yaml')
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

            // Create connection to Redis Queue
            const rsmq = new RSMQPromise({
              host: process.env.REDIS_HOST,
              port: process.env.REDIS_PORT,
              password: process.env.REDIS_PW,
              realtime: true
            })

            // Check if Queue already exists
            let existingQueues = await rsmq.listQueues()
            if (core.isDebug()) {
              core.info(`✅ Queues - ${existingQueues}`)
            }

            // If not, create queue
            if (!Array.isArray(existingQueues) || !existingQueues.length) {
              existingQueues = await rsmq.createQueue({ qname: 'checklyMac' })
            }

            // Convert to JSON for easier storing / transfering over the wire
            const checkJson = yaml.safeLoad(checkYaml, 'utf8')
            // Write msg to queue
            const msgId = await rsmq.sendMessage({
              qname: existingQueues[0],
              message: JSON.stringify(checkJson, null, 2)
            })

            // If successfully written, print output, subtract credit, etc.
            if (msgId) {
              core.info(`✅ Job enqueued - ${msgId}`)
              core.setOutput('result', '✅ Check Successfully Added')

              const checklyApi2 =
                'https://run.mocky.io/v3/622656a1-ae96-469a-b0d6-24d5eb7b4017'
              fetch(checklyApi2, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'X-Api-Key': process.env.CHECKLY_API_KEY
                },
                body: JSON.stringify({
                  user: data.identity.id,
                  credits: 1
                })
              })
                .then(res => res.json())
                .then(res => {
                  core.info(
                    `✅ User ${res.identity.username} has ${res.credits.available} credits remaining`
                  )
                })

              rsmq.quit()
            } else {
              core.error('Error writing to Queue')
              core.setFailed('Error writing to Queue')
            }
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
