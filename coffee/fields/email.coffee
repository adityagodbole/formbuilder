Formbuilder.registerField 'email',

  view: """
    <input type='email' class='rf-size-<%= rf.get(Formbuilder.options.mappings.SIZE) %>' />
  """

  edit: ""

  addButton: """
    <span class="symbol"><span class="icon-envelope-alt"></span></span> Email
  """

  clearFields: ($el, model) ->
  		$el.find("[name = " + model.getCid() + "_1]").val("");
