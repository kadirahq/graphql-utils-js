import {describe, it} from 'mocha';
import {expect} from 'chai';

import {
  withContext,
  getContext
} from '../';

describe('graphq-utils', () => {
  describe('withContext', () => {
    it('it should not mutate the input payload if it\'s an object', () => {
      const original = {};
      const context = {the: 'context'};
      withContext(original, context);

      expect(original.__context).to.be.equal(undefined);
    });

    it('it should not mutate the input payload if it\'s an array', () => {
      const original = [ {}, {} ];
      const context = {the: 'context'};
      withContext(original, context);

      original.forEach(({__context}) => {
        expect(__context).to.be.equal(undefined);
      });
    });

    it('it should asign the context to an object', () => {
      const original = {the: 'data'};
      const context = {the: 'context'};
      const payload = withContext(original, context);

      expect(payload.__context).to.be.equal(context);
      delete payload.__context;
      expect(payload).to.be.deep.equal(original);
    });

    it('it should asign the context to all the elements in the array', () => {
      const original = [ {a: 10}, [ {b: 20} ] ];
      const context = {the: 'context'};
      const payload = withContext(original, context);

      payload.forEach((o, index) => {
        expect(o.__context).to.be.equal(context);
        delete o.__context;
        expect(o).to.be.deep.equal(original[index]);
      });
    });
  });

  describe('getContext', () => {
    it('should return the context if there is', () => {
      const context = {the: 'context'};
      const payload = {__context: context};

      expect(getContext(payload)).to.be.equal(context);
    });
  });
});
