//------------------------------- Start dark theme 
const mode = document.getElementById('colorMode');
const body = document.querySelector('body');

let getMode = localStorage.getItem('mode');
    if (getMode == 'light') {
        document.body.classList.toggle('dark-theme');
        mode.classList.toggle('active');
    }
mode.onclick = () => {
    mode.classList.toggle('active');
    document.body.classList.toggle('dark-theme');



    if(body.classList.contains('dark-theme')) {
        return localStorage.setItem('mode', 'light');
    }
        localStorage.setItem('mode', 'dark');
};




   //------------------------------ End dark theme

// Function to switch sections in the dashboard
function switchSection(sectionName) {
    const sections = {
        users: document.getElementById('users-section'),
        courses: document.getElementById('courses-section'),
        products: document.getElementById('products-section'),
        comments: document.getElementById('comments-section'),
        settings: document.getElementById('settings-section')
    };

    // Hide all sections
    Object.values(sections).forEach(section => {
        if (section) {
            section.style.display = 'none';
        }
    });

    // Activate the selected section
    const selectedSection = sections[sectionName];
    if (selectedSection) {
        selectedSection.style.display = 'block';
        console.log(`Switched to section: ${sectionName}`);
    } else {
        console.error(`Unknown section: ${sectionName}`);
    }
}

// Debugging log to verify the products-section exists
console.log('Verifying products-section:', document.getElementById('products-section'));

// Debugging log to check clicked section ID
console.log('Clicked section ID:', clickedSectionId);

// Example usage: switchSection('products');


