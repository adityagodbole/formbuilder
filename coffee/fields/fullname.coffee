Formbuilder.registerField 'fullname',
  perfix: ['Mr.', 'Mrs.', 'Miss.', 'Ms.', 'Mst.', 'Dr.']
  view: """
    <div class='input-line'>
      <span>
        <select class='span12'>
          <%for (i = 0; i < this.perfix.length; i++){%>
            <option><%= this.perfix[i]%></option>
          <%}%>
        </select>
        <label>Prefix</label>
      </span>

      <span>
        <input id='first_name' type='text' pattern="[a-zA-Z]+"/>
        <label>First</label>
      </span>

      <% if (rf.get(Formbuilder.options.mappings.INCLUDE_OTHER)) { %>
        <span>
          <input type='text' pattern="[a-zA-Z]+"/>
          <label>Middle</label>
        </span>
      <% } %>

      <span>
        <input id='last_name' type='text' pattern="[a-zA-Z]+"/>
        <label>Last</label>
      </span>

      <span>
        <input id='suffix' type='text'/>
        <label>Suffix</label>
      </span>
    </div>
  """

  edit: """
    <%= Formbuilder.templates['edit/middle']({ includeOther: true }) %>
  """

  addButton: """
    <span class="symbol"><span class="icon-user"></span></span> Full Name
  """

  isValid: ($el, model) ->
    do(valid = false) =>
      valid = do (required_attr = model.get('required'), checked_chk_cnt = 0) =>
        return true if !required_attr
        return ($el.find("#first_name").val() != '' &&
          $el.find("#last_name").val() != '')
      valid

  clearFields: ($el, model) ->
    $el.find("#first_name").val("")
    $el.find("#last_name").val("")
    $el.find("#suffix").val("")

  evalResult: (clicked_element, cid, condition, set_value) ->
    do(
       elem_val = '' ,
       check_result = false                   
    ) =>           
    elem_val = clicked_element
                          .find("#first_name").val()           
    check_result = eval("'#{elem_val}' #{condition} '#{set_value}'")  
    check_result
