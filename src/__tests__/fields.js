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
          recentPost {
            id,
            title
          }
        }
      `;

      const info = await getInfo(query);
      const fields = getFieldsFromAst(info, info.fieldASTs[0]);
      expect(_.keys(fields)).to.be.deep.equal([ 'id', 'title' ]);
    });

    it('should give fields in fragments', async () => {
      const query = `
        {
          recentPost {
            id,
            ...a
          }
        }

        fragment a on Post {
          title
        }
      `;

      const info = await getInfo(query);
      const fields = getFieldsFromAst(info, info.fieldASTs[0]);
      expect(_.keys(fields)).to.be.deep.equal([ 'id', 'title' ]);
    });

    it('should give fields in nested fragments', async () => {
      const query = `
        {
          recentPost {
            id,
            ...a
          }
        }

        fragment a on Post {
          title,
          ...b
        }

        fragment b on Post {
          author {
            name
          }
        }
      `;

      const info = await getInfo(query);
      const fields = getFieldsFromAst(info, info.fieldASTs[0]);
      expect(_.keys(fields)).to.be.deep.equal([ 'id', 'title', 'author' ]);
    });

    it('should allow to get fields in nested types', async () => {
      const query = `
        {
          recentPost {
            id,
            ...a
          }
        }

        fragment a on Post {
          title,
          ...b
        }

        fragment b on Post {
          author {
            name
          }
        }
      `;

      const info = await getInfo(query);
      const fieldsOnPost = getFieldsFromAst(info, info.fieldASTs[0]);
      const fieldsOnAuthor = getFieldsFromAst(info, fieldsOnPost['author']);
      expect(_.keys(fieldsOnAuthor)).to.be.deep.equal([ 'name' ]);
    });
  });

  describe('getFieldsFromInfo', () => {
    it('should give filed just passing the info', async () => {
      const query = `
        {
          recentPost {
            id,
            title
          }
        }
      `;

      const info = await getInfo(query);
      const fields = getFieldsFromInfo(info);
      expect(_.keys(fields)).to.be.deep.equal([ 'id', 'title' ]);
    });
  });
});

function getInfo(query) {
  let resolve = null;

  const Post = new GraphQLObjectType({
    name: 'Post',
    fields: () => ({
      id: {type: GraphQLString},
      title: {type: GraphQLString},
      author: {type: Author},
    })
  });

  const Author = new GraphQLObjectType({
    name: 'Author',
    fields: () => ({
      id: {type: GraphQLString},
      name: {type: GraphQLString},
    })
  });

  const schema = new GraphQLSchema({
    query: new GraphQLObjectType({
      name: 'RootQuery',
      fields: () => ({
        recentPost: {
          type: Post,
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
