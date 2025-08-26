let gameActive = false;
let randomNumber;
let attempts;

const SCORES_API = '/api/scores';

let turnstileToken = "";
window.onTurnstileVerified = (token) => { turnstileToken = token || ""; };

function gameListener(cmd) {
    const guess = Number(cmd);
    if (isNaN(guess)) {
        output.textContent += `\nInvalid input. Please enter a number.`;
    } else {
        attempts++;
        if (guess === randomNumber) {
            if (attempts === 1) {
            output.textContent += `\nCongratulations! You found the number on the first attempt. Your code is: 877219
            `;
            } else {
                output.textContent += `\nCongratulations! You found the number in ${attempts} attempts.\n
                `;
            }
            gameActive = false;
        } else if (guess < randomNumber) {
            output.textContent += `\n${guess} is too low. Try again.
            `;
        } else if (guess > randomNumber) {
            output.textContent += `\n${guess} is too high. Try again.
            `; // code for useless game
        }
    }
}
document.addEventListener("DOMContentLoaded", function () {
    const output = document.getElementById('output');
    const input = document.getElementById('input');
    const prompt = document.getElementById('prompt');

    const introText = `
                    ⠀⠀⠀⠀⠀⠀   ⠀⠀⠀⠀⠀⠀⠀⠀⢀⣀⣄⣠⣀⡀⣀⣠⣤⣤⣤⣀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
                    ⠀⠀⠀⠀   ⠀⠀⠀⠀⠀⠀⣄⢠⣠⣼⣿⣿⣿⣟⣿⣿⣿⣿⣿⣿⣿⣿⡿⠋⠀⠀⠀⢠⣤⣦⡄⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠰⢦⣄⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
                    ⠀    ⠀⠀⠀⠀⠀⠀⠀⣼⣿⣟⣾⣿⣽⣿⣿⣅⠈⠉⠻⣿⣿⣿⣿⣿⡿⠇⠀⠀⠀⠀⠀⠉⠀⠀⠀⠀⠀⢀⡶⠒⢉⡀⢠⣤⣶⣶⣿⣷⣆⣀⡀⠀⢲⣖⠒⠀⠀⠀⠀⠀⠀⠀
                       ⢀⣤⣾⣶⣦⣤⣤⣶⣿⣿⣿⣿⣿⣿⣽⡿⠻⣷⣀⠀⢻⣿⣿⣿⡿⠟⠀⠀⠀⠀⠀⠀⣤⣶⣶⣤⣀⣀⣬⣷⣦⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣶⣦⣤⣦⣼⣀⠀
                       ⠈⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡿⠛⠓⣿⣿⠟⠁⠘⣿⡟⠁⠀⠘⠛⠁⠀⠀⢠⣾⣿⢿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡿⠏⠙⠁
                       ⠀⠸⠟⠋⠀⠈⠙⣿⣿⣿⣿⣿⣿⣷⣦⡄⣿⣿⣿⣆⠀⠀⠀⠀⠀⠀⠀⠀⣼⣆⢘⣿⣯⣼⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡉⠉⢱⡿⠀⠀⠀⠀⠀
                    ⠀⠀⠀   ⠀⠀⠀⠀⠘⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣟⡿⠦⠀⠀⠀⠀⠀⠀⠀⠙⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡿⡗⠀⠈⠀⠀⠀⠀⠀⠀
                    ⠀⠀⠀   ⠀⠀⠀⠀⠀⢻⣿⣿⣿⣿⣿⣿⣿⣿⠋⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⢿⣿⣉⣿⡿⢿⢷⣾⣾⣿⣞⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⠋⣠⠟⠀⠀⠀⠀⠀⠀⠀⠀
                    ⠀⠀   ⠀⠀⠀⠀⠀⠀⠀⠹⣿⣿⣿⠿⠿⣿⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣀⣾⣿⣿⣷⣦⣶⣦⣼⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣷⠈⠛⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀
                        ⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠉⠻⣿⣤⡖⠛⠶⠤⡀⠀⠀⠀⠀⠀⠀⠀⢰⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡿⠁⠙⣿⣿⠿⢻⣿⣿⡿⠋⢩⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
                    ⠀   ⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⠙⠧⣤⣦⣤⣄⡀⠀⠀⠀⠀⠀⠘⢿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡇⠀⠀⠀⠘⣧⠀⠈⣹⡻⠇⢀⣿⡆⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
                       ⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢠⣿⣿⣿⣿⣿⣤⣀⡀⠀⠀⠀⠀⠀⠀⠈⢽⣿⣿⣿⣿⣿⠋⠀⠀⠀⠀⠀⠀⠀⠀⠹⣷⣴⣿⣷⢲⣦⣤⡀⢀⡀⠀⠀⠀⠀⠀⠀
                        ⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⢿⣿⣿⣿⣿⣿⣿⠟⠀⠀⠀⠀⠀⠀⠀⢸⣿⣿⣿⣿⣷⢀⡄⠀⠀⠀⠀⠀⠀⠀⠀⠈⠉⠂⠛⣆⣤⡜⣟⠋⠙⠂⠀⠀⠀⠀⠀
                       ⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢹⣿⣿⣿⣿⠟⠀⠀⠀⠀⠀⠀⠀⠀⠘⣿⣿⣿⣿⠉⣿⠃⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣤⣾⣿⣿⣿⣿⣆⠀⠰⠄⠀⠉⠀⠀
                       ⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣸⣿⣿⡿⠃⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢹⣿⡿⠃⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢻⣿⠿⠿⣿⣿⣿⠇⠀⠀⢀⠀⠀⠀
                       ⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⣿⡿⠛⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⢻⡇⠀⠀⢀⣼⠗⠀⠀
                       ⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢸⣿⠃⣀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠙⠁⠀⠀⠀
                       ⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠙⠒`;

const helpText = "\nType 'help' to list all available commands."; // Ensure to start with a newline if needed

let charIndex = 0;
let totalText = introText + helpText; // Concatenate intro and help text
                   
function typeIntroText() {
    if (charIndex < totalText.length) {
            output.textContent += totalText.charAt(charIndex);
                charIndex++;
            setTimeout(typeIntroText, 1.0); // Maintain the same typing speed throughout
                } else {
            input.disabled = false; // Enable input after typing is complete
            input.focus();
                }
             }
            input.disabled = true; // Disable input initially
                typeIntroText();

    document.body.addEventListener('click', function(event) {
    // Prevent focusing the input field if the click was on an input, button, or link
        if (!['INPUT', 'BUTTON', 'A'].includes(event.target.tagName)) {
            input.focus();
                }
    });
    
    input.addEventListener('keydown', function(event) {
        if (event.key === 'Enter') {
            event.preventDefault();
            const cmd = this.value.trim();
            this.value = '';
            output.textContent += '\n' + prompt.textContent + cmd;

            if (gameActive) {
                if (cmd.toLowerCase() === 'exit') { // exits game and returns to prompt
                    gameActive = false;
                    output.textContent += `\nGame over.`;
                } else {
                    gameListener(cmd);
                }
                return;
            }
            switch (cmd.toLowerCase()) {
                case 'help':
                    output.textContent += `
                    
[+] Core Commands:

Twitter             Opens brian's twitter
Playlist            Opens brian's playlist
Instagram           Opens brian's instagram
Store               ?
                    
[+] System Commands:
                                   
Contact             Displays contact information
Game                Guess a Number 1-100 for a prize
Location            Displays brian's current location
Music               Displays a random song from brian's music
                    
[+] User Commands:
                 
Whoami              Displays information about your device
Clear               Clear entries              

`; // help commands 
                    break;
                case 'date':
                            ; // users current timezone
                    break;
                case 'instagram':
                    const url3 = 'https://www.instagram.com/myhandsareclammy/'; // instagram
                    window.open(url3, '_blank');
                    break;
                    case 'whoami':
                        // Fetch the IP address from ipify
                        fetch('https://api.ipify.org?format=json')
                            .then(response => response.json())
                            .then(data => {
                                const ipInfo = `\nIP Address: ${data.ip}`;
                                // Fetch browser information
                                const browserInfo = `Browser: ${navigator.appName}, \nVersion: ${navigator.appVersion}, \nPlatform: ${navigator.platform}`;
                                // Fetch screen resolution
                                const screenSize = `Screen Resolution: ${window.screen.width} x ${window.screen.height}`;
                                // Fetch local time and timezone
                                const timezone = `Local Time: ${new Date().toLocaleTimeString()}, Time Zone: ${Intl.DateTimeFormat().resolvedOptions().timeZone}`;
        
                                output.textContent += `\n${ipInfo}\n${browserInfo}\n${screenSize}\n${timezone}`;
                            })
                            .catch(error => {
                                console.error('Error fetching IP:', error);
                                output.textContent += '\nError fetching IP address.';
                            });
                        break;
                case 'purchases':
                    output.textContent += ``
                    break;
                case 'login':
                    output.textContent += `\nAn unexpected error occurred. Please try again. If the problem continues, please restart device.
                    `
                    break;
                case 'contact':
                    output.textContent += `\nEmail: bender.work@gmx.com \nPhone: 657-273-1134
                    `; // contact
                        break;
                case 'playlist':
                    const url = 'https://music.apple.com/us/playlist/playlist-for-my-funeral/pl.u-vxy6kjMCPW56lK'; // playlist
                    window.open(url, '_blank');
                        break;
                case 'net user':
                    output.textContent += `
                    \nUser accounts for \\VRIAN
                    
-------------------------------------------------------------------------------------------------
Administrator                   Vrian                           DefaultAccount 
Guest                           blabbla                         you :]
The Command completed successfully.
                    `;
                        break;
                case 'twitter':
                    const url2 = 'https://twitter.com/vriannn'; // twitter
                    window.open(url2, '_blank');
                    break;
                case 'location':
                    const locations = ['at HOME', ]; // location status
                    const currentHour = new Date().getHours();
                    if (currentHour >= 7 && currentHour < 15) { // 7 AM to 3 PM
                        output.textContent += `\nbrian is at work
                        `;
                    } else {
                        const selectedLocation = locations[Math.floor(Math.random() * locations.length)];
                        output.textContent += `\nbrian is ${selectedLocation}
                        `;
                    }
                    break;
                    case 'store': // hey you aren't suppose to see this
                    output.textContent += `
            `;
            output.innerHTML += asciiArt;
                        break;
                    case 'music':
                        const songs = [
                            'Drake - Too Much', 
                            'Action Bronson - Actin Crazy', 
                            'Kendrick Lamar - Alright',
                            'A$AP Rocky - A$AP Forever',
                            'Travis Scott - ASTROTHUNDER',
                            'BROCKHAMPTON - BANK',
                            'Jaden Smith - Better Things',
                            'Quavo - BIGGEST ALLEY OOP',
                            'Kendrick Lamar - Bitch, Dont Kill My Vibe',
                            'Kanye West - Bound 2',
                            'Steve Lacy - C U Girl',
                            'Travis Scott - BUTTERFLY EFFECT',
                            'A$AP Rocky - CALLDROPS',
                            'Wu-Tang Clan - C.R.E.A.M.',
                            'Travis Scott - CANT SAY',
                            'Drake - Cant Have Everything',
                            'Kanye West - Cant Tell Me Nothing',
                            'XXXTENTACION - Carry On',
                            'Logic - City of Stars',
                            'Nirvana - Come As You Are',
                            'Mac Miller - Congratulations',
                            'Lil Yachty - COUNT ME IN',
                            'Kid Cudi - Day n Nite',
                            'Drake - Do Not Disturb',
                            'Metro Boomin - Dont Come Out the House',
                            'Nirvana - Dumb',
                            'Kendrick Lamar - DUCKWORTH.',
                            'Action Bronson - Easy Rider',
                            'Rex Orange County - Edition',
                            'Travis Scott - the ends',
                            'Kid Cudi & Kanye West - Erase Me',
                            'Playboi Carti - FlatBed Freestyle',
                            'Kanye West - Flashing Lights',
                            'BROCKHAMPTON - FIGHT',
                            'Phora - Feel',
                            'Kanye West - Father Stretch My Hands, Pt. 1',
                            'Quavo - FLIP THE SWITCH',
                            'Tyler, The Creator - F*****G YOUNG / PERFECT',
                            'Kanye West & Chris Martin - Homecoming',
                            'Mac Miller - Hurt Feelings',
                            'Tay-K - I <3 My Choppa',
                            'Kanye West - Jesus Walks',
                            'A$AP Rocky - Kids Turned Out Fine',
                            '21 Savage - a lot',
                            'Tay-K - M.... She Wrote',
                            'Jaden - Lost Boy',
                            'HUNCHO JACK, Travis Scott & Quavo - Motorcycle Patches',
                            'Drake - Passionfruit',
                            'Earl Sweatshirt - Playing Possum',
                            'Tyler, The Creator & A$AP Rocky - Potato Salad',
                            'A$AP Rocky - Praise The Lord',
                            'Wu-Tang Clan - Protect Ya Neck'
                        ];
                        const selectedSong = songs[Math.floor(Math.random() * songs.length)];
                        output.textContent += `\nyou should listen to ${selectedSong}
                        `; // picking a random song
                        break;
                        case 'game':
                            gameActive = true;
                            attempts = 0;
                            randomNumber = Math.floor(Math.random() * 100) + 1;
                            output.textContent += `\nGuess a number between 1 and 100; Type exit to quit game \nCurrent Prize: $100
                            `; // useless game command
                            break;

                    default:
                        output.textContent += `\n'${cmd}' is not recognized as an internal or external command,\nType 'help' for a list of commands.
                        `; // error for wrong command
            break;
            
                }
            }
        });
    typeIntroText();
});
