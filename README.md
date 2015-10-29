# GraphQL Utils

This is a set of utilities for apps building with [graphql-js](https://github.com/graphql/graphql-js).

* [Usage](#usage)
* [Picking Fields Before Resolve](#picking-fields-before-resolve)
    * [Picking Fields](#picking-fields)
    * [Picking Nested Fields](#picking-nested-fields)
* [Maintaining Context](#maintaining-context)
    * [Setting a context to an object](#setting-a-context-to-an-object)
    * [Setting a context to an array](#setting-a-context-to-an-array)

### Usage

~~~
npm install graphql-utils
~~~

### Picking Fields Before Resolve

Using these utilities, you can get the field names of the result type, user asked for. Based on that, you can filter which fields you need from the DB.

You can also check fields on nested fields as well.

---

> First of all, have a look at our [schema](https://gist.github.com/arunoda/5c819dc4fc30f7792c68).

#### Picking Fields

Then we need to pick the fields of mentioned in the query inside the resolve function of `recentPost`.

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

Then, this is how we get fields.

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

We can even get the fields of the `author` just inside the `recentPost` resolve function.

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

Sometimes it's very important to pass some context down to the child nodes in graph. There is no built in functionality in GraphQL for that. But we can add a context with the return value of the `resolve` function. 

Then in the resolve function of result type's fields we can get the above value and get the context.

For that we can use `withContext` and `getContext` functions of `graphql-utils.`

#### Setting a context to an object

This is how we can set a context to a plain object.

```js
import {
  withContext,
  getContext
} from 'graphql-utils'

const payload = {the: "payload"};
const context = {some: "data"};
const payloadWithContext = withContext(payload, context);

// payloadWithContext has a field called __context with the given context
// You can get the context with
console.log(`The context is: ${getContext(payloadWithContext)}`)
```

#### Setting a context to an array

Setting the context to an array is different because we need to have a different context for each element in the array. This is how we do it.

```js
import {
  withContext,
  getContext
} from 'graphql-utils'

const payload = [{id: 10}, {id: 20}];
const rootContext = {some: 'context'}
const payloadWithContext = withContext(payload, (item) => {
  // You can use a immutable data structure to prevent clones like this
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
