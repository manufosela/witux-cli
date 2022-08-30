import chai from 'chai';
import witux from '../lib/witux.cjs';

const { expect } = chai;


describe('witux', () => {
  it('init method', async () => {
    expect(witux).to.haveOwnProperty('init').to.be.a('function');
  });
});