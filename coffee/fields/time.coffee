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
      valid = do (required_attr = $el.find("[name = "+model.getCid()+"_1]").attr("required")) =>
        return true if !required_attr
        return $el.find(".hasTimepicker").val() != ''
      valid
      
  clearFields: ($el, model) ->
    $el.find("[name = " + model.getCid() + "_1]").val("")

  evalResult: (clicked_element, cid, condition, set_value) ->  
    do(firstDate = new Date(),secondDate = new Date()
          , firstValue = ""
          , secondValue = ""
          ) =>
            firstValue = clicked_element
                          .find("[name = "+cid+"_1]").val()
            firstValue = firstValue.split(':')
            secondValue = set_value.split(':')
            firstDate.setHours(firstValue[0])
            firstDate.setMinutes(firstValue[1])
            secondDate.setHours(secondValue[0])
            secondDate.setMinutes(secondValue[1])
            if (condition == "<")
              if(firstDate < secondDate)
                true
              else
                false
            else if(condition == ">")
              if(firstDate > secondDate)
                true
              else
                false
            else if(condition == "==")
              if(parseInt(firstValue[0]) == parseInt(secondValue[0]) &&
                 parseInt(firstValue[1]) == parseInt(secondValue[1]))
                  true