/**
 * @author Dmitriy Bizyaev
 */

'use strict';

const _cloneDeep = require('lodash.clonedeep');

const textAndDescShape = {
  textKey: {
    type: 'string',
    allowEmpty: false,
    required: true,
  },
  descriptionTextKey: {
    type: 'string',
    allowEmpty: false,
    required: true,
  },
};

const jssyTypedefShape = {
  type: {
    type: 'string',
    required: true,
  },
  notNull: {
    type: 'boolean',
    required: false,
  },
  ofType: {
    type: 'object',
    properties: null,
    required: false,
  },
  fields: {
    type: 'object',
    patternProperties: {
      '.*': {
        type: 'object',
        properties: null,
      },
    },
    required: false,
  },
  options: {
    type: 'array',
    items: {
      type: 'object',
      properties: {
        value: {
          type: 'any',
          required: true,
        },
      },
    },
    required: false,
  },
};

jssyTypedefShape.ofType.properties = jssyTypedefShape;
jssyTypedefShape.fields.patternProperties['.*'].properties = jssyTypedefShape;

const valueSourcesConfigShape = {
  source: {
    type: 'array',
    minItems: 1,
    uniqueItems: true,
    items: {
      type: 'string',
      enum: [
        'static',
        'data',
        'const',
        'designer',
        'actions',
        'state',
      ],
    },
    required: false,
  },
  
  sourceConfigs: {
    type: 'object',
    properties: {
      static: {
        type: 'object',
        properties: {
          default: {
            type: 'any',
            required: false,
          },
          
          // For 'string' type
          defaultTextKey: {
            type: 'string',
            required: false,
          },
          
          // For 'arrayOf' type
          defaultNum: {
            type: 'integer',
            required: false,
          },
          
          minItems: {
            type: 'integer',
            required: false,
          },
          
          maxItems: {
            type: 'integer',
            required: false,
          },
        },
        required: false,
      },
      
      data: {
        type: 'object',
        properties: {
          pushDataContext: {
            type: 'string',
            allowEmpty: false,
            required: false,
          },
        },
        required: false,
      },
      
      const: {
        type: 'object',
        properties: {
          value: {
            type: 'any',
            required: false,
          },
          
          jssyConstId: {
            type: 'string',
            required: false,
          },
        },
        required: false,
      },
      
      designer: {
        type: 'object',
        properties: {
          wrapper: {
            type: 'string',
            required: false,
          },
          wrapperLayout: {
            type: 'integer',
            minimum: 0,
            required: false,
          },
          props: {
            type: 'object',
            patternProperties: {
              '.*': {
                type: 'object',
                properties: Object.assign({
                  dataContext: {
                    type: 'string',
                    allowEmpty: false,
                    required: false,
                  },
                  type: {
                    type: 'string',
                    allowEmpty: false,
                    required: false,
                  },
                }, textAndDescShape),
              },
            },
            required: false,
          },
        },
        required: false,
      },
      
      actions: {
        type: 'object',
        properties: {
          args: {
            type: 'array',
            items: {
              type: 'object',
              properties: Object.assign(
                {},
                jssyTypedefShape,
                textAndDescShape
              ),
            },
            required: true,
          },
          updateState: {
            type: 'object',
            patternProperties: {
              '.*': {
                type: 'object',
                properties: {
                  source: {
                    type: 'string',
                    enum: ['const', 'arg'],
                    required: true,
                  },
                  sourceData: {
                    type: 'object',
                    properties: {
                      value: {
                        type: 'any',
                        required: false,
                      },
                      arg: {
                        type: 'integer',
                        required: false,
                      },
                      path: {
                        type: 'array',
                        minItems: 1,
                        items: {
                          type: ['string', 'integer'],
                        },
                        required: false,
                      },
                    },
                    required: true,
                  },
                },
              },
            },
            required: false,
          },
        },
        required: false,
      },
      
      state: {
        type: 'object',
        properties: {},
        required: false,
      },
    },
    required: false,
  },
};

const jssyValueShape = Object.assign(
  _cloneDeep(jssyTypedefShape),
  valueSourcesConfigShape
);

jssyValueShape.options.items.properties.textKey = {
  type: 'string',
  allowEmpty: false,
  required: true,
};

const jssyValueWithTextShape = Object.assign(
  _cloneDeep(jssyValueShape),
  textAndDescShape
);

jssyValueWithTextShape.ofType.properties = jssyValueShape;

jssyValueShape.fields.patternProperties['.*'].properties =
  jssyValueWithTextShape;


const propSchema = {
  type: 'object',
  properties: Object.assign({
    group: {
      type: 'string',
      allowEmpty: false,
      required: false,
    },
  }, textAndDescShape, jssyValueShape),
};

const typesSchema = {
  type: 'object',
  patternProperties: {
    '.*': {
      type: 'object',
      properties: jssyValueShape,
    },
  },
};

const stringsSchema = {
  type: 'object',
  patternProperties: {
    '.*': {
      type: 'object',
      patternProperties: {
        '.*': {
          type: 'string',
        },
      },
    },
  },
};

const metaSchema = {
  type: 'object',
  properties: Object.assign({
    displayName: {
      type: 'string',
      allowEmpty: false,
      required: true,
    },
    
    group: {
      type: 'string',
      allowEmpty: false,
      required: false,
    },
    
    tags: {
      type: 'array',
      items: {
        type: 'string',
        allowEmpty: false,
      },
      uniqueItems: true,
      required: false,
    },
    
    kind: {
      type: 'string',
      enum: ['atomic', 'container', 'composite'],
      required: true,
    },
    
    hidden: {
      type: 'boolean',
      required: false,
    },
    
    icon: {
      type: 'string',
      allowEmpty: false,
      required: false,
    },
    
    props: {
      type: 'object',
      patternProperties: {
        '.*': propSchema,
      },
      required: false,
    },
    
    propGroups: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            allowEmpty: false,
            required: true,
          },
          textKey: {
            type: 'string',
            allowEmpty: false,
            required: true,
          },
        },
      },
      required: false,
    },
    
    state: {
      type: 'object',
      patternProperties: {
        '.*': {
          type: 'object',
          properties: Object.assign({
            initialValue: {
              type: 'object',
              properties: {
                source: {
                  type: 'string',
                  enum: ['const', 'prop'],
                  required: true,
                },
                sourceData: {
                  value: {
                    type: 'any',
                    required: false,
                  },
                  propName: {
                    type: 'string',
                    required: false,
                  },
                },
              },
              required: true,
            },
          }, jssyTypedefShape, textAndDescShape),
        },
      },
      required: false,
    },
    
    methods: {
      type: 'object',
      patternProperties: {
        '.*': {
          type: 'object',
          properties: Object.assign({
            args: {
              type: 'array',
              items: {
                type: 'object',
                properties: Object.assign({
                  required: {
                    type: 'boolean',
                    required: true,
                  },
                }, jssyValueShape, textAndDescShape),
              },
              required: true,
            },
          }, textAndDescShape),
        },
      },
      required: false,
    },
    
    types: Object.assign({ required: false }, typesSchema),
    
    strings: Object.assign({ required: false }, stringsSchema),
    
    layouts: {
      type: 'array',
      items: {
        type: 'object',
        properties: Object.assign({
          icon: {
            type: 'string',
            allowEmpty: false,
            required: false,
          },
          regions: {
            type: 'array',
            items: {
              type: 'object',
              properties: Object.assign({
                component: {
                  type: 'string',
                  allowEmpty: false,
                  required: true,
                },
                defaultEnabled: {
                  type: 'boolean',
                  required: true,
                },
                props: {
                  type: 'object',
                  required: false,
                },
              }, textAndDescShape),
            },
            minItems: 1,
            required: true,
          },
        }, textAndDescShape),
      },
      minItems: 1,
      required: false,
    },
    
    placement: {
      type: 'object',
      properties: {
        inside: {
          type: 'object',
          properties: {
            include: {
              type: 'array',
              minItems: 1,
              items: {
                type: 'object',
                properties: {
                  all: {
                    type: 'boolean',
                    required: false,
                  },
                  component: {
                    type: 'string',
                    allowEmpty: false,
                    required: false,
                  },
                  group: {
                    type: 'string',
                    allowEmpty: false,
                    required: false,
                  },
                  tag: {
                    type: 'string',
                    allowEmpty: false,
                    required: false,
                  },
                  maxNum: {
                    type: 'number',
                    minimum: 1,
                    required: false,
                  },
                },
              },
            },
            
            exclude: {
              type: 'array',
              minItems: 1,
              items: {
                type: 'object',
                properties: {
                  component: {
                    type: 'string',
                    allowEmpty: false,
                    required: false,
                  },
                  group: {
                    type: 'string',
                    allowEmpty: false,
                    required: false,
                  },
                  tag: {
                    type: 'string',
                    allowEmpty: false,
                    required: false,
                  },
                },
              },
            },
          },
          required: false,
        },
        after: {
          // Not used yet
          type: 'object',
          properties: {
            include: {
              type: 'array',
              minItems: 1,
              items: {
                type: 'object',
                properties: {
                  component: {
                    type: 'string',
                    allowEmpty: false,
                    required: false,
                  },
                  group: {
                    type: 'string',
                    allowEmpty: false,
                    required: false,
                  },
                },
              },
            },
            
            exclude: {
              type: 'array',
              minItems: 1,
              items: {
                type: 'object',
                properties: {
                  component: {
                    type: 'string',
                    allowEmpty: false,
                    required: false,
                  },
                  group: {
                    type: 'string',
                    allowEmpty: false,
                    required: false,
                  },
                },
              },
            },
          },
          required: false,
        },
        before: {
          // Not used yet
          type: 'object',
          properties: {
            include: {
              type: 'array',
              minItems: 1,
              items: {
                type: 'object',
                properties: {
                  component: {
                    type: 'string',
                    allowEmpty: false,
                    required: false,
                  },
                  group: {
                    type: 'string',
                    allowEmpty: false,
                    required: false,
                  },
                },
              },
            },
            
            exclude: {
              type: 'array',
              minItems: 1,
              items: {
                type: 'object',
                properties: {
                  component: {
                    type: 'string',
                    allowEmpty: false,
                    required: false,
                  },
                  group: {
                    type: 'string',
                    allowEmpty: false,
                    required: false,
                  },
                },
              },
            },
          },
          required: false,
        },
      },
      required: false,
    },
  }, textAndDescShape),
};

const mainMetaSchema = {
  properties: {
    namespace: {
      type: 'string',
      allowEmpty: false,
      required: true,
    },
    
    globalStyle: {
      type: 'boolean',
      required: true,
    },
    
    containerStyle: {
      type: 'object',
      patternProperties: {
        '.*': {
          type: 'string',
          allowEmpty: false,
        },
      },
      required: false,
    },
    
    loaders: {
      type: 'object',
      patternProperties: {
        '.*': {
          type: 'array',
          minItems: 1,
          items: {
            type: ['string', 'object'],
            allowEmpty: false,
          },
        },
      },
      required: false,
    },
    
    import: {
      type: 'array',
      required: false,
      uniqueItems: true,
      items: {
        type: 'string',
        allowEmpty: false,
      },
    },
    
    components: {
      type: 'object',
      patternProperties: {
        '.*': metaSchema,
      },
      required: false,
    },
    
    componentGroups: {
      patternProperties: {
        '.*': {
          type: 'object',
          properties: {
            textKey: {
              type: 'string',
              allowEmpty: false,
              required: true,
            },
            
            descriptionTextKey: {
              type: 'string',
              allowEmpty: false,
              required: false,
            },
          },
        },
      },
      required: false,
    },
    
    strings: Object.assign({ required: false }, stringsSchema),
    
    tags: {
      patternProperties: {
        '.*': {
          type: 'array',
          minItems: 1,
          items: {
            type: 'string',
            allowEmpty: false,
          },
          uniqueItems: true,
        },
      },
      required: false,
    },
  },
};

exports.typesSchema = typesSchema;
exports.stringsSchema = stringsSchema;
exports.metaSchema = metaSchema;
exports.mainMetaSchema = mainMetaSchema;
