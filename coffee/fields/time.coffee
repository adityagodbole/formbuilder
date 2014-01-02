Formbuilder.registerField 'time',

  view: """
    <div class='input-line'>
      <input id='<%= rf.getCid() %>' type="text" readonly/>
    </div>
    <script>
      $(function() {
        $("#<%= rf.getCid() %>").timepicker();
      });
    </script>
  """

  edit: """
    <%= Formbuilder.templates['edit/step']() %>
  """

  addButton: """
    <span class="symbol"><span class="icon-time"></span></span> Time
  """

  setup: (el, model, index) ->
    if model.get(Formbuilder.options.mappings.STEP)
      el.attr("step", model.get(Formbuilder.options.mappings.STEP))

  isValid: ($el, model) ->
    do(valid = false) =>
      valid = do (required_attr = model.get('required')) =>
        return true if !required_attr
        return $el.find(".hasTimepicker").val() != ''
      valid
