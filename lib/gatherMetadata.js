'use strict';

const co = require('co');
const path = require('path');
const fs = require('mz/fs');
const rv = require('revalidator');
const _forOwn = require('lodash.forown');
const AsyncTreeWalker = require('booben-common-tree').AsyncTreeWalker;
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
 * @param {string} [componentName='']
 * @param {boolean} [hasTextAndDesc=true]
 * @throws {Error}
 */
const checkAdditionalPropTypeData = (
  propName,
  propMeta,
  strings,
  types,
  componentName = '',
  hasTextAndDesc = true
) => {
  if (hasTextAndDesc && !strings[propMeta.textKey]) {
    throw new Error(
      `Unknown string '${propMeta.textKey}' ` +
      `in textKey of prop '${propName}' ` +
      `of component '${componentName}'`
    );
  }
  
  if (hasTextAndDesc && !strings[propMeta.descriptionTextKey]) {
    throw new Error(
      `Unknown string '${propMeta.descriptionTextKey}' ` +
      `in descriptionKey of prop '${propName}' ` +
      `of component '${componentName}'`
    );
  }
  
  if (propMeta.source && propMeta.sourceConfigs) {
    _forOwn(propMeta.sourceConfigs, (_, source) => {
      if (propMeta.source.indexOf(source) === -1) {
        throw new Error(
          `Got '${source}' source config ` +
          `but '${source}' is not in sources list for prop '${propName}' ` +
          `of component '${componentName}'`
        );
      }
    });
  
    const hasDefaultValue =
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
  
    const hasDefaultTextKey =
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
      componentName,
      false
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
      componentName,
      false
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
  }
};

/**
 *
 * @param {string} typeName
 * @param {JssyTypeDefinition} typedef
 * @param {Object<string, Object<string, string>>} strings
 * @param {Object<string, Object>} types
 * @param {string} componentName
 * @throws {Error}
 */
const checkAdditionalTypedefTypeData = (
  typeName,
  typedef,
  strings,
  types,
  componentName
) => {
  if (typedef.type === 'oneOf') {
    if (!typedef.options) {
      throw new Error(
        `Type '${typeName}' (oneOf) must have 'options' field`
      );
    }
  
    typedef.options.forEach(option => {
      if (!strings[option.textKey]) {
        throw new Error(
          `Unknown string '${option.textKey}' ` +
          `in options list of type '${typeName}'`
        );
      }
    });
  } else if (typedef.type === 'arrayOf') {
    if (!typedef.ofType) {
      throw new Error(
        `Type '${typeName}' (arrayOf) must have 'ofType' field`
      );
    }
    
    checkAdditionalPropTypeData(
      `[types].${typeName}.[]`,
      typedef.ofType,
      strings,
      types,
      componentName
    );
  } else if (typedef.type === 'objectOf') {
    if (!typedef.ofType) {
      throw new Error(
        `Type '${typeName}' (objectOf) must have 'ofType' field`
      );
    }
    
    checkAdditionalPropTypeData(
      `[types].${typeName}.{}`,
      typedef.ofType,
      strings,
      types,
      componentName
    );
  } else if (typedef.type === 'shape') {
    if (!typedef.fields) {
      throw new Error(
        `Type '${typeName}' (shape) must have 'fields' field`
      );
    }
    
    _forOwn(typedef.fields, (field, fieldName) => {
      checkAdditionalPropTypeData(
        `[types].${typeName}.${fieldName}`,
        field,
        strings,
        types,
        componentName
      );
    });
  }
};

/**
 *
 * @param {string} metaDir
 * @param {Object<string, Object<string, string>>} strings
 * @param {string} componentName
 * @return {Promise<Object<string, JssyTypeDefinition>>}
 */
const readTypedefs = (metaDir, strings, componentName) => co(function* () {
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
  
  _forOwn(types, (type, typeName) => {
    checkAdditionalTypedefTypeData(
      typeName,
      type,
      strings,
      types,
      componentName
    );
  });
  
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
  
  if (!meta.types) {
    meta.types =
      (yield readTypedefs(metaDir, meta.strings, meta.displayName)) || {};
  }
  
  if (!meta.props) meta.props = {};
  if (!meta.propGroups) meta.propGroups = [];
  
  meta.propGroups.forEach(propGroup => {
    if (!meta.strings[propGroup.textKey]) {
      throw new Error(
        `Unknown string '${propGroup.textKey}' ` +
        `in prop groups list of component '${meta.displayName}'`
      );
    }
  });
  
  _forOwn(meta.props, (propMeta, propName) => {
    const groupIsOk =
      !propMeta.group ||
      meta.propGroups.some(group => group.name === propMeta.group);
  
    if (!groupIsOk) {
      throw new Error(
        `Unknown props group '${propMeta.group}' ` +
        `in prop '${propName}' ` +
        `of component '${meta.displayName}'`
      );
    }
  
    if (isBuiltinType(propMeta.type)) {
      checkAdditionalPropTypeData(
        propName,
        propMeta,
        meta.strings,
        meta.types,
        meta.displayName
      );
    } else if (typeof meta.types[propMeta.type] === 'undefined') {
      throw new Error(
        `Unknown type '${propMeta.type}' ` +
        `in prop ${propName} ` +
        `of component ${meta.displayName}`
      );
    }
  });
  
  if (meta.kind === 'composite') {
    if (!meta.layouts) {
      throw new Error(
        '\'layouts\' field not found in metadata ' +
        `for composite component '${meta.displayName}'`
      );
    }
  
    meta.layouts.forEach(layout => {
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
  
      layout.regions.forEach(region => {
        if (!meta.strings[region.textKey]) {
          throw new Error(
            `Unknown string '${region.textKey}' ` +
            `in layouts of component '${meta.displayName}'`
          );
        }
  
        if (!meta.strings[region.descriptionTextKey]) {
          throw new Error(
            `Unknown string '${region.descriptionTextKey}' ` +
            `in layouts of component '${meta.displayName}'`
          );
        }
      });
    });
  }
  
  if (meta.state) {
    _forOwn(meta.state, (stateSlot, name) => {
      if (!meta.strings[stateSlot.textKey]) {
        throw new Error(
          `Unknown string '${stateSlot.textKey}' ` +
          `in text key of state slot '${name}' ` +
          `of component '${meta.displayName}'`
        );
      }
  
      if (!meta.strings[stateSlot.descriptionTextKey]) {
        throw new Error(
          `Unknown string '${stateSlot.textKey}' ` +
          `in description text key of state slot '${name}' ` +
          `of component '${meta.displayName}'`
        );
      }
  
      if (isBuiltinType(stateSlot.type)) {
        checkAdditionalPropTypeData(
          `[state].${name}`,
          stateSlot,
          meta.strings,
          meta.types,
          meta.displayName
        );
      } else if (!meta.types[stateSlot.type]) {
        throw new Error(
          `Unknown type '${stateSlot.type}' ` +
          `of state slot '${name}' ` +
          `of component '${meta.displayName}'`
        );
      }
      
      if (stateSlot.initialValue.source === 'prop') {
        const propName = stateSlot.initialValue.sourceData.propName;
        
        if (!meta.props[propName]) {
          throw new Error(
            `Unknown prop reference '${propName}' ` +
            `in initial value configuration of state slot '${name}' ` +
            `of component '${meta.displayName}'`
          );
        }
      }
    });
  }
  
  if (meta.methods) {
    _forOwn(meta.methods, (method, name) => {
      if (!meta.strings[method.textKey]) {
        throw new Error(
          `Unknown string '${method.textKey}' ` +
          `in text key of method '${name}' ` +
          `of component '${meta.displayName}'`
        );
      }
      
      if (!meta.strings[method.descriptionTextKey]) {
        throw new Error(
          `Unknown string '${method.textKey}' ` +
          `in description text key of method '${name}' ` +
          `of component '${meta.displayName}'`
        );
      }
      
      method.args.forEach((arg, idx) => {
        if (!meta.strings[arg.textKey]) {
          throw new Error(
            `Unknown string '${arg.textKey}' ` +
            `in text key of argument ${idx} in method '${name}' ` +
            `of component '${meta.displayName}'`
          );
        }
  
        if (!meta.strings[arg.descriptionTextKey]) {
          throw new Error(
            `Unknown string '${arg.descriptionTextKey}' ` +
            `in description text key of argument ${idx} in method '${name}' ` +
            `of component '${meta.displayName}'`
          );
        }
        
        if (isBuiltinType(arg.type)) {
          checkAdditionalPropTypeData(
            `[methods].${name}.[arg${idx}]`,
            arg,
            meta.strings,
            meta.types,
            meta.displayName
          );
        } else if (!meta.types[arg.type]) {
          throw new Error(
            `Unknown type '${arg.type}' ` +
            `of argument ${idx} in method '${name}' ` +
            `of component '${meta.displayName}'`
          );
        }
      });
    });
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
  
  if (mainMeta.containerStyle && !mainMeta.globalStyle) {
    throw new Error('containerStyle only allowed when globalStyle is true');
  }
  
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
            `in tags section (tag '${tag}') of ${constants.METADATA_MAIN_FILE}`
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
