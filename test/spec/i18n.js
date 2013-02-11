define([
  '../../test/lib/chai', 
  'text!../../app/templates/color.html',
  '../../app/nls/colors'
],
function(chai,template,colorsJSON){
  'use strict';

   var assert = chai.assert,
    expect = chai.expect,
    should = chai.should();

   describe('async',function(){
     var lang = 'en_us';
     beforeEach(function(){
        lang = 'fr-fr'
     });

     afterEach(function(){
        lang = 'en_us'
     });

     it("multiple async", function(done) {
      requirejs.config({
            locale: lang
      });
      //verify we are loading red in non-english
      require(['i18n!../../app/nls/colors'],function(colors){
          expect(colors.red).to.not.equal('red');
          done();
       });
    });
   });

   describe("verify i18n components", function() {
    it("is a function", function() {
      expect(dust).to.be.a('object');
    });

    it("is a template",function(){
      expect(template).to.be.a('string');
    });

    it("is a json file",function(){
      expect(colorsJSON).to.be.a('object');
    });
  });

  describe("verify languages", function() {
     expect(colorsJSON['fr-fr']).to.be.true;
  });

  
});