// Mobile menu toggle
function toggleMenu() {
    var menu = document.getElementById('nav-menu');
    menu.classList.toggle('open');
}

// Close menu when a link is clicked (on mobile)
document.addEventListener('DOMContentLoaded', function () {
    var links = document.querySelectorAll('#nav-menu a');
    links.forEach(function (link) {
        link.addEventListener('click', function () {
            var menu = document.getElementById('nav-menu');
            menu.classList.remove('open');
        });
    });
});

// Contact form validation
function handleEnquiry(event) {
    event.preventDefault();

    var name = document.getElementById('name');
    var email = document.getElementById('email');
    var subject = document.getElementById('subject');
    var message = document.getElementById('message');
    var valid = true;

    // Reset errors
    clearError(name);
    clearError(email);
    clearError(subject);
    clearError(message);

    // Validate name
    if (name.value.trim() === '') {
        showError(name);
        valid = false;
    }

    // Validate email
    var emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email.value.trim())) {
        showError(email);
        valid = false;
    }

    // Validate subject
    if (subject.value === '') {
        showError(subject);
        valid = false;
    }

    // Validate message
    if (message.value.trim() === '') {
        showError(message);
        valid = false;
    }

    if (valid) {
        // Show success message
        document.getElementById('form-success').classList.add('show');
        document.getElementById('enquiry-form').reset();

        // Hide success message after 5 seconds
        setTimeout(function () {
            document.getElementById('form-success').classList.remove('show');
        }, 5000);
    }

    return false;
}

function showError(field) {
    var group = field.closest('.form-group');
    if (group) {
        group.classList.add('error');
    }
}

function clearError(field) {
    var group = field.closest('.form-group');
    if (group) {
        group.classList.remove('error');
    }
}
