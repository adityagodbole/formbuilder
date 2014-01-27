Formbuilder.registerField 'gmap',

  view: """
    <input type='button' style="min-width: 100px ;height: 35px;padding-top: 5px;padding-bottom: 5px;" id="gmap_button" value="" />
  """

  edit: ""

  addButton: """
    <span class="symbol"><span class="icon-map-marker"></span></span> google maps
  """

  addRequiredConditions: ->
    $('<div class="modal fade" id="myModal1" tabindex="-1" role="dialog" aria-labelledby="myModalLabel" aria-hidden="true">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <button type="button" class="close" data-dismiss="modal" aria-hidden="true">&times;</button>
              <h4 class="modal-title" id="myModalLabel">Google Maps</h4>
            </div>
            <div class="modal-body">
              <div class="row-fluid panel top-panel1">
                <input id="latlng" class="panel1" type="text" value="40.714224,-73.961452"/>
                <input type="button" value="Lat,Long" onclick="codeLatLng()"/>
              </div>
              <div class="row-fluid panel top-panel2">
                <input id="gmap_address" class="panel1" type="textbox" value="Sydney, NSW"/>
                <input type="button" value="Location" onclick="codeAddress()"/>
              </div>
              <div id="map-canvas"/>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-default" id="ok" data-dismiss="modal">Ok</button>
            </div>
          </div>
        </div>
      </div>
  ').appendTo('body')

  isValid: ($el, model) ->
    do(valid = false) =>
      valid = do (required_attr = $el.find("[name = "+model.getCid()+"_1]").attr("required")) =>
        return true if !required_attr
        return $el.find("[name = " + model.getCid() + "_1]").val() != ''
      valid