# jsTACS

JavaScript Templating and Caching System for Node.js.

*This is a beta product primary designed for the [Publican static site generator](https://www.npmjs.com/package/publican). Please use at your own discretion.*

jsTACs uses tagged template literals for zero-dependency fast template rendering. Features:

* ECMAScript module
* standard JavaScript template literal `${ expression }`
* `!{ expression }` is ignored in the initial render so it can be evaluated at runtime. It's possible to pre-build templates so only runtime data remains.
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
const out1a = templateParse(
  '<p>Hello ${ data.name }!</p>',
  { name: 'World' }
);


/*
output:
<p>Hello World!</p>
*/
const out1b = templateParse(
  '${ data.name && `<p>Hello ${ data.name }!</p>` }',
  { name: 'World' }
);

/*
output: blank
*/
const out1c = templateParse(
  '${ data.name && `<p>Hello ${ data.name }!</p>` }',
  { name: null }
);
```

`data` properties such as `data.name` typically hold a string, number, or another native value. `null`, `undefined`, and `NaN` return an empty string, but `true`, `false`, and `0` are rendered as text. Arrays, Sets, and Maps are automatically output: there's no need for `.join('')` unless you want a specific character between each value.

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
  '<p>${ toArray( data.set ).join(', ') }</p>',
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

Files can be fully-qualified or relative to the project root directory. You can also set a template directory in the `tacsConfig` configuration object. All includes and sub-includes use this directory:

```js
import { tacsConfig, templateParse } from 'jstacs';

tacsConfig.dir.template = './template/';

const out6 = templateParse(
  '${ include("index.html") }',
  {}
);
```


## Global values

Global values and functions can be passed to a template using the `tacs` object.

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

The `templateMap` Map object used to cache template strings loaded from files. It can be used to pre-load templates and set (or unset) virtual files so they are available when an `include()` is referenced:

```js
import { templateMap, templateParse } from 'jstacs';

tacsConfig.dir.template = './template/';

templateMap.set('index.html', '${ include("header.html") }');
templateMap.set('_partials/header.html', '<h1>${ data.title }</h1>');
```

The path is relative to `tacsConfig.dir.template` or the project root if not set.

Alternatively, you can load and cache individual files using `templateGet()`. Note this uses `readFileSync` and may not be as efficient as other methods:

```js
import { templateGet, templateParse } from 'jstacs';

tacsConfig.dir.template = './template/';

templateGet('file.html');
```


## Using jsTACS as a rendering engine

jsTACS can be used as an Express.js rendering engine. Ideally, templates should be pre-rendered first with `!{ expressions }` so only runtime values need be replaced.

```js
import express from 'express';
import { templateEngine } from 'jstacs';

const
  app = express(),
  port = 8181;

app.engine('html', templateEngine);
app.set('views', './templates/');
app.set('view engine', 'html');

// render template at ./templates/index.html
app.get('/', (req, res) => {
  res.render('index', {
    title: 'Page title',
    runtime: 'runtime message'
  });
});

app.listen(port, () => {
  console.log(`Express started on port ${port}`);
});
```


## Advanced options

`tacsConfig.maxIterations` is set to 50 by default. This ensures no more than 50 `templateParse()` iterations will occur and prevents circular `include()` expressions or recursive expressions writing other expressions.
