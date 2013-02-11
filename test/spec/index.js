define(['../../test/lib/chai', '../../app/scripts/index'],function(chai,module){
  'use strict';

   var app;

   var assert = chai.assert,
    expect = chai.expect,
    should = chai.should();


   describe('should be a backbone view',function(){

    it('should have a view',function(){
      expect(module.view).to.be.a('object');
    });

    it('should be able to render', function(){
      expect(module.view.render).to.be.a('function');
      module.view.render();
      expect($('body').find('#viewmaster').html()).to.not.equal('');
    });

   });

  
});