console.log(`%c
Hello element inspector,
Isn't code the coolest??
Let me know if you want to work together on a project.
- MG (miles.gilbert@gmail.com)
`, `
color: #00ff00;
background: #1a1a1a;
font-size: 14px;
`);

const menuButton = document.getElementById('menuButton');
if (menuButton) {
    menuButton.addEventListener('click', () => {
        const navLinks = document.querySelectorAll('.nav-link-hidden');
        navLinks.forEach(element => {
            element.classList.toggle('hide');
        });
    })
}