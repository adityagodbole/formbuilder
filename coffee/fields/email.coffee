Formbuilder.registerField 'email',

  view: """
    <input type='email' class='rf-size-<%= rf.get(Formbuilder.options.mappings.SIZE) %>' />
  """

  edit: ""

  addButton: """
    <span class="symbol"><span class="icon-envelope-alt"></span></span> Email
  """

  clearFields: ($el, model) ->
  		$el.find("[name = " + model.getCid() + "_1]").val("")

  evalResult: (clicked_element, cid, condition, set_value) ->
    do( 
      check_result=false
    ) =>
      elem_val = clicked_element
                          .find("[name = "+cid+"_1]").val()
      check_result = eval("'#{elem_val}' #{condition} '#{set_value}'")
      check_result		
