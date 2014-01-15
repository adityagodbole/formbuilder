Formbuilder.registerField 'checkboxes',

  view: """
    <% var field_options = (rf.get(Formbuilder.options.mappings.OPTIONS) || []) %>
    <% for ( var i = 0 ; i < field_options.length ; i++) { %>
      <div>
        <label class='fb-option'>
          <input type='checkbox' value=<%= rf.get(Formbuilder.options.mappings.OPTIONS)[i].label%> <%= rf.get(Formbuilder.options.mappings.OPTIONS)[i].checked && 'checked' %> />
          <%= rf.get(Formbuilder.options.mappings.OPTIONS)[i].label %>
        </label>
      </div>
    <% } %>

    <% if (rf.get(Formbuilder.options.mappings.INCLUDE_OTHER)) { %>
      <div class='other-option'>
        <label class='fb-option'>
          <input class='other-option' type='checkbox' value="__other__"/>
          Other
        </label>

        <input type='text' />
      </div>
    <% } %>
  """

  edit: """
    <%= Formbuilder.templates['edit/options']({ includeOther: true }) %>
  """

  addButton: """
    <span class="symbol"><span class="icon-check-empty"></span></span> Checkboxes
  """

  defaultAttributes: (attrs) ->
    attrs.field_options.options = [
      label: "",
      checked: false
    ,
      label: "",
      checked: false
    ]

    attrs

  isValid: ($el, model) ->
    do(valid = false) =>
      valid = do (required_attr = model.get('required'), checked_chk_cnt = 0) =>
        return true if !required_attr
        checked_chk_cnt = $el.find('input:checked').length
        if $($el.find('input:checked').last()).val() == '__other__'
          return $el.find('input:text').val() != ''
        return checked_chk_cnt > 0
      valid

  clearFields: ($el, model) ->
    for elem in $el.find('input:checked')
      elem.checked = false

  evalResult: (clicked_element, cid, condition, set_value) ->
    do(
       elem_val = '' ,
       check_result = false                   
    ) =>
      elem_val = clicked_element.find("[value = " + set_value+"]").is(':checked')
      check_result = eval("'#{elem_val}' #{condition} 'true'")
      check_result    

