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
Type 'help' to list all available commands.`;
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
    
    input.addEventListener('keydown', function(event) {
        if (event.key === 'Enter') {
            event.preventDefault();
            const cmd = input.value.trim();
            input.value = '';
            output.textContent += '\n' + prompt.textContent + cmd;
            switch (cmd.toLowerCase()) {
                case 'help':
                    output.textContent += `\nDATE         Displays time and date\nCONTACT      Displays contact information\nLOCATION     Displays brians current location\nSTORE        null\nMUSIC        Displays a random song from brians playlist\nPLAYLIST     Opens brians playlist`;
                    break;
                case 'date':
                    const currentDate = new Date();
                    output.textContent += `\nLocal Date and Time: ${currentDate.toLocaleString()}`;
                    break;
                case 'location':
                    const locations = ['supercharged', 'tacos and Tequila', 'philadelphia', ];
                    const currentHour = new Date().getHours();
                    if (currentHour >= 7 && currentHour < 15) {
                        output.textContent += '\nbrian is at work';
                    } else {
                        const selectedLocation = locations[Math.floor(Math.random() * locations.length)];
                        output.textContent += `\nbrian is at ${selectedLocation}`;
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
                            'Jaden - Better Things',
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
                        output.textContent += `\nyou should listen to ${selectedSong}`;
                        break;
                    case 'playlist':
                        const url = 'https://music.apple.com/us/playlist/playlist-for-my-funeral/pl.u-vxy6kjMCPW56lK'; // playlist
                        window.open(url, '_blank');
                    break;
                    default:
                        output.textContent += `\n'${cmd}' is not recognized as an internal or external command,\noperable program or batch file.`;
            break;
            
                }
            }
        });
        });
    typeIntroText();
});
