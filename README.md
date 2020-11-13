<p align="center">
<img src="https://blog.checklyhq.com/content/images/2019/03/logo_script_racoon_horizontal_795.png" />
</p>
<p align="center">
<img src="https://img.shields.io/badge/version-0.1.0-blue" />  
<img src="https://img.shields.io/badge/license-MIT-red" />
<img src="https://img.shields.io/badge/uptime-100%25-green" />
<img src="https://img.shields.io/badge/hire-nico-orange" />  
</p>

# Github Action

Checkly Github Action for parsing and creating checks based on yaml definitions in your repository. An example check format can be found below.

## 🔩 Usage

Clone this repo and make sure you have a github action setup to run this private action (`uses: ./`). In the future this could be submitted to the marketplace and then simply defined by name (i.e. `uses: @ndom91/checkly-checker@v1`).

Your Github workflow definition (`.github/workflow/main.yml`) should look something like this: 

```yaml
steps:
  - name: Checkout
    uses: action/checkout@v2
  - name: Checkly
    id: checkly
    uses: ./
    env:
      CHECKLY_API_KEY: ${{ secrets.CHECKLY_API_KEY }}
      REDIS_HOST: ${{ secrets.REDIS_HOST }}
      REDIS_PORT: ${{ secrets.REDIS_PORT }}
      REDIS_PW: ${{ secrets.REDIS_PW }}
    with:
      path: ./myCheck.yml
```

This will then run your check, defined below, through some parsing and verification and then submit it to the queue for further processing by the worker [checkly-heroku-worker](https://github.com/ndom91/checkly-heroku-worker).

## 🚀 Check Format

At minimum, next to the code for the action (for now while its private), your repo should contain a yaml file defined in the `path` variable above.

An example check definition looks like this:

```yaml
checks:
  - name: check1
    tags:
      - api
      - check
    request:
      - type: http
        method: POST
        url: https://katalog.newtelco.dev/api
        headers:
          - content-type: application/json
            body: >
             {
               "operationName": "ItemQuery",
               "variables": {},
               "query": ""
             }
    scripts:
      - setup: setup_script1.js
      - teardown: teardown_script1.js
    response:
      degrade: 5s
      fail: 20s
    assertions:
      - source: header
        property: X-Powered-By
        comparison: equals
        target: 'nginx'
      - source: jsonBody
        property: $.data.items
        comparison: isNotEmpty
        target:
    datacenter:
      - virginia
      - frankfurt
    interval: 5min
    alerts:
      - type: email
        sendOn:
          - recover
          - degrade
          - fail
          - sslExpiry
```

If you have trouble with your yaml formatting, this [yaml Linter](https://jsonformatter.org/yaml-validator) can help.

## 🙏 Contributing

All Contributions Welcome!

## 📋 License

MIT

