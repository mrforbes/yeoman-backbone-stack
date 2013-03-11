yeoman-backbone-stack
=====================

Directory / Config for Yeoman + Require + Backbone (with validation, model binding, and deep model support) + SASS + Bootstrap + Precompiled Dust Templates + Mocha + Testacular

What is it?
--------------

A skeleton framework for using the stack outlined above. 

Why?
-------------
There is some config work that needs to be done to get all of these pieces working together correctly - especially the require/testacular integration. I did all of the work, so if you find this repo you can reap the benefits.

What else do I need?
-----------
In order for this to be of any use to you, you'll also have to install:

+ Node: (http://nodejs.org)
+ Yeoman: (http://yeoman.io)
+ Testacular (http://vojtajina.github.com/testacular/)

As well as some other Yeoman dependencies, but it'll guide you through those.

Backbone Packages
----------
+ Backbone.Validation: (https://github.com/thedersen/backbone.validation)
+ Backone.DeepModel: (https://github.com/powmedia/backbone-deep-model)
+ Backbone.ModelBinder: (https://github.com/theironcook/Backbone.ModelBinder) 

Also See
---------
+ Dust: (https://github.com/linkedin/dustjs)
+ Mockjax: (https://github.com/appendto/jquery-mockjax)
+ Sinon: (http://sinonjs.org/)

Usage
-------
Once you have the dependencies installed, go to the directory where you installed this in your command line and type grunt testacular, open a new console tab, and type grunt server

Or if you already have some other preferred way of doing these types of things (sublime maybe?) - then use that.


