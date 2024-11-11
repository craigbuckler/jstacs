import { tacsConfig, tacs, templateGet, templateParse, templateEngine } from '../jstacs.js';

import { describe, it, test } from 'node:test';
import assert from 'node:assert';

tacsConfig.dir.template = './tests/template/';


describe('jsTACS templateGet', () => {

  [
    {
      file: './tests/template/name.html',
      content: '<p>first name: ${ data.nameFirst }</p><p>last name: ${ data.nameLast }</p>\n'
    },
    {
      file: './tests/template/index.html',
      content: '${ include(\'header.html\') }\n<p>${ data.content }</p>\n'
    },
  ].forEach((set, idx) => {

    it(
      `templateGet test ${ idx + 1 }: ${ set.file }`,
      () => assert.strictEqual(templateGet(set.file), set.content)
    );

  });

});


describe('jsTACS templateParse', () => {

  [
    {
      name: 'string replacement',
      template: '<p>first name: ${ data.nameFirst }</p><p>last name: ${ data.nameLast }</p>',
      data: { nameFirst: 'Craig', nameLast: 'Buckler' },
      result: '<p>first name: Craig</p><p>last name: Buckler</p>'
    },
    {
      name: 'string replacement with NaN, null, and undefined values',
      template: '<p>first name: ${ data.nameFirst }</p><p>middle name: ${ data.nameMiddle }</p><p>last name: ${ data.nameLast }</p>',
      data: { nameFirst: parseInt('Craig'), nameLast: null },
      result: '<p>first name: </p><p>middle name: </p><p>last name: </p>'
    },
    {
      name: 'string replacement with && expression',
      template: '${ data.nameFirst && `<p>first name: ${ data.nameFirst }</p>` }${ data.nameLast && `<p>last name: ${ data.nameLast }</p>` }',
      data: { nameFirst: 'Craig', nameLast: null },
      result: '<p>first name: Craig</p>'
    },
    {
      name: 'string replacement with runtime evaluation',
      template: '<p>first name: ${ data.nameFirst }</p><p>last name: !{ data.nameLast }</p>',
      data: { nameFirst: 'Craig', nameLast: 'Buckler' },
      result: '<p>first name: Craig</p><p>last name: ${ data.nameLast }</p>'
    },
    {
      name: 'array list',
      template: '<p>list: ${ data.list }</p>',
      data: { list: ['a','b','c'] },
      result: '<p>list: abc</p>'
    },
    {
      name: 'array with mapping',
      template: '<p>list: ${ toArray(data.list).map(x => x * 2).join(",") }</p>',
      data: { list: [1,2,3] },
      result: '<p>list: 2,4,6</p>'
    },
    {
      name: 'HTML template with include()',
      template: '${ include("index.html") }',
      data: { title: 'Page title', content: 'Page content' },
      result: '<header>Page title</header>\n\n<p>Page content</p>\n'
    },
    {
      name: 'HTML template with custom function in tacs global',
      template: '${ include("globals.html") }',
      tacs: {
        exec: { makeList: i => '<ol>' + i.map(item => `<li>${ item }</li>`).join('') + '</ol>' }
      },
      data: { list: [1,2,3] },
      result: '<ol><li>1</li><li>2</li><li>3</li></ol>\n'
    }
  ].forEach((set, idx) => {

    it(
      `templateParse test ${ idx + 1 }: ${ set.name }`,
      () => {
        if (set.tacs) {
          for(const p in set.tacs) tacs[p] = set.tacs[p];
        }
        return assert.strictEqual(templateParse(set.template, set.data), set.result);
      }
    );

  });

});


test('jsTACS Express.js templateEngine test string replacement', (t, done) => {

  function callback(error, data) {
    try {
      assert.strictEqual(data, '<p>first name: Craig</p><p>last name: Buckler</p>\n');
      done();
    }
    catch (error) {
      done(new Error(error));
    }
  }

  templateEngine('./tests/template/name.html', { nameFirst: 'Craig', nameLast: 'Buckler' }, callback);

});


test('jsTACS Express.js templateEngine test template include', (t, done) => {

  function callback(error, data) {
    try {
      assert.strictEqual(data, '<header>Main title</header>\n\n<p>Some text</p>\n');
      done();
    }
    catch (error) {
      done(new Error(error));
    }
  }

  templateEngine('./tests/template/index.html', { title: 'Main title', content: 'Some text' }, callback);

});
