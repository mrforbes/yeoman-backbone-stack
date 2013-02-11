define(['../../test/lib/chai', '../../app/scripts/app','../../app/scripts/main'],function(chai,app,module){
  'use strict';

   var assert = chai.assert,
    expect = chai.expect,
    should = chai.should();

   describe('main is the app launcher',function(){
      
      it('should create a dust template named main',function(done){
          assert.ok(app,true,'exists');

          setTimeout(function(){
            console.log(app)
        //    assert.ok(app.$main.attr('id'),'viewmaster','exists');
            done();
          },500)
      
      });
   });

  
});