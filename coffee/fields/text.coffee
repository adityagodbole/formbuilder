Formbuilder.registerField 'text',

  view: """
    <input type='text' class='rf-size-<%= rf.get(Formbuilder.options.mappings.SIZE) %>' />
  """

  edit: """
    <%= Formbuilder.templates['edit/size']() %>
    <%= Formbuilder.templates['edit/min_max_length']() %>
    <%= Formbuilder.templates['edit/default_value_hint']() %>
  """

  addButton: """
    <span class='symbol'><span class='icon-font'></span></span> Text
  """

  defaultAttributes: (attrs) ->
    attrs.field_options.size = 'small'
    attrs

  setup: (el, model, index) ->
    if model.get(Formbuilder.options.mappings.MINLENGTH)
      do(min_length = model.get(Formbuilder.options.mappings.MINLENGTH)) ->
        el.attr("pattern", "[a-zA-Z0-9_\\s]{#{min_length},}")
    if model.get(Formbuilder.options.mappings.MAXLENGTH)
      el.attr("maxlength", model.get(Formbuilder.options.mappings.MAXLENGTH))
    if model.get(Formbuilder.options.mappings.DEFAULT_VALUE)
      el.attr("value", model.get(Formbuilder.options.mappings.DEFAULT_VALUE))
    if model.get(Formbuilder.options.mappings.HINT)
      el.attr("placeholder", model.get(Formbuilder.options.mappings.HINT))
