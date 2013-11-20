(function() {
  rivets.binders.input = {
    publishes: true,
    routine: rivets.binders.value.routine,
    bind: function(el) {
      return el.addEventListener('input', this.publish);
    },
    unbind: function(el) {
      return el.removeEventListener('input', this.publish);
    }
  };

  rivets.configure({
    prefix: "rv",
    adapter: {
      subscribe: function(obj, keypath, callback) {
        callback.wrapped = function(m, v) {
          return callback(v);
        };
        return obj.on('change:' + keypath, callback.wrapped);
      },
      unsubscribe: function(obj, keypath, callback) {
        return obj.off('change:' + keypath, callback.wrapped);
      },
      read: function(obj, keypath) {
        if (keypath === "cid") {
          return obj.cid;
        }
        return obj.get(keypath);
      },
      publish: function(obj, keypath, value) {
        if (obj.cid) {
          return obj.set(keypath, value);
        } else {
          return obj[keypath] = value;
        }
      }
    }
  });

}).call(this);

(function() {
  var Formbuilder;

  Formbuilder = (function() {
    Formbuilder.helpers = {
      defaultFieldAttrs: function(field_type) {
        var attrs, _base;
        attrs = {
          label: "Untitled",
          field_type: field_type,
          required: true,
          field_options: {}
        };
        return (typeof (_base = Formbuilder.fields[field_type]).defaultAttributes === "function" ? _base.defaultAttributes(attrs) : void 0) || attrs;
      },
      simple_format: function(x) {
        return x != null ? x.replace(/\n/g, '<br />') : void 0;
      }
    };

    Formbuilder.options = {
      BUTTON_CLASS: 'fb-button',
      HTTP_ENDPOINT: '',
      HTTP_METHOD: 'POST',
      FIELDSTYPES_CUSTOM_VALIDATION: ['checkboxes', 'fullname'],
      mappings: {
        SIZE: 'field_options.size',
        UNITS: 'field_options.units',
        LABEL: 'label',
        FIELD_TYPE: 'field_type',
        REQUIRED: 'required',
        ADMIN_ONLY: 'admin_only',
        OPTIONS: 'field_options.options',
        DESCRIPTION: 'field_options.description',
        INCLUDE_OTHER: 'field_options.include_other_option',
        INCLUDE_BLANK: 'field_options.include_blank_option',
        INTEGER_ONLY: 'field_options.integer_only',
        MIN: 'field_options.min',
        MAX: 'field_options.max',
        STEP: 'field_options.step',
        MINLENGTH: 'field_options.minlength',
        MAXLENGTH: 'field_options.maxlength',
        LENGTH_UNITS: 'field_options.min_max_length_units',
        MINAGE: 'field_options.minage',
        DEFAULT_VALUE: 'field_options.default_value',
        HINT: 'field_options.hint'
      },
      dict: {
        ALL_CHANGES_SAVED: 'All changes saved',
        SAVE_FORM: 'Save form',
        UNSAVED_CHANGES: 'You have unsaved changes. If you leave this page, you will lose those changes!'
      }
    };

    Formbuilder.fields = {};

    Formbuilder.inputFields = {};

    Formbuilder.nonInputFields = {};

    Formbuilder.model = Backbone.DeepModel.extend({
      sync: function() {},
      indexInDOM: function() {
        var $wrapper,
          _this = this;
        $wrapper = $(".fb-field-wrapper").filter((function(_, el) {
          return $(el).data('cid') === _this.cid;
        }));
        return $(".fb-field-wrapper").index($wrapper);
      },
      is_input: function() {
        return Formbuilder.inputFields[this.get(Formbuilder.options.mappings.FIELD_TYPE)] != null;
      },
      getCid: function() {
        return this.get('cid') || this.cid;
      }
    });

    Formbuilder.collection = Backbone.Collection.extend({
      initialize: function() {
        return this.on('add', this.copyCidToModel);
      },
      model: Formbuilder.model,
      comparator: function(model) {
        return model.indexInDOM();
      },
      copyCidToModel: function(model) {
        return model.attributes.cid = model.cid;
      }
    });

    Formbuilder.registerField = function(name, opts) {
      var x, _i, _len, _ref;
      _ref = ['view', 'edit'];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        x = _ref[_i];
        opts[x] = _.template(opts[x]);
      }
      Formbuilder.fields[name] = opts;
      if (opts.type === 'non_input') {
        return Formbuilder.nonInputFields[name] = opts;
      } else {
        return Formbuilder.inputFields[name] = opts;
      }
    };

    Formbuilder.views = {
      view_field: Backbone.View.extend({
        className: "fb-field-wrapper",
        events: {
          'click .subtemplate-wrapper': 'focusEditView',
          'click .js-duplicate': 'duplicate',
          'click .js-clear': 'clear'
        },
        initialize: function() {
          this.parentView = this.options.parentView;
          this.field_type = this.model.get(Formbuilder.options.mappings.FIELD_TYPE);
          this.field = Formbuilder.fields[this.field_type];
          this.listenTo(this.model, "change", this.render);
          return this.listenTo(this.model, "destroy", this.remove);
        },
        isValid: function() {
          if (!this.field.isValid) {
            return true;
          }
          return this.field.isValid(this.$el, this.model);
        },
        render: function() {
          var _this = this;
          (function(cid, base_templ_suff) {
            _this.$el.addClass('response-field-' + _this.field_type).data('cid', cid).html(Formbuilder.templates["view/base" + base_templ_suff]({
              rf: _this.model,
              opts: _this.options
            }));
            return (function(x, count, should_incr) {
              var _i, _len, _ref, _results;
              _ref = _this.$("input");
              _results = [];
              for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                x = _ref[_i];
                _results.push(count = (function(x, index, name, val) {
                  name = cid.toString() + "_" + index.toString();
                  if (_this.model.get('field_values')) {
                    val = _this.model.get('field_values')[name];
                  }
                  $(x).attr("name", name);
                  if (val) {
                    _this.setFieldVal($(x), val);
                  }
                  if (_this.field.setup) {
                    _this.field.setup($(x), _this.model, index);
                  }
                  if (_this.model.get(Formbuilder.options.mappings.REQUIRED) && $.inArray(_this.model.get('field_type'), Formbuilder.options.FIELDSTYPES_CUSTOM_VALIDATION) === -1) {
                    $(x).attr("required", true);
                  }
                  return index;
                })(x, count + (should_incr($(x).attr('type')) ? 1 : 0), null, null));
              }
              return _results;
            })(null, 0, function(attr) {
              return attr !== 'radio';
            });
          })(this.model.getCid(), this.model.is_input() ? '' : '_non_input');
          return this;
        },
        setFieldVal: function(elem, val) {
          var _this = this;
          return (function(setters, type) {
            setters = {
              checkbox: function() {
                if (val) {
                  return $(elem).attr("checked", true);
                }
              },
              "default": function() {
                if (val) {
                  return $(elem).val(val);
                }
              }
            };
            return (setters[type] || setters['default'])(elem, val);
          })(null, $(elem).attr('type'));
        },
        focusEditView: function() {
          if (!this.options.live) {
            return this.parentView.createAndShowEditView(this.model);
          }
        },
        clear: function() {
          this.parentView.handleFormUpdate();
          return this.model.destroy();
        },
        duplicate: function() {
          var attrs;
          attrs = _.clone(this.model.attributes);
          delete attrs['id'];
          attrs['label'] += ' Copy';
          return this.parentView.createField(attrs, {
            position: this.model.indexInDOM() + 1
          });
        }
      }),
      edit_field: Backbone.View.extend({
        className: "edit-response-field",
        events: {
          'click .js-add-option': 'addOption',
          'click .js-remove-option': 'removeOption',
          'click .js-default-updated': 'defaultUpdated',
          'input .option-label-input': 'forceRender'
        },
        initialize: function() {
          return this.listenTo(this.model, "destroy", this.remove);
        },
        render: function() {
          this.$el.html(Formbuilder.templates["edit/base" + (!this.model.is_input() ? '_non_input' : '')]({
            rf: this.model
          }));
          rivets.bind(this.$el, {
            model: this.model
          });
          return this;
        },
        remove: function() {
          this.options.parentView.editView = void 0;
          this.options.parentView.$el.find("[href=\"#addField\"]").click();
          return Backbone.View.prototype.remove.call(this);
        },
        addOption: function(e) {
          var $el, i, newOption, options;
          $el = $(e.currentTarget);
          i = this.$el.find('.option').index($el.closest('.option'));
          options = this.model.get(Formbuilder.options.mappings.OPTIONS) || [];
          newOption = {
            label: "",
            checked: false
          };
          if (i > -1) {
            options.splice(i + 1, 0, newOption);
          } else {
            options.push(newOption);
          }
          this.model.set(Formbuilder.options.mappings.OPTIONS, options);
          this.model.trigger("change:" + Formbuilder.options.mappings.OPTIONS);
          return this.forceRender();
        },
        removeOption: function(e) {
          var $el, index, options;
          $el = $(e.currentTarget);
          index = this.$el.find(".js-remove-option").index($el);
          options = this.model.get(Formbuilder.options.mappings.OPTIONS);
          options.splice(index, 1);
          this.model.set(Formbuilder.options.mappings.OPTIONS, options);
          this.model.trigger("change:" + Formbuilder.options.mappings.OPTIONS);
          return this.forceRender();
        },
        defaultUpdated: function(e) {
          var $el;
          $el = $(e.currentTarget);
          if (this.model.get(Formbuilder.options.mappings.FIELD_TYPE) !== 'checkboxes') {
            this.$el.find(".js-default-updated").not($el).attr('checked', false).trigger('change');
          }
          return this.forceRender();
        },
        forceRender: function() {
          return this.model.trigger('change');
        }
      }),
      main: Backbone.View.extend({
        SUBVIEWS: [],
        events: {
          'click .js-save-form': 'saveForm',
          'click .fb-tabs a': 'showTab',
          'click .fb-add-field-types a': 'addField'
        },
        initialize: function() {
          this.$el = $(this.options.selector);
          this.formBuilder = this.options.formBuilder;
          this.fieldViews = [];
          this.collection = new Formbuilder.collection;
          this.collection.bind('add', this.addOne, this);
          this.collection.bind('reset', this.reset, this);
          this.collection.bind('change', this.handleFormUpdate, this);
          this.collection.bind('destroy add reset', this.hideShowNoResponseFields, this);
          this.collection.bind('destroy', this.ensureEditViewScrolled, this);
          if (!this.options.live) {
            this.options.readonly = true;
          }
          this.render();
          this.collection.reset(this.options.bootstrapData);
          this.saveFormButton = this.$el.find(".js-save-form");
          this.saveFormButton.attr('disabled', true).text(Formbuilder.options.dict.ALL_CHANGES_SAVED);
          if (this.options.autoSave) {
            return this.initAutosave();
          }
        },
        initAutosave: function() {
          var _this = this;
          this.formSaved = true;
          setInterval(function() {
            return _this.saveForm.call(_this);
          }, 5000);
          return $(window).bind('beforeunload', function() {
            if (_this.formSaved) {
              return void 0;
            } else {
              return Formbuilder.options.dict.UNSAVED_CHANGES;
            }
          });
        },
        reset: function() {
          this.$responseFields.html('');
          return this.addAll();
        },
        render: function() {
          var subview, _i, _len, _ref;
          if (!this.options.alt_parents) {
            this.$el.html(Formbuilder.templates['page']({
              opts: this.options
            }));
            this.$fbLeft = this.$el.find('.fb-left');
            this.$responseFields = this.$el.find('.fb-response-fields');
          } else {
            if (!this.options.live) {
              $(this.options.alt_parents['fb_save']).html(Formbuilder.templates['partials/save_button']());
              $(this.options.alt_parents['fb_left']).html(Formbuilder.templates['partials/left_side']());
              this.$fbLeft = this.options.alt_parents['fb_left'].find('.fb-left');
            }
            $(this.options.alt_parents['fb_right']).html(Formbuilder.templates['partials/right_side']({
              opts: this.options
            }));
            this.$responseFields = this.options.alt_parents['fb_right'].find('.fb-response-fields');
          }
          this.bindWindowScrollEvent();
          this.hideShowNoResponseFields();
          _ref = this.SUBVIEWS;
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            subview = _ref[_i];
            new subview({
              parentView: this
            }).render();
          }
          return this;
        },
        bindWindowScrollEvent: function() {
          var _this = this;
          return $(window).on('scroll', function() {
            var maxMargin, newMargin;
            if (_this.$fbLeft.data('locked') === true) {
              return;
            }
            newMargin = Math.max(0, $(window).scrollTop());
            maxMargin = _this.$responseFields.height();
            return _this.$fbLeft.css({
              'margin-top': Math.min(maxMargin, newMargin)
            });
          });
        },
        showTab: function(e) {
          var $el, first_model, target;
          $el = $(e.currentTarget);
          target = $el.data('target');
          $el.closest('li').addClass('active').siblings('li').removeClass('active');
          $(target).addClass('active').siblings('.fb-tab-pane').removeClass('active');
          if (target !== '#editField') {
            this.unlockLeftWrapper();
          }
          if (target === '#editField' && !this.editView && (first_model = this.collection.models[0])) {
            return this.createAndShowEditView(first_model);
          }
        },
        addOne: function(responseField, _, options) {
          var $replacePosition, view;
          view = new Formbuilder.views.view_field({
            model: responseField,
            parentView: this,
            live: this.options.live,
            readonly: this.options.readonly,
            seedData: responseField.seedData
          });
          this.fieldViews.push(view);
          if (options.$replaceEl != null) {
            return options.$replaceEl.replaceWith(view.render().el);
          } else if ((options.position == null) || options.position === -1) {
            return this.$responseFields.append(view.render().el);
          } else if (options.position === 0) {
            return this.$responseFields.prepend(view.render().el);
          } else if (($replacePosition = this.$responseFields.find(".fb-field-wrapper").eq(options.position))[0]) {
            return $replacePosition.before(view.render().el);
          } else {
            return this.$responseFields.append(view.render().el);
          }
        },
        setSortable: function() {
          var _this = this;
          if (this.$responseFields.hasClass('ui-sortable')) {
            this.$responseFields.sortable('destroy');
          }
          this.$responseFields.sortable({
            forcePlaceholderSize: true,
            placeholder: 'sortable-placeholder',
            stop: function(e, ui) {
              var rf;
              if (ui.item.data('field-type')) {
                rf = _this.collection.create(Formbuilder.helpers.defaultFieldAttrs(ui.item.data('field-type')), {
                  $replaceEl: ui.item
                });
                _this.createAndShowEditView(rf);
              }
              _this.handleFormUpdate();
              return true;
            },
            update: function(e, ui) {
              if (!ui.item.data('field-type')) {
                return _this.ensureEditViewScrolled();
              }
            }
          });
          return this.setDraggable();
        },
        setDraggable: function() {
          var $addFieldButtons,
            _this = this;
          $addFieldButtons = this.$el.find("[data-field-type]");
          return $addFieldButtons.draggable({
            connectToSortable: this.$responseFields,
            helper: function() {
              var $helper;
              $helper = $("<div class='response-field-draggable-helper' />");
              $helper.css({
                width: _this.$responseFields.width(),
                height: '80px'
              });
              return $helper;
            }
          });
        },
        addAll: function() {
          this.collection.each(this.addOne, this);
          if (!this.options.live) {
            return this.setSortable();
          }
        },
        hideShowNoResponseFields: function() {
          return this.$el.find(".fb-no-response-fields")[this.collection.length > 0 ? 'hide' : 'show']();
        },
        addField: function(e) {
          var field_type;
          field_type = $(e.currentTarget).data('field-type');
          return this.createField(Formbuilder.helpers.defaultFieldAttrs(field_type));
        },
        createField: function(attrs, options) {
          var rf;
          rf = this.collection.create(attrs, options);
          this.createAndShowEditView(rf);
          return this.handleFormUpdate();
        },
        createAndShowEditView: function(model) {
          var $newEditEl, $responseFieldEl, oldPadding;
          $responseFieldEl = this.$el.find(".fb-field-wrapper").filter(function() {
            return $(this).data('cid') === model.cid;
          });
          $responseFieldEl.addClass('editing').siblings('.fb-field-wrapper').removeClass('editing');
          if (this.editView) {
            if (this.editView.model.cid === model.cid) {
              this.$el.find(".fb-tabs a[data-target=\"#editField\"]").click();
              this.scrollLeftWrapper($responseFieldEl, (typeof oldPadding !== "undefined" && oldPadding !== null) && oldPadding);
              return;
            }
            oldPadding = this.$fbLeft.css('padding-top');
            this.editView.remove();
          }
          this.editView = new Formbuilder.views.edit_field({
            model: model,
            parentView: this
          });
          $newEditEl = this.editView.render().$el;
          this.$el.find(".fb-edit-field-wrapper").html($newEditEl);
          this.$el.find(".fb-tabs a[data-target=\"#editField\"]").click();
          this.scrollLeftWrapper($responseFieldEl);
          return this;
        },
        ensureEditViewScrolled: function() {
          if (!this.editView) {
            return;
          }
          return this.scrollLeftWrapper($(".fb-field-wrapper.editing"));
        },
        scrollLeftWrapper: function($responseFieldEl) {
          var _this = this;
          this.unlockLeftWrapper();
          return $.scrollWindowTo($responseFieldEl.offset().top - this.$responseFields.offset().top, 200, function() {
            return _this.lockLeftWrapper();
          });
        },
        lockLeftWrapper: function() {
          return this.$fbLeft.data('locked', true);
        },
        unlockLeftWrapper: function() {
          return this.$fbLeft.data('locked', false);
        },
        handleFormUpdate: function() {
          if (this.updatingBatch) {
            return;
          }
          this.formSaved = false;
          return this.saveFormButton.removeAttr('disabled').text(Formbuilder.options.dict.SAVE_FORM);
        },
        saveForm: function(e) {
          var payload;
          if (this.formSaved) {
            return;
          }
          this.formSaved = true;
          this.saveFormButton.attr('disabled', true).text(Formbuilder.options.dict.ALL_CHANGES_SAVED);
          this.collection.sort();
          payload = JSON.stringify({
            fields: this.collection.toJSON()
          });
          if (Formbuilder.options.HTTP_ENDPOINT) {
            this.doAjaxSave(payload);
          }
          return this.formBuilder.trigger('save', payload);
        },
        formData: function() {
          return this.$('#formbuilder_form').serializeArray();
        },
        formValid: function() {
          var _this = this;
          return (function(valid) {
            valid = (function(el) {
              return !el.checkValidity || el.checkValidity();
            })(_this.$('#formbuilder_form')[0]);
            if (!valid) {
              return false;
            }
            return (function(field) {
              var _i, _len, _ref;
              _ref = _this.fieldViews;
              for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                field = _ref[_i];
                if (field.isValid && !field.isValid()) {
                  return false;
                }
              }
              return true;
            })(null);
          })(false);
        },
        doAjaxSave: function(payload) {
          var _this = this;
          return $.ajax({
            url: Formbuilder.options.HTTP_ENDPOINT,
            type: Formbuilder.options.HTTP_METHOD,
            data: payload,
            contentType: "application/json",
            success: function(data) {
              var datum, _i, _len, _ref;
              _this.updatingBatch = true;
              for (_i = 0, _len = data.length; _i < _len; _i++) {
                datum = data[_i];
                if ((_ref = _this.collection.get(datum.cid)) != null) {
                  _ref.set({
                    id: datum.id
                  });
                }
                _this.collection.trigger('sync');
              }
              return _this.updatingBatch = void 0;
            }
          });
        }
      })
    };

    function Formbuilder(selector, opts) {
      if (opts == null) {
        opts = {};
      }
      _.extend(this, Backbone.Events);
      this.mainView = new Formbuilder.views.main(_.extend({
        selector: selector
      }, opts, {
        formBuilder: this
      }));
    }

    Formbuilder.prototype.formData = function() {
      return this.mainView.formData();
    };

    Formbuilder.prototype.formValid = function() {
      return this.mainView.formValid();
    };

    return Formbuilder;

  })();

  window.Formbuilder = Formbuilder;

  if (typeof module !== "undefined" && module !== null) {
    module.exports = Formbuilder;
  } else {
    window.Formbuilder = Formbuilder;
  }

}).call(this);

(function() {
  Formbuilder.registerField('address', {
    view: "<div class='input-line'>\n  <span class='street'>\n    <input type='text' />\n    <label>Address</label>\n  </span>\n</div>\n\n<div class='input-line'>\n  <span class='city'>\n    <input type='text' />\n    <label>Suburb</label>\n  </span>\n\n  <span class='state'>\n    <input type='text' />\n    <label>State / Province / Region</label>\n  </span>\n</div>\n\n<div class='input-line'>\n  <span class='zip'>\n    <input type='text' />\n    <label>Zipcode</label>\n  </span>\n\n  <span class='country'>\n    <select><option>United States</option></select>\n    <label>Country</label>\n  </span>\n</div>",
    edit: "",
    addButton: "<span class=\"symbol\"><span class=\"icon-home\"></span></span> Address"
  });

}).call(this);

(function() {
  Formbuilder.registerField('checkboxes', {
    view: "<% for (i in (rf.get(Formbuilder.options.mappings.OPTIONS) || [])) { %>\n  <div>\n    <label class='fb-option'>\n      <input type='checkbox' value=<%= rf.get(Formbuilder.options.mappings.OPTIONS)[i].label%> <%= rf.get(Formbuilder.options.mappings.OPTIONS)[i].checked && 'checked' %> />\n      <%= rf.get(Formbuilder.options.mappings.OPTIONS)[i].label %>\n    </label>\n  </div>\n<% } %>\n\n<% if (rf.get(Formbuilder.options.mappings.INCLUDE_OTHER)) { %>\n  <div class='other-option'>\n    <label class='fb-option'>\n      <input class='other-option' type='checkbox' value=\"__other__\"/>\n      Other\n    </label>\n\n    <input type='text' />\n  </div>\n<% } %>",
    edit: "<%= Formbuilder.templates['edit/options']({ includeOther: true }) %>",
    addButton: "<span class=\"symbol\"><span class=\"icon-check-empty\"></span></span> Checkboxes",
    defaultAttributes: function(attrs) {
      attrs.field_options.options = [
        {
          label: "",
          checked: false
        }, {
          label: "",
          checked: false
        }
      ];
      return attrs;
    },
    isValid: function($el, model) {
      var _this = this;
      return (function(valid) {
        valid = (function(required_attr, checked_chk_cnt) {
          if (!required_attr) {
            return true;
          }
          checked_chk_cnt = $el.find('input:checked').length;
          return checked_chk_cnt > 0;
        })(model.get('required'), 0);
        return valid;
      })(false);
    }
  });

}).call(this);

(function() {
  Formbuilder.registerField('date', {
    view: "<div class='input-line'>\n  <input type='date' />\n</div>",
    edit: "",
    addButton: "<span class=\"symbol\"><span class=\"icon-calendar\"></span></span> Date"
  });

}).call(this);

(function() {
  Formbuilder.registerField('date_of_birth', {
    view: "<div class='input-line'>\n  <input type='date'/>\n</div>",
    edit: "<%= Formbuilder.templates['edit/age_restriction']({ includeOther: true }) %>",
    addButton: "<span class=\"symbol\"><span class=\"icon-gift\"></span></span> BirthDay",
    setup: function(el, model, index) {
      var _this = this;
      return (function(today, restricted_date) {
        if (model.get(Formbuilder.options.mappings.MINAGE)) {
          restricted_date.setFullYear(today.getFullYear() - model.get(Formbuilder.options.mappings.MINAGE));
          return el.attr("max", restricted_date.toISOString().slice(0, 10));
        } else {
          return el.attr("max", today.toISOString().slice(0, 10));
        }
      })(new Date, new Date);
    }
  });

}).call(this);

(function() {
  Formbuilder.registerField('dropdown', {
    view: "<select>\n  <% if (rf.get(Formbuilder.options.mappings.INCLUDE_BLANK)) { %>\n    <option value=''></option>\n  <% } %>\n\n  <% for (i in (rf.get(Formbuilder.options.mappings.OPTIONS) || [])) { %>\n    <option <%= rf.get(Formbuilder.options.mappings.OPTIONS)[i].checked && 'selected' %>>\n      <%= rf.get(Formbuilder.options.mappings.OPTIONS)[i].label %>\n    </option>\n  <% } %>\n</select>",
    edit: "<%= Formbuilder.templates['edit/options']({ includeBlank: true }) %>",
    addButton: "<span class=\"symbol\"><span class=\"icon-caret-down\"></span></span> Dropdown",
    defaultAttributes: function(attrs) {
      attrs.field_options.options = [
        {
          label: "",
          checked: false
        }, {
          label: "",
          checked: false
        }
      ];
      attrs.field_options.include_blank_option = false;
      return attrs;
    }
  });

}).call(this);

(function() {
  Formbuilder.registerField('email', {
    view: "<input type='email' class='rf-size-<%= rf.get(Formbuilder.options.mappings.SIZE) %>' />",
    edit: "",
    addButton: "<span class=\"symbol\"><span class=\"icon-envelope-alt\"></span></span> Email"
  });

}).call(this);

(function() {
  Formbuilder.registerField('file', {
    view: "<a id='form_file'>file</a>\n<input type='file' />",
    edit: "",
    addButton: "<span class=\"symbol\"><span class=\"icon-cloud-upload\"></span></span> File"
  });

}).call(this);

(function() {
  Formbuilder.registerField('fullname', {
    perfix: ['Mr.', 'Mrs.', 'Miss.', 'Ms.', 'Mst.', 'Dr.'],
    view: "<div class='input-line'>\n  <span>\n    <select class='span12'>\n      <%for (i = 0; i < this.perfix.length; i++){%>\n        <option><%= this.perfix[i]%></option>\n      <%}%>\n    </select>\n    <label>Prefix</label>\n  </span>\n\n  <span>\n    <input id='first_name' type='text' pattern=\"[a-zA-Z]+\"/>\n    <label>First</label>\n  </span>\n\n  <% if (rf.get(Formbuilder.options.mappings.INCLUDE_OTHER)) { %>\n    <span>\n      <input type='text' pattern=\"[a-zA-Z]+\"/>\n      <label>Middle</label>\n    </span>\n  <% } %>\n\n  <span>\n    <input id='last_name' type='text' pattern=\"[a-zA-Z]+\"/>\n    <label>Last</label>\n  </span>\n\n  <span>\n    <input type='text'/>\n    <label>Suffix</label>\n  </span>\n</div>",
    edit: "<%= Formbuilder.templates['edit/middle']({ includeOther: true }) %>",
    addButton: "<span class=\"symbol\"><span class=\"icon-user\"></span></span> Full Name",
    isValid: function($el, model) {
      var _this = this;
      return (function(valid) {
        valid = (function(required_attr, checked_chk_cnt) {
          if (!required_attr) {
            return true;
          }
          return $el.find("#first_name").val() !== '' && $el.find("#last_name").val() !== '';
        })(model.get('required'), 0);
        return valid;
      })(false);
    }
  });

}).call(this);

(function() {
  Formbuilder.registerField('heading', {
    type: 'non_input',
    view: "<label class='rf-size-<%= rf.get(Formbuilder.options.mappings.SIZE) %>'>\n  <%= rf.get(Formbuilder.options.mappings.LABEL) %>\n</label>\n<p class='rf-size-<%= rf.get(Formbuilder.options.mappings.SIZE) %>'>\n  <%= rf.get(Formbuilder.options.mappings.DESCRIPTION) %>\n</p>",
    edit: "<div class=''>Heading Title</div>\n<input type='text'\n  data-rv-input='model.<%= Formbuilder.options.mappings.LABEL %>' />\n<textarea\n  data-rv-input='model.<%= Formbuilder.options.mappings.DESCRIPTION %>'\n  placeholder='Add a longer description to this field'>\n</textarea>\n<%= Formbuilder.templates['edit/size']() %>",
    addButton: "<span class='symbol'><span class='icon-font'></span></span> Heading",
    defaultAttributes: function(attrs) {
      attrs.field_options.size = 'small';
      return attrs;
    }
  });

}).call(this);

(function() {
  Formbuilder.registerField('number', {
    view: "<input type='number' />\n<% if (units = rf.get(Formbuilder.options.mappings.UNITS)) { %>\n  <%= units %>\n<% } %>",
    edit: "<%= Formbuilder.templates['edit/min_max_step']() %>\n<%= Formbuilder.templates['edit/units']() %>\n<%= Formbuilder.templates['edit/integer_only']() %>",
    addButton: "<span class=\"symbol\"><span class=\"icon-number\">123</span></span> Number",
    setup: function(el, model, index) {
      if (model.get(Formbuilder.options.mappings.MIN)) {
        el.attr("min", model.get(Formbuilder.options.mappings.MIN));
      }
      if (model.get(Formbuilder.options.mappings.MAX)) {
        el.attr("max", model.get(Formbuilder.options.mappings.MAX));
      }
      if (model.get(Formbuilder.options.mappings.STEP)) {
        return el.attr("step", model.get(Formbuilder.options.mappings.STEP));
      }
    }
  });

}).call(this);

(function() {
  Formbuilder.registerField('paragraph', {
    view: "<textarea class='rf-size-<%= rf.get(Formbuilder.options.mappings.SIZE) %>'></textarea>",
    edit: "<%= Formbuilder.templates['edit/size']() %>\n<%= Formbuilder.templates['edit/min_max_length']() %>",
    addButton: "<span class=\"symbol\">&#182;</span> Paragraph",
    defaultAttributes: function(attrs) {
      attrs.field_options.size = 'small';
      return attrs;
    }
  });

}).call(this);

(function() {
  Formbuilder.registerField('price', {
    view: "<div class='input-line'>\n  <span class='above-line'>$</span>\n  <span class='dolars'>\n    <input type='text' pattern=\"[0-9]+\" />\n    <label>Dollars</label>\n  </span>\n  <span class='above-line'>.</span>\n  <span class='cents'>\n    <input type='text' pattern=\"[0-9]+\" />\n    <label>Cents</label>\n  </span>\n</div>",
    edit: "",
    addButton: "<span class=\"symbol\"><span class=\"icon-dollar\"></span></span> Price"
  });

}).call(this);

(function() {
  Formbuilder.registerField('radio', {
    view: "<% for (i in (rf.get(Formbuilder.options.mappings.OPTIONS) || [])) { %>\n  <div>\n    <label class='fb-option'>\n      <input type='radio' value=<%= rf.get(Formbuilder.options.mappings.OPTIONS)[i].label%> <%= rf.get(Formbuilder.options.mappings.OPTIONS)[i].checked && 'checked' %>/>\n      <%= rf.get(Formbuilder.options.mappings.OPTIONS)[i].label %>\n    </label>\n  </div>\n<% } %>\n\n<% if (rf.get(Formbuilder.options.mappings.INCLUDE_OTHER)) { %>\n  <div class='other-option'>\n    <label class='fb-option'>\n      <input type='radio' value=\"__other__\"/>\n      Other\n    </label>\n\n    <input type='text' />\n  </div>\n<% } %>",
    edit: "<%= Formbuilder.templates['edit/options']({ includeOther: true }) %>",
    addButton: "<span class=\"symbol\"><span class=\"icon-circle-blank\"></span></span> Multiple Choice",
    defaultAttributes: function(attrs) {
      attrs.field_options.options = [
        {
          label: "",
          checked: false
        }, {
          label: "",
          checked: false
        }
      ];
      return attrs;
    }
  });

}).call(this);

(function() {
  Formbuilder.registerField('section_break', {
    type: 'non_input',
    view: "<label class='section-name'><%= rf.get(Formbuilder.options.mappings.LABEL) %></label>\n<p><%= rf.get(Formbuilder.options.mappings.DESCRIPTION) %></p>",
    edit: "<div class='fb-edit-section-header'>Label</div>\n<input type='text' data-rv-input='model.<%= Formbuilder.options.mappings.LABEL %>' />\n<textarea data-rv-input='model.<%= Formbuilder.options.mappings.DESCRIPTION %>'\n  placeholder='Add a longer description to this field'></textarea>",
    addButton: "<span class='symbol'><span class='icon-minus'></span></span> Section Break"
  });

}).call(this);

(function() {
  Formbuilder.registerField('text', {
    view: "<input type='text' pattern=\"[a-zA-Z0-9_\\s]+\" class='rf-size-<%= rf.get(Formbuilder.options.mappings.SIZE) %>' />",
    edit: "<%= Formbuilder.templates['edit/size']() %>\n<%= Formbuilder.templates['edit/min_max_length']() %>\n<%= Formbuilder.templates['edit/default_value_hint']() %>",
    addButton: "<span class='symbol'><span class='icon-font'></span></span> Text",
    defaultAttributes: function(attrs) {
      attrs.field_options.size = 'small';
      return attrs;
    },
    setup: function(el, model, index) {
      if (model.get(Formbuilder.options.mappings.MINLENGTH)) {
        (function(min_length) {
          return el.attr("pattern", "[a-zA-Z0-9_\\s]{" + min_length + ",}");
        })(model.get(Formbuilder.options.mappings.MINLENGTH));
      }
      if (model.get(Formbuilder.options.mappings.MAXLENGTH)) {
        el.attr("maxlength", model.get(Formbuilder.options.mappings.MAXLENGTH));
      }
      if (model.get(Formbuilder.options.mappings.DEFAULT_VALUE)) {
        el.attr("value", model.get(Formbuilder.options.mappings.DEFAULT_VALUE));
      }
      if (model.get(Formbuilder.options.mappings.HINT)) {
        return el.attr("placeholder", model.get(Formbuilder.options.mappings.HINT));
      }
    }
  });

}).call(this);

(function() {
  Formbuilder.registerField('time', {
    view: "<div class='input-line'>\n  <input type=\"time\" />\n</div>",
    edit: "<%= Formbuilder.templates['edit/step']() %>",
    addButton: "<span class=\"symbol\"><span class=\"icon-time\"></span></span> Time",
    setup: function(el, model, index) {
      if (model.get(Formbuilder.options.mappings.STEP)) {
        return el.attr("step", model.get(Formbuilder.options.mappings.STEP));
      }
    }
  });

}).call(this);

(function() {
  Formbuilder.registerField('url', {
    view: "<input type='url' pattern=\"https?://.+\" class='rf-size-<%= rf.get(Formbuilder.options.mappings.SIZE) %>' placeholder='http://' />",
    edit: "<%= Formbuilder.templates['edit/size']() %>",
    addButton: "<span class=\"symbol\"><span class=\"icon-link\"></span></span> URL"
  });

}).call(this);

this["Formbuilder"] = this["Formbuilder"] || {};
this["Formbuilder"]["templates"] = this["Formbuilder"]["templates"] || {};

this["Formbuilder"]["templates"]["edit/age_restriction"] = function(obj) {
obj || (obj = {});
var __t, __p = '', __e = _.escape;
with (obj) {
__p += '<div class=\'fb-edit-section-header\'>Age Restriction</div>\n\n  <input type="number" data-rv-input="model.' +
((__t = ( Formbuilder.options.mappings.MINAGE )) == null ? '' : __t) +
'" style="width: 30px" />\n';

}
return __p
};

this["Formbuilder"]["templates"]["edit/base"] = function(obj) {
obj || (obj = {});
var __t, __p = '', __e = _.escape;
with (obj) {
__p +=
((__t = ( Formbuilder.templates['edit/base_header']() )) == null ? '' : __t) +
'\n' +
((__t = ( Formbuilder.templates['edit/common']() )) == null ? '' : __t) +
'\n' +
((__t = ( Formbuilder.fields[rf.get(Formbuilder.options.mappings.FIELD_TYPE)].edit({rf: rf}) )) == null ? '' : __t) +
'\n';

}
return __p
};

this["Formbuilder"]["templates"]["edit/base_header"] = function(obj) {
obj || (obj = {});
var __t, __p = '', __e = _.escape;
with (obj) {
__p += '<div class=\'fb-field-label\'>\n  <span data-rv-text="model.' +
((__t = ( Formbuilder.options.mappings.LABEL )) == null ? '' : __t) +
'"></span>\n  <code class=\'field-type\' data-rv-text=\'model.' +
((__t = ( Formbuilder.options.mappings.FIELD_TYPE )) == null ? '' : __t) +
'\'></code>\n  <span class=\'icon-arrow-right pull-right\'></span>\n</div>';

}
return __p
};

this["Formbuilder"]["templates"]["edit/base_non_input"] = function(obj) {
obj || (obj = {});
var __t, __p = '', __e = _.escape;
with (obj) {
__p +=
((__t = ( Formbuilder.templates['edit/base_header']() )) == null ? '' : __t) +
'\n' +
((__t = ( Formbuilder.fields[rf.get(Formbuilder.options.mappings.FIELD_TYPE)].edit({rf: rf}) )) == null ? '' : __t) +
'\n';

}
return __p
};

this["Formbuilder"]["templates"]["edit/checkboxes"] = function(obj) {
obj || (obj = {});
var __t, __p = '', __e = _.escape;
with (obj) {
__p += '<label>\n  <input type=\'checkbox\' data-rv-checked=\'model.' +
((__t = ( Formbuilder.options.mappings.REQUIRED )) == null ? '' : __t) +
'\' />\n  Required\n</label>\n<label>\n  <input type=\'checkbox\' data-rv-checked=\'model.' +
((__t = ( Formbuilder.options.mappings.ADMIN_ONLY )) == null ? '' : __t) +
'\' />\n  Admin only\n</label>';

}
return __p
};

this["Formbuilder"]["templates"]["edit/common"] = function(obj) {
obj || (obj = {});
var __t, __p = '', __e = _.escape;
with (obj) {
__p += '<div class=\'fb-edit-section-header\'>Label</div>\n\n<div class=\'fb-common-wrapper\'>\n  <div class=\'fb-label-description\'>\n    ' +
((__t = ( Formbuilder.templates['edit/label_description']() )) == null ? '' : __t) +
'\n  </div>\n  <div class=\'fb-common-checkboxes\'>\n    ' +
((__t = ( Formbuilder.templates['edit/checkboxes']() )) == null ? '' : __t) +
'\n  </div>\n  <div class=\'fb-clear\'></div>\n</div>\n';

}
return __p
};

this["Formbuilder"]["templates"]["edit/default_value_hint"] = function(obj) {
obj || (obj = {});
var __t, __p = '', __e = _.escape;
with (obj) {
__p += '<div class=\'fb-edit-section-header\'>Default value</div>\n\n<input type="text" pattern="[a-zA-Z0-9_\\\\s]+" data-rv-input="model.' +
((__t = ( Formbuilder.options.mappings.DEFAULT_VALUE )) == null ? '' : __t) +
'"/>\n\n<div class=\'fb-edit-section-header\'>Hint/Placeholder</div>\n\n<input type="text" pattern="[a-zA-Z0-9_\\\\s]+" data-rv-input="model.' +
((__t = ( Formbuilder.options.mappings.HINT )) == null ? '' : __t) +
'"/>\n';

}
return __p
};

this["Formbuilder"]["templates"]["edit/integer_only"] = function(obj) {
obj || (obj = {});
var __t, __p = '', __e = _.escape;
with (obj) {
__p += '<div class=\'fb-edit-section-header\'>Integer only</div>\n<label>\n  <input type=\'checkbox\' data-rv-checked=\'model.' +
((__t = ( Formbuilder.options.mappings.INTEGER_ONLY )) == null ? '' : __t) +
'\' />\n  Only accept integers\n</label>\n';

}
return __p
};

this["Formbuilder"]["templates"]["edit/label_description"] = function(obj) {
obj || (obj = {});
var __t, __p = '', __e = _.escape;
with (obj) {
__p += '<input type=\'text\' data-rv-input=\'model.' +
((__t = ( Formbuilder.options.mappings.LABEL )) == null ? '' : __t) +
'\' />\n<textarea data-rv-input=\'model.' +
((__t = ( Formbuilder.options.mappings.DESCRIPTION )) == null ? '' : __t) +
'\'\n  placeholder=\'Add a longer description to this field\'></textarea>';

}
return __p
};

this["Formbuilder"]["templates"]["edit/middle"] = function(obj) {
obj || (obj = {});
var __t, __p = '', __e = _.escape, __j = Array.prototype.join;
function print() { __p += __j.call(arguments, '') }
with (obj) {
__p += '<div class=\'fb-edit-section-header\'>Options</div>\n\n';
 if (typeof includeOther !== 'undefined'){ ;
__p += '\n  <label>\n    <input type=\'checkbox\' data-rv-checked=\'model.' +
((__t = ( Formbuilder.options.mappings.INCLUDE_OTHER )) == null ? '' : __t) +
'\' />\n    Include "Middle Name"\n  </label>\n';
 } ;
__p += '\n';

}
return __p
};

this["Formbuilder"]["templates"]["edit/min_max_length"] = function(obj) {
obj || (obj = {});
var __t, __p = '', __e = _.escape;
with (obj) {
__p += '<div class=\'fb-edit-section-header\'>Length Limit</div>\n\nMin\n<input type="number" data-rv-input="model.' +
((__t = ( Formbuilder.options.mappings.MINLENGTH )) == null ? '' : __t) +
'" style="width: 30px" />\n\n&nbsp;&nbsp;\n\nMax\n<input type="number" data-rv-input="model.' +
((__t = ( Formbuilder.options.mappings.MAXLENGTH )) == null ? '' : __t) +
'" style="width: 30px" />\n\n&nbsp;&nbsp;\n\n<label class="fb-field-label-length-unit">Characters</label>\n';

}
return __p
};

this["Formbuilder"]["templates"]["edit/min_max_step"] = function(obj) {
obj || (obj = {});
var __t, __p = '', __e = _.escape;
with (obj) {
__p += '<div class=\'fb-edit-section-header\'>Minimum / Maximum</div>\n\nAbove\n<input type="number" data-rv-input="model.' +
((__t = ( Formbuilder.options.mappings.MIN )) == null ? '' : __t) +
'" style="width: 30px" />\n\n&nbsp;&nbsp;\n\nBelow\n<input type="number" data-rv-input="model.' +
((__t = ( Formbuilder.options.mappings.MAX )) == null ? '' : __t) +
'" style="width: 30px" />\n\n&nbsp;&nbsp;\nStep\n<input type="number" data-rv-input="model.' +
((__t = ( Formbuilder.options.mappings.STEP )) == null ? '' : __t) +
'" style="width: 30px" />\n';

}
return __p
};

this["Formbuilder"]["templates"]["edit/options"] = function(obj) {
obj || (obj = {});
var __t, __p = '', __e = _.escape, __j = Array.prototype.join;
function print() { __p += __j.call(arguments, '') }
with (obj) {
__p += '<div class=\'fb-edit-section-header\'>Options</div>\n\n';
 if (typeof includeBlank !== 'undefined'){ ;
__p += '\n  <label>\n    <input type=\'checkbox\' data-rv-checked=\'model.' +
((__t = ( Formbuilder.options.mappings.INCLUDE_BLANK )) == null ? '' : __t) +
'\' />\n    Include blank\n  </label>\n';
 } ;
__p += '\n\n<div class=\'option\' data-rv-each-option=\'model.' +
((__t = ( Formbuilder.options.mappings.OPTIONS )) == null ? '' : __t) +
'\'>\n  <input type="checkbox" class=\'js-default-updated\' data-rv-checked="option:checked" />\n  <input type="text" data-rv-input="option:label" class=\'option-label-input\' />\n  <a class="js-add-option ' +
((__t = ( Formbuilder.options.BUTTON_CLASS )) == null ? '' : __t) +
'" title="Add Option"><i class=\'icon-plus-sign\'></i></a>\n  <a class="js-remove-option ' +
((__t = ( Formbuilder.options.BUTTON_CLASS )) == null ? '' : __t) +
'" title="Remove Option"><i class=\'icon-minus-sign\'></i></a>\n</div>\n\n';
 if (typeof includeOther !== 'undefined'){ ;
__p += '\n  <label>\n    <input type=\'checkbox\' data-rv-checked=\'model.' +
((__t = ( Formbuilder.options.mappings.INCLUDE_OTHER )) == null ? '' : __t) +
'\' />\n    Include "other"\n  </label>\n';
 } ;
__p += '\n\n<div class=\'fb-bottom-add\'>\n  <a class="js-add-option ' +
((__t = ( Formbuilder.options.BUTTON_CLASS )) == null ? '' : __t) +
'">Add option</a>\n</div>\n';

}
return __p
};

this["Formbuilder"]["templates"]["edit/size"] = function(obj) {
obj || (obj = {});
var __t, __p = '', __e = _.escape;
with (obj) {
__p += '<div class=\'fb-edit-section-header\'>Size</div>\n<select data-rv-value="model.' +
((__t = ( Formbuilder.options.mappings.SIZE )) == null ? '' : __t) +
'">\n  <option value="small">Small</option>\n  <option value="medium">Medium</option>\n  <option value="large">Large</option>\n</select>\n';

}
return __p
};

this["Formbuilder"]["templates"]["edit/step"] = function(obj) {
obj || (obj = {});
var __t, __p = '', __e = _.escape;
with (obj) {
__p += '<div class=\'fb-edit-section-header\'>Step</div>\n\n<input type="number" placeholder="step" data-rv-input="model.' +
((__t = ( Formbuilder.options.mappings.STEP )) == null ? '' : __t) +
'" style="width: 40px" />\n';

}
return __p
};

this["Formbuilder"]["templates"]["edit/units"] = function(obj) {
obj || (obj = {});
var __t, __p = '', __e = _.escape;
with (obj) {
__p += '<div class=\'fb-edit-section-header\'>Units</div>\n<input type="text" data-rv-input="model.' +
((__t = ( Formbuilder.options.mappings.UNITS )) == null ? '' : __t) +
'" />\n';

}
return __p
};

this["Formbuilder"]["templates"]["page"] = function(obj) {
obj || (obj = {});
var __t, __p = '', __e = _.escape, __j = Array.prototype.join;
function print() { __p += __j.call(arguments, '') }
with (obj) {

 if (!opts.live) { ;
__p += '\n' +
((__t = ( Formbuilder.templates['partials/save_button']() )) == null ? '' : __t) +
'\n' +
((__t = ( Formbuilder.templates['partials/left_side']() )) == null ? '' : __t) +
'\n';
 } ;
__p += '\n' +
((__t = ( Formbuilder.templates['partials/right_side']({opts: opts}) )) == null ? '' : __t) +
'\n';
 if (!opts.live) { ;
__p += '\n<div class=\'fb-clear\'></div>\n';
 } ;
__p += '\n';

}
return __p
};

this["Formbuilder"]["templates"]["partials/add_field"] = function(obj) {
obj || (obj = {});
var __t, __p = '', __e = _.escape, __j = Array.prototype.join;
function print() { __p += __j.call(arguments, '') }
with (obj) {
__p += '<div class=\'fb-tab-pane active\' id=\'addField\'>\n  <div class=\'fb-add-field-types\'>\n    <div class=\'section\'>\n      ';
 for (i in Formbuilder.inputFields) { ;
__p += '\n        <a data-field-type="' +
((__t = ( i )) == null ? '' : __t) +
'" class="' +
((__t = ( Formbuilder.options.BUTTON_CLASS )) == null ? '' : __t) +
'">\n          ' +
((__t = ( Formbuilder.inputFields[i].addButton )) == null ? '' : __t) +
'\n        </a>\n      ';
 } ;
__p += '\n    </div>\n\n    <div class=\'section\'>\n      ';
 for (i in Formbuilder.nonInputFields) { ;
__p += '\n        <a data-field-type="' +
((__t = ( i )) == null ? '' : __t) +
'" class="' +
((__t = ( Formbuilder.options.BUTTON_CLASS )) == null ? '' : __t) +
'">\n          ' +
((__t = ( Formbuilder.nonInputFields[i].addButton )) == null ? '' : __t) +
'\n        </a>\n      ';
 } ;
__p += '\n    </div>\n  </div>\n</div>';

}
return __p
};

this["Formbuilder"]["templates"]["partials/edit_field"] = function(obj) {
obj || (obj = {});
var __t, __p = '', __e = _.escape;
with (obj) {
__p += '<div class=\'fb-tab-pane\' id=\'editField\'>\n  <div class=\'fb-edit-field-wrapper\'></div>\n</div>\n';

}
return __p
};

this["Formbuilder"]["templates"]["partials/left_side"] = function(obj) {
obj || (obj = {});
var __t, __p = '', __e = _.escape;
with (obj) {
__p += '<div class=\'fb-left\'>\n  <ul class=\'fb-tabs\'>\n    <li class=\'active\'><a data-target=\'#addField\'>Add new field</a></li>\n    <li><a data-target=\'#editField\'>Edit field</a></li>\n  </ul>\n\n  <div class=\'fb-tab-content\'>\n    ' +
((__t = ( Formbuilder.templates['partials/add_field']() )) == null ? '' : __t) +
'\n    ' +
((__t = ( Formbuilder.templates['partials/edit_field']() )) == null ? '' : __t) +
'\n  </div>\n</div>';

}
return __p
};

this["Formbuilder"]["templates"]["partials/right_side"] = function(obj) {
obj || (obj = {});
var __t, __p = '', __e = _.escape, __j = Array.prototype.join;
function print() { __p += __j.call(arguments, '') }
with (obj) {

 if(opts && opts.live) { ;
__p += '\n<form enctype="multipart/form-data"\n  id=\'formbuilder_form\'\n  class=\'fb-right-live\'\n  ';
 if(opts.submitUrl) { ;
__p += '\n  action="' +
((__t = ( opts.submitUrl )) == null ? '' : __t) +
'"\n  ';
 } ;
__p += '\n  method="post">\n';
 } else { ;
__p += '\n<div class=\'fb-right\'>\n';
 } ;
__p += '\n  <div class=\'fb-no-response-fields\'>No response fields</div>\n  <div class=\'fb-response-fields\'></div>\n  ';
 if(opts && opts.submitUrl) { ;
__p += '\n  <input type="submit" value="Submit">\n  ';
 } ;
__p += '\n\n  ';
 for (l in (opts.hidden || {})) { ;
__p += '\n  <input type="hidden" name=' +
((__t = ( l)) == null ? '' : __t) +
' value=' +
((__t = ( opts.hidden[l])) == null ? '' : __t) +
'>\n  ';
 } ;
__p += '\n';
 if(opts && opts.live) { ;
__p += '\n</form>\n';
 } else { ;
__p += '\n</div>\n';
 } ;
__p += '\n';

}
return __p
};

this["Formbuilder"]["templates"]["partials/save_button"] = function(obj) {
obj || (obj = {});
var __t, __p = '', __e = _.escape;
with (obj) {
__p += '<div class=\'fb-save-wrapper\'>\n  <button class=\'js-save-form ' +
((__t = ( Formbuilder.options.BUTTON_CLASS )) == null ? '' : __t) +
'\'></button>\n</div>';

}
return __p
};

this["Formbuilder"]["templates"]["view/base"] = function(obj) {
obj || (obj = {});
var __t, __p = '', __e = _.escape, __j = Array.prototype.join;
function print() { __p += __j.call(arguments, '') }
with (obj) {
__p += '<div class=\'subtemplate-wrapper\'>\n  ';
 if(opts.readonly){ ;
__p += '\n  <div class=\'cover\'></div>\n  ';
 } ;
__p += '\n  ' +
((__t = ( Formbuilder.templates['view/label']({rf: rf}) )) == null ? '' : __t) +
'\n\n  ' +
((__t = ( Formbuilder.fields[rf.get(Formbuilder.options.mappings.FIELD_TYPE)].view({rf: rf}) )) == null ? '' : __t) +
'\n\n  ' +
((__t = ( Formbuilder.templates['view/description']({rf: rf}) )) == null ? '' : __t) +
'\n  ';
 if(!opts.live){ ;
__p += '\n  ' +
((__t = ( Formbuilder.templates['view/duplicate_remove']({rf: rf}) )) == null ? '' : __t) +
'\n  ';
 } ;
__p += '\n</div>\n';

}
return __p
};

this["Formbuilder"]["templates"]["view/base_non_input"] = function(obj) {
obj || (obj = {});
var __t, __p = '', __e = _.escape;
with (obj) {
__p += '<div class=\'subtemplate-wrapper\'>\n  <div class=\'cover\'></div>\n  ' +
((__t = ( Formbuilder.fields[rf.get(Formbuilder.options.mappings.FIELD_TYPE)].view({rf: rf}) )) == null ? '' : __t) +
'\n  ' +
((__t = ( Formbuilder.templates['view/duplicate_remove']({rf: rf}) )) == null ? '' : __t) +
'\n</div>\n';

}
return __p
};

this["Formbuilder"]["templates"]["view/description"] = function(obj) {
obj || (obj = {});
var __t, __p = '', __e = _.escape;
with (obj) {
__p += '<span class=\'help-block\'>\n  ' +
((__t = ( Formbuilder.helpers.simple_format(rf.get(Formbuilder.options.mappings.DESCRIPTION)) )) == null ? '' : __t) +
'\n</span>\n';

}
return __p
};

this["Formbuilder"]["templates"]["view/duplicate_remove"] = function(obj) {
obj || (obj = {});
var __t, __p = '', __e = _.escape;
with (obj) {
__p += '<div class=\'actions-wrapper\'>\n  <a class="js-duplicate ' +
((__t = ( Formbuilder.options.BUTTON_CLASS )) == null ? '' : __t) +
'" title="Duplicate Field"><i class=\'icon-plus-sign\'></i></a>\n  <a class="js-clear ' +
((__t = ( Formbuilder.options.BUTTON_CLASS )) == null ? '' : __t) +
'" title="Remove Field"><i class=\'icon-minus-sign\'></i></a>\n</div>';

}
return __p
};

this["Formbuilder"]["templates"]["view/label"] = function(obj) {
obj || (obj = {});
var __t, __p = '', __e = _.escape, __j = Array.prototype.join;
function print() { __p += __j.call(arguments, '') }
with (obj) {
__p += '<label>\n  <span>' +
((__t = ( Formbuilder.helpers.simple_format(rf.get(Formbuilder.options.mappings.LABEL)) )) == null ? '' : __t) +
'\n  ';
 if (rf.get(Formbuilder.options.mappings.REQUIRED)) { ;
__p += '\n    <abbr title=\'required\'>*</abbr>\n  ';
 } ;
__p += '\n</label>\n';

}
return __p
};