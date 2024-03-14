document.addEventListener("DOMContentLoaded", function () {
    const output = document.getElementById('output');
    const input = document.getElementById('input');
    const prompt = document.getElementById('prompt');
    const introText = `Welcome to Brian's World! Type 'help' to list all available commands.`;
    let charIndex = 0;

    function typeIntroText() {
        if (charIndex < introText.length) {
            output.textContent += introText.charAt(charIndex);
            charIndex++;
            setTimeout(typeIntroText, 5); // Adjust the typing speed (5 ms per character for visibility)
        }
    }

    input.addEventListener('keydown', function(event) {
        if (event.key === 'Enter') {
            event.preventDefault();
            const cmd = input.value.trim();
            input.value = '';
            output.textContent += '\n' + prompt.textContent + cmd;
            switch (cmd.toLowerCase()) {
                case 'help':
                    output.textContent += '\nCommands: DATE, CONTACT, LOCATION, STORE';
                    break;
                case 'date':
                    const currentDate = new Date();
                    output.textContent += `\nLocal Date and Time: ${currentDate.toLocaleString()}`;
                    break;
                case 'location':
                    const locations = ['Supercharged', 'Tacos and Tequila', 'Philadelphia', 'Around'];
                    const currentHour = new Date().getHours();
                    if (currentHour >= 7 && currentHour < 15) {
                        output.textContent += '\nBrian is at work';
                    } else {
                        const selectedLocation = locations[Math.floor(Math.random() * locations.length)];
                        output.textContent += `\nLocation: ${selectedLocation}`;
                    }
                    break;
                default:
                    output.textContent += '\nUnknown command.';
            }
        }
    });

    typeIntroText();
});
