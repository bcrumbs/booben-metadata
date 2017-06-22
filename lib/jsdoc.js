/**
 * @author Dmitriy Bizyaev
 */

'use strict';

// TODO: Describe 'placement' property

/**
 * @typedef {Object} ComponentMeta - Component metadata (root object in .jssy/meta.json files).
 * @property {string} displayName - Name of component (same as ComponentClass.displayName).
 * @property {string} textKey - Key for the string used as component name in the library.
 * @property {string} [icon] - Icon file name (icon must be placed in .jssy/icons dir).
 * @property {string} descriptionTextKey - Key for the string used for component description.
 * @property {string} kind - Can be "atomic", "container" or "composite".
 * @property {string} [group] - Component group id.
 * @property {Set<string>} tags - Component tags.
 * @property {boolean} [hidden] - If true, this component will not be shown in the library.
 * @property {Object<string, ComponentPropMeta>} props - Description of component's props.
 * @property {ComponentLayout[]} [layouts] - Available layouts for composite component.
 * @property {Object<string, ComponentStateSlot>} [state]
 * @property {Object<string, ComponentMethodDefinition>} [methods]
 * @property {Object<string, Object<string, string>>} [strings] - String translations. Example: { "string_key": { "en": "...", "ru": "...", ... }, ... }. Can be placed in a separate file (.jssy/strings.json).
 * @property {Object<string, JssyValueDefinition>} [types] - User-defined types. Can be placed in a separate file (.jssy/types.json).
 */

/**
 * @typedef {Object} ComponentLayout
 * @property {string} [textKey] - Key for layout name string.
 * @property {string} [descriptionTextKey] - Key for layout description string.
 * @property {string} [icon] - Icon file name (icon must be placed in .jssy/icons dir).
 * @property {ComponentLayoutRegion[]} regions.
 */

/**
 * @typedef {Object} ComponentLayoutRegion
 * @property {string} textKey - Key for region name string.
 * @property {string} descriptionTextKey - Key for region description string.
 * @property {string} [icon] - Icon file name (icon must be placed in .jssy/icons dir).
 * @property {boolean} defaultEnabled - If true, this region will be enabled by default.
 * @property {string} component - Component name without namespace ("MainRegion", not "Reactackle.MainRegion").
 * @property {Object<string, ProjectComponentProp>} [props] - Component props' values (like in project).
 */

/**
 * @typedef {Object} ComponentStateSlotInitialValueSourceDataConst
 * @property {*} value
 */

/**
 * @typedef {Object} ComponentStateSlotInitialValueSourceDataProp
 * @property {string} propName
 */

/**
 * @typedef {Object} ComponentStateSlotInitialValue
 * @property {string} source - Valid values are "const" and "prop"
 * @property {ComponentStateSlotInitialValueSourceDataConst|ComponentStateSlotInitialValueSourceDataProp} sourceData - Shape depends on source
 */

/**
 * @typedef {JssyTypeDefinition} ComponentStateSlot
 * @property {string} textKey
 * @property {string} descriptionTextKey
 * @property {ComponentStateSlotInitialValue} initialValue
 */

/**
 * @typedef {JssyTypeDefinition} ComponentMethodArgument
 * @property {string} textKey
 * @property {string} descriptionTextKey
 * @property {boolean} required
 */

/**
 * @typedef {Object} ComponentMethodDefinition
 * @property {string} textKey
 * @property {string} descriptionTextKey
 * @property {ComponentMethodArgument[]} args
 */

/**
 * @typedef {JssyTypeDefinition} JssyValueDefinition
 * @property {string[]} source - Available sources for prop's value. Must be a subset of <"static", "data", "const", "designer", "actions", "state">.
 * @property {Object} [sourceConfigs]
 * @property {StaticSourceConfig} [sourceConfigs.static]
 * @property {DataSourceConfig} [sourceConfigs.data]
 * @property {ConstSourceConfig} [sourceConfigs.const]
 * @property {DesignerSourceConfig} [sourceConfigs.designer]
 * @property {ActionsSourceConfig} [sourceConfigs.actions]
 * @property {Object} [sourceConfigs.state]
 * @property {string} [label]
 * @property {string} [description]
 */

/**
 * @typedef {JssyValueDefinition} ComponentPropMeta
 * @property {string} textKey - Key for prop name string.
 * @property {string} descriptionTextKey - Key for prop description string.
 *
 */

/**
 * @typedef {Object} StaticSourceConfig
 * @property {*} [default] - Default value (for scalar types only).
 * @property {string} [defaultTextKey] - String key of default value (for "string" type only).
 * @property {number} [defaultNum] - Default items num (for "arrayOf" type only).
 * @property {number} [minItems] - Min items num (for "arrayOf" type only).
 * @property {number} [maxItems] - Max items num (for "arrayOf" type only).
 */

/**
 * @typedef {Object} DataSourceConfig
 * @property {string} [pushDataContext] - For non-scalar types only
 */

/**
 * @typedef {JssyValueDefinition} ActionArgumentDefinition
 * @property {string} textKey
 * @property {string} descriptionTextKey
 */

/**
 * @typedef {Object} ActionStateUpdateDefinition
 * @property {string} source - Valid values are "const" and "arg"
 * @property {ActionStateUpdateDefinitionSourceDataConst|ActionStateUpdateDefinitionSourceDataArg} sourceData - Object shape depends on source
 */

/**
 * @typedef {Object} ActionStateUpdateDefinitionSourceDataArg
 * @property {number} arg
 * @property {(string|number)[]} [path]
 */

/**
 * @typedef {Object} ActionStateUpdateDefinitionSourceDataConst
 * @property {*} value
 */

/**
 * @typedef {Object} ActionsSourceConfig
 * @property {ActionArgumentDefinition[]} args
 * @property {Object<string, ActionStateUpdateDefinition>} [updateState]
 */

/**
 * @typedef {Object} ConstSourceConfig
 * @property {*} value
 */

/**
 * @typedef {JssyTypeDefinition} DesignerSourceConfigPropDesc
 * @property {string} textKey
 * @property {string} descriptionSourceKey
 * @property {string} [dataContext]
 */

/**
 * @typedef {Object} DesignerSourceConfig
 * @property {string} [wrapper] - Wrapper component name
 * @property {number} [wrapperLayout] - Layout number for composite wrapper component
 * @property {Object<string, DesignerSourceConfigPropDesc>} [props]
 */
