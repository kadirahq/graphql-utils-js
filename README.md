# GraphQL Utils

This is a set of utilities for schemas building with [graphql-js](https://github.com/graphql/graphql-js).

* [Usage](#usage)
* [Picking Fields Before Resolve](#picking-fields-before-resolve)
    * [Picking Fields](#picking-fields)
    * [Picking Nested Fields](#picking-nested-fields)
* [Maintaining Context](#maintaining-context)
    * [Setting a context to an object](#setting-a-context-to-an-object)
    * [Setting a context to an array](#setting-a-context-to-an-array)

### Usage

~~~graohq
npm install graphql-utils
~~~

### Picking Fields Before Resolve

With this, you can get the field names of the result type based the query. With that, you can filter which fields you need to fetch from the DB.

You can also check fields on nested fields as well.

> First of all, have a look at our [schema](https://gist.github.com/arunoda/5c819dc4fc30f7792c68).

#### Picking Fields

Basically, we need to pick fields mentioned in the following query.

Here's our query:

```js
const query = `
  {
    recentPost {
      id,
      title
    }
  }
`;
```

We need to get them inside the resolve function of the `recentPost` field. This is how we to do it.

```js
import {getFieldsFromInfo} from 'graphql-utils';

const RootQuery = new GraphQLObjectType({
  ...
    recentPost: {
      type: Post,
      resolve(root, args, info) {
        const fieldsMap = getFieldsFromInfo(info);
        console.log(Object.keys(fieldsMap));
      }
    }
  ...
});
```

Now you can see `[ "id", "title" ]` is printed on the screen.

#### Picking Nested Fields

Let's say, we've a query like this:

```js
const query = `
  {
    recentPost {
      id,
      title,
      author {
        name
      }
    }
  }
`;
```

Then this is how we can get the nested fields of the field `author`.

```js
import {
  getFieldsFromAst,
  getFieldsFromInfo
} from 'graphql-utils';

const RootQuery = new GraphQLObjectType({
  ...
    recentPost: {
      type: Post,
      resolve(root, args, info) {
        const fieldsMapOfPost = getFieldsFromInfo(info);
        const fieldsMapOfAuthor = getFieldsFromAst(info, fieldsMapOfPost['author']);
        console.log(Object.keys(fieldsMapOfAuthor));
      }
    }
  ...
});
```

Now you can see `[ "name" ]` is printed on the screen.

### Maintaining Context

Sometimes it's very important to pass a context down to child nodes in graph. There is no built in functionality in graphql-js for that. But we can add a context with the return value of the `resolve` function. Then we can grab it from the parent value(in resolve functions) of child nodes.

For that we can use `withContext` and `getContext` functions of `graphql-utils.`

**Read [this blog](#) post to see how this can be done in a real app.**

#### Setting a context to an object

This is how we can set a context to a plain object.

```js
import {
  withContext,
  getContext
} from 'graphql-utils';

const payload = {the: "payload"};
const context = {some: "data"};
const payloadWithContext = withContext(payload, context);

// payloadWithContext has a field called __context with the context we provide
// We can get it easily with the `getContext` method
console.log(getContext(payloadWithContext));
```

#### Setting a context to an array

When setting a context to an array, we need to set it for all the items in the array. This is how to do it.

```js
import {
  withContext,
  getContext
} from 'graphql-utils'

const payload = [{id: 10}, {id: 20}];
const rootContext = {some: 'context'}
const payloadWithContext = withContext(payload, (item) => {
  // You can use an immutable data structure to prevent costly clones like this
  let newContext = JSON.parse(JSON.stringify(rootContext));
  newContext.itemId = item.id;
  return newContext;
});

// Now each of the items in the array has it's own context. 
// You can check it by printing the new payload
payloadWithContext.forEach((item) => {
  const context = getContext(item)
  console.log(context);
});
```
