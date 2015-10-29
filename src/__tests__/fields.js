import {describe, it} from 'mocha';
import {expect} from 'chai';
import _ from 'lodash';
import {
  GraphQLObjectType,
  GraphQLSchema,
  GraphQLString,
  graphql
} from 'graphql';

import {
  getFieldsFromAst,
  getFieldsFromInfo
} from '../';

describe('Fields', () => {
  describe('getFieldsFromAst', () => {
    it('should give root level fields', async () => {
      const query = `
        {
          metric {
            one,
            two
          }
        }
      `;

      const info = await getInfo(query);
      const fields = getFieldsFromAst(info, info.fieldASTs[0]);
      expect(_.keys(fields)).to.be.deep.equal([ 'one', 'two' ]);
    });

    it('should give fields in fragments', async () => {
      const query = `
        {
          metric {
            one,
            ...a
          }
        }

        fragment a on Metric {
          two
        }
      `;

      const info = await getInfo(query);
      const fields = getFieldsFromAst(info, info.fieldASTs[0]);
      expect(_.keys(fields)).to.be.deep.equal([ 'one', 'two' ]);
    });

    it('should give fields in nested fragments', async () => {
      const query = `
        {
          metric {
            one,
            ...a
          }
        }

        fragment a on Metric {
          two,
          ...b
        }

        fragment b on Metric {
          three {
            four
          }
        }
      `;

      const info = await getInfo(query);
      const fields = getFieldsFromAst(info, info.fieldASTs[0]);
      expect(_.keys(fields)).to.be.deep.equal([ 'one', 'two', 'three' ]);
    });

    it('should allow to get fields in nested types', async () => {
      const query = `
        {
          metric {
            one,
            ...a
          }
        }

        fragment a on Metric {
          two,
          ...b
        }

        fragment b on Metric {
          three {
            four
          }
        }
      `;

      const info = await getInfo(query);
      const fieldsOnMetric = getFieldsFromAst(info, info.fieldASTs[0]);
      const fieldsOnSubMetric = getFieldsFromAst(info, fieldsOnMetric['three']);
      expect(_.keys(fieldsOnSubMetric)).to.be.deep.equal([ 'four' ]);
    });
  });

  describe('getFieldsFromInfo', () => {
    it('should give filed just passing the info', async () => {
      const query = `
        {
          metric {
            one,
            two
          }
        }
      `;

      const info = await getInfo(query);
      const fields = getFieldsFromInfo(info);
      expect(_.keys(fields)).to.be.deep.equal([ 'one', 'two' ]);
    });
  });
});

function getInfo(query) {
  let resolve = null;

  const Metric = new GraphQLObjectType({
    name: 'Metric',
    fields: () => ({
      one: {type: GraphQLString},
      two: {type: GraphQLString},
      three: {type: SubMetric},
    })
  });

  const SubMetric = new GraphQLObjectType({
    name: 'SubMetric',
    fields: () => ({
      four: {type: GraphQLString},
      five: {type: GraphQLString},
    })
  });

  const schema = new GraphQLSchema({
    query: new GraphQLObjectType({
      name: 'Metrics',
      fields: () => ({
        metric: {
          type: Metric,
          resolve(root, args, info) {
            resolve(info);
            return {};
          }
        }
      })
    })
  });

  setTimeout(() => graphql(schema, query), 0);
  return new Promise(r => {resolve = r;});
}
