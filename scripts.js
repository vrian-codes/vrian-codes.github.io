let gameActive = false;
let randomNumber;
let attempts;

function gameListener(cmd) {
    const guess = Number(cmd);
    if (isNaN(guess)) {
        output.textContent += `\nInvalid input. Please enter a number.
        `;
    } else {
        attempts++;
        if (guess === randomNumber) {
            output.textContent += `\nCongratulations! You found the number in ${attempts} attempts.
            `;
            gameActive = false;
        } else if (guess < randomNumber) {
            output.textContent += `\n${guess} is too low. Try again.
            `;
        } else if (guess > randomNumber) {
            output.textContent += `\n${guess} is too high. Try again.
            `;
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
                       ⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠙⠒⠀⠀⠀⠀⠀⠀⠀⠀
Type 'help' to list all available commands.
`;
    
let charIndex = 0;

    function typeIntroText() {
        if (charIndex < introText.length) {
            output.textContent += introText.charAt(charIndex);
            charIndex++;
            setTimeout(typeIntroText, 0.3); // Adjust the typing speed (0.3 ms per character for visibility)
        }
    }
        window.addEventListener('click', function() {
        document.getElementById('input').focus();
    });
    
    document.getElementById('input').addEventListener('keydown', function(event) {
        if (event.key === 'Enter') {
            event.preventDefault();
            const cmd = this.value.trim();
            this.value = '';
            output.textContent += '\n' + prompt.textContent + cmd;
            if (gameActive) {
                if (cmd.toLowerCase() === 'exit') {
                    gameActive = false;
                    output.textContent += `\nExited the game.`;
                } else {
                    gameListener(cmd);
                }
                return;
            }
            switch (cmd.toLowerCase()) {
                case 'help':
                    output.textContent += `\nFor more information on a specific command, type HELP \nDATE         Displays time and date\nCONTACT      Displays contact information\nLOCATION     Displays brian's current location\nSTORE        null\nMUSIC        Displays a random song from brian's music\nPLAYLIST     Opens brian's playlist\nGAME         Guess a Number 1-100 for a prize\nTWITTER       Opens brian's twitter\nINSTAGRAM       Opens brian's instagram
                    `;
                    break;
                case 'date':
                    const currentDate = new Date();
                    output.textContent += `\nLocal Date and Time: ${currentDate.toLocaleString()}
                    `;
                    break;
                case 'instagram':
                    const url3 = 'https://www.instagram.com/myhandsareclammy/'; // twitter
                    window.open(url3, '_blank');
                    break;
                        break;
                case 'contact':
                    output.textContent += `\nEmail: brianrodriguez368@gmail.com \nPhone: 657-273-1134
                    `;
                        break;
                case 'playlist':
                    const url = 'https://music.apple.com/us/playlist/playlist-for-my-funeral/pl.u-vxy6kjMCPW56lK'; // playlist
                    window.open(url, '_blank');
                        break;
                case 'twitter':
                    const url2 = 'https://twitter.com/vriannn'; // twitter
                    window.open(url2, '_blank');
                    break;
                case 'location':
                    const locations = ['at supercharged', 'getting tacos and tequila', 'in Philadelphia', ];
                    const currentHour = new Date().getHours();
                    if (currentHour >= 7 && currentHour < 15) {
                        output.textContent += `\nbrian is at work
                        `;
                    } else {
                        const selectedLocation = locations[Math.floor(Math.random() * locations.length)];
                        output.textContent += `\nbrian is ${selectedLocation}
                        `;
                    }
                    break;
                    case 'store':
                        output.textContent +=`
┌───────────────────────────────┐          ┌───────────────────────────────┐          ┌───────────────────────────────┐  
│                               │          │                               │          │                               │ 
│                               │          │                               │          │                               │
│                               │          │                               │          │                               │ 
│                               │          │                               │          │                               │
│                               │          │                               │          │                               │
│                               │          │                               │          │                               │
│                               │──────────│                               │──────────│                               │
│                               │          │                               │          │                               │
│                               │          │                               │          │                               │
│                               │          │                               │          │                               │
│                               │          │                               │          │                               │
│                               │          │                               │          │                               │
│                               │          │                               │          │                               │                          
└───────────────────────────────┘          └───────────────────────────────┘          └───────────────────────────────┘               
            ?error                                      ?error                                      ?error
            `;
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
                        `;
                        break;
                        case 'game':
                            gameActive = true;
                            attempts = 0;
                            randomNumber = Math.floor(Math.random() * 100) + 1;
                            output.textContent += `\nGuess a number between 1 and 100; Type exit to quit game
                            `;
                            break;

                    default:
                        output.textContent += `\n'${cmd}' is not recognized as an internal or external command,\noperable program or batch file.
                        `;
                        
            break;
            
                }
            }
        });
    typeIntroText();
});
