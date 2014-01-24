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
          field_options: {},
          conditions: []
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
      FIELDSTYPES_CUSTOM_VALIDATION: ['checkboxes', 'fullname', 'radio'],
      CKEDITOR_CONFIG: ' ',
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
        HINT: 'field_options.hint',
        PREV_BUTTON_TEXT: 'field_options.prev_button_text',
        NEXT_BUTTON_TEXT: 'field_options.next_button_text',
        HTML_DATA: 'field_options.html_data',
        STARTING_POINT_TEXT: 'field_options.start_point_text',
        ENDING_POINT_TEXT: 'field_options.ending_point_text',
        MATCH_CONDITIONS: 'field_options.match_conditions'
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
      wizard_tab: Backbone.View.extend({
        className: "fb-tab",
        intialize: function() {
          return this.parentView = this.options.parentView;
        }
      }),
      view_field: Backbone.View.extend({
        className: "fb-field-wrapper",
        events: {
          'click .subtemplate-wrapper': 'focusEditView',
          'click .js-duplicate': 'duplicate',
          'click .js-clear': 'clear',
          'keyup': 'changeStateSource',
          'change': 'changeStateSource',
          'click #gmap_button': 'openGMap'
        },
        initialize: function() {
          this.current_state = 'show';
          this.parentView = this.options.parentView;
          this.field_type = this.model.get(Formbuilder.options.mappings.FIELD_TYPE);
          this.field = Formbuilder.fields[this.field_type];
          this.is_section_break = this.field_type === 'section_break';
          this.listenTo(this.model, "change", this.render);
          return this.listenTo(this.model, "destroy", this.remove);
        },
        add_remove_require: function(required) {
          if (this.model.get(Formbuilder.options.mappings.REQUIRED) && $.inArray(this.field_type, Formbuilder.options.FIELDSTYPES_CUSTOM_VALIDATION) === -1) {
            return $("." + this.model.getCid()).find("[name = " + this.model.getCid() + "_1]").attr("required", required);
          }
        },
        show_hide_fields: function(check_result, set_field) {
          var _this = this;
          return (function(set_field) {
            if (check_result === true) {
              _this.$el.addClass(set_field.action);
              if (set_field.action === 'show') {
                _this.current_state = set_field.action;
                return _this.add_remove_require(true);
              } else {
                _this.current_state = "hide";
                return _this.add_remove_require(false);
              }
            } else {
              _this.$el.removeClass(set_field.action);
              if (set_field.action === 'hide') {
                _this.current_state = set_field.action;
                return _this.add_remove_require(true);
              } else {
                _this.add_remove_require(false);
                return _this.current_state = "hide";
              }
            }
          })(set_field);
        },
        changeState: function() {
          var _this = this;
          (function(set_field, i, and_flag, check_match_condtions) {
            var _i, _len, _ref, _results;
            if (_this.model.get('field_options').match_conditions === 'and') {
              and_flag = true;
            }
            _ref = _this.model.get("conditions");
            _results = [];
            for (_i = 0, _len = _ref.length; _i < _len; _i++) {
              set_field = _ref[_i];
              _results.push((function(source_model, clicked_element, elem_val, condition, field_type, check_result) {
                var _j, _len1, _ref1, _results1;
                if (set_field.target === _this.model.getCid()) {
                  source_model = _this.model.collection.where({
                    cid: set_field.source
                  })[0];
                  clicked_element = $("." + source_model.getCid());
                  field_type = source_model.get('field_type');
                  if (set_field.condition === "equals") {
                    condition = '==';
                  } else if (set_field.condition === "less than") {
                    condition = '<';
                  } else if (set_field.condition === "greater than") {
                    condition = '>';
                  } else {
                    condition = "!=";
                  }
                  check_result = _this.evalCondition(clicked_element, source_model, condition, set_field.value);
                  check_match_condtions.push(check_result);
                  _this.clearFields();
                  if (and_flag === true) {
                    if (check_match_condtions.indexOf(false) === -1) {
                      _this.show_hide_fields(true, set_field);
                    } else {
                      _this.show_hide_fields('false', set_field);
                    }
                  } else {
                    if (check_match_condtions.indexOf(true) !== -1) {
                      _this.show_hide_fields(true, set_field);
                    } else {
                      _this.show_hide_fields('false', set_field);
                    }
                  }
                  _ref1 = _this.model.get("conditions");
                  _results1 = [];
                  for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
                    set_field = _ref1[_j];
                    _results1.push((function() {
                      if (set_field.source === _this.model.getCid()) {
                        return _this.changeStateSource();
                      }
                    })());
                  }
                  return _results1;
                }
              })({}, [], {}, "equals", '', false));
            }
            return _results;
          })({}, 0, false, new Array());
          return this;
        },
        evalCondition: function(clicked_element, source_model, condition, value) {
          var _this = this;
          return (function(field_type, field, check_result) {
            field = Formbuilder.fields[field_type];
            if (!field.evalCondition) {
              return true;
            }
            check_result = field.evalCondition(clicked_element, source_model.getCid(), condition, value, field);
            return check_result;
          })(source_model.get(Formbuilder.options.mappings.FIELD_TYPE), '', 'false');
        },
        clearFields: function() {
          if (!this.field.clearFields) {
            return true;
          }
          return this.field.clearFields(this.$el, this.model);
        },
        changeStateSource: function(ev) {
          return this.trigger('change_state');
        },
        openGMap: function() {
          if ($('#myModal1').length === 0) {
            if (this.field.addRequiredConditions) {
              this.field.addRequiredConditions();
            }
          }
          $('#ok').val(this.model.getCid());
          $('#myModal1').modal({
            show: true
          });
          $("#myModal1").on("shown", function(e) {
            var gmap_button_value;
            initialize();
            $("#gmap_address").keypress(function(event) {
              if (event.keyCode === 13) {
                return codeAddress();
              }
            });
            $("#gmap_latlng").keypress(function(event) {
              if (event.keyCode === 13) {
                return codeLatLng();
              }
            });
            gmap_button_value = $("[name = " + getCid() + "_1]").val();
            if (gmap_button_value !== "") {
              return codeLatLng(gmap_button_value);
            }
          });
          $('#ok').on('click', function(e) {
            return $("[name = " + getCid() + "_1]").val(getLatLong());
          });
          return $('#myModal1').on('hidden.bs.modal', function(e) {
            $('#myModal1').off('shown').on('shown');
            return $(this).removeData("modal");
          });
        },
        isValid: function() {
          if (!this.field.isValid) {
            return true;
          }
          return this.field.isValid(this.$el, this.model);
        },
        render: function() {
          if (this.options.live) {
            return this.live_render();
          } else {
            return this.builder_render();
          }
        },
        builder_render: function() {
          (function(cid, that) {
            that.$el.addClass('response-field-' + that.model.get(Formbuilder.options.mappings.FIELD_TYPE)).data('cid', cid).html(Formbuilder.templates["view/base" + (!that.model.is_input() ? '_non_input' : '')]({
              rf: that.model,
              opts: that.options
            }));
            return (function(x, count) {
              var _i, _len, _ref, _results;
              _ref = that.$("input, textarea, select");
              _results = [];
              for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                x = _ref[_i];
                if ((function(attr) {
                  return attr !== 'radio' && attr !== 'checkbox';
                })($(x).attr('type'))) {
                  count = count + 1;
                }
                _results.push($(x).attr("name", cid.toString() + "_" + count.toString()));
              }
              return _results;
            })(null, 0);
          })(this.model.getCid(), this);
          return this;
        },
        live_render: function() {
          var _this = this;
          (function(set_field, i, action, cid, set_field_class, base_templ_suff) {
            var _fn, _i, _len, _ref;
            if (_this.model.attributes.conditions) {
              if (_this.model.get('conditions').length > 0) {
                while (i < _this.model.get('conditions').length) {
                  set_field = _this.model.get('conditions')[i];
                  if (set_field.action === 'show' && _this.model.getCid() === set_field.target) {
                    set_field_class = true;
                  }
                  break;
                }
                i++;
              }
            }
            if (set_field_class === true) {
              _this.current_state = "hide";
            } else {
              _this.current_state = "show";
            }
            if (_this.model.attributes.conditions) {
              if (!_this.is_section_break) {
                if (_this.model.get("conditions").length) {
                  _ref = _this.model.get("conditions");
                  _fn = function(set_field) {
                    var views_name, _j, _len1, _ref1, _results;
                    if (set_field.target === _this.model.getCid()) {
                      _ref1 = _this.parentView.fieldViews;
                      _results = [];
                      for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
                        views_name = _ref1[_j];
                        _results.push((function(views_name, set_field) {
                          if (views_name.model.get('cid') === set_field.source) {
                            return _this.listenTo(views_name, 'change_state', _this.changeState);
                          }
                        })(views_name, set_field));
                      }
                      return _results;
                    }
                  };
                  for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                    set_field = _ref[_i];
                    _fn(set_field);
                  }
                }
              }
            }
            if (!_this.is_section_break) {
              if (_this.model.get("field_options").state === "readonly") {
                _this.$el.addClass('readonly');
              }
              _this.$el.addClass('response-field-' + _this.field_type + ' ' + _this.model.getCid()).data('cid', cid).html(Formbuilder.templates["view/base" + base_templ_suff]({
                rf: _this.model,
                opts: _this.options
              }));
              return (function(x, count, should_incr) {
                var _j, _len1, _ref1, _results;
                _ref1 = _this.$("input, textarea, select");
                _results = [];
                for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
                  x = _ref1[_j];
                  _results.push(count = (function(x, index, name, val, value, elem_value) {
                    if (_this.field_type === 'radio' || 'scale_rating') {
                      value = x.value;
                    }
                    name = cid.toString() + "_" + index.toString();
                    if ($(x).attr('type') === 'radio' && _this.model.get('field_values')) {
                      val = _this.model.get('field_values')[value];
                    } else if (_this.model.get('field_values')) {
                      val = _this.model.get('field_values')[name];
                    }
                    $(x).attr("name", name);
                    if (val) {
                      _this.setFieldVal($(x), val);
                    }
                    if (_this.field_type === "fullname") {
                      elem_value = _this.$el.find("[name = " + _this.model.getCid() + "_2]").val();
                    } else {
                      elem_value = _this.$el.find("[name = " + _this.model.getCid() + "_1]").val();
                    }
                    if (set_field_class === false && _this.model.get('field_values') && elem_value === "") {
                      _this.$el.addClass("hide");
                    }
                    if (set_field_class === true && (val === null || elem_value === "" || _this.$el.find("[name = " + _this.model.getCid() + "_1]").val() === false)) {
                      _this.$el.addClass("hide");
                    }
                    if (_this.field.setup) {
                      _this.field.setup($(x), _this.model, index);
                    }
                    if (_this.model.get(Formbuilder.options.mappings.REQUIRED) && $.inArray(_this.field_type, Formbuilder.options.FIELDSTYPES_CUSTOM_VALIDATION) === -1 && set_field_class !== true) {
                      $(x).attr("required", true);
                    }
                    return index;
                  })(x, count + (should_incr($(x).attr('type')) ? 1 : 0), null, null, 0, ''));
                }
                return _results;
              })(null, 0, function(attr) {
                return attr !== 'radio';
              });
            }
          })({}, 0, "show", this.model.getCid(), false, this.model.is_input() ? '' : '_non_input');
          return this;
        },
        setFieldVal: function(elem, val) {
          var _this = this;
          return (function(setters, type) {
            setters = {
              file: function() {
                $(elem).siblings(".active_link").attr("href", val);
                if (val) {
                  return $(elem).siblings(".active_link").text(val.split("/").pop().split("?")[0]);
                }
              },
              checkbox: function() {
                if (val) {
                  return $(elem).attr("checked", true);
                }
              },
              radio: function() {
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
          return (function(index, that) {
            that.parentView.handleFormUpdate();
            index = that.parentView.fieldViews.indexOf(_.where(that.parentView.fieldViews, {
              cid: that.cid
            })[0]);
            if (index > -1) {
              that.parentView.fieldViews.splice(index, 1);
            }
            that.clearConditions(that.model.getCid(), that.parentView.fieldViews);
            return that.model.destroy();
          })(0, this);
        },
        clearConditions: function(cid, fieldViews) {
          return _.each(fieldViews, function(fieldView) {
            var _this = this;
            return (function(updated_conditions) {
              if (!_.isEmpty(fieldView.model.attributes.conditions)) {
                updated_conditions = _.reject(fieldView.model.attributes.conditions, function(condition) {
                  return _.isEqual(condition.source, cid);
                });
                fieldView.model.attributes.conditions = [];
                return fieldView.model.attributes.conditions = updated_conditions;
              }
            })({});
          });
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
          'click .js-add-condition': 'addCondition',
          'click .js-remove-condition': 'removeCondition',
          'click .js-remove-option': 'removeOption',
          'click .js-default-updated': 'defaultUpdated',
          'input .option-label-input': 'forceRender'
        },
        initialize: function() {
          return this.listenTo(this.model, "destroy", this.remove);
        },
        render: function() {
          this.$el.html(Formbuilder.templates["edit/base" + (!this.model.is_input() ? '_non_input' : '')]({
            rf: this.model,
            opts: this.options
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
        addCondition: function(e) {
          var $el, conditions, i, newCondition;
          $el = $(e.currentTarget);
          i = this.$el.find('.condition').index($el.closest('.condition'));
          conditions = this.model.get('conditions') || [];
          newCondition = {
            source: "",
            condition: "",
            value: "",
            action: "",
            target: "",
            isSource: true
          };
          if (i > -1) {
            conditions.splice(i + 1, 0, newCondition);
          } else {
            conditions.push(newCondition);
          }
          this.model.set('conditions', conditions);
          return this.model.trigger('change:conditions');
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
        removeCondition: function(e) {
          var $el, conditions, index;
          $el = $(e.currentTarget);
          index = this.$el.find(".js-remove-option").index($el);
          conditions = this.model.get('conditions');
          conditions.splice(index, 1);
          this.model.set('conditions', conditions);
          this.model.trigger("change:conditions");
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
          var _base;
          this.$el = $(this.options.selector);
          this.formBuilder = this.options.formBuilder;
          this.fieldViews = [];
          this.formConditionsSaved = false;
          this.collection = new Formbuilder.collection;
          this.collection.bind('add', this.addOne, this);
          this.collection.bind('reset', this.reset, this);
          this.collection.bind('change', this.handleFormUpdate, this);
          this.collection.bind('destroy add reset', this.hideShowNoResponseFields, this);
          this.collection.bind('destroy', this.ensureEditViewScrolled, this);
          if (!this.options.live) {
            this.options.readonly = true;
          }
          (_base = this.options).showSubmit || (_base.showSubmit = false);
          this.render();
          this.collection.reset(this.options.bootstrapData);
          this.saveFormButton = this.$el.find(".js-save-form");
          this.saveFormButton.attr('disabled', true).text(Formbuilder.options.dict.ALL_CHANGES_SAVED);
          if (this.options.autoSave) {
            this.initAutosave();
          }
          return Formbuilder.options.CKEDITOR_CONFIG = this.options.ckeditor_config;
        },
        getCurrentView: function() {
          var current_view_state, fieldView;
          current_view_state = (function() {
            var _i, _len, _ref, _results;
            _ref = this.fieldViews;
            _results = [];
            for (_i = 0, _len = _ref.length; _i < _len; _i++) {
              fieldView = _ref[_i];
              if (fieldView.current_state === 'show') {
                _results.push(fieldView.model.get('cid'));
              }
            }
            return _results;
          }).call(this);
          return current_view_state;
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
          if (!this.options.live) {
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
        addSectionBreak: function(obj_view, cnt) {
          obj_view.$el.attr('data-step', cnt);
          obj_view.$el.attr('data-step-title', "step" + cnt);
          obj_view.$el.addClass('step');
          if (cnt === 1) {
            return obj_view.$el.addClass('active');
          }
        },
        applyEasyWizard: function() {
          var _this = this;
          (function(field_view, cnt, fieldViews, add_break_to_next, wizard_view, wiz_cnt, prev_btn_text, next_btn_text, showSubmit) {
            var _i, _len;
            for (_i = 0, _len = fieldViews.length; _i < _len; _i++) {
              field_view = fieldViews[_i];
              if (field_view.is_section_break) {
                add_break_to_next = true;
                prev_btn_text = field_view.model.get(Formbuilder.options.mappings.PREV_BUTTON_TEXT);
                next_btn_text = field_view.model.get(Formbuilder.options.mappings.NEXT_BUTTON_TEXT);
              }
              if (cnt === 1) {
                wizard_view = new Formbuilder.views.wizard_tab({
                  parentView: _this
                });
                _this.addSectionBreak(wizard_view, wiz_cnt);
              } else if (add_break_to_next && !field_view.is_section_break) {
                _this.$responseFields.append(wizard_view.$el);
                wizard_view = new Formbuilder.views.wizard_tab({
                  parentView: _this
                });
                wiz_cnt += 1;
                if (add_break_to_next) {
                  add_break_to_next = false;
                }
                _this.addSectionBreak(wizard_view, wiz_cnt);
              }
              if (wizard_view && field_view && !field_view.is_section_break) {
                wizard_view.$el.append(field_view.render().el);
              }
              if (cnt === fieldViews.length && wizard_view) {
                _this.$responseFields.append(wizard_view.$el);
              }
              cnt += 1;
            }
            return $("#formbuilder_form").easyWizard({
              showSteps: false,
              submitButton: false,
              prevButton: prev_btn_text,
              nextButton: next_btn_text,
              after: function(wizardObj) {
                if (parseInt($nextStep.attr('data-step')) === thisSettings.steps && showSubmit) {
                  return wizardObj.parents('.form-panel').find('.update-button').show();
                } else {
                  return wizardObj.parents('.form-panel').find('.update-button').hide();
                }
              }
            });
          })(null, 1, this.fieldViews, false, null, 1, 'Back', 'Next', this.options.showSubmit);
          return this;
        },
        addAll: function() {
          this.collection.each(this.addOne, this);
          if (this.options.live) {
            this.applyEasyWizard();
            return $('.readonly').find('input, textarea, select').attr('disabled', true);
          } else {
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
          this.collection.each(this.removeSourceConditions, this);
          this.collection.each(this.addConditions, this);
          payload = JSON.stringify({
            fields: this.collection.toJSON()
          });
          if (Formbuilder.options.HTTP_ENDPOINT) {
            this.doAjaxSave(payload);
          }
          return this.formBuilder.trigger('save', payload);
        },
        removeSourceConditions: function(model) {
          if (!_.isEmpty(model.attributes.conditions)) {
            return _.each(model.attributes.conditions, function(condition) {
              var _this = this;
              return (function(index) {
                if (!_.isEmpty(condition.source)) {
                  if (condition.source === model.getCid()) {
                    index = model.attributes.conditions.indexOf(condition);
                    if (index > -1) {
                      model.attributes.conditions.splice(index, 1);
                    }
                    return model.save();
                  }
                }
              })(0);
            });
          }
        },
        addConditions: function(model) {
          if (!_.isEmpty(model.attributes.conditions)) {
            return _.each(model.attributes.conditions, function(condition) {
              var _this = this;
              return (function(source, source_condition) {
                if (!_.isEmpty(condition.source)) {
                  source = model.collection.where({
                    cid: condition.source
                  });
                  if (!_.has(source[0].attributes.conditions, condition)) {
                    _.extend(source_condition, condition);
                    source_condition.isSource = false;
                    source[0].attributes.conditions.push(source_condition);
                    return source[0].save();
                  }
                }
              })({}, {});
            });
          }
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
            return (function(field, i) {
              while (i < _this.fieldViews.length) {
                field = _this.fieldViews[i];
                if (_this.getCurrentView().indexOf(field.model.get('cid')) !== -1) {
                  if (field.isValid && !field.isValid()) {
                    return false;
                  }
                }
                i++;
              }
              return true;
            })(null, 0);
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
    view: "<div class='input-line'>\n  <span>\n    <input type='text' id='address'/>\n    <label>Address</label>\n  </span>\n</div>\n\n<div class='input-line'>\n  <span>\n    <input type='text' id='suburb'/>\n    <label>Suburb</label>\n  </span>\n\n  <span>\n    <input type='text' id='state'/>\n    <label>State / Province / Region</label>\n  </span>\n</div>\n\n<div class='input-line' id='zipcode'>\n  <span>\n    <input type='text' pattern=\"[a-zA-Z0-9]+\"/>\n    <label>Zipcode</label>\n  </span>\n\n  <span>\n    <select class='dropdown_country'><option>United States</option></select>\n    <label>Country</label>\n  </span>\n</div>",
    edit: "",
    addButton: "<span class=\"symbol\"><span class=\"icon-home\"></span></span> Address",
    clearFields: function($el, model) {
      $el.find("#address").val("");
      $el.find("#suburb").val("");
      $el.find("#state").val("");
      return $el.find("#zipcode").val("");
    },
    evalCondition: function(clicked_element, cid, condition, set_value) {
      var _this = this;
      return (function(check_result, check_match_condtions) {
        var elem_val;
        elem_val = clicked_element.find("#address").val();
        check_result = eval("'" + elem_val + "' " + condition + " '" + set_value + "'");
        check_match_condtions.push(check_result);
        elem_val = clicked_element.find("#suburb").val();
        check_result = eval("'" + elem_val + "' " + condition + " '" + set_value + "'");
        check_match_condtions.push(check_result);
        elem_val = clicked_element.find("#state").val();
        check_result = eval("'" + elem_val + "' " + condition + " '" + set_value + "'");
        check_match_condtions.push(check_result);
        elem_val = clicked_element.find("[name=" + cid + "_4]");
        check_result = eval("'" + elem_val + "' " + condition + " '" + set_value + "'");
        check_match_condtions.push(check_result);
        if (check_match_condtions.indexOf(false) === -1) {
          return true;
        } else {
          return false;
        }
      })(false, []);
    }
  });

}).call(this);

(function() {
  Formbuilder.registerField('checkboxes', {
    view: "<% var field_options = (rf.get(Formbuilder.options.mappings.OPTIONS) || []) %>\n<% for ( var i = 0 ; i < field_options.length ; i++) { %>\n  <div>\n    <label class='fb-option'>\n      <input type='checkbox' value=<%= rf.get(Formbuilder.options.mappings.OPTIONS)[i].label%> <%= rf.get(Formbuilder.options.mappings.OPTIONS)[i].checked && 'checked' %> />\n      <%= rf.get(Formbuilder.options.mappings.OPTIONS)[i].label %>\n    </label>\n  </div>\n<% } %>\n\n<% if (rf.get(Formbuilder.options.mappings.INCLUDE_OTHER)) { %>\n  <div class='other-option'>\n    <label class='fb-option'>\n      <input class='other-option' type='checkbox' value=\"__other__\"/>\n      Other\n    </label>\n\n    <input type='text' />\n  </div>\n<% } %>",
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
          if ($($el.find('input:checked').last()).val() === '__other__') {
            return $el.find('input:text').val() !== '';
          }
          return checked_chk_cnt > 0;
        })(model.get('required'), 0);
        return valid;
      })(false);
    },
    clearFields: function($el, model) {
      var elem, _i, _len, _ref, _results;
      _ref = $el.find('input:checked');
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        elem = _ref[_i];
        _results.push(elem.checked = false);
      }
      return _results;
    },
    evalCondition: function(clicked_element, cid, condition, set_value) {
      var _this = this;
      return (function(elem_val, check_result) {
        elem_val = clicked_element.find("[value = " + set_value + "]").is(':checked');
        check_result = eval("'" + elem_val + "' " + condition + " 'true'");
        return check_result;
      })('', false);
    }
  });

}).call(this);

(function() {
  if (typeof CKEDITOR !== 'undefined') {
    Formbuilder.registerField('free_text_html', {
      type: 'non_input',
      view: "<label class='rf-size-<%= rf.get(Formbuilder.options.mappings.SIZE) %>'>\n  <%= rf.get(Formbuilder.options.mappings.LABEL) %>\n</label>\n<div id='<%= rf.getCid() %>'></div>\n<script>\n  $(function() {\n    var data = \"<%=rf.get(Formbuilder.options.mappings.HTML_DATA)%>\"\n    $(\"#<%= rf.getCid() %>\").html(data);\n  });\n</script>\n",
      edit: "\n</br>\n<input type='text'\n  data-rv-input='model.<%= Formbuilder.options.mappings.LABEL %>' />\n\n<div class='inline'>\n  <span>Edit Here:</span>\n  <textarea id='ck_<%= rf.getCid() %>' contenteditable=\"true\" data-rv-value='model.<%= Formbuilder.options.mappings.HTML_DATA %>'>\n  </textarea>\n</div>\n\n<script>\n  $(function() {\n    $(document).ready( function() {\n      CKEDITOR.disableAutoInline = true;\n      editor_<%= rf.getCid() %> = CKEDITOR.inline(document.getElementById(\"ck_<%= rf.getCid() %>\"),\n        Formbuilder.options.CKEDITOR_CONFIG\n      );\n      editor_<%= rf.getCid() %>.on( 'blur', function( e ) {\n        $(\"#ck_<%= rf.getCid() %>\").val(editor_<%= rf.getCid() %>.getData().replace(/(\\r\\n|\\n|\\r)/gm, \"\"));\n        $(\"#ck_<%= rf.getCid() %>\").trigger(\"change\");\n      });\n    });\n  });\n</script>\n",
      addButton: "<span class='symbol'><span class='icon-font'></span></span> Free Text HTML"
    });
  }

}).call(this);

(function() {
  Formbuilder.registerField('date', {
    view: "<div class='input-line'>\n  <input id='<%= rf.getCid() %>' type='text' readonly/>\n</div>\n<script>\n  $(function() {\n    $(\"#<%= rf.getCid() %>\").datepicker({ dateFormat: \"dd/mm/yy\" });\n  });\n</script>",
    edit: "",
    addButton: "<span class=\"symbol\"><span class=\"icon-calendar\"></span></span> Date",
    isValid: function($el, model) {
      var _this = this;
      return (function(valid) {
        valid = (function(required_attr) {
          if (!required_attr) {
            return true;
          }
          return $el.find(".hasDatepicker").val() !== '';
        })($el.find("[name = " + model.getCid() + "_1]").attr("required"));
        return valid;
      })(false);
    },
    clearFields: function($el, model) {
      return $el.find("[name = " + model.getCid() + "_1]").val("");
    },
    check_date_result: function(condition, firstValue, secondValue) {
      firstValue[0] = parseInt(firstValue[0]);
      firstValue[1] = parseInt(firstValue[1]);
      firstValue[2] = parseInt(firstValue[2]);
      secondValue[0] = parseInt(secondValue[0]);
      secondValue[1] = parseInt(secondValue[1]);
      secondValue[2] = parseInt(secondValue[2]);
      if (condition === "<") {
        if (firstValue[2] <= secondValue[2] && firstValue[1] <= secondValue[1] && firstValue[0] < secondValue[0]) {
          return true;
        } else {
          return false;
        }
      } else if (condition === ">") {
        if (firstValue[2] >= secondValue[2] && firstValue[1] >= secondValue[1] && firstValue[0] > secondValue[0]) {
          return true;
        } else {
          return false;
        }
      } else {
        if (firstValue[2] === secondValue[2] && firstValue[1] === secondValue[1] && firstValue[0] === secondValue[0]) {
          return true;
        } else {
          return false;
        }
      }
    },
    evalCondition: function(clicked_element, cid, condition, set_value, field) {
      var _this = this;
      return (function(firstValue, check_result, secondValue, is_true) {
        firstValue = clicked_element.find("[name = " + cid + "_1]").val();
        firstValue = firstValue.split('/');
        secondValue = set_value.split('/');
        return is_true = field.check_date_result(condition, firstValue, secondValue);
      })('', false, '', false);
    }
  });

}).call(this);

(function() {
  Formbuilder.registerField('date_of_birth', {
    view: "<div class='input-line'>\n  <input id='<%= rf.getCid() %>' type='text' readonly/>\n</div>",
    edit: "<%= Formbuilder.templates['edit/age_restriction']({ includeOther: true }) %>",
    addButton: "<span class=\"symbol\"><span class=\"icon-gift\"></span></span> Birth Date",
    setup: function(el, model, index) {
      var _this = this;
      return (function(today, restricted_date) {
        if (model.get(Formbuilder.options.mappings.MINAGE)) {
          restricted_date.setFullYear(today.getFullYear() - model.get(Formbuilder.options.mappings.MINAGE));
          return el.datepicker({
            dateFormat: "dd/mm/yy",
            maxDate: restricted_date
          });
        } else {
          return el.datepicker({
            dateFormat: "dd/mm/yy",
            maxDate: today
          });
        }
      })(new Date, new Date);
    },
    isValid: function($el, model) {
      var _this = this;
      return (function(valid) {
        valid = (function(required_attr) {
          if (!required_attr) {
            return true;
          }
          return $el.find(".hasDatepicker").val() !== '';
        })($el.find("[name = " + model.getCid() + "_1]").attr("required"));
        return valid;
      })(false);
    },
    clearFields: function($el, model) {
      return $el.find("[name = " + model.getCid() + "_1]").val("");
    },
    check_date_result: function(condition, firstValue, secondValue) {
      firstValue[0] = parseInt(firstValue[0]);
      firstValue[1] = parseInt(firstValue[1]);
      firstValue[2] = parseInt(firstValue[2]);
      secondValue[0] = parseInt(secondValue[0]);
      secondValue[1] = parseInt(secondValue[1]);
      secondValue[2] = parseInt(secondValue[2]);
      if (condition === "<") {
        if (firstValue[2] <= secondValue[2] && firstValue[1] <= secondValue[1] && firstValue[0] < secondValue[0]) {
          return true;
        } else {
          return false;
        }
      } else if (condition === ">") {
        if (firstValue[2] >= secondValue[2] && firstValue[1] >= secondValue[1] && firstValue[0] > secondValue[0]) {
          return true;
        } else {
          return false;
        }
      } else {
        if (firstValue[2] === secondValue[2] && firstValue[1] === secondValue[1] && firstValue[0] === secondValue[0]) {
          return true;
        } else {
          return false;
        }
      }
    },
    evalCondition: function(clicked_element, cid, condition, set_value, field) {
      var _this = this;
      return (function(firstValue, check_result, secondValue, is_true) {
        firstValue = clicked_element.find("[name = " + cid + "_1]").val();
        firstValue = firstValue.split('/');
        secondValue = set_value.split('/');
        return is_true = field.check_date_result(condition, firstValue, secondValue);
      })('', false, '', false);
    }
  });

}).call(this);

(function() {
  Formbuilder.registerField('dropdown', {
    view: "<select id=\"dropdown\">\n  <% if (rf.get(Formbuilder.options.mappings.INCLUDE_BLANK)) { %>\n    <option value=''></option>\n  <% } %>\n\n  <% var field_options = (rf.get(Formbuilder.options.mappings.OPTIONS) || []) %>\n  <% for ( var i = 0 ; i < field_options.length ; i++) { %>\n    <option <%= rf.get(Formbuilder.options.mappings.OPTIONS)[i].checked && 'selected' %>>\n      <%= rf.get(Formbuilder.options.mappings.OPTIONS)[i].label %>\n    </option>\n  <% } %>\n</select>",
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
    },
    evalCondition: function(clicked_element, cid, condition, set_value) {
      var elem_val,
        _this = this;
      (function(check_result) {})(false);
      elem_val = clicked_element.find("[name = " + cid + "_1]").val();
      if (typeof elem_val === 'number') {
        elem_val = parseInt(elem_val);
        set_value = parseInt(set_value);
      }
      if (condition === '<') {
        if (elem_val < set_value) {
          return true;
        } else {
          return false;
        }
      } else if (condition === '>') {
        if (elem_val > set_value) {
          return true;
        } else {
          return false;
        }
      } else {
        if (elem_val === set_value) {
          return true;
        } else {
          return false;
        }
      }
    }
  });

}).call(this);

(function() {
  Formbuilder.registerField('email', {
    view: "<input type='email' class='rf-size-<%= rf.get(Formbuilder.options.mappings.SIZE) %>' />",
    edit: "",
    addButton: "<span class=\"symbol\"><span class=\"icon-envelope-alt\"></span></span> Email",
    clearFields: function($el, model) {
      return $el.find("[name = " + model.getCid() + "_1]").val("");
    },
    evalCondition: function(clicked_element, cid, condition, set_value) {
      var _this = this;
      return (function(check_result) {
        var elem_val;
        elem_val = clicked_element.find("[name = " + cid + "_1]").val();
        check_result = eval("'" + elem_val + "' " + condition + " '" + set_value + "'");
        return check_result;
      })(false);
    }
  });

}).call(this);

(function() {
  Formbuilder.registerField('file', {
    view: "<a target=\"_blank\" class=\"active_link\"></a>\n<input type='file' />",
    edit: "",
    addButton: "<span class=\"symbol\"><span class=\"icon-cloud-upload\"></span></span> File"
  });

}).call(this);

(function() {
  Formbuilder.registerField('fullname', {
    perfix: ['Mr.', 'Mrs.', 'Miss.', 'Ms.', 'Mst.', 'Dr.'],
    view: "<div class='input-line'>\n  <span>\n    <select class='span12'>\n      <%for (i = 0; i < this.perfix.length; i++){%>\n        <option><%= this.perfix[i]%></option>\n      <%}%>\n    </select>\n    <label>Prefix</label>\n  </span>\n\n  <span>\n    <input id='first_name' type='text' pattern=\"[a-zA-Z]+\"/>\n    <label>First</label>\n  </span>\n\n  <% if (rf.get(Formbuilder.options.mappings.INCLUDE_OTHER)) { %>\n    <span>\n      <input type='text' pattern=\"[a-zA-Z]+\"/>\n      <label>Middle</label>\n    </span>\n  <% } %>\n\n  <span>\n    <input id='last_name' type='text' pattern=\"[a-zA-Z]+\"/>\n    <label>Last</label>\n  </span>\n\n  <span>\n    <input id='suffix' type='text'/>\n    <label>Suffix</label>\n  </span>\n</div>",
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
    },
    clearFields: function($el, model) {
      $el.find("#first_name").val("");
      $el.find("#last_name").val("");
      return $el.find("#suffix").val("");
    },
    evalCondition: function(clicked_element, cid, condition, set_value) {
      var check_result, elem_val,
        _this = this;
      (function(elem_val, check_result) {})('', false);
      elem_val = clicked_element.find("#first_name").val();
      check_result = eval("'" + elem_val + "' " + condition + " '" + set_value + "'");
      return check_result;
    }
  });

}).call(this);

(function() {
  Formbuilder.registerField('gmap', {
    view: "<input type='button' style=\"min-width: 100px ;height: 35px;padding-top: 5px;padding-bottom: 5px;\" id=\"gmap_button\" value=\"\" />",
    edit: "",
    addButton: "<span class=\"symbol\"><span class=\"icon-map-marker\"></span></span> google maps",
    addRequiredConditions: function() {
      return $('<div class="modal fade" id="myModal1" tabindex="-1" role="dialog" aria-labelledby="myModalLabel" aria-hidden="true">\
        <div class="modal-dialog">\
          <div class="modal-content">\
            <div class="modal-header">\
              <button type="button" class="close" data-dismiss="modal" aria-hidden="true">&times;</button>\
              <h4 class="modal-title" id="myModalLabel">Google Maps</h4>\
            </div>\
            <div class="modal-body">\
              <div class="row-fluid panel top-panel1">\
                <input id="latlng" class="panel1" type="text" value="40.714224,-73.961452"/>\
                <input type="button" value="Lat,Long" onclick="codeLatLng()"/>\
              </div>\
              <div class="row-fluid panel top-panel2">\
                <input id="gmap_address" class="panel1" type="textbox" value="Sydney, NSW"/>\
                <input type="button" value="Location" onclick="codeAddress()"/>\
              </div>\
              <div id="map-canvas"/>\
            </div>\
            <div class="modal-footer">\
              <button type="button" class="btn btn-default" id="ok" data-dismiss="modal">Ok</button>\
            </div>\
          </div>\
        </div>\
      </div>\
  ').appendTo('body');
    },
    isValid: function($el, model) {
      var _this = this;
      return (function(valid) {
        valid = (function(required_attr) {
          if (!required_attr) {
            return true;
          }
          return $el.find("[name = " + model.getCid() + "_1]").val() !== '';
        })($el.find("[name = " + model.getCid() + "_1]").attr("required"));
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
    },
    clearFields: function($el, model) {
      return $el.find("[name = " + model.getCid() + "_1]").val("");
    },
    evalCondition: function(clicked_element, cid, condition, set_value) {
      var _this = this;
      return (function(check_result) {
        var elem_val;
        elem_val = clicked_element.find("[name = " + cid + "_1]").val();
        check_result = eval("'" + elem_val + "' " + condition + " '" + set_field + "'");
        return check_result;
      })(false);
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
    },
    clearFields: function($el, model) {
      return $el.find("[name = " + model.getCid() + "_1]").val("");
    },
    evalCondition: function(clicked_element, cid, condition, set_value) {
      var _this = this;
      return (function(check_result) {
        var elem_val;
        elem_val = clicked_element.find("[name = " + cid + "_1]").val();
        check_result = eval("'" + elem_val + "' " + condition + " '" + set_value + "'");
        return check_result;
      })(false);
    }
  });

}).call(this);

(function() {
  Formbuilder.registerField('price', {
    view: "<div class='input-line'>\n  <span class='above-line'>$</span>\n  <span class='dolars'>\n    <input type='text' pattern=\"[0-9]+\" />\n    <label>Dollars</label>\n  </span>\n  <span class='above-line'>.</span>\n  <span class='cents'>\n    <input type='text' pattern=\"[0-9]+\" />\n    <label>Cents</label>\n  </span>\n</div>",
    edit: "",
    addButton: "<span class=\"symbol\"><span class=\"icon-dollar\"></span></span> Price",
    clearFields: function($el, model) {
      return $el.find("[name = " + model.getCid() + "_1]").val("");
    },
    evalCondition: function(clicked_element, cid, condition, set_value) {
      var _this = this;
      return (function(firstValue, check_result, secondValue, is_true) {
        var elem_val;
        elem_val = clicked_element.find("[name = " + cid + "_1]").val();
        firstValue = parseInt(elem_val);
        secondValue = parseInt(set_value);
        if (eval("" + firstValue + " " + condition + " " + secondValue)) {
          return true;
        }
      })('', false, '', false);
    }
  });

}).call(this);

(function() {
  Formbuilder.registerField('radio', {
    view: "<% var field_options = (rf.get(Formbuilder.options.mappings.OPTIONS) || []) %>\n<% for ( var i = 0 ; i < field_options.length ; i++) { %>\n  <div>\n    <label class='fb-option'>\n      <input type='radio' value='<%= rf.get(Formbuilder.options.mappings.OPTIONS)[i].label %>' <%= rf.get(Formbuilder.options.mappings.OPTIONS)[i].checked && 'checked' %>/>\n      <%= rf.get(Formbuilder.options.mappings.OPTIONS)[i].label %>\n    </label>\n  </div>\n<% } %>\n\n<% if (rf.get(Formbuilder.options.mappings.INCLUDE_OTHER)) { %>\n  <div class='other-option'>\n    <label class='fb-option'>\n      <input class='other-option' type='radio' value=\"__other__\"/>\n      Other\n    </label>\n\n    <input type='text' />\n  </div>\n<% } %>",
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
    },
    isValid: function($el, model) {
      var _this = this;
      return (function(valid) {
        valid = (function(required_attr, checked_chk_cnt) {
          if (!required_attr) {
            return true;
          }
          checked_chk_cnt = $el.find('input:checked').length;
          if ($el.find('input:checked').val() === '__other__') {
            return $el.find('input:text').val() !== '';
          }
          return checked_chk_cnt > 0;
        })(model.get('required'), 0);
        return valid;
      })(false);
    },
    clearFields: function($el, model) {
      var elem, _i, _len, _ref, _results;
      _ref = $el.find('input:checked');
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        elem = _ref[_i];
        _results.push(elem.checked = false);
      }
      return _results;
    },
    evalCondition: function(clicked_element, cid, condition, set_value) {
      var _this = this;
      return (function(elem_val, check_result) {
        elem_val = clicked_element.find("[value = " + set_value + "]").is(':checked');
        check_result = eval("'" + elem_val + "' " + condition + " 'true'");
        return check_result;
      })('', false);
    }
  });

}).call(this);

(function() {
  Formbuilder.registerField('scale_rating', {
    view: "<%var field_options = (rf.get(Formbuilder.options.mappings.OPTIONS) || [])%>\n<div class='row-fluid'>\n  <div class=\"span1 scale_rating_text\">\n    <div class=\"divider\"></div>\n    <label>\n      <%= rf.get(Formbuilder.options.mappings.STARTING_POINT_TEXT) %>\n    </label>\n  </div>\n  <div>\n    <% for ( var i = 0 ; i < field_options.length ; i++) { %>\n      <div class=\"span1 scale_rating\">\n        <%= i+1 %>\n        <div class=\"divider\"></div>\n        <label class='fb-option'>\n          <input type='radio' value='<%= i+1 %>'\n            <%=\n              rf.get(Formbuilder.options.mappings.OPTIONS)[i].checked &&\n              'checked'\n            %>\n          />\n        </label>\n      </div>\n    <% } %>\n  </div>\n  <div class=\"span1 scale_rating_text scale_rating\">\n    <div class=\"divider\"></div>\n    <label class='span1'>\n      <%= rf.get(Formbuilder.options.mappings.ENDING_POINT_TEXT) %>\n    </label>\n  </div>\n</div>",
    edit: "<%= Formbuilder.templates['edit/scale_rating_options']() %>",
    addButton: "<span class=\"symbol\">\n  <span class=\"icon-circle-blank\"></span>\n</span> Scale Rating",
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
          if ($el.find('input:checked').val() === '__other__') {
            return $el.find('input:text').val() !== '';
          }
          return checked_chk_cnt > 0;
        })(model.get('required'), 0);
        return valid;
      })(false);
    },
    clearFields: function($el, model) {
      var _this = this;
      return (function(elem) {
        var _i, _len, _ref, _results;
        _ref = $el.find('input:checked');
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          elem = _ref[_i];
          _results.push(elem.checked = false);
        }
        return _results;
      })('');
    },
    evalCondition: function(clicked_element, cid, condition, set_value) {
      var _this = this;
      return (function(el_val, check_result) {
        el_val = clicked_element.find("[value = " + set_value + "]").is(':checked');
        check_result = eval("'" + elem_val + "' " + condition + " 'true'");
        return check_result;
      })('', false);
    }
  });

}).call(this);

(function() {
  Formbuilder.registerField('section_break', {
    type: 'non_input',
    view: "<div class=\"easyWizardButtons\" style=\"clear: both;\">\n  <button class=\"next\">\n    <%= rf.get(Formbuilder.options.mappings.NEXT_BUTTON_TEXT) || 'Next' %>\n  </button>\n  <button class=\"prev\">\n    <%= rf.get(Formbuilder.options.mappings.PREV_BUTTON_TEXT) || 'Back' %>\n  </button>\n</div>",
    edit: "<div class='fb-edit-section-header'>Next button</div>\n<input type=\"text\" pattern=\"[a-zA-Z0-9_\\s]+\" data-rv-input=\n  \"model.<%= Formbuilder.options.mappings.NEXT_BUTTON_TEXT %>\"\n  value='Next'/>\n\n<div class='fb-edit-section-header'>Back button</div>\n<input type=\"text\" pattern=\"[a-zA-Z0-9_\\s]+\" data-rv-input=\n  \"model.<%= Formbuilder.options.mappings.PREV_BUTTON_TEXT %>\"\n  value='Back'/>",
    addButton: "<span class='symbol'><span class='icon-minus'></span></span> Section Break"
  });

}).call(this);

(function() {
  Formbuilder.registerField('text', {
    view: "<input type='text' class='rf-size-<%= rf.get(Formbuilder.options.mappings.SIZE) %>' />",
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
    },
    clearFields: function($el, model) {
      return $el.find("[name = " + model.getCid() + "_1]").val("");
    },
    evalCondition: function(clicked_element, cid, condition, set_value) {
      var _this = this;
      return (function(check_result) {
        var elem_val;
        elem_val = clicked_element.find("[name = " + cid + "_1]").val();
        check_result = eval("'" + elem_val + "' " + condition + " '" + set_value + "'");
        return check_result;
      })(false);
    }
  });

}).call(this);

(function() {
  Formbuilder.registerField('time', {
    view: "<div class='input-line'>\n  <input id='<%= rf.getCid() %>' type=\"text\" readonly/>\n</div>\n<script>\n  $(function() {\n    $(\"#<%= rf.getCid() %>\").timepicker();\n  });\n</script>",
    edit: "<%= Formbuilder.templates['edit/step']() %>",
    addButton: "<span class=\"symbol\"><span class=\"icon-time\"></span></span> Time",
    setup: function(el, model, index) {
      if (model.get(Formbuilder.options.mappings.STEP)) {
        return el.attr("step", model.get(Formbuilder.options.mappings.STEP));
      }
    },
    isValid: function($el, model) {
      var _this = this;
      return (function(valid) {
        valid = (function(required_attr) {
          if (!required_attr) {
            return true;
          }
          return $el.find(".hasTimepicker").val() !== '';
        })($el.find("[name = " + model.getCid() + "_1]").attr("required"));
        return valid;
      })(false);
    },
    clearFields: function($el, model) {
      return $el.find("[name = " + model.getCid() + "_1]").val("");
    },
    evalCondition: function(clicked_element, cid, condition, set_value) {
      var _this = this;
      return (function(firstDate, secondDate, firstValue, secondValue) {
        firstValue = clicked_element.find("[name = " + cid + "_1]").val();
        firstValue = firstValue.split(':');
        secondValue = set_value.split(':');
        firstDate.setHours(firstValue[0]);
        firstDate.setMinutes(firstValue[1]);
        secondDate.setHours(secondValue[0]);
        secondDate.setMinutes(secondValue[1]);
        if (condition === "<") {
          if (firstDate < secondDate) {
            return true;
          } else {
            return false;
          }
        } else if (condition === ">") {
          if (firstDate > secondDate) {
            return true;
          } else {
            return false;
          }
        } else if (condition === "==") {
          if (parseInt(firstValue[0]) === parseInt(secondValue[0]) && parseInt(firstValue[1]) === parseInt(secondValue[1])) {
            return true;
          }
        }
      })(new Date(), new Date(), "", "");
    }
  });

}).call(this);

(function() {
  Formbuilder.registerField('url', {
    view: "<input type='url' pattern=\"https?://.+\" class='rf-size-<%= rf.get(Formbuilder.options.mappings.SIZE) %>' placeholder='http://' />",
    edit: "<%= Formbuilder.templates['edit/size']() %>",
    addButton: "<span class=\"symbol\"><span class=\"icon-link\"></span></span> URL",
    clearFields: function($el, model) {
      return $el.find("[name = " + model.getCid() + "_1]").val("");
    },
    evalCondition: function(clicked_element, cid, condition, set_value) {
      var _this = this;
      return (function(check_result) {
        var elem_val;
        elem_val = clicked_element.find("[name = " + cid + "_1]").val();
        check_result = eval("'" + elem_val + "' " + condition + " '" + set_value + "'");
        return check_result;
      })(false);
    }
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
((__t = ( Formbuilder.fields[rf.get(Formbuilder.options.mappings.FIELD_TYPE)].edit({rf: rf, opts:opts}) )) == null ? '' : __t) +
'\n' +
((__t = ( Formbuilder.templates['edit/conditions']({ rf:rf, opts:opts }))) == null ? '' : __t) +
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
'\' />\n  Admin only access\n</label>';

}
return __p
};

this["Formbuilder"]["templates"]["edit/common"] = function(obj) {
obj || (obj = {});
var __t, __p = '', __e = _.escape;
with (obj) {
__p += '<div class=\'fb-edit-section-header\'>Label</div>\n\n<div class=\'fb-common-wrapper\'>\n  <div class=\'fb-label-description span11\'>\n    ' +
((__t = ( Formbuilder.templates['edit/label_description']() )) == null ? '' : __t) +
'\n  </div>\n  <div class=\'fb-common-checkboxes span12\'>\n    ' +
((__t = ( Formbuilder.templates['edit/checkboxes']() )) == null ? '' : __t) +
'\n  </div>\n  <div class=\'fb-clear\'></div>\n</div>\n';

}
return __p
};

this["Formbuilder"]["templates"]["edit/conditions"] = function(obj) {
obj || (obj = {});
var __t, __p = '', __e = _.escape, __j = Array.prototype.join;
function print() { __p += __j.call(arguments, '') }
with (obj) {
__p += '<div class=\'fb-edit-section-header\'>Conditions</div>\n\n<select data-rv-value="model.' +
((__t = ( Formbuilder.options.mappings.MATCH_CONDITIONS )) == null ? '' : __t) +
'">\n  <option value="or">Select Matching</option>\n  <option value="and">Match All Conditions</option>\n  <option value="or">Match Any Conditions</option>\n</select>\n\n<div class=\'subtemplate-wrapper\' >\n  <div class=\'condition\' data-rv-each-condition=\'model.conditions\'>\n    <div class=\'row-fluid\' data-rv-show="condition:isSource">\n      <span class=\'fb-field-label fb-field-condition-label span1\'> If </span>\n      <div class="span8">\n        <select data-rv-value=\'condition:source\'>\n          <option value="">Select Field</option>\n          ';
 for( var i=0 ; i < opts.parentView.fieldViews.length ; i++){;
__p += '\n            ';
 if(opts.parentView.fieldViews[i].model.attributes.label == rf.attributes.label){ ;
__p += '\n              ';
 break ;
__p += '\n            ';
 } ;
__p += '\n            <option value="' +
((__t = ( opts.parentView.fieldViews[i].model.getCid() )) == null ? '' : __t) +
'">' +
((__t = ( opts.parentView.fieldViews[i].model.attributes.label )) == null ? '' : __t) +
'</option>\n          ';
};
__p += '\n        </select>\n      </div>\n      <span class=\'fb-field-label fb-field-condition-label span2\'> field </span>\n      <div class="span6">\n        <select data-rv-value=\'condition:condition\'>\n            <option value="">Select Comparator</option>\n            <option>equals</option>\n            <option>greater than</option>\n            <option>less than</option>\n            <option>is not empty</option>\n        </select>\n      </div>\n      <input class=\'span5 pull-right\' data-rv-input=\'condition:value\' type=\'text\'/>\n      <span class=\'fb-field-label fb-field-condition-label span2\'> then </span>\n      <div class="span3">\n        <select data-rv-value=\'condition:action\'>\n            <option value="">Select Action</option>\n            <option>show</option>\n            <option>hide</option>\n        </select>\n      </div>\n      <div class="span8">\n        <select data-rv-value=\'condition:target\'>\n          <option value="">Select Field</option>\n          <option value="' +
((__t = ( rf.getCid() )) == null ? '' : __t) +
'" data-rv-text=\'model.' +
((__t = ( Formbuilder.options.mappings.LABEL )) == null ? '' : __t) +
'\'></option>\n        </select>\n      </div>\n      <a class="pull-right js-remove-condition ' +
((__t = ( Formbuilder.options.BUTTON_CLASS )) == null ? '' : __t) +
'" title="Remove Condition"><i class=\'icon-minus-sign\'></i></a>\n    </div>\n  </div>\n</div>\n\n<div class=\'fb-bottom-add\'>\n  <a class="js-add-condition ' +
((__t = ( Formbuilder.options.BUTTON_CLASS )) == null ? '' : __t) +
'">Add Condition</a>\n</div>';

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

this["Formbuilder"]["templates"]["edit/scale_rating_options"] = function(obj) {
obj || (obj = {});
var __t, __p = '', __e = _.escape;
with (obj) {
__p += '<div class=\'fb-edit-section-header\'>Options</div>\n\n<div class=\'row-fluid\'>\n  <span class="fb-field-label">Starting Point:</span>\n  <input type="text" data-rv-input="model.' +
((__t = ( Formbuilder.options.mappings.STARTING_POINT_TEXT )) == null ? '' : __t) +
'" class=\'option-label-input span3\' />\n</div>\n\n<div class=\'row-fluid\'>\n  <span class="fb-field-label scale_rating_label">Ending Point:</span>\n  <input type="text" data-rv-input="model.' +
((__t = ( Formbuilder.options.mappings.ENDING_POINT_TEXT )) == null ? '' : __t) +
'" class=\'option-label-input span3\' />\n</div>\n\n<div class=\'option\' data-rv-each-option=\'model.' +
((__t = ( Formbuilder.options.mappings.OPTIONS )) == null ? '' : __t) +
'\'>\n  <input type="checkbox" class=\'js-default-updated\' data-rv-checked="option:checked" />\n  <a class="js-add-option ' +
((__t = ( Formbuilder.options.BUTTON_CLASS )) == null ? '' : __t) +
'" title="Add Option"><i class=\'icon-plus-sign\'></i></a>\n  <a class="js-remove-option ' +
((__t = ( Formbuilder.options.BUTTON_CLASS )) == null ? '' : __t) +
'" title="Remove Option"><i class=\'icon-minus-sign\'></i></a>\n</div>\n\n<div class=\'fb-bottom-add\'>\n  <a class="js-add-option ' +
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
__p += '\n  <div class=\'fb-no-response-fields\'>\n    <div class=\'input-line nav_help_user\'>\n      <div class=\'nav_help_user_new_form\'></div>\n      <label>Select or drag and drop to add</label>\n    </div>\n  </div>\n  <div class=\'fb-response-fields\'></div>\n  ';
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
var __t, __p = '', __e = _.escape, __j = Array.prototype.join;
function print() { __p += __j.call(arguments, '') }
with (obj) {
__p += '<div class=\'subtemplate-wrapper\'>\n  <div class=\'cover\'></div>\n  ' +
((__t = ( Formbuilder.fields[rf.get(Formbuilder.options.mappings.FIELD_TYPE)].view({rf: rf}) )) == null ? '' : __t) +
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