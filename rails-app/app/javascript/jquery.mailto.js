
$.fn.mailTo = function () {
  const replacements = {
    und: '@',
    bei: '@',
    at: '@',
    punkt: '.',
    dot: '.',
    minus: '-',
    dash: '-',
  };

  this.each(function () {
    const $el = $(this);
    let address = $el.text();

    // Replace all words-in-brackets with their mapped character
    for (const [k, v] of Object.entries(replacements)) {
      const regex = new RegExp(`\\s*[\\(\\[]\\s*${k}\\s*[\\)\\]]\\s*`, 'gi');
      address = address.replace(regex, v);
    }

    // Option 1: Rebuild the mailto link on the page
    $el.attr('href', `mailto:${address}`);
    $el.text(address);

    // Option 2: If you want click handler instead of rewriting text, use:
    // $el.on('click', (e) => {
    //   e.preventDefault();
    //   window.location.href = `mailto:${address}`;
    // });
  });

  return this; // for chaining
};
