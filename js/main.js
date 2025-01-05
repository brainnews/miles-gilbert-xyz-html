console.log(`%c
dear fellow element inspector,
U R cool ;)
wanna chat about a project?
let me know.
- mg
`, `
color: #00ff00;
background: #1a1a1a;
font-family: monospace;
font-size: 10px;
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