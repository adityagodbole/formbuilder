Formbuilder.registerField 'address',

  view: """
    <div class='input-line'>
      <span>
        <input type='text' id='address'/>
        <label>Address</label>
      </span>
    </div>

    <div class='input-line'>
      <span>
        <input type='text' id='suburb'/>
        <label>Suburb</label>
      </span>

      <span>
        <input type='text' id='state'/>
        <label>State / Province / Region</label>
      </span>
    </div>

    <div class='input-line' id='zipcode'>
      <span>
        <input type='text' pattern="[a-zA-Z0-9]+"/>
        <label>Zipcode</label>
      </span>

      <span>
        <select class='dropdown_country'><option>United States</option></select>
        <label>Country</label>
      </span>
    </div>
  """

  edit: ""

  addButton: """
    <span class="symbol"><span class="icon-home"></span></span> Address
  """
  clearFields: ($el, model) ->
    $el.find("#address").val("")
    $el.find("#suburb").val("")
    $el.find("#state").val("")
    $el.find("#zipcode").val("")

  evalResult: (clicked_element, cid, condition, set_value) ->
    do( 
      check_result=false,
      check_match_condtions=[]

    ) =>
      elem_val = clicked_element.find("#address").val()
      check_result = eval("'#{elem_val}' #{condition} '#{set_value}'")
      check_match_condtions.push(check_result)
      elem_val = clicked_element.find("#suburb").val()
      check_result = eval("'#{elem_val}' #{condition} '#{set_value}'")
      check_match_condtions.push(check_result)
      elem_val = clicked_element.find("#state").val()
      check_result = eval("'#{elem_val}' #{condition} '#{set_value}'")
      check_match_condtions.push(check_result)
      elem_val = clicked_element.find("[name="+cid+"_4]")
      check_result = eval("'#{elem_val}' #{condition} '#{set_value}'")
      check_match_condtions.push(check_result)
      
      if check_match_condtions.indexOf(false) == -1
        true
      else
        false  
