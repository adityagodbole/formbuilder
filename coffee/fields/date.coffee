Formbuilder.registerField 'date',

  view: """
    <div class='input-line'>
      <input id='<%= rf.getCid() %>' type='text' readonly/>
    </div>
    <script>
      $(function() {
        $("#<%= rf.getCid() %>").datepicker({ dateFormat: "dd/mm/yy" });
      });
    </script>
  """

  edit: ""

  addButton: """
    <span class="symbol"><span class="icon-calendar"></span></span> Date
  """
  isValid: ($el, model) ->
    do(valid = false) =>
      valid = do (required_attr = $el.find("[name = "+model.getCid()+"_1]").attr("required")) =>
        return true if !required_attr
        return $el.find(".hasDatepicker").val() != ''
      valid

  clearFields: ($el, model) ->
    $el.find("[name = " + model.getCid() + "_1]").val("")


  check_date_result: (condition, firstValue, secondValue) ->
    firstValue[0] = parseInt(firstValue[0])
    firstValue[1] = parseInt(firstValue[1])
    firstValue[2] = parseInt(firstValue[2])

    secondValue[0] = parseInt(secondValue[0])
    secondValue[1] = parseInt(secondValue[1])
    secondValue[2] = parseInt(secondValue[2])

    if (condition == "<")
      if(firstValue[2] <= secondValue[2] && 
         firstValue[1] <= secondValue[1] &&
         firstValue[0] < secondValue[0])
            true
      else
        false      
    else if(condition == ">")
      if(firstValue[2] >= secondValue[2] &&
         firstValue[1] >= secondValue[1] &&
         firstValue[0] > secondValue[0])
           true
      else
        false     
    else
      if(firstValue[2] is secondValue[2] &&
         firstValue[1] is secondValue[1] &&
         firstValue[0] is secondValue[0])
            true
      else
        false      



  evalResult: (clicked_element, cid, condition, set_value, field) ->
    do(  
       firstValue = '' ,
       check_result = false,
       secondValue = '',
       is_true = false                  
    ) =>
      firstValue = clicked_element
                          .find("[name = "+cid+"_1]").val()
      firstValue = firstValue.split('/')
      secondValue = set_value.split('/')
      is_true = field.check_date_result(condition,firstValue,secondValue)
      
