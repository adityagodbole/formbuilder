Formbuilder.registerField 'address',

  view: """
    <div class='input-line'>
      <span>
        <input type='text' />
        <label>Address</label>
      </span>
    </div>

    <div class='input-line'>
      <span>
        <input type='text' />
        <label>Suburb</label>
      </span>

      <span>
        <input type='text' />
        <label>State / Province / Region</label>
      </span>
    </div>

    <div class='input-line'>
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
