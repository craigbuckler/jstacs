# jsTACS

JavaScript Templating and Caching System for Node.js.

*This is an alpha product: please use at your own discretion.*

jsTACs uses tagged template literals for zero-dependency fast template rendering. Features:

* EcmaScript module
* standard JavaScript template literal `${ expression }`
* `!{ expression }` is ignored to the initial render so it can be evaluated at runtime. It's possible to pre-build templates so only runtime data remains.
* include other files
* pass global data and custom functions.


## Basic usage

Replace expressions in a template string:

```js
import { templateParse } from 'jstacs';

/*
output:
<p>Hello World!</p>
*/
const out1 = templateParse(
  '<p>Hello ${ data.name }!</p>',
  { name: 'World' }
);
```

`data.name` should typically hold a string, number, or another native value. However, arrays, Sets, and Maps are automatically output: there's no need for `.join('')` unless you want a specific character.

```js
/*
output:
<ol><li>1</li><li>2</li><li>3</li></ol>
*/
const out2 = templateParse(
  '<ol>${ data.list.map(i => `<li>${ i }</li>`) }</ol>',
  { list: [1, 2, 3] }
);
```

Use `!{ expression }` to return a partially-completed template which can be saved and used later:

```js
/*
output:
<p>Hello World! The time is ${ data.now }</p>
*/
const out3 = templateParse(
  '<p>Hello ${ data.name }! The time is !{ data.now }.</p>',
  { name: 'World' }
);
```


## Convert any value to an array

Any object, Map, Set, or value can be converted to an array using `toArray()` for easier output:

```js
/*
output:
<p>a, b, c</p>
*/
const out4 = templateParse(
  '<p>${ toArray(data.set).join(', ') }</p>',
  { set: new Set(['a', 'b', 'c']) }
);
```


## File includes

A template can include another with `include(filename)`:

```js
const out5 = templateParse(
  '${ include("./template/index.html") }',
  {}
);
```

Files can be fully-qualified or relative to the project root directory. You can also set a template directory using `tacsConfig`. All includes and sub-includes will use this directory:

```js
import { tacsConfig, templateParse } from 'jstacs';

tacsConfig.dir.template = './template/';

const out6 = templateParse(
  '${ include("index.html") }',
  {}
);
```


## Global values

Global values can be passed to a template using the `tacs` object. This can contain any values or functions.

```js
import { tacs, templateParse } from 'jstacs';

tacs.global = tacs.global || {};
tacs.global.list = ['a', 'b', 'c'];

tacs.exec = tacs.exec || {};
tacs.exec.olList = list => '<ol>' + list.map(i => `<li>${ i }</li>`).join('') + '<ol>';

/*
output:
<ol><li>1</li><li>2</li><li>3</li></ol>
<ol><li>a</li><li>b</li><li>c</li></ol>
*/
const out7 = templateParse(
  '${ tacs.exec.olList( tacs.global.list ) }\n${ tacs.exec.olList( data.list ) }\n',
  { list: [ 1, 2, 3 ] }
);
```


## Pre-loading templates

`templateMap` is a Map object used to cache template strings loaded from files. It can be used to pre-load templates or set (or unset) virtual files so they are available when an `include()` is referenced:

```js
import { templateMap, templateParse } from 'jstacs';

templateMap.set('/home/user/project/template/index.html', '${ include("header.html") }');
templateMap.set('/home/user/project/template/header.html', '<h1>${ data.title }</h1>');
```

Note that the full path is required even if `tacsConfig.dir.template` has been set.

Alternatively, you can load and cache individual files using `templateGet()`, but this uses `readFileSync` so it will not be as effect as other methods:

```js
import { templateGet, templateParse } from 'jstacs';

templateGet('/home/user/project/template/file.html');
```


## Using jsTACS as a rendering engine

jsTACS can be used as an Express.js rendering engine. Ideally, templates should be pre-rendered first with `!{ expressions }` so only runtime values need be replaced:

```js
import express from 'express';
import { templateEngine } from 'jstacs';

const
  app = express(),
  port = 8181;

app.engine('html', templateEngine);
app.set('views', './templates');
app.set('view engine', 'html');

// render template at ./templates/index.html
app.get('/', (req, res) => {
  res.render('index', { runtime: 'runtime message' });
});

app.listen(port, () => {
  console.log(`Express started on port ${port}`);
});
```


## Advanced options

`tacsConfig.maxIterations` is set to 50 by default. This ensures no more than 50 `templateParse()` iterations will occur and prevents circular `include()` expressions or recursive expressions writing other expressions.
