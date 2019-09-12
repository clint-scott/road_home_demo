

console.log('***** common.js loaded.');

var trayDisabled = false;

$(function ($) {
	selectChange();
	initBuild();
	updateTrayPosition();

	$(window).on('resize', function (e) {
		updateTrayPosition();
	});

	$(document).on('scroll', function (e) {

	});

	$(document).on('change', '#skill-level-change', function (e) {
		selectChange();
	});

	$(document).on('click', '.btn-back-to-main', function (e) {
		e.preventDefault();
		var href = $(this).attr('href');
		parent.location.href = href;
	});

	$(document).on('click', '[data-tray-url]', function (e) {

		var url = $(this).data('tray-url') || '';
		
		$('#tray > iframe').attr('src', url);
		updateTrayPosition(true);
	});
});

function selectChange () {
	var querry = $('#skill-level-change').val(),
		fullURL = $('#btn-evaluate').data('tray-url'),
		url = fullURL.substring(0, fullURL.indexOf('?')) || fullURL;

	$('#btn-evaluate').data({ 'tray-url': url + '?build=' + querry });
}

function initBuild() {
	var urlParams = new URLSearchParams(window.location.search),
		build = urlParams.get('build');
	
	$('[data-' + build + ']').toggleClass('hidden', false);
	
	if (build === 'trainer' || build === 'manager') {
		$('.customer-journey-tiles a').toggleClass('completed', true);
	}
	else if (build === 'crewb') {
		$('.customer-journey-tiles a:lt(5)').toggleClass('completed', true);
	}
}

function updateTrayPosition(toggle) {
	
	if (trayDisabled) return false;
	
	trayDisabled = true;
	var fixedX = $('#app').offset().left+'px';

	if (toggle !== undefined) {
		$('#tray').toggleClass('closed');
	}
	
	var closed = $('#tray').hasClass('closed'),
		targetX = closed ? '100%' : fixedX;
		appWidth = $('#app').outerWidth();
	

	$('#tray').css({
		'left': targetX,
		'max-width': appWidth
	});
	if (closed) {
		$('#tray > iframe').attr('src', '');
	}
	setTimeout(function() {
		trayDisabled = false;
	},500);
}



