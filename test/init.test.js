import chai from 'chai';
import linuxt from '../lib/linuxt.cjs';

const { expect } = chai;


describe('linuxt', () => {
  it('init method', async () => {
    expect(linuxt).to.haveOwnProperty('init').to.be.a('function');
  });
});