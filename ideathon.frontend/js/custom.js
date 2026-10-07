$(document).ready(function () {
    // Handle footer program links from other pages
    function handleFooterProgramLinks() {
        // Check if URL has hash on page load (from external links)
        if (window.location.hash) {
            var targetId = window.location.hash.substring(1);
            var $targetElement = $('#' + targetId);

            if ($targetElement.length > 0) {
                // Wait for page to load completely, then scroll
                setTimeout(function() {
                    var targetOffset = $targetElement.offset().top - 100; // 100px offset for header
                    $('html, body').animate({
                        scrollTop: targetOffset
                    }, 800, 'easeInOutQuad');
                }, 500);
            }
        }
    }

    // Initialize footer link handling
    handleFooterProgramLinks();

    // Handle mobile menu anchor links properly - work with main.js
    $('.navbar-nav a[href^="#"]').on('click', function (e) {
        var $link = $(this);
        var target = $link.attr('href');

        // Close mobile menu - let Bootstrap handle the collapse event
        $('.navbar-collapse').collapse('hide');

        // For program links, ensure they scroll properly after menu closes
        if (target === '#ideathon' || target === '#proptech' || target === '#contech') {
            // Wait for Bootstrap collapse animation to complete
            setTimeout(function() {
                var $targetElement = $(target);
                if ($targetElement.length) {
                    var offset = $targetElement.offset().top - 80;
                    window.scrollTo({
                        top: offset,
                        behavior: 'auto'
                    });
                }
            }, 400); // Match Bootstrap collapse animation time
        }
        // Let browser handle other anchor links naturally after menu closes
    });

    // Update active navigation on scroll with improved logic
    $(window).scroll(function () {
        var scrollPos = $(document).scrollTop() + 100;
        var currentSection = '';

        $('.navbar-nav .nav-link[href^="#"]').each(function () {
            var currLink = $(this);
            var refElement = $(currLink.attr("href"));

            if (refElement.length) {
                var sectionTop = refElement.offset().top - 100;
                var sectionBottom = sectionTop + refElement.outerHeight();

                if (scrollPos >= sectionTop && scrollPos < sectionBottom) {
                    currentSection = currLink.attr("href");
                }
            }
        });

        $('.navbar-nav .nav-link').removeClass("active");
        $('.navbar-nav .nav-link[href="' + currentSection + '"]').addClass("active");
    });

    // Trigger scroll event on page load to set initial active state
    $(window).trigger('scroll');
});

// Easing function for smoother animation
$.easing.easeInOutQuad = function (x, t, b, c, d) {
    if ((t /= d / 2) < 1) return c / 2 * t * t + b;
    return -c / 2 * ((--t) * (t - 2) - 1) + b;
};

// Revolutionary 3D Morphing Timeline Interactions
$(document).ready(function () {
    // Morphing Card Flip Animation
    $('.morphing-card').on('click', function () {
        var $card = $(this);
        var $geometry = $card.find('.card-geometry');

        if ($card.hasClass('flipped')) {
            // Flip back to front
            $card.removeClass('flipped');
            $geometry.css('transform', 'rotateY(0deg)');
        } else {
            // Flip to back
            $card.addClass('flipped');
            $geometry.css('transform', 'rotateY(180deg)');
        }
    });

    // Timeline Progress Tracking
    function updateTimelineProgress() {
        var scrollTop = $(window).scrollTop();
        var windowHeight = $(window).height();
        var documentHeight = $(document).height() - windowHeight;
        var scrollProgress = scrollTop / documentHeight;

        // Update progress bar
        $('.progress-bar::before').css('height', (scrollProgress * 100) + '%');

        // Update active nodes based on scroll position
        var programsOffset = $('#programs').offset() ? $('#programs').offset().top : 0;
        var timelineItems = $('.timeline-item-simple');
        var ideathonTop = timelineItems.eq(0).offset() ? timelineItems.eq(0).offset().top : 0;
        var proptechTop = timelineItems.eq(1).offset() ? timelineItems.eq(1).offset().top : 0;
        var contechTop = timelineItems.eq(2).offset() ? timelineItems.eq(2).offset().top : 0;

        $('.progress-node').removeClass('active');

        if (scrollTop >= contechTop - windowHeight * 0.5) {
            $('.progress-node[data-node="3"]').addClass('active');
        } else if (scrollTop >= proptechTop - windowHeight * 0.5) {
            $('.progress-node[data-node="2"]').addClass('active');
        } else if (scrollTop >= ideathonTop - windowHeight * 0.5) {
            $('.progress-node[data-node="1"]').addClass('active');
        }
    }

    // Progress Node Click Navigation - Only if progress nodes exist
    if ($('.progress-node').length > 0) {
        $('.progress-node').on('click', function () {
            var nodeNumber = $(this).data('node');
            var timelineItems = $('.timeline-item-simple');
            var targetElement = timelineItems.eq(nodeNumber - 1);
            var targetOffset = targetElement.offset() ? targetElement.offset().top - 100 : 0;

            $('html, body').animate({
                scrollTop: targetOffset
            }, 800, 'easeInOutQuad');
        });
    }

    // Parallax Effect for Floating Elements - Only if floating elements exist
    function updateParallax() {
        var scrollTop = $(window).scrollTop();

        $('.floating-elements > div').each(function (index) {
            var speed = 0.5 + (index * 0.1);
            var yPos = -(scrollTop * speed);
            $(this).css('transform', 'translateY(' + yPos + 'px)');
        });
    }

    // Intersection Observer for Morphing Cards - Only if morphing cards exist
    if ($('.morphing-card').length > 0) {
        const observerOptions = {
            threshold: 0.3,
            rootMargin: '-100px 0px -100px 0px'
        };

        const observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    $(entry.target).addClass('visible');
                }
            });
        }, observerOptions);

        $('.morphing-card').each(function () {
            observer.observe(this);
        });
    }

    // Scroll Event Handlers - Only add if elements exist
    var hasScrollHandlers = $('.morphing-card').length > 0 || $('.floating-elements').length > 0 || $('.timeline-item-simple').length > 0;

    if (hasScrollHandlers) {
        $(window).on('scroll', function () {
            if ($('.timeline-item-simple').length > 0) {
                updateTimelineProgress();
            }
            if ($('.floating-elements').length > 0) {
                updateParallax();
            }
        });

        // Initial calls
        if ($('.timeline-item-simple').length > 0) {
            updateTimelineProgress();
        }
        if ($('.floating-elements').length > 0) {
            updateParallax();
        }
    }

    // Keyboard Navigation for Morphing Cards - Only if morphing cards exist
    if ($('.morphing-card').length > 0) {
        $(document).on('keydown', function (e) {
            if (e.key === 'Enter' || e.key === ' ') {
                var $focusedCard = $('.morphing-card:focus');
                if ($focusedCard.length) {
                    e.preventDefault();
                    $focusedCard.trigger('click');
                }
            }
        });
    }

    // Touch Support for Mobile - Only if morphing cards exist
    if ('ontouchstart' in window && $('.morphing-card').length > 0) {
        // Touch support for entire morphing cards - improved for mobile
        $('.morphing-card').on('touchstart', function (e) {
            var $card = $(this);
            var startTime = Date.now();

            $card.one('touchend', function (e) {
                var endTime = Date.now();
                var touchDuration = endTime - startTime;

                // Quick tap for morphing
                if (touchDuration < 500) { // Increased threshold for mobile
                    e.preventDefault();
                    e.stopPropagation();
                    $card.trigger('click');
                    return false;
                }
            });
        });
    }

    // Loading Animation - Only if elements exist
    setTimeout(function () {
        if ($('.morphing-card').length > 0) {
            $('.morphing-card').addClass('loaded');
        }
        if ($('.timeline-axis').length > 0) {
            $('.timeline-axis').addClass('animated');
        }
    }, 500);

    // Timeline Scroll Animation - Only if timeline exists
    function initTimelineAnimation() {
        const timelineItems = $('.timeline-item-simple');

        // Check if timeline elements exist
        if (timelineItems.length === 0) {
            return; // Exit if no timeline elements found
        }

        function checkTimelineItems() {
            const triggerBottom = $(window).height() * 0.9;

            timelineItems.each(function() {
                const itemTop = $(this).offset().top;

                if (itemTop < triggerBottom) {
                    $(this).addClass('visible');
                }
            });
        }

        // Show first few items immediately
        timelineItems.slice(0, 3).addClass('visible');

        // Check on load
        checkTimelineItems();

        // Check on scroll
        $(window).on('scroll', checkTimelineItems);
    }

    // Initialize timeline animation
    initTimelineAnimation();

    // Application Form Interactions
    function initApplicationForm() {
        // Participant type selection
        $('input[name="participantType"]').on('change', function() {
            const selectedType = $(this).val();
            $('.conditional-fields').removeClass('show');

            if (selectedType === 'student') {
                $('#studentFields').addClass('show');
            } else if (selectedType === 'entrepreneur' || selectedType === 'employee' || selectedType === 'graduate') {
                $('#professionalFields').addClass('show');
            } else if (selectedType === 'team') {
                $('#teamFields').addClass('show');
            }
        });

        // Previous work experience toggle
        $('input[name="previousWork"]').on('change', function() {
            if ($(this).val() === 'yes') {
                $('#previousWorkDetails').slideDown();
            } else {
                $('#previousWorkDetails').slideUp();
            }
        });

        // Form validation and submission
        $('#applicationForm').on('submit', function(e) {
            e.preventDefault();

            // Basic validation
            let isValid = true;
            const requiredFields = $(this).find('[required]');

            requiredFields.each(function() {
                if (!$(this).val()) {
                    $(this).addClass('is-invalid');
                    isValid = false;
                } else {
                    $(this).removeClass('is-invalid');
                }
            });

            // Check participant type specific fields
            const participantType = $('input[name="participantType"]:checked').val();
            if (participantType === 'student') {
                if (!$('#school').val() || !$('#department').val()) {
                    isValid = false;
                    $('#studentFields input').addClass('is-invalid');
                }
            }

            if (!isValid) {
                // Scroll to first error
                const firstError = $('.is-invalid').first();
                if (firstError.length) {
                    $('html, body').animate({
                        scrollTop: firstError.offset().top - 100
                    }, 500);
                }
                return false;
            }

            // Show loading state
            const submitBtn = $(this).find('.btn-primary');
            const originalText = submitBtn.html();
            submitBtn.prop('disabled', true).html('<i class="bi bi-hourglass-split me-8px"></i>Gönderiliyor...');

            // Simulate form submission (replace with actual API call)
            setTimeout(function() {
                // Success state
                submitBtn.removeClass('btn-primary').addClass('btn-success form-success')
                    .html('<i class="bi bi-check-circle me-8px"></i>Başvuru Gönderildi!');

                // Reset form after 3 seconds
                setTimeout(function() {
                    submitBtn.prop('disabled', false).removeClass('btn-success form-success').addClass('btn-primary')
                        .html(originalText);
                    $('#applicationForm')[0].reset();
                    $('.conditional-fields').removeClass('show');
                    $('#previousWorkDetails').slideUp();
                }, 3000);
            }, 2000);
        });

        // Real-time validation
        $('.form-control').on('blur', function() {
            if ($(this).val()) {
                $(this).removeClass('is-invalid');
            } else if ($(this).prop('required')) {
                $(this).addClass('is-invalid');
            }
        });
    }

    // Initialize application form
    initApplicationForm();

// Removed highlightProgramCard function - using native behavior only
});

// Completely remove all anchor link JavaScript - let browser handle natively

// Force hide chat widget on desktop and hamburger menu
$(document).ready(function() {
    function checkScreenSize() {
        var windowWidth = $(window).width();

        // Chat widget control
        if (windowWidth >= 769) {
            $('.mobile-chat-widget').hide();
        } else {
            $('.mobile-chat-widget').show();
        }

        // Hamburger menu control - force hide on tablets and desktop
        if (windowWidth >= 481) {
            $('.modern-hamburger, .navbar-toggler, button.navbar-toggler').hide();
        } else {
            $('.modern-hamburger, .navbar-toggler, button.navbar-toggler').show();
        }
    }

    // Check on load
    checkScreenSize();

    // Check on resize
    $(window).resize(function() {
        checkScreenSize();
    });
});
