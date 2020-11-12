# ⌨️ Checkly Github Action

Checkly Github Action for parsing and creating checks based on yaml definitions in your repository. An example check format can be found below.

## 🔩 Usage

Simply add this Github Action to your Repo

```yaml
steps:
  - name: Checkly
    id: checkly
    uses: ndom91/checkly-gh-action@v1
    env:
      CHECKLY_API_KEY: ${{ secrets.CHECKLY_API_KEY }}
    with:
      path: ./myCheck.yml
```

## 🚀 Check Format

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

If you have trouble with your yaml formatting, this [Yaml Linter](https://jsonformatter.org/yaml-validator) can help.

## 🙏 Contributing

All Contributions Welcome!

## 📋 License

MIT

