jQuery.fn.mailTo = ->
  @each (i,e)->
    $this = $ @
    replacements =
      und:    '@'
      bei:    '@'
      at:     '@'
      punkt:  '.'
      dot:    '.'
      minus:  '-'
      dash:   '-'
    address = $this.text()
    address = address.replace new RegExp("\\s*[\\(\\[]\\s*#{k}\\s*[\\)\\]]\\s*"), v for k,v of replacements

    ## either rebuild mailto links on the page
    $this.attr('href', "mailto:#{address}")
    $this.text(address)

    ## or add a click event handler
    # $this.on 'click', (e)->
    #   e.preventDefault()
    #   window.location.href = "mailto:#{address}"
