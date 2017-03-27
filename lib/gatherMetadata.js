/**
 * @author Dmitriy Bizyaev
 */

'use strict';

const co = require('co');
const path = require('path');
const fs = require('mz/fs');
const rv = require('revalidator');
const AsyncTreeWalker = require('@common/tree').AsyncTreeWalker;
const { isValidValue, printType, isBuiltinType } = require('@jssy/types');
const constants = require('./constants');

const {
  typesSchema,
  stringsSchema,
  metaSchema,
  mainMetaSchema,
} = require('./schemas');

const validationOptions = {
  validateFormats: true,
  validateFormatsStrict: true,
  validateFormatExtensions: true,
  additionalProperties: false,
  cast: false,
};

/**
 *
 * @param {string} filename
 * @return {Promise<*>}
 */
const readJSONFile = filename => co(function* () {
  let json;
  
  try {
    json = yield fs.readFile(filename, { encoding: 'utf8' });
  } catch (err) {
    if (err.code === 'ENOENT') return null;
    throw new Error(`FS error while reading ${filename}: ${err.code}`);
  }
  
  let data;
  
  try {
    data = JSON.parse(json);
  } catch (err) {
    throw new Error(`Malformed JSON in ${filename}`);
  }
  
  return data;
});

/**
 *
 * @param {string} propName
 * @param {ComponentPropMeta} propMeta
 * @param {Object<string, Object<string, string>>} strings
 * @param {Object<string, Object>} types
 * @param {string} componentName
 * @throws {Error}
 */
const checkAdditionalPropTypeData = (
  propName,
  propMeta,
  strings,
  types,
  componentName = ''
) => {
  if (propMeta.textKey && !strings[propMeta.textKey]) {
    throw new Error(
      `Unknown string '${propMeta.textKey}' ` +
      `in textKey of prop '${propName}' ` +
      `of component '${componentName}'`
    );
  }
  
  if (propMeta.descriptionTextKey && !strings[propMeta.descriptionTextKey]) {
    throw new Error(
      `Unknown string '${propMeta.descriptionTextKey}' ` +
      `in descriptionKey of prop '${propName}' ` +
      `of component '${componentName}'`
    );
  }
  
  const hasDefaultValue =
    propMeta.source &&
    propMeta.source.indexOf('static') > -1 &&
    propMeta.sourceConfigs &&
    propMeta.sourceConfigs.static &&
    typeof propMeta.sourceConfigs.static.default !== 'undefined';
  
  if (hasDefaultValue) {
    const defaultValueIsInvalid =
      !isValidValue(propMeta.sourceConfigs.static.default, propMeta, types);
    
    if (defaultValueIsInvalid) {
      throw new Error(
        `'${componentName}': Default static value of prop '${propName}' ` +
        `is not valid for type '${printType(propMeta, types)}'`
      );
    }
  }
  
  const hasConstValue =
    propMeta.source &&
    propMeta.source.indexOf('const') > -1 &&
    propMeta.sourceConfigs &&
    propMeta.sourceConfigs.const &&
    typeof propMeta.sourceConfigs.const.value !== 'undefined';
  
  if (hasConstValue) {
    const constValueIsInvalid =
      !isValidValue(propMeta.sourceConfigs.const.value, propMeta, types);
    
    if (constValueIsInvalid) {
      throw new Error(
        `'${componentName}': Const value of prop '${propName}' ` +
        `is not valid for type '${printType(propMeta, types)}'`
      );
    }
  }
  
  const hasOwnerProps =
    propMeta.source &&
    propMeta.source.indexOf('designer') > -1 &&
    propMeta.sourceConfigs &&
    propMeta.sourceConfigs.designer &&
    propMeta.sourceConfigs.designer.props;
  
  if (hasOwnerProps) {
    Object.keys(propMeta.sourceConfigs.designer.props).forEach(key => {
      const ownerProp = propMeta.sourceConfigs.designer.props[key];
      
      if (!strings[ownerProp.textKey]) {
        throw new Error(
          `Unknown string '${ownerProp.textKey}' ` +
          `in owner props list of prop '${propName}' ` +
          `of component '${componentName}'`
        );
      }
      
      if (!strings[ownerProp.descriptionTextKey]) {
        throw new Error(
          `Unknown string '${ownerProp.descriptionTextKey}' ` +
          `in owner props list of prop '${propName}' ` +
          `of component '${componentName}'`
        );
      }
    });
    
    // TODO: Check dataContext
  }
  
  if (propMeta.type === 'oneOf') {
    if (typeof propMeta.options === 'undefined') {
      throw new Error(
        `'${componentName}': Prop '${propName}' ` +
        'of type \'oneOf\' must have \'options\' field'
      );
    }
    
    for (let i = 0, l = propMeta.options.length; i < l; i++) {
      const optionTextKey = propMeta.options[i].textKey;
      
      if (!strings[optionTextKey]) {
        throw new Error(
          `Unknown string '${optionTextKey}' ` +
          `in options list of prop '${propName}' ` +
          `of component '${componentName}'`
        );
      }
    }
  } else if (propMeta.type === 'arrayOf') {
    if (typeof propMeta.ofType === 'undefined') {
      throw new Error(
        `'${componentName}': Prop '${propName}' ` +
        'of type \'arrayOf\' must have \'ofType\' field'
      );
    }
    
    checkAdditionalPropTypeData(
      `${propName}.[]`,
      propMeta.ofType,
      strings,
      types,
      componentName
    );
  } else if (propMeta.type === 'objectOf') {
    if (typeof propMeta.ofType === 'undefined') {
      throw new Error(
        `'${componentName}': Prop '${propName}' ` +
        'of type \'objectOf\' must have \'ofType\' field'
      );
    }
    
    checkAdditionalPropTypeData(
      `${propName}.{}`,
      propMeta.ofType,
      strings,
      types,
      componentName
    );
  } else if (propMeta.type === 'shape') {
    if (typeof propMeta.fields === 'undefined') {
      throw new Error(
        `'${componentName}': Prop '${propName}' ` +
        'of type \'shape\' must have \'fields\' field'
      );
    }
    
    const fields = Object.keys(propMeta.fields);
    
    for (let i = 0, l = fields.length; i < l; i++) {
      checkAdditionalPropTypeData(
        `${propName}.${fields[i]}`,
        propMeta.fields[fields[i]],
        strings,
        types,
        componentName
      );
    }
  } else if (propMeta.type === 'string') {
    const hasDefaultTextKey =
      propMeta.source &&
      propMeta.source.indexOf('static') > -1 &&
      propMeta.sourceConfigs.static &&
      propMeta.sourceConfigs.static.defaultTextKey;
    
    if (hasDefaultTextKey) {
      const defaultTextKey = propMeta.sourceConfigs.static.defaultTextKey;
      
      if (!strings[defaultTextKey]) {
        throw new Error(
          `Unknown string '${defaultTextKey}' ` +
          `in defaultTextKey of prop '${propName}' ` +
          `of component '${componentName}'`
        );
      }
    }
  }
};

/**
 *
 * @param {string} typeName
 * @param {JssyTypeDefinition} typedef
 * @param {Object<string, Object<string, string>>} strings
 * @param {Object<string, Object>} types
 * @throws {Error}
 */
const checkAdditionalTypedefTypeData = (typeName, typedef, strings, types) => {
  if (typedef.type === 'oneOf') {
    if (typeof typedef.options === 'undefined') {
      throw new Error(
        `Type '${typeName}' (oneOf) must have 'options' field`
      );
    }
    
    for (let i = 0, l = typedef.options.length; i < l; i++) {
      const optionTextKey = typedef.options[i].textKey;
      
      if (!strings[optionTextKey]) {
        throw new Error(
          `Unknown string '${optionTextKey}' ` +
          `in options list of type '${typeName}'`
        );
      }
    }
  } else if (typedef.type === 'arrayOf') {
    if (typeof typedef.ofType === 'undefined') {
      throw new Error(
        `Type '${typeName}' (arrayOf) must have 'ofType' field`
      );
    }
    
    checkAdditionalPropTypeData('[]', typedef.ofType, strings, types);
  } else if (typedef.type === 'objectOf') {
    if (typeof typedef.ofType === 'undefined') {
      throw new Error(
        `Type '${typeName}' (objectOf) must have 'ofType' field`
      );
    }
    
    checkAdditionalPropTypeData('{}', typedef.ofType, strings, types);
  } else if (typedef.type === 'shape') {
    if (typeof typedef.fields === 'undefined') {
      throw new Error(
        `Type '${typeName}' (shape) must have 'fields' field`
      );
    }
    
    const fields = Object.keys(typedef.fields);
    
    for (let i = 0, l = fields.length; i < l; i++) {
      checkAdditionalPropTypeData(
        fields[i],
        typedef.fields[fields[i]],
        strings,
        types
      );
    }
  }
};

/**
 *
 * @param {string} metaDir
 * @param {Object<string, Object<string, string>>} strings
 * @return {Promise<Object<string, PropTypeDefinition>>}
 */
const readTypedefs = (metaDir, strings) => co(function* () {
  const typesFile = path.join(metaDir, constants.METADATA_TYPES_FILE);
  const types = yield readJSONFile(typesFile);
  
  if (!types) return null;
  
  let validationResult;
  
  try {
    validationResult = rv.validate(types, typesSchema);
  } catch (err) {
    throw new Error(
      'Error while performing formal validation ' +
      `of file ${typesFile}: ${err.message}`
    );
  }
  
  const { valid, errors } = validationResult;
  
  if (!valid) {
    const err = new Error(`Invalid typedefs in ${typesFile}`);
    err.validationErrors = errors;
    throw err;
  }
  
  const typeNames = Object.keys(types);
  
  for (let j = 0, m = typeNames.length; j < m; j++) {
    checkAdditionalTypedefTypeData(
      typeNames[j],
      types[typeNames[j]],
      strings,
      types
    );
  }
  
  return types;
});

/**
 *
 * @param {string} metaDir
 * @return {Promise<Object<string, Object<string, string>>>}
 */
const readStrings = metaDir => co(function* () {
  const stringsFile = path.join(metaDir, constants.METADATA_STRINGS_FILE);
  const strings = yield readJSONFile(stringsFile);
  
  if (!strings) return null;
  
  let validationResult;
  
  try {
    validationResult = rv.validate(strings, stringsSchema);
  } catch (err) {
    throw new Error(
      'Error while performing formal validation ' +
      `of file ${stringsFile}: ${err.message}`
    );
  }
  
  const { valid, errors } = validationResult;
  
  if (!valid) {
    const err = new Error(`Invalid strings in ${stringsFile}`);
    err.validationErrors = errors;
    throw err;
  }
  
  return strings;
});

/**
 *
 * @param {string} metaDir
 * @return {Promise<ComponentMeta>}
 */
const readComponentMeta = metaDir => co(function* () {
  const metaFile = path.join(metaDir, constants.METADATA_FILE);
  const meta = yield readJSONFile(metaFile);
  
  let validationResult;
  
  try {
    validationResult = rv.validate(meta, metaSchema, validationOptions);
  } catch (err) {
    throw new Error(
      'Error while performing formal validation ' +
      `of file ${metaFile}: ${err.message}`
    );
  }
  
  const { valid, errors } = validationResult;
  
  if (!valid) {
    const err = new Error(`Invalid metadata in ${metaFile}`);
    err.validationErrors = errors;
    throw err;
  }
  
  if (!meta.strings) meta.strings = (yield readStrings(metaDir)) || {};
  
  if (!meta.types)
    meta.types = (yield readTypedefs(metaDir, meta.strings)) || {};
  
  if (!meta.props) meta.props = {};
  if (!meta.propGroups) meta.propGroups = [];
  
  for (let i = 0, l = meta.propGroups.length; i < l; i++) {
    if (!meta.strings[meta.propGroups[i].textKey]) {
      throw new Error(
        `Unknown string '${meta.propGroups[i].textKey}' ` +
        `in prop groups list of component '${meta.displayName}'`
      );
    }
  }
  
  const props = Object.keys(meta.props);
  
  for (let i = 0, l = props.length; i < l; i++) {
    const propMeta = meta.props[props[i]];
    
    const groupIsOk =
      !propMeta.group ||
      meta.propGroups.some(group => group.name === propMeta.group);
    
    if (!groupIsOk) {
      throw new Error(
        `Unknown props group '${propMeta.group}' ` +
        `in prop '${props[i]}' ` +
        `of component '${meta.displayName}'`
      );
    }
    
    if (isBuiltinType(propMeta.type)) {
      checkAdditionalPropTypeData(
        props[i],
        propMeta,
        meta.strings,
        meta.types,
        meta.displayName
      );
    } else if (typeof meta.types[propMeta.type] === 'undefined') {
      throw new Error(
        `Unknown type '${propMeta.type}' ` +
        `in prop ${props[i]} ` +
        `of component ${meta.displayName}`
      );
    }
  }
  
  if (meta.kind === 'composite') {
    if (!meta.layouts) {
      throw new Error(
        '\'layouts\' field not found in metadata ' +
        `for composite component '${meta.displayName}'`
      );
    }
    
    for (let i = 0, l = meta.layouts.length; i < l; i++) {
      const layout = meta.layouts[i];
      if (layout.textKey && !meta.strings[layout.textKey]) {
        throw new Error(
          `Unknown string '${layout.textKey}' ` +
          `in layouts of component '${meta.displayName}'`
        );
      }
      
      if (
        layout.descriptionTextKey &&
        !meta.strings[layout.descriptionTextKey]
      ) {
        throw new Error(
          `Unknown string '${layout.descriptionTextKey}' ` +
          `in layouts of component '${meta.displayName}'`
        );
      }
      
      const regions = layout.regions;
      for (let j = 0, m = regions.length; j < m; j++) {
        if (!meta.strings[regions[j].textKey]) {
          throw new Error(
            `Unknown string '${regions[j].textKey}' ` +
            `in layouts of component '${meta.displayName}'`
          );
        }
        
        if (!meta.strings[regions[j].descriptionTextKey]) {
          throw new Error(
            `Unknown string '${regions[j].descriptionTextKey}' ` +
            `in layouts of component '${meta.displayName}'`
          );
        }
      }
    }
  }
  
  return meta;
});

/**
 *
 * @param {string} dir
 * @return {Promise<boolean>}
 */
const isDirectory = dir => co(function* () {
  let stats;
  try {
    stats = yield fs.stat(dir);
  } catch (err) {
    if (err.code === 'ENOENT') return false;
    throw err;
  }
  
  return stats.isDirectory();
});

const visitNode = ({ dir }) => co(function* () {
  const jssyMetaDir = path.join(dir, constants.METADATA_DIR);
  
  return (yield isDirectory(jssyMetaDir))
    ? (yield readComponentMeta(jssyMetaDir))
    : null;
});

const getChildNodes = ({ dir }) => co(function* () {
  const contents = yield fs.readdir(dir);
  const ret = [];
  
  for (let i = 0, l = contents.length; i < l; i++) {
    if (contents[i] === constants.METADATA_DIR) continue;
    const fullPath = path.join(dir, contents[i]);
    if (yield isDirectory(fullPath)) ret.push({ dir: fullPath });
  }
  
  return ret;
});

/**
 * @typedef {Object} LibMetadata
 * @property {string} namespace
 * @property {boolean} globalStyle
 * @property {string[]} import
 * @property {Object<string, string[]>} loaders
 * @property {Object<string, Object>} components
 * @property {Object} packageJSON
 */

/**
 *
 * @param {string} moduleDir
 * @return {Promise<LibMetadata>}
 */
module.exports = moduleDir => co(function* () {
  const mainMetaFile = path.join(moduleDir, constants.METADATA_MAIN_FILE);
  let mainMeta = yield readJSONFile(mainMetaFile);
  
  if (!mainMeta) {
    const packageJSON = require(path.join(moduleDir, 'package.json'));
    mainMeta = packageJSON.jssy;
  }
  
  if (!mainMeta) throw new Error('Not a jssy components library');
  
  const { valid, errors } = rv.validate(mainMeta, mainMetaSchema);
  
  if (!valid) {
    const err = new Error('Invalid main metadata');
    err.validationErrors = errors;
    throw err;
  }
  
  if (mainMeta.containerStyle && !mainMeta.globalStyle)
    throw new Error('containerStyle only allowed when globalStyle is true');
  
  if (!mainMeta.componentGroups) mainMeta.componentGroups = {};
  
  const ret = Object.assign({}, mainMeta);
  
  if (!ret.components) {
    ret.components = {};
    
    const walker = new AsyncTreeWalker([{ dir: moduleDir }], getChildNodes);
    let node;
    
    // eslint-disable-next-line no-cond-assign
    while (node = yield walker.next()) {
      try {
        const maybeMeta = yield visitNode(node);
        
        if (maybeMeta !== null) {
          if (maybeMeta.group && !mainMeta.componentGroups[maybeMeta.group]) {
            //noinspection ExceptionCaughtLocallyJS
            throw new Error(
              `'${maybeMeta.displayName}' component: ` +
              `group '${maybeMeta.group}' is not defined.`
            );
          }
          
          maybeMeta.tags = new Set(maybeMeta.tags || []);
          
          ret.components[maybeMeta.displayName] = maybeMeta;
        }
      } catch (err) {
        err.message =
          `Error while reading components metadata of '${ret.namespace}': ` +
          `${err.message || err.toString()}`;
        
        throw err;
      }
    }
  }
  
  if (ret.tags) {
    Object.keys(ret.tags).forEach(tag => {
      ret.tags[tag].forEach(componentName => {
        if (!ret.components[componentName]) {
          throw new Error(
            `Unknown component '${componentName}' ` +
            `in tags section (tag '${tag}') of jssy.json`
          );
        }
        
        ret.components[componentName].tags.add(tag);
      });
    });
  }
  
  Object.keys(ret.components).forEach(componentName => {
    ret.components[componentName].tags =
      Array.from(ret.components[componentName].tags);
  });
  
  return ret;
});
