#CKEDITOR: http://ckeditor.com/
unless typeof(CKEDITOR) is 'undefined'
  Formbuilder.registerField 'free_text_html',

    type: 'non_input'

    view: """
      <label class='rf-size-<%= rf.get(Formbuilder.options.mappings.SIZE) %>'>
        <%= rf.get(Formbuilder.options.mappings.LABEL) %>
      </label>
      <div id='<%= rf.getCid() %>'></div>
      <script>
        $(function() {
          var data = "<%=rf.get(Formbuilder.options.mappings.HTML_DATA)%>"
          $("#<%= rf.getCid() %>").html(data);
        });
      </script>

    """

    edit: """

      </br>
      <input type='text'
        data-rv-input='model.<%= Formbuilder.options.mappings.LABEL %>' />

      <div class='inline'>
        <span>Edit Here:</span>
        <textarea id='ck_<%= rf.getCid() %>' contenteditable="true" data-rv-value='model.<%= Formbuilder.options.mappings.HTML_DATA %>'>
        </textarea>
      </div>

      <script>
        $(function() {
          $(document).ready( function() {
            CKEDITOR.disableAutoInline = true;
            editor_<%= rf.getCid() %> = CKEDITOR.inline(document.getElementById("ck_<%= rf.getCid() %>"),
              Formbuilder.options.CKEDITOR_CONFIG
            );
            editor_<%= rf.getCid() %>.on( 'blur', function( e ) {
              $("#ck_<%= rf.getCid() %>").val(editor_<%= rf.getCid() %>.getData().replace(/(\\r\\n|\\n|\\r)/gm, ""));
              $("#ck_<%= rf.getCid() %>").trigger("change");
            });
          });
        });
      </script>

    """

    addButton: """
      <span class='symbol'><span class='icon-font'></span></span> Free Text HTML
    """

