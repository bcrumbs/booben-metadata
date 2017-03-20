/**
 * @author Dmitriy Bizyaev
 */

'use strict';

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

const propSchema = {
  type: 'object',
  properties: {
    textKey: {
      type: 'string',
      allowEmpty: true,
      required: false,
    },
    
    descriptionTextKey: {
      type: 'string',
      allowEmpty: true,
      required: false,
    },
    
    group: {
      type: 'string',
      allowEmpty: false,
      required: false,
    },
    
    type: {
      type: 'string',
      allowEmpty: false,
      required: true,
    },
    
    // For 'shape', 'objectOf' and 'object' types
    notNull: {
      type: 'boolean',
      required: false,
    },
    
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
                  properties: {
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
                  },
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
                properties: Object.assign({
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
                }, jssyTypedefShape),
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
      },
      required: false,
    },
    
    // For 'arrayOf' type
    ofType: null, // Will be replaced
    
    // For 'shape' type
    fields: {
      type: 'object',
      patternProperties: {
        '.*': null, // Will be replaced
      },
      required: false,
    },
    
    // For 'oneOf' type
    options: {
      type: 'array',
      minItems: 1,
      items: {
        type: 'object',
        properties: {
          value: {
            type: 'any',
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
  },
};

propSchema.properties.fields.patternProperties['.*'] = propSchema;
propSchema.properties.ofType = Object.assign({ required: false }, propSchema);

const typesSchema = {
  type: 'object',
  patternProperties: {
    '.*': {
      type: 'object',
      properties: {
        type: {
          type: 'string',
          enum: ['oneOf', 'arrayOf', 'shape', 'objectOf'],
          required: true,
        },
        
        // For 'arrayOf' and 'objectOf' types
        ofType: Object.assign({ required: false }, propSchema),
        
        // For 'shape' type
        fields: {
          type: 'object',
          patternProperties: {
            '.*': propSchema,
          },
          required: false,
        },
        
        // For 'oneOf' type
        options: {
          type: 'array',
          minItems: 1,
          items: {
            type: 'object',
            properties: {
              value: {
                type: 'any',
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
      },
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
  properties: {
    displayName: {
      type: 'string',
      allowEmpty: false,
      required: true,
    },
    
    textKey: {
      type: 'string',
      allowEmpty: false,
      required: true,
    },
    
    descriptionTextKey: {
      type: 'string',
      allowEmpty: true,
      required: false,
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
          }, jssyTypedefShape),
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
        properties: {
          textKey: {
            type: 'string',
            allowEmpty: false,
            required: false,
          },
          descriptionTextKey: {
            type: 'string',
            allowEmpty: false,
            required: false,
          },
          icon: {
            type: 'string',
            allowEmpty: false,
            required: false,
          },
          regions: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                component: {
                  type: 'string',
                  allowEmpty: false,
                  required: true,
                },
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
                defaultEnabled: {
                  type: 'boolean',
                  required: true,
                },
                props: {
                  type: 'object',
                  required: false,
                },
              },
            },
            minItems: 1,
            required: true,
          },
        },
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
  },
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
            type: 'string',
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

exports.propSchema = propSchema;
exports.typesSchema = typesSchema;
exports.stringsSchema = stringsSchema;
exports.metaSchema = metaSchema;
exports.mainMetaSchema = mainMetaSchema;
