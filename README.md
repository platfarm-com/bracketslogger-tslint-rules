# Introduction

This is a `tslint` rule for use with `bracketslogger` (see https://github.com/platfarm-com/bracketslogger)

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

## Example Output

```
[18:36:11]  tslint: src/app/app.component.ts, line: 218
            Suspect Debug missing executive brackets - will not produce console output

     L217:  this.nav.push(nextPage).catch((e) => Log.Error(e));
     L218:  Log.Error('oops');
     L219:
```

## Todo

- Unit test suite
- Improve documentation
- Publish to npm