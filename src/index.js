import {clone} from 'lodash';

export const getFieldsFromAst = function (info, ast, fields = {}) {
  ast.selectionSet.selections.map(function (selection) {
    if (selection.kind === 'Field') {
      fields[selection.name.value] = selection;
    } else if (selection.kind === 'FragmentSpread') {
      let fragment = info.fragments[selection.name.value];
      getFieldsFromAst(info, fragment, fields);
    }
  });

  return fields;
};

export const getFieldsFromInfo = function (info) {
  return getFieldsFromAst(info, info.fieldASTs[0]);
};

export const withContext = function (originalPayload, _contextFn) {
  let contextFn = _contextFn;
  if (typeof contextFn !== 'function') {
    let context = contextFn;
    contextFn = () => context;
  }

  var resultPayload;
  if (originalPayload instanceof Array) {
    resultPayload = [];
    originalPayload.forEach(_o => {
      let o = clone(_o);
      o.__context = contextFn(o);
      resultPayload.push(o);
    });
  } else {
    resultPayload = clone(originalPayload);
    resultPayload.__context = contextFn(originalPayload);
  }

  return resultPayload;
};

export const getContext = function (source) {
  return source.__context;
};
