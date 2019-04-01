/*
 *	file:	404.js
 *	author:	garnt
 *	date:	03/27/2019
 *	desc:	js to update the contents of #404-message with a random new language
 *			as translated by google's api.
 */

// a bunch of translations of "404. Page not found."
var messages = [
	"404 Pagina no encontrada",
	"404 الصفحة غير موجودة",
	"404 Страницата не е намерена",
	"404 Side ikke fundet",
	"404 Page non trouvée",
	"404 Seite nicht gefunden",
	"404 Η σελίδα δεν βρέθηκε",
	"404 Paj pa jwenn",
	"404 הדף לא נמצא",
	"404 Síða fannst ekki",
	"404 pagina non trovata",
	"404 페이지를 찾을 수 없습니다",
	"CDIV Page non inveni",
	"404 halaman tidak dijumpai",
	"404 хуудас олдсонгүй",
	"404 پاڼه ونه موندل شوه",
	"404 Nie znaleziono strony",
	"404 Página Não Encontrada",
	"404 Страница не найдена",
	"404 Страница није пронађена",
	"Ukurasa 404 haukupatikana",
	"404 sida ej hittad",
	"Lôi 404 Không Tim Được Trang",
	"404 Page ניט געפונען",
	"Ikhasi le-404 alitholakalanga",
];

var messageSpan = document.getElementById('message-span');

// add an event listener to change the language 2 seconds after it's modified
messageSpan.addEventListener("DOMSubtreeModified", function() {
	// after 2 seconds...
	setTimeout(function() {
		messageSpan.innerHTML = messages[Math.floor(Math.random() * messages.length)];
	}, 3500);
});

// after 2 seconds...
setTimeout(function() {
	messageSpan.innerHTML = messages[Math.floor(Math.random() * messages.length)];
}, 3500);
