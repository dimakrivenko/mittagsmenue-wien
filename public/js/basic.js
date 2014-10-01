var intervalVotes = false;
var usedGeolocation = false;
var oldVoteData = null;
var voting_over_interval_multiplier = 1;
var venues_ajax_query = Array();
var ajax_retry_time_max = 3000;
var ajax_retry_count_max = 10;

function isMobileDevice() {
	return /Android|webOS|iPhone|iPad|iPod|BlackBerry|MIDP|Nokia|J2ME/i.test(navigator.userAgent);
}

function checkDateInput() {
	var input = document.createElement('input');
	input.setAttribute('type','date');

	var notADateValue = 'not-a-date';
	input.setAttribute('value', notADateValue);

	return !(input.value === notADateValue);
}

function detectIE() {
	var ua = window.navigator.userAgent;
	var msie = ua.indexOf('MSIE ');
	var trident = ua.indexOf('Trident/');

	if (msie > 0) {
		// IE 10 or older => return version number
		return parseInt(ua.substring(msie + 5, ua.indexOf('.', msie)), 10);
	}

	if (trident > 0) {
		// IE 11 (or newer) => return version number
		var rv = ua.indexOf('rv:');
		return parseInt(ua.substring(rv + 3, ua.indexOf('.', rv)), 10);
	}

	// other browser
	return false;
}

// jquery keys extension for old IE
$.extend({
	keys: function(obj) {
		var a = [];
		$.each(obj, function(k){ a.push(k) });
		return a;
	}
});

function custom_userid_generate(try_count) {
	$.ajax({
		type: "POST",
		url:  'customuserid.php',
		data: { "action": "custom_userid_generate", 'userid' : $('#userid').html() },
		dataType: "json",
		success: function(result) {
			// alert from server (e.g. error)
			if (typeof result.alert != 'undefined') {
				alert(result.alert);
			}
			// got valid access url
			else if (typeof result.access_url != 'undefined') {
				$("#custom_userid_url").html(result.access_url);
			}
			else
				alert('Fehler beim Erstellen der externen Zugriffs-URL.');
		},
		error: function() {
			// retry on error
			if (try_count < ajax_retry_count_max)
				window.setTimeout(function() { custom_userid_generate(try_count+1) }, (Math.random()*ajax_retry_time_max)+1);
			else
				alert('Fehler beim Erstellen der externen Zugriffs-URL.');
		}
	});
}

// sends vote action (vote_up, vote_down, vote_get) and identifier (delete, restaurant name, ..) to server
function vote_helper(action, identifier, note, try_count) {
	$.ajax({
		type: "POST",
		url:  'vote.php',
		data: { "action": action, "identifier": identifier, "note": note, 'userid' : $('#userid').html()},
		dataType: "json",
		success: function(result) {

			// increase interval multiplier to reduce server load
			if (intervalVotes)
				clearInterval(intervalVotes);
			if (typeof result.voting_over != 'undefined' && result.voting_over || !result || typeof result.alert != 'undefined')
				voting_over_interval_multiplier += 0.1;
			else
				voting_over_interval_multiplier = 1;
			intervalVotes = setInterval(function(){vote_get()}, Math.floor(5000 * voting_over_interval_multiplier));

			// exit, if we got the same as before
			// except it is a server alert
			if (typeof JSON != 'undefined' && JSON.stringify(oldVoteData) == JSON.stringify(result) && typeof result.alert == 'undefined')
				return;

			// alert from server (e.g. error)
			if (typeof result.alert != 'undefined') {
				alert(result.alert);
			}
			// got valid vote result
			else if (typeof result.html != 'undefined') {
				$("#dialog_ajax_data").html(result.html);
				$("#dialog_vote_summary").css('display', 'table');
				// highlight dialog (only if voting not over)
				if (!result.voting_over)
					$("#dialog_vote_summary").effect('highlight');
			}
			// no | empty result => hide voting dialog
			else {
				if (intervalVotes)
					$("#dialog_vote_summary").hide();
			}
			oldVoteData = result;
		},
		error: function() {
			// retry on error
			if (try_count < ajax_retry_count_max)
				window.setTimeout(function() { vote_helper(action, identifier, note, try_count+1) }, (Math.random()*ajax_retry_time_max)+1);
			else
				alert('Fehler beim Setzen des Votes.');
		}
	});
}
// vote up
function vote_up(identifier) {
	vote_helper('vote_up', identifier, null, 0);
}
// vote down
function vote_down(identifier) {
	vote_helper('vote_down', identifier, null, 0);
}
// vote special
function vote_special(identifier) {
	$('#noteInput').val(identifier);
	vote_helper('vote_special', identifier, null, 0);
}
// set note
function vote_set_note(note) {
	vote_helper('vote_set_note', null, note, 0);
}
// get votes
function vote_get() {
	vote_helper('vote_get', null, null, 0);
}
// delete vote
function vote_delete() {
	$('#noteInput').val('');
	vote_helper('vote_delete', null, null, 0);
}
// delete vote part
function vote_delete_part(identifier) {
	if (identifier == 'special')
		$('#noteInput').val('');
	vote_helper('vote_delete_part', identifier, null, 0);
}
// got (lat / long) location => get address from it
function positionHandler(position) {
	lat = position.coords.latitude;
	lng = position.coords.longitude;

	// get address via ajax
	$.ajax({
		type: "POST",
		url:  'locator.php',
		data: { "action": "latlngToAddress", "lat": lat, "lng": lng, 'userid' : $('#userid').html()},
		dataType: "json",
		success: function(result) {

			if (result && typeof result.address != 'undefined' && result.address) {
				usedGeolocation = true;
				$('#location').html(result.address);
				$('#locationInput').val(result.address);
				sortVenuesAfterPosition(lat, lng);
			}
		},
		error: function() {
			sortVenuesAfterPosition(lat, lng);
		}
	});
}
// error or user denied location access
function positionErrorHandler(error) {
	sortVenuesAfterPosition($('#lat').html(), $('#lng').html());
}
// calculates the distance between two lat/lng points
function distanceLatLng(lat1, lng1, lat2, lng2) {
	lat1 = parseFloat(lat1);
	lng1 = parseFloat(lng1);
	lat2 = parseFloat(lat2);
	lng2 = parseFloat(lng2);
	var pi80 = Math.PI / 180;
	lat1 *= pi80;
	lng1 *= pi80;
	lat2 *= pi80;
	lng2 *= pi80;

	var r = 6372.797; // mean radius of Earth in km
	var dlat = lat2 - lat1;
	var dlng = lng2 - lng1;
	var a = Math.sin(dlat / 2) * Math.sin(dlat / 2) + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dlng / 2) * Math.sin(dlng / 2);
	var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
	var km = r * c;

	return km;
}
// sort venues according to given lat lng of user
function sortVenuesAfterPosition(lat, lng) {

	// set lat | lng in document
	$('#lat').html(lat);
	$('#lng').html(lng);

	// get location diff for all venues
	var locationDiffs = new Array();
	$.each($('[class="venueDiv"]'), function() {
		var id = $(this).prop('id');
		var latVenue = $(this).children('.lat').html();
		var lngVenue = $(this).children('.lng').html();

		locationDiffs[id] = distanceLatLng(lat, lng, latVenue, lngVenue);
	});

	// load all venues in array for sorting
	var venueSortArray = $('[class="venueDiv"]');

	// sort array according to location diff
	venueSortArray.sort(function (a, b) {
		var idA = $(a).prop('id');
		var idB = $(b).prop('id');
		var diffA = locationDiffs[idA];
		var diffB = locationDiffs[idB];

		if (diffA > diffB) {
			return 1;
		}
		else if (diffA < diffB) {
			return -1;
		}
		else {
			return 0;
		}
	});

	// load sorted venues back in venue container
	$('#venueContainer').html(venueSortArray);

	// locationReady event
	$(document).trigger('locationReady');
}

function setLocation(location, force_geolocation, try_count) {
	// location via geolocation
	if (!location || force_geolocation) {
		// use geolocation via client only on mobile devices
		if ((isMobileDevice() || force_geolocation) && navigator.geolocation) {
			navigator.geolocation.getCurrentPosition(positionHandler, positionErrorHandler, {timeout: 5000});
		}
		else {
			// sort venues
			sortVenuesAfterPosition($('#lat').html(), $('#lng').html());

			// locationReady event
			usedGeolocation = false;
			$(document).trigger('locationReady');
		}
		$.removeCookie('location');
		return;
	}
	usedGeolocation = false;

	// get lat / lng via ajax
	$.ajax({
		type: "POST",
		url:  'locator.php',
		data: { "action": "addressToLatLong", "address": location, 'userid' : $('#userid').html()},
		dataType: "json",
		success: function(result) {

			if (result && typeof result.lat != 'undefined' && result.lat && typeof result.lng != 'undefined' && result.lng) {
				// custom location
				$('#location').html(location);
				$('#locationInput').val(location);

				// sort venues
				sortVenuesAfterPosition(result.lat, result.lng);

				// save custom location in cookie
				$.cookie('location', location, { expires: 7 });
			}
			else {
				$('#locationInput').val($('#location').html());
				alert('Keine Geo-Daten zu dieser Adresse gefunden.');
			}
		},
		error: function() {
			// retry
			if (try_count < ajax_retry_count_max)
				window.setTimeout(function() { setLocation(location, force_geolocation, try_count+1); }, (Math.random()*ajax_retry_time_max)+1);
			else
				alert('Fehler beim Abrufen der Geo-Position. Bitte Internetverbindung überprüfen.');
		}
	});
}
// set location by user => get lat / lng from it => sort venues
function setLocationDialog(el) {
	// show dialog
	$('#setLocationDialog').dialog({
		modal: true,
		resizable: false,
		title: "Adresse festlegen",
		buttons: {
			"Ok": function() {
				var location = $('#locationInput').val();
				setLocation(location, false, 0);
				$('#setLocationDialog').dialog("close");
				$(this).dialog("close");
			},
			"Abbrechen": function() {
				$(this).dialog("close");
			}
		},
		width: 'auto'
	});
}
function setDistance(distance) {
	if (typeof distance != 'undefined') {
		// set slider
		$('#sliderDistance').slider("option", "value", distance);

		// set in ui
		$('#distance').val(distance);

		// save distance in cookie
		$.cookie('distance', distance, { expires: 7 });
	}
	// update shown venues
	get_venues_distance();
}
// shows an alert with the current location on a google map
// also the nearest venues are shown
function showLocation(el) {
	// current location
	var latlng = $('#lat').html() + "," + $('#lng').html();
	var img_url = "http://maps.googleapis.com/maps/api/staticmap?center="+latlng+"&amp;zoom=15&amp;language=de&amp;size=400x300&amp;sensor=false"+
	"&amp;markers=color:red|"+latlng;

	// marker for each venue
	var marker = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
	var cnt = 0;
	var key = "";
	$.each($('[class="venueDiv"]:visible'), function() {
		var latVenue = $(this).children('.lat').html();
		var lngVenue = $(this).children('.lng').html();
		var title = $(this).children('[class="title"]').children('a').html()

		img_url += "&amp;markers=color:red|label:" + marker[cnt] + "|" + latVenue + "," + lngVenue;
		if (cnt < 5)
			key += marker[cnt] + ": " + title + "<br />";
		cnt++;
		if (cnt >= marker.length)
			cnt = 0;
	});

	// show in alert
	var data = '<img width="400" height="300" src="' + img_url + '"></img>';
	data += '<br />' + '<div class="locationMapLegend" style="">' + key + '</div>';
	alert(data, $('#location').html(), false, 425);
}
function get_venues_distance() {
	// current location
	var lat = $('#lat').html();
	var lng = $('#lng').html();
	var distance = $('#distance').val();

	// for each venue
	var marker = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
	var cnt = 0;
	$.each($('[class="venueDiv"]'), function() {
		var latVenue = $(this).children('.lat').html();
		var lngVenue = $(this).children('.lng').html();
		var obj = $(this);

		// get distance on clientside via JS
		var distanceString = "";
		var distanceValue = distanceLatLng(lat, lng, latVenue, lngVenue);
		var distanceMetersRound = Math.floor(Number((distanceValue).toFixed(2)) * 1000);

		if (distanceValue >= 1)
			distanceString = "~ " + distanceValue.toFixed(1) + " km";
		else
			distanceString = "~ " + distanceMetersRound + " m";

		// hide too far locations
		if (distanceMetersRound > distance)
			$(this).hide();
		else
			$(this).show();

		// remove old distance object if existing
		obj.children('.distance').remove();
		// create new distance object
		obj.append("<div class='distance'>Distanz: " + distanceString + "</div>");

	});
	// notifier if no venues found
	if ($('[class="venueDiv"]:visible').length < 1)
		$('#noVenueFoundNotifier').show();
	else
		$('#noVenueFoundNotifier').hide();
}

function setNoteDialog() {
	// show dialog
	$('#setNoteDialog').dialog({
		modal: true,
		resizable: false,
		title: "Notiz erstellen",
		buttons: {
			"Ok": function() {
				var note = $('#noteInput').val();
				vote_set_note(note);
				$('#setNoteDialog').dialog("close");
				$(this).dialog("close");
			}
		},
		width: 'auto'
	});
}

function handle_href_reference_details(id, reference, name, try_count) {
	$.ajax({
		type: 'POST',
		url:  'nearplaces.php',
		data: {
			'action'    : 'details',
			'id'        : id,
			'reference' : reference,
			'sensor'    : isMobileDevice(),
			'userid'    : $('#userid').html()
		},
		dataType: 'json',
		async: false,
		success: function(result) {
			if (typeof result.alert != 'undefined')
				alert(result.alert);

			// got website via details api
			if (typeof result.result.website != 'undefined')
				window.open(result.result.website, '_blank');
			// now website open google search
			else
				window.open('https://www.google.com/#q=' + name, '_blank');
		},
		error: function() {
			// retry
			if (try_count < ajax_retry_count_max)
				window.setTimeout(function() { handle_href_reference_details(id, reference, name, try_count+1); }, (Math.random()*ajax_retry_time_max)+1);
			else
				alert('Fehler beim Abholen der Restaurants in der Nähe.');
		}
	});
}

function get_alt_venues(lat, lng, radius, radius_max, success_function, try_count) {
	$.ajax({
		type: 'POST',
		url:  'nearplaces.php',
		data: {
			//'action'     : 'nearbysearch_staged', // takes so long, is it worth it?
			'action'     : 'nearbysearch_full',
			'lat'        : lat,
			'lng'        : lng,
			'radius'     : radius,
			'radius_max' : radius_max,
			'sensor'     : isMobileDevice(),
			'userid'     : $('#userid').html()
		},
		dataType: "json",
		success: function(result) {
			if (typeof result.alert != 'undefined')
				alert(result.alert);
			else
				return success_function(result);
		},
		error: function() {
			if (try_count < ajax_retry_count_max)
				window.setTimeout(function() { get_alt_venues(lat, lng, radius, radius_max, success_function, try_count+1); }, (Math.random()*ajax_retry_time_max)+1);
			else
				alert('Fehler beim Abholen der Restaurants in der Nähe.');
		}
	});
}

function init_venues_alt() {
	var lat = $('#lat').html();
	var lng = $('#lng').html();

	$('#table_voting_alt').hide();
	$('#div_voting_alt_loader').show();

	// get venues in 1000 - user distance radius
	var results = new Array();
	get_alt_venues(lat, lng, 1000, $('#distance').val(), function (results) {
		$('#table_voting_alt').dataTable().fnDestroy();
		$('#table_voting_alt').dataTable({
			data: results,
			"order": [[ 1, "asc" ]]
		});
		$('#div_voting_alt_loader').hide();
		$('#table_voting_alt').show();
		$("#setAlternativeVenuesDialog").dialog("option", "position", "center");
		$('#setAlternativeVenuesDialog').dialog('widget').position({my:"center", at:"center", of:window})
	}, 0);
}

function setAlternativeVenuesDialog() {
	init_venues_alt();

	// show dialog
	$('#setAlternativeVenuesDialog').dialog({
		modal: true,
		resizable: false,
		title: "Lokale in der Nähe",
		buttons: {
			"Schließen": function() {
				$(this).dialog("close");
			}
		},
		width: 'auto'
	});
}
// updates the gui on user changes
function updateVoteSettingsDialog() {
	// disable reminder checkbox if "send mail only if already voted" checkbox is checked
	$('#vote_reminder').attr('disabled', $('#voted_mail_only').is(':checked'));
}
function setVoteSettingsDialog() {
	// show dialog
	$('#setVoteSettingsDialog').dialog({
		modal: true,
		resizable: false,
		title: "Spezial-Votes & Einstellungen",
		buttons: {
			"Speichern / Schließen": function() {
				$.ajax({
					type: 'POST',
					url: 'users.php',
					data: {
						'action'         : 'user_config_set',
						'name'           : $('#name').val(),
						'email'          : $('#email').val(),
						'vote_reminder'  : $('#vote_reminder').is(':checked'),
						'voted_mail_only': $('#voted_mail_only').is(':checked'),
						'userid'         : $('#userid').html()
					},
					dataType: "json",
					success: function(result) {
						if (typeof result.alert != 'undefined')
							alert(result.alert);
					},
					error: function() {
						alert('Fehler beim Setzen der Vote-Einstellungen.');
					}
				});
				$(this).dialog("close");
			}
		},
		width: 'auto'
	});
}

// INIT
$(document).ready(function() {

	// old ie warning (not supported by jquery 2.*)
	var ie_version = detectIE();
	if (ie_version && ie_version <= 8)
		alert('Bitte neuere Internet Explorer Version verwenden!');

	// replace native datepicker with jqueryui one on demand
	if (!checkDateInput()) {
		$('#date').datepicker({
			dateFormat: 'yy-mm-dd'
		});
	}

	// location ready event
	var locationReadyFired = false;
	$(document).on('locationReady', function() {
		locationReadyFired = true;
		// add distance user-venue to each venue
		// also hides venues which are too far away
		head.ready('scripts', function() {
			var distance = $.cookie('distance');

			// default distance
			if (typeof distance == 'undefined')
				distance = $('#distance_default').html();

			// init distance slider
			$("#sliderDistance").slider({
				value: distance,
				min: 100,
				max: 10000,
				step: 100,
				slide: function(event, ui) {
					setDistance(ui.value);
				}
			});

			// show social shares
			$('#socialShare').show();

			$('#loadingContainer').hide();
			setDistance(distance);
		});

		// replace @@lat_lng@@ placeholder in google maps hrefs
		$('.lat_lng_link').each(function(index, value) {
			var href = $(this).prop('href');
			href = href.replace('@@lat_lng@@', $('#lat').html() + ',' + $('#lng').html());
			$(this).prop('href', href);
		});
	});

	// start location stuff
	head.ready('scripts', function() {
		var location = $.cookie('location');
		// custom location from cookie
		if (typeof location != 'undefined' && location && location.length) {
			setLocation(location, false, 0);
		}
		// location via geolocation
		else {
			setLocation(null, false, 0);
		}
	});
	// fallback with timer if location ready event not fired
	setTimeout(function() {
		if (!locationReadyFired)
			$(document).trigger('locationReady');
	}, 10000);

	// show voting
	if ($('#show_voting').length)
		vote_get();

	// connect distance input with distance slider
	$('#distance').on('input change', function() {
		setDistance($(this).val());
	});

	// date change handler
	$('#date').bind('change', function() {
		document.location = window.location.protocol + "//" + window.location.host + window.location.pathname + "?date=" + $(this).val();
	});

	// set submit handler for location input form
	$('#locationForm').submit(function(event) {
		var location = $('#locationInput').val();
		setLocation(location, false, 0);
		$('#setLocationDialog').dialog("close");
		event.preventDefault();
	});

	// set submit handler for note input form
	$('#noteForm').submit(function(event) {
		var note = $('#noteInput').val();
		vote_set_note(note);
		$('#setNoteDialog').dialog("close");
		event.preventDefault();
	});

	// set change handler for setVoteSettingsDialog
	$('#setVoteSettingsDialog').change(function() {
		updateVoteSettingsDialog();
	});
	updateVoteSettingsDialog();
});

// alert override
window.alert = function(message, alertTitle, showIcon, width) {
	if (typeof alertTitle == 'undefined')
		var alertTitle = 'Hinweis';
	if (typeof showIcon == 'undefined' || showIcon)
		message = '<table><tr><td><span class="ui-icon ui-icon-alert" style="margin-right: 5px"></span></td><td>' + message + '</td></tr></table>';
	if (typeof width == 'undefined')
		width = 'auto';

	// remove old alert elements (avoids stacking)
	$('.alert').remove();

	// create new alert element
	$(document.createElement('div'))
		.attr({title: alertTitle, 'class': 'alert'})
		.html(message)
		.dialog({
			title: alertTitle,
			resizable: false,
			modal: true,
			width: width,
			buttons: {
				'OK': function() {
					$(this).dialog('close');
				}
			}
		});
};