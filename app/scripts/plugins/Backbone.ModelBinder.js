// Backbone.ModelBinder v0.1.5
// (c) 2012 Bart Wood
// Distributed Under MIT License

// altered define function to meet app needs
define([], function(){


    if(!Backbone){
        throw 'Please include Backbone.js before Backbone.ModelBinder.js';
    }

    Backbone.ModelBinder = function(){
        _.bindAll(this);
    };

    // Current version of the library.
    Backbone.ModelBinder.VERSION = '0.1.5';
    Backbone.ModelBinder.Constants = {};
    Backbone.ModelBinder.Constants.ModelToView = 'ModelToView';
    Backbone.ModelBinder.Constants.ViewToModel = 'ViewToModel';
/* michael forbes - extend with Backbone.events so we can send events in here */
    _.extend(Backbone.ModelBinder.prototype, Backbone.Events, {

        bind:function (model, rootEl, attributeBindings) {
            this.unbind();

            this._model = model;
            this._rootEl = rootEl;

            if (!this._model) throw 'model must be specified';
            if (!this._rootEl) throw 'rootEl must be specified';

            if(attributeBindings){
                // Create a deep clone of the attribute bindings
                this._attributeBindings = $.extend(true, {}, attributeBindings);

                this._initializeAttributeBindings();
                this._initializeElBindings();
            }
            else {
                this._initializeDefaultBindings();
            }

            this._bindModelToView();
            this._bindViewToModel();
        },

        unbind:function () {
            this._unbindModelToView();
            this._unbindViewToModel();

            if(this._attributeBindings){
                delete this._attributeBindings;
                this._attributeBindings = undefined;
            }
        },

        // Converts the input bindings, which might just be empty or strings, to binding objects
        _initializeAttributeBindings:function () {
            var attributeBindingKey, inputBinding, attributeBinding, elementBindingCount, elementBinding;

            for (attributeBindingKey in this._attributeBindings) {
                inputBinding = this._attributeBindings[attributeBindingKey];

                if (_.isString(inputBinding)) {
                    attributeBinding = {elementBindings: [{selector: inputBinding}]};
                }
                else if (_.isArray(inputBinding)) {
                    attributeBinding = {elementBindings: inputBinding};
                }
                else if(_.isObject(inputBinding)){
                    attributeBinding = {elementBindings: [inputBinding]};
                }
                else {
                    throw 'Unsupported type passed to Model Binder ' + attributeBinding;
                }

                // Add a linkage from the element binding back to the attribute binding
                for(elementBindingCount = 0; elementBindingCount < attributeBinding.elementBindings.length; elementBindingCount++){
                    elementBinding = attributeBinding.elementBindings[elementBindingCount];
                    elementBinding.attributeBinding = attributeBinding;
                }

                attributeBinding.attributeName = attributeBindingKey;
                this._attributeBindings[attributeBindingKey] = attributeBinding;
            }
        },

        // If the bindings are not specified, the default binding is performed on the name attribute
        _initializeDefaultBindings: function(){
            var elCount, namedEls, namedEl, name;
            this._attributeBindings = {};
            namedEls = $('[name]', this._rootEl);

            for(elCount = 0; elCount < namedEls.length; elCount++){
                namedEl = namedEls[elCount];
                name = $(namedEl).attr('name');

                // For elements like radio buttons we only want a single attribute binding with possibly multiple element bindings
                if(!this._attributeBindings[name]){
                    var attributeBinding =  {attributeName: name};
                    attributeBinding.elementBindings = [{attributeBinding: attributeBinding, boundEls: [namedEl]}];
                    this._attributeBindings[name] = attributeBinding;
                }
                else{
                    this._attributeBindings[name].elementBindings.push({attributeBinding: this._attributeBindings[name], boundEls: [namedEl]});
                }
            }
        },

        _initializeElBindings:function () {
            var bindingKey, attributeBinding, bindingCount, elementBinding, foundEls, elCount, el;
            for (bindingKey in this._attributeBindings) {
                attributeBinding = this._attributeBindings[bindingKey];

                for (bindingCount = 0; bindingCount < attributeBinding.elementBindings.length; bindingCount++) {
                    elementBinding = attributeBinding.elementBindings[bindingCount];
                    if (elementBinding.selector === '') {
                        foundEls = $(this._rootEl);
                    }
                    else {
                        foundEls = $(elementBinding.selector, this._rootEl);
                    }

                    if (foundEls.length === 0) {
                        throw 'Bad binding found. No elements returned for binding selector ' + elementBinding.selector;
                    }
                    else {
                        elementBinding.boundEls = [];
                        for (elCount = 0; elCount < foundEls.length; elCount++) {
                            el = foundEls[elCount];
                            elementBinding.boundEls.push(el);
                        }
                    }
                }
            }
        },

        _bindModelToView: function () {
            this._model.on('change', this._onModelChange, this);

            this.copyModelAttributesToView();
        },

        // attributesToCopy is an optional parameter - if empty, all attributes
        // that are bound will be copied.  Otherwise, only attributeBindings specified
        // in the attributesToCopy are copied.
        copyModelAttributesToView: function(attributesToCopy){
            var attributeName, attributeBinding;

            for (attributeName in this._attributeBindings) {
                if(attributesToCopy === undefined || _.indexOf(attributesToCopy, attributeName) !== -1){
                    attributeBinding = this._attributeBindings[attributeName];
                    this._copyModelToView(attributeBinding);
                }
            }
        },

        _unbindModelToView: function(){
            if(this._model){
                this._model.off('change', this._onModelChange);
                this._model = undefined;
            }
        },

        _bindViewToModel:function () {
            $(this._rootEl).delegate('', 'change', this._onElChanged);
            // The change event doesn't work properly for contenteditable elements - but blur does
            $(this._rootEl).delegate('[contenteditable]', 'blur', this._onElChanged);
        },

        _unbindViewToModel: function(){
            if(this._rootEl){
                $(this._rootEl).undelegate('', 'change', this._onElChanged);
                $(this._rootEl).undelegate('[contenteditable]', 'blur', this._onElChanged);
            }
        },

        _onElChanged:function (event) {
            var el, elBindings, elBindingCount, elBinding;

            el = $(event.target)[0];
            elBindings = this._getElBindings(el);

            for(elBindingCount = 0; elBindingCount < elBindings.length; elBindingCount++){
                elBinding = elBindings[elBindingCount];
                if (this._isBindingUserEditable(elBinding)) {
                    this._copyViewToModel(elBinding, el);
                }
            }
        },

        _isBindingUserEditable: function(elBinding){
            return elBinding.elAttribute === undefined ||
                elBinding.elAttribute === 'text' ||
                elBinding.elAttribute === 'html';
        },

        _getElBindings:function (findEl) {
            var attributeName, attributeBinding, elementBindingCount, elementBinding, boundElCount, boundEl;
            var elBindings = [];

            for (attributeName in this._attributeBindings) {
                attributeBinding = this._attributeBindings[attributeName];

                for (elementBindingCount = 0; elementBindingCount < attributeBinding.elementBindings.length; elementBindingCount++) {
                    elementBinding = attributeBinding.elementBindings[elementBindingCount];

                    for (boundElCount = 0; boundElCount < elementBinding.boundEls.length; boundElCount++) {
                        boundEl = elementBinding.boundEls[boundElCount];

                        if (boundEl === findEl) {
                            elBindings.push(elementBinding);
                        }
                    }
                }
            }

            return elBindings;
        },

        _onModelChange:function () {
            var changedAttribute, attributeBinding;

            for (changedAttribute in this._model.changedAttributes()) {
                attributeBinding = this._attributeBindings[changedAttribute];

                if (attributeBinding) {
                    this._copyModelToView(attributeBinding);
                }
            }
        },

        _copyModelToView:function (attributeBinding) {
            var elementBindingCount, elementBinding, boundElCount, boundEl;
            var value = this._model.get(attributeBinding.attributeName);

            for (elementBindingCount = 0; elementBindingCount < attributeBinding.elementBindings.length; elementBindingCount++) {
                elementBinding = attributeBinding.elementBindings[elementBindingCount];
//michael forbes - removed isSetting flag.. what is it for??? 
               // if(!elementBinding.isSetting){
                    var convertedValue = this._getConvertedValue(Backbone.ModelBinder.Constants.ModelToView, elementBinding, value);

                    for (boundElCount = 0; boundElCount < elementBinding.boundEls.length; boundElCount++) {
                        boundEl = elementBinding.boundEls[boundElCount];
                        this._setEl($(boundEl), elementBinding, convertedValue);
                    }
              //  }
            }
        },

        _setEl: function (el, elementBinding, convertedValue) {
            if (elementBinding.elAttribute) {
                this._setElAttribute(el, elementBinding, convertedValue);
            }
            else {
                this._setElValue(el, convertedValue);
            }
        },

        _setElAttribute:function (el, elementBinding, convertedValue) {

            switch (elementBinding.elAttribute) {
                case 'html':
                    el.html(convertedValue);
                    break;
                case 'text':
                    el.text(convertedValue);
                    break;
                case 'enabled':
                    el.attr('disabled', !convertedValue);
                    break;
                case 'displayed':
                    el[convertedValue ? 'show' : 'hide']();
                    break;
                case 'hidden':
                    el[convertedValue ? 'hide' : 'show']();
                    break;
                case 'css':
                    el.css(elementBinding.cssAttribute, convertedValue);
                    break;
                case 'class':
                    var previousValue = this._model.previous(elementBinding.attributeBinding.attributeName);
                    if(!_.isUndefined(previousValue)){
                        previousValue = this._getConvertedValue(Backbone.ModelBinder.Constants.ModelToView, elementBinding, previousValue);
                        el.removeClass(previousValue);
                    }

                    if(convertedValue){
                        el.addClass(convertedValue);
                    }
                    break;
                default:
                    el.attr(elementBinding.elAttribute, convertedValue);
            }
        },

        _setElValue:function (el, convertedValue) {

            if(el.attr('type') && el[0].nodeName!=='BUTTON'){
                switch (el.attr('type')) {
                    case 'radio':
                        if (el.val() === convertedValue) {
                            el.attr('checked', 'checked');
                        }
                        break;
                    case 'checkbox':
                        if (convertedValue) {
                            el.attr('checked', 'checked');
                        }
                        else {
                            el.removeAttr('checked');
                        }
                        break;
                    default:
                        el.val(convertedValue);
                }
            }
            else if(el.is('input') || el.is('select') || el.is('textarea')){
                el.val(convertedValue);
            }
            else {
                /* michael forbes - changed to html instead of text, added conversion of html tags to entities for display */
                if(typeof convertedValue === 'string'){
                    convertedValue = convertedValue.replace(/&/g,"&amp;");
                    convertedValue = convertedValue.replace(/</g,"&lt;");
                    convertedValue = convertedValue.replace(/>/g,"&gt;");
                    el.html(convertedValue);
                }
                /* michael forbes - add support to pass in an object (jquery document fragments mainly) */
                else{
                    el.empty().append(convertedValue);
                }
               
                /* michael forbes - add event so we can get the value and localize it if needed */
                this.trigger('binderValueChanged',{el:el,value:convertedValue});
            }
        },

        _copyViewToModel: function (elementBinding, el) {
            if (!elementBinding.isSetting) {
                elementBinding.isSetting = true;
                this._setModel(elementBinding, $(el));

                if(elementBinding.converter){
                    this._copyModelToView(elementBinding.attributeBinding);
                }

                elementBinding.isSetting = false;
            }
        },

        _getElValue: function(elementBinding, el){
            switch (el.attr('type')) {
                case 'checkbox':
                    return el.prop('checked') ? true : false;
                default:
                    if(el.attr('contenteditable') !== undefined){
                        return el.html();
                    }
                    else {
                        return el.val();
                    }
            }
        },

        _setModel: function (elementBinding, el) {
            var data = {};
            var elVal = this._getElValue(elementBinding, el);
            elVal = this._getConvertedValue(Backbone.ModelBinder.Constants.ViewToModel, elementBinding, elVal);
            data[elementBinding.attributeBinding.attributeName] = elVal;
            this._model.set(data, {changeSource: 'ModelBinder'});
        },

        _getConvertedValue: function (direction, elementBinding, value) {
            if (elementBinding.converter) {
                value = elementBinding.converter(direction, value, elementBinding.attributeBinding.attributeName, this._model);
            }

            return value;
        }
    });

    Backbone.ModelBinder.CollectionConverter = function(collection){
        this._collection = collection;

        if(!this._collection){
            throw 'Collection must be defined';
        }
        _.bindAll(this, 'convert');
    };

    _.extend(Backbone.ModelBinder.CollectionConverter.prototype, {
        convert: function(direction, value){
            if (direction === Backbone.ModelBinder.Constants.ModelToView) {
                return value ? value.id : undefined;
            }
            else {
                return this._collection.get(value);
            }
        }
    });

    // A static helper function to create a default set of bindings that you can customize before calling the bind() function
    // rootEl - where to find all of the bound elements
    // attributeType - probably 'name' or 'id' in most cases
    // converter(optional) - the default converter you want applied to all your bindings
    // elAttribute(optional) - the default elAttribute you want applied to all your bindings
    Backbone.ModelBinder.createDefaultBindings = function(rootEl, attributeType, converter, elAttribute){
        var foundEls, elCount, foundEl, attributeName;
        var bindings = {};

        foundEls = $('[' + attributeType + ']', rootEl);

        for(elCount = 0; elCount < foundEls.length; elCount++){
            foundEl = foundEls[elCount];
            attributeName = $(foundEl).attr(attributeType);

            if(!bindings[attributeName]){
                var attributeBinding =  {selector: '[' + attributeType + '="' + attributeName + '"]'};
                bindings[attributeName] = attributeBinding;

                if(converter){
                    bindings[attributeName].converter = converter;
                }

                if(elAttribute){
                    bindings[attributeName].elAttribute = elAttribute;
                }
            }
        }

        return bindings;
    };

    // Helps you to combine 2 sets of bindings
    Backbone.ModelBinder.combineBindings = function(destination, source){
        _.each(source, function(value, key){
            var elementBinding = {selector: value.selector};

            if(value.converter){
                elementBinding.converter = value.converter;
            }

            if(value.elAttribute){
                elementBinding.elAttribute = value.elAttribute;
            }

            if(!destination[key]){
                destination[key] = elementBinding;
            }
            else {
                destination[key] = [destination[key], elementBinding];
            }
        });
    };

    // Backbone.CollectionBinder v0.1.1
// (c) 2012 Bart Wood
// Distributed Under MIT License

(function(){

    if(!Backbone){
        throw 'Please include Backbone.js before Backbone.ModelBinder.js';
    }

    if(!Backbone.ModelBinder){
        throw 'Please include Backbone.ModelBinder.js before Backbone.CollectionBinder.js';
    }

    Backbone.CollectionBinder = function(elManagerFactory){
        _.bindAll(this);

        this._elManagerFactory = elManagerFactory;
        if(!this._elManagerFactory) throw 'elManagerFactory must be defined.';

        // Let the factory just use the trigger function on the view binder
        this._elManagerFactory.trigger = this.trigger;
    };

    Backbone.CollectionBinder.VERSION = '0.1.1';

    _.extend(Backbone.CollectionBinder.prototype, Backbone.Events, {
        bind: function(collection, parentEl){
            
            this.unbind();
            this.isNewlyBound = true;

            if(!collection) throw 'collection must be defined';
            if(!parentEl) throw 'parentEl must be defined';
            this.parentEl = parentEl;
            this._collection = collection;
            this._elManagerFactory.setParentEl(parentEl);

            /* michael forbes - added complete event */
            this._collection.on('complete', this._onCollectionComplete, this);
            this._collection.on('add', this._onCollectionAdd, this);
            this._collection.on('remove', this._onCollectionRemove, this);
            this._collection.on('reset', this._onCollectionReset, this);

        },

        unbind: function(){
            if(this._collection !== undefined){
                this._collection.off('complete', this._onCollectionComplete);
                this._collection.off('add', this._onCollectionAdd);
                this._collection.off('remove', this._onCollectionRemove);
                this._collection.off('reset', this._onCollectionReset);
            }

            this._removeAllElManagers();
        },

        getManagerForEl: function(el){
            var i, elManager, elManagers = _.values(this._elManagers);

            for(i = 0; i < elManagers.length; i++){
                elManager = elManagers[i];

                if(elManager.isElContained(el)){
                    return elManager;
                }
            }

            return undefined;
        },

        getManagerForModel: function(model){
            var i, elManager, elManagers = _.values(this._elManagers);

            for(i = 0; i < elManagers.length; i++){
                elManager = elManagers[i];

                if(elManager.getModel() === model){
                    return elManager;
                }
            }

            return undefined;
        },
        /* michael forbes - added complete event - its not particularly efficient, but it fixes some jnap syncing issues */
        _onCollectionComplete: function(model){

                var self = this;
                /* this needs to go to the end of the execution stack, otherwise it can interfere with _onCollectionAdd and
                we get duplicate entries */
                setTimeout(function(){
                    self.parentEl.empty();
                    self._removeAllElManagers();
                    self._collection.each(function(model){
                    self._onCollectionAdd(model,true);
                });

                    self.trigger('complete');
                },0);
                
        },

        _onCollectionAdd: function(model,fromLoop){
            if(this.isNewlyBound){
                this.parentEl.empty();
                this.isNewlyBound=false;
            }
            /* michael forbes - added check to see if this model was already bound to prevent duplicates */
            if(!this._elManagers[model.cid]){
                this._elManagers[model.cid] = this._elManagerFactory.makeElManager(model);
                this._elManagers[model.cid].createEl();
                
            }
        },

        _onCollectionRemove: function(model){
            this._removeElManager(model);
             this.trigger('remove');
        },

        _onCollectionReset: function(){
            this._removeAllElManagers();

            this._collection.each(function(model){
                this._onCollectionAdd(model);
            }, this);

            this.trigger('complete');
            this.trigger('elsReset', this._collection);
        },

        _removeAllElManagers: function(){
            _.each(this._elManagers, function(elManager){
                elManager.removeEl();
                delete this._elManagers[elManager._model.cid];
            }, this);

            delete this._elManagers;
            this._elManagers = {};
        },

        _removeElManager: function(model){
            if(this._elManagers[model.cid] !== undefined){
                this._elManagers[model.cid].removeEl();
                delete this._elManagers[model.cid];
            }
        }
    });

    // The ElManagerFactory is used for els that are just html templates
    // elHtml - how the model's html will be rendered.  Must have a single root element (div,span).
    // bindings (optional) - either a string which is the binding attribute (name, id, data-name, etc.) or a normal bindings hash
    Backbone.CollectionBinder.ElManagerFactory = function(elHtml, bindings){
        _.bindAll(this);

        this._elHtml = elHtml;
        this._bindings = bindings;

        if(! _.isString(this._elHtml)) throw 'elHtml must be a valid html string';
    };

    _.extend(Backbone.CollectionBinder.ElManagerFactory.prototype, {
        setParentEl: function(parentEl){
            this._parentEl = parentEl;
        },

        makeElManager: function(model){

            var elManager = {
                _model: model,

                createEl: function(){

                    this._el =  $(this._elHtml);
                    $(this._parentEl).append(this._el);

                    if(this._bindings){
                        if(_.isString(this._bindings)){
                            this._modelBinder = new Backbone.ModelBinder();
                            this._modelBinder.bind(this._model, this._el, Backbone.ModelBinder.createDefaultBindings(this._el, this._bindings));
                        }
                        else if(_.isObject(this._bindings)){
                            this._modelBinder = new Backbone.ModelBinder();
                            this._modelBinder.bind(this._model, this._el, this._bindings);
                        }
                        else {
                            throw 'Unsupported bindings type, please use a boolean or a bindings hash';
                        }
                    }

                    this.trigger('elCreated', this._model, this._el);
                },

                removeEl: function(){
                    if(this._modelBinder !== undefined){
                        this._modelBinder.unbind();
                    }

                    this._el.remove();
                    this.trigger('elRemoved', this._model, this._el);
                },

                isElContained: function(findEl){
                    return this._el === findEl || $(this._el).has(findEl).length > 0;
                },

                getModel: function(){
                    return this._model;
                },

                getEl: function(){
                    return this._el;
                }
            };

            _.extend(elManager, this);
            return elManager;
        }
    });


    // The ViewManagerFactory is used for els that are created and owned by backbone views.
    // There is no bindings option because the view made by the viewCreator should take care of any binding
    // viewCreator - a callback that will create backbone view instances for a model passed to the callback
    Backbone.CollectionBinder.ViewManagerFactory = function(viewCreator){
        _.bindAll(this);
        this._viewCreator = viewCreator;

        if(!_.isFunction(this._viewCreator)) throw 'viewCreator must be a valid function that accepts a model and returns a backbone view';
    };

    _.extend(Backbone.CollectionBinder.ViewManagerFactory.prototype, {
        setParentEl: function(parentEl){
            this._parentEl = parentEl;
        },

        makeElManager: function(model){
            var elManager = {

                _model: model,

                createEl: function(){
                    this._view = this._viewCreator(model);
                    $(this._parentEl).append(this._view.render(this._model).el);

                    this.trigger('elCreated', this._model, this._view);
                },

                removeEl: function(){
                    if(this._view.close !== undefined){
                        this._view.close();
                    }
                    else {
                        this._view.$el.remove();
                        // console.log('Backbone.ModelBinder', 'warning, you should implement a close() function for your view, you might end up with zombies');
                    }

                    this.trigger('elRemoved', this._model, this._view);
                },

                isElContained: function(findEl){
                    return this._view.el === findEl || this._view.$el.has(findEl).length > 0;
                },

                getModel: function(){
                    return this._model;
                },

                getEl: function(){
                    return this._view.el;
                }
            };

            _.extend(elManager, this);

            return elManager;
        }
    });

}).call(this);

return Backbone;

});


