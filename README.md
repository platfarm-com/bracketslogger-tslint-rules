# Introduction

This is a `tslint` rule for use with `bracketslogger` (see https://github.com/pastcompute/bracketslogger)

## Instructions

Insert the following into `tslint.json`:

```
  "rulesDirectory": [
    "node_modules/bracketslogger-tslint-rules/dist",
```

and

```
  "rules": {
    "bracketslogger-custom-debug": true

```
