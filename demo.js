$(document).ready(function() {

	$("input").click(function() {
		console.log("push !");
		console.log($(this).attr("id"));
		alert($(this).attr("id"));
	})

});
