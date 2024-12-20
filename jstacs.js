/*
JavaScript Templating and Caching System
A simple templating system using tagged template literals
By Craig Buckler
https://github.com/craigbuckler/jstacs
*/
import { join, dirname, basename } from 'node:path';
import { readFileSync } from 'node:fs';

// template configuration
export const tacsConfig = {
  dir: {
    template: ''
  },
  maxIterations: 50
};

// global values
export const tacs = {};

// map of template files
export const templateMap = new Map();


// get and store a template file
export function templateGet(file) {

  // get template from cache
  let content = templateMap.get(file);

  if (content === undefined) {

    // get and cache file content
    content = readFileSync( join(tacsConfig.dir.template, file), { encoding: 'utf8' } );
    templateMap.set(file, content);

  }

  return content || '';

}


// parse template with data and return string
export function templateParse(template = '', data) {

  // prevents recursive includes
  let iteration = tacsConfig.maxIterations;

  // iteratively render template
  let olen = 0;
  while (template.length !== olen) {
    olen = template.length;
    template = parser(template);
  }

  // replace render-time values
  return template.replace(/!\{/g, '${');


  // template evaluation
  function parser(str) {
    iteration--;
    return iteration > 0 ? eval('html`' + str +  '`') : '';
  }


  // tagged template literal
  function html(str, ...value) {

    let ret = '';
    str.forEach((s, i) => {

      ret += s;
      const v = (i < value.length) ? value[i] : null;
      if (v !== undefined && v !== null && !Number.isNaN(v)) {

        if (typeof v === 'object') ret += String( toArray(v).join('') );
        else ret += String( v ?? '' );

      }

    });

    return ret;

  };


  // include file content
  function include(file) {

    const content = templateGet(file);
    return content ? parser(content) : '';

  }


  // convert any value to an array
  function toArray(obj) {

    if (Array.isArray(obj)) return obj;
    if (obj === null || obj === undefined || Number.isNaN(obj)) return [];
    if (obj instanceof Set) return [...obj];
    if (obj instanceof Map) return Array.from(obj, ([, value]) => value);
    return [obj];

  }

}


// Express-compatible rendering function
export function templateEngine(file, data, callback) {

  // back-up template directory
  const cfgDirTemplate = tacsConfig.dir.template;

  // set tempate directory to template path
  tacsConfig.dir.template = dirname(file);

  // render template
  const render = templateParse( templateGet( basename(file) ), data );

  // revert template directory
  tacsConfig.dir.template = cfgDirTemplate;

  // callback
  setImmediate( callback, null, render );

}
