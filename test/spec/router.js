define(['../../test/lib/chai', '../../app/scripts/router'],function(chai,module){
  'use strict';

   var assert = chai.assert,
    expect = chai.expect,
    should = chai.should();

   describe('verify module',function(){
      
      it('should return a backbone router',function(){
        expect(module).to.be.a('function');
        expect(module.prototype).to.be.a('object');
      });

      it('should have routes',function(){
        expect(module.prototype.routes).to.be.a('object');
        assert.ok(_.size(module.prototype.routes)>0, 'routes were added');
      });

   });

  
});