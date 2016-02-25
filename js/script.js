$(document).ready(function () {
  var videous = document.querySelectorAll("video");
  for (var i in videous) {
    if (videous.hasOwnProperty(i)) {
      new vp(videous[i]);
    }
  }
});



