Formbuilder.registerField 'number',

  view: """
    <input type='number' />
    <% if (units = rf.get(Formbuilder.options.mappings.UNITS)) { %>
      <%= units %>
    <% } %>
  """

  edit: """
    <%= Formbuilder.templates['edit/min_max_step']() %>
    <%= Formbuilder.templates['edit/units']() %>
    <%= Formbuilder.templates['edit/integer_only']() %>
  """

  addButton: """
    <span class="symbol"><span class="icon-number">123</span></span> Number
  """

  setup: (el, model, index) ->
    if model.get(Formbuilder.options.mappings.MIN)
      el.attr("min", model.get(Formbuilder.options.mappings.MIN))
    if model.get(Formbuilder.options.mappings.MAX)
      el.attr("max", model.get(Formbuilder.options.mappings.MAX))
    if model.get(Formbuilder.options.mappings.STEP)
      el.attr("step", model.get(Formbuilder.options.mappings.STEP))

  clearFields: ($el, model) ->
    $el.find("[name = " + model.getCid() + "_1]").val("")

  evalResult: (clicked_element, cid, condition, set_value) ->
    do( 
      check_result=false
    ) =>
      elem_val = clicked_element
                          .find("[name = "+cid+"_1]").val()
      check_result = eval("'#{elem_val}' #{condition} '#{set_field}'")
      check_result      
