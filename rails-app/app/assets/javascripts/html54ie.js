/* teach IE HTML5 elements */
var html54ie = function() {
  var e = "abbr,article,aside,audio,bb,canvas,datagrid,datalist,details,dialog,eventsource,figure,footer,header,hgroup,mark,menu,meter,nav,output,progress,section,time,video".split(',');
  for(var i=0;i<e.length;i++){
    document.createElement(e[i])
  }
}
if(!/*@cc_on!@*/0)
  html54ie();
