/**
 * Created by tss on 26.09.2015.
 */
var mainData, quoteHistory = [], prevIndex;

$(document).ready(function () {
    $.getJSON("read", {}, function (data) {
        mainData = data;
        if (window.location.hash) {
            var quote = findObjectById(mainData, window.location.hash.substring(1));
            if (!quote) quote = getRandomQuoteHtml();
            else {
                window.location.hash = quote._id;
            }
            $('.slides section:first').html(tmpl("the-data", quote));
        } else {
            $('.slides section:first').html(getRandomQuoteHtml());
        }
        setupReveal();
        // extra info
        $('.slides').on("mouseover", function (e) {
            $('.toggle:hidden').show();
        });
        $('.slides').on("mouseout", function (e) {
            $('.toggle:visible').hide();
        });
    });
});

function getRandomQuoteHtml(isPrevSlide) {
    var quote;
    if (isPrevSlide && quoteHistory.length) {
        quote = findObjectById(mainData, quoteHistory.pop());
    }
    if (!quote) {
        var idx = parseInt(Math.random() * mainData.length);
        quote = mainData[idx];
    }
    window.location.hash = quote._id;
    return tmpl("the-data", quote);
}

var findObjectById = function (objects, id) {
    for (var i = 0, len = objects.length; i < len; i++) {
        if (objects[i]._id === id)
            return objects[i]; // Return as soon as the object is found
    }
    return null; // The object was not found
}

function setupReveal() {
    Reveal.addEventListener('slidechanged', function (event) {
        var isPrevSlide = false;
        if (prevIndex < event.indexh || (event.indexh == 0 && prevIndex == 16)) { // if next slide
            quoteHistory.push(window.location.hash.substring(1)); //quote._id
        } else { // prev slide
            isPrevSlide = true;
        }
        $(event.currentSlide).html(getRandomQuoteHtml(isPrevSlide));
        window.dispatchEvent(new Event('resize'));
        prevIndex = event.indexh;
    });

    Reveal.initialize({
        width: '110%',

        height: '140%',

        //maxScale: 0.5,

        // Display controls in the bottom right corner
        controls: true,

        // Display a presentation progress bar
        progress: false,

        // Display the page number of the current slide
        slideNumber: false,

        // Push each slide change to the browser history
        history: false,

        // Enable keyboard shortcuts for navigation
        keyboard: true,

        // Enable the slide overview mode
        overview: false,

        // Vertical centering of slides
        center: true,

        // Enables touch navigation on devices with touch input
        touch: true,

        // Loop the presentation
        loop: true,

        // Change the presentation direction to be RTL
        rtl: false,

        // Turns fragments on and off globally
        fragments: true,

        // Flags if the presentation is running in an embedded mode,
        // i.e. contained within a limited portion of the screen
        embedded: false,

        // Flags if we should show a help overlay when the questionmark
        // key is pressed
        help: true,

        // Number of milliseconds between automatically proceeding to the
        // next slide, disabled when set to 0, this value can be overwritten
        // by using a data-autoslide attribute on your slides
        autoSlide: 0,

        // Stop auto-sliding after user input
        autoSlideStoppable: true,

        // Enable slide navigation via mouse wheel
        mouseWheel: true,

        // Hides the address bar on mobile devices
        hideAddressBar: true,

        // Opens links in an iframe preview overlay
        previewLinks: true,

        // Transition style
        transition: 'default', // none/fade/slide/convex/concave/zoom

        // Transition speed
        transitionSpeed: 'default', // default/fast/slow

        // Transition style for full page slide backgrounds
        backgroundTransition: 'default', // none/fade/slide/convex/concave/zoom

        // Number of slides away from the current that are visible
        viewDistance: 3,

        // Parallax background image
        parallaxBackgroundImage: 'images/bg.jpg', // e.g. "'https://s3.amazonaws.com/hakim-static/reveal-js/reveal-parallax-1.jpg'"

        // Parallax background size
        parallaxBackgroundSize: '2200px 1150px', // CSS syntax, e.g. "2100px 900px"

        // Amount to move parallax background (horizontal and vertical) on slide change
        // Number, e.g. 100
        parallaxBackgroundHorizontal: '50',
        parallaxBackgroundVertical: ''

    });

}