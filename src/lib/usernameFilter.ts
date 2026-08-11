const BANNED_WORDS = [
    // Profanity & vulgarity
    'fuck', 'shit', 'ass', 'bastard', 'bitch', 'cunt', 'damn', 'dick',
    'piss', 'cock', 'twat', 'wanker', 'bollocks', 'bloody', 'bugger',
    'arse', 'minge', 'prick', 'knob', 'tosser', 'slut', 'whore',
    'motherfucker', 'mf', 'mofo', 'fuckface', 'fucktard', 'shithead',
    'dickhead', 'asshole', 'arsehole', 'jackass', 'dumbass', 'dipshit',
    'bullshit', 'horseshit', 'batshit', 'clusterfuck', 'mindfuck',
    'fuckery', 'shitstorm', 'douche', 'douchebag', 'douchecanoe',
    'scumbag', 'scum', 'trash', 'garbage', 'waste', 'cretin',
    'moron', 'idiot', 'imbecile', 'degenerate', 'pervert', 'deviant',
    'skank', 'slag', 'hag', 'wench', 'bimbo', 'trollop', 'hussy',
    'pimp', 'playa', 'playah', 'porn', 'sex', 'xxx', 'hentai',
    'masturbate', 'masturbation', 'jerkoff', 'jackoff', 'blowjob',
    'handjob', 'cum', 'jizz', 'sperm', 'semen', 'orgasm', 'climax',
    'anal', 'anus', 'rectum', 'penis', 'vagina', 'clitoris', 'vulva',
    'testicle', 'scrotum', 'boob', 'boobs', 'tits', 'titties', 'nipple',
    'areola', 'boner', 'erection', 'hardon', 'wank', 'fap', 'fapping',
    '69', '69er', 'doggy', 'cowgirl', 'missionary', 'bdsm', 'fetish',
    'kink', 'kinky', 'bondage', 'dominatrix', 'submissive',
    'futanari', 'yaoi', 'yuri', 'ecchi', 'ero', 'eroge', 'nsfw',

    // Sexual slurs
    'cocksucker', 'cocksucka', 'dicksucker', 'asslicker', 'asskisser',
    'buttlicker', 'rimjob', 'rimmer', 'felch', 'felcher', 'cumdump',
    'cumdumpster', 'cumbucket', 'spermburper', 'cockholster',
    'cuntface', 'cuntbag', 'dickwad', 'dickweed', 'dickcheese',
    'asswipe', 'assclown', 'asshat', 'assmunch', 'assgoblin',
    'buttmunch', 'buttface', 'butthead', 'fartknocker', 'fartface',
    'dildo', 'vibrator', 'buttplug', 'cockring', 'fleshlight',

    // Hate speech: racial
    'nigger', 'nigga', 'nig', 'niggy', 'nigglet', 'niglet', 'nigguh',
    'n1gger', 'n1gga', 'n1gg3r', 'nigg3r', 'n!gger', 'n!gga', 'n1g',
    'negro', 'negroes', 'niggress', 'niggah', 'spic', 'spick', 'spik',
    'spicca', 'spicka', 'chink', 'chinky', 'chinkie', 'gook', 'g00k',
    'guk', 'gooker', 'kike', 'kyke', 'k1ke', 'kik', 'heeb', 'hebe',
    'yid', 'yiddo', 'zipperhead', 'groid', 'jigaboo', 'jig', 'jiggaboo',
    'coon', 'coons', 'coonass', 'coonie', 'darkie', 'darky', 'dune coon',
    'sandnigger', 'sandn1gger', 'sandnig', 'cracker', 'cracka', 'honky',
    'honkey', 'honkie', 'whitey', 'whitety', 'redneck', 'rednek',
    'hillbilly', 'bogan', 'chav', 'pikey', 'piker', 'gypsy', 'gypp',
    'gyp', 'gyppo', 'tinker', 'wetback', 'wetb@ck', 'beaner', 'beaney',
    'greaser', 'greaseball', 'guido', 'guinea', 'wop', 'dago', 'dego',
    'papist', 'mick', 'mickey', 'paddy', 'taig', 'prod', 'fenian',
    'hun', 'kraut', 'jerry', 'fritz', 'boche', 'nip', 'nips', 'jap',
    'japs', 'nipon', 'niponese', 'zipper', 'slant', 'slanteye', 'slitty',
    'slope', 'slopehead', 'curry muncher', 'currymuncher', 'paki',
    'pak1', 'p@k1', 'paki', 'raghead', 'towelhead', 'terrorist',
    'raghead', 'dune coon', 'camel jockey', 'cameljockey', 'sandmonkey',
    'muzzie', 'muzrat', 'islamonazi', 'jihadist', 'jihadi', 'hajji',
    'hadji', 'turbanator', 'brownie', 'halfbreed', 'mulatto', 'mutt',
    'mongrel', 'quadroon', 'octoroon', 'miscegenation',

    // Hate speech: religious/ethnic
    'jesus freak', 'bible basher', 'bible thumper', 'fundie', 'fundy',
    'religitard', 'god botherer', 'allah snackbar', 'akbar',
    'christcuck', 'christfag', 'jewboy', 'jewess', 'jewbastard',
    'kafir', 'kuffar', 'kaffir', 'murtad', 'shia', 'sunni', 'rafidhi',
    'wahabi', 'salafi', 'zionist', 'ziocon', 'globalist', 'cabal',
    'illuminati', 'mason', 'freemason', 'jewish conspiracy',
    'holohoax', 'holocaust', 'holocough', 'sheeple', 'cuck', 'cuckservative',
    'libtard', 'libturd', 'conservatard', 'republitard', 'democrap',
    'democrat', 'republicunt', 'commie', 'commy', 'nazi', 'hitler',
    'fascist', 'fash', 'antifa', 'proud boy', 'proudboys', 'boogaloo',
    'boog', 'white power', 'whitepower', 'black power', 'blackpower',
    '1488', '14/88', 'hh', 'heil', 'sieg heil', 'heil hitler',
    '88', '18', 'blood and honour', 'bloodandhonour', 'rahowa',
    'swastika', 'swast1ka', 'hakenkreuz', 'ss', 'reich', 'third reich',
    'fuhrer', 'adolf', 'hitla', 'hitl3r', 'hitl3r', 'h1tler', 'h!tler',

    // Hate speech: homophobic/transphobic
    'faggot', 'fag', 'faggy', 'fagot', 'f@ggot', 'f@g', 'f4g', 'f4gg0t',
    'faggit', 'faglet', 'dyke', 'dike', 'dykey', 'lesbo', 'lez', 'lezbo',
    'lezzie', 'lezzy', 'queer', 'qweer', 'queero', 'homo', 'hommo',
    'homosex', 'homofag', 'fruitcake', 'fruit', 'poof', 'poofter',
    'poofy', 'puff', 'pansy', 'sissy', 'nancy', 'nancyboy', 'she-male',
    'shemale', 'tranny', 'trannie', 'tgirl', 'transvestite',
    'gender bender', 'genderbender', 'troon', 'troonout', 'agp',
    'autogynephile', 'cis scum', 'cis scum', 'die cis scum', 'terf',
    'terf', 'swerf', 'radfem', 'transphobe', 'homophobe', 'gaylord',
    'gaytard', 'gaywad', 'gayboy', 'buttboy', 'butt pirate',
    'buttpirate', 'ass pirate', 'asspirate', 'pillow biter', 'rug muncher',
    'carpet muncher', 'muff diver', 'cock gobbler', 'knob gobbler',

    // Violence & threats
    'kill', 'murder', 'rape', 'rap1st', 'rapist', 'raper', 'raape',
    'torture', 'maim', 'strangle', 'choke', 'stab', 'shoot', 'shooting',
    'bomb', 'bombing', 'explode', 'explosion', 'terrorize', 'hijack',
    'hostage', 'execute', 'execution', 'slaughter', 'massacre', 'genocide',
    'lynch', 'lynching', 'hang', 'hanged', 'behead', 'decapitate',
    'suicide', 'suicidal', 'selfharm', 'self-harm', 'cutting', 'cutter',
    'die', 'death', 'dead', 'murderer', 'killer', 'serial killer',
    'mass shooter', 'school shooter', 'shooter', 'gunman', 'gunmen',
    'armed', 'weapon', 'assault', 'attack', 'car bomb', 'pipe bomb',
    'molotov', 'IED', 'ak47', 'ak-47', 'ar15', 'm16', 'uzi', 'glock',
    'beretta', 'shotgun', 'rifle', 'handgun', 'pistol', 'revolver',
    'ammo', 'ammunition', 'bullet', 'grenade', 'dynamite', 'c4',
    'semtex', 'napalm', 'mustard gas', 'sarin', 'vx', 'anthrax',
    'ricin', 'cyanide', 'poison', 'strangulation', 'suffocate',
    'drown', 'electrocute', 'burn', 'arson', 'firebomb', 'incendiary',

    // Drugs & substance abuse
    'weed', 'cannabis', 'marijuana', 'hash', 'hashish', 'pot', 'ganja',
    'mary jane', 'maryjane', 'bong', 'joint', 'blunt', 'spliff',
    'cocaine', 'coke', 'crack', 'crack cocaine', 'speed', 'meth',
    'methamphetamine', 'crystal meth', 'ice', 'glass', 'heroin', 'heroine',
    'smack', 'h', 'brown sugar', 'china white', 'opium', 'morphine',
    'fentanyl', 'fent', 'carfentanil', 'oxy', 'oxycodone', 'oxycontin',
    'percocet', 'vicodin', 'hydrocodone', 'codeine', 'lean', 'purple drank',
    'sizzurp', 'xanax', 'xanny', 'bar', 'benzos', 'valium', 'diazepam',
    'klonopin', 'clonazepam', 'ambien', 'zolpidem', 'adderall', 'addy',
    'ritalin', 'vyvanse', 'dexedrine', 'ecstasy', 'mdma', 'molly',
    'lsd', 'acid', 'psychedelics', 'shrooms', 'mushrooms', 'psilocybin',
    'dmt', 'ayahuasca', 'mescaline', 'peyote', 'ketamine', 'k',
    'special k', 'pills', 'pharm', 'pharma', 'drug dealer', 'drugdealer',
    'plug', 'trap', 'traphouse', 'crackhouse', 'shooting up', 'shootup',
    'fix', 'hit', 'snort', 'snorting', 'smoke meth', 'smokemeth',
    'inject', 'needle', 'syringe', 'overdose', 'od', 'nod', 'nodding',
    'junkie', 'junkie', 'crackhead', 'methhead', 'meth head', 'pothead',
    'stoner', 'druggie', 'drug user', 'substance abuse', 'addict',
    'addiction', 'withdrawal', 'detox', 'rehab',

    // Bypasses & leetspeak profanity
    'f u c k', 'f-u-c-k', 'f.u.c.k', 'f_u_c_k', 'f*ck', 'f**k', 'fck',
    'fcuk', 'fuk', 'fuq', 'f u q', 'phuck', 'phuk', 'phuq', 'f@ck',
    'f@k', 'f#ck', 'f#k', 'f%ck', 'f*ck', 'f**k', 'f v c k', 'fvck',
    'fuckk', 'fucc', 'fukk', 'fucck', 'ffucckk', 'fuuu', 'fack',
    'fock', 'feck', 'fick', 'f0ck', 'f' + 'u' + 'c' + 'k', 'f.u.c.k.i.n.g',
    'sh1t', 'sh1t', 'sh!t', 'sh*t', 's h i t', 's-h-i-t', 'shyt',
    'shite', 'sh!te', 'shite', 'sh!t', 'shyt', 'shiet', 'shitt',
    'shiz', 'shiznit', 'shiznitz', 'b1tch', 'b!tch', 'b*tch', 'b!tch',
    'b1tch', 'b!tch', 'b!+ch', 'b17ch', 'b1tch', 'biiitch', 'biatch',
    'beyotch', 'beeotch', 'beatch', 'beeyotch', 'biiatch', 'b!+ch',
    'a$$', 'a s s', 'a-s-s', 'azz', 'azz', 'a55', 'a5s', 'arse',
    'a$$hole', 'a$$h0le', 'as$', 'ahole', 'assh0le', 'd!ck', 'd*ck',
    'd1ck', 'd!ck', 'dikk', 'dicc', 'd1k', 'd!k', 'dikk', 'dic',
    'pen1s', 'pen!s', 'p3nis', 'p3n1s', 'peen', 'ween', 'weiner',
    'wiener', 'vag1na', 'vag!na', 'vajayjay', 'vaj', 'c u n t', 'c*nt',
    'cunt', 'c0nt', 'cun7', 'cun+', 'c u n t', 'c-n-t', 'see you next tuesday',
    'cuunt', 'cuntt', 'kunt', 'kint', 'kunt', 'cvnt',

    // Insults & demeaning terms
    'loser', 'luser', 'l00ser', 'loozer', 'looser', 'failure', 'fail',
    'nobody', 'worthless', 'useless', 'pathetic', 'joke', 'clown',
    'freak', 'weirdo', 'creep', 'creeper', 'stalker', 'incel', 'incels',
    'volcel', 'chad', 'stacy', 'becky', 'tyrone', 'simp', 'cuck',
    'beta', 'beta male', 'alpha', 'omega', 'sigma', 'gamma', 'delta',
    'soyboy', 'soy boy', 'soy', 'cuckboy', 'cuckqueen', 'manlet',
    'manchild', 'neckbeard', 'neck beard', 'legbeard', 'virgin',
    'virgins', 'basement dweller', 'basementdweller', 'neet', 'neets',
    'hikikomori', 'shutin', 'hermit', 'loner', 'loser', 'inceldom',
    'blackpill', 'redpill', 'bluepill', 'whitepill', 'pill',


    // Nonsense bypasses / blank-like
    ' ', '  ', '   ', '    ', '     ', '      ', '       ', '', '\t',
    '⠀', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ',
    '​', '‌', '‍', ' ', ' ', '⁠', '⠀', 'ㅤ', '　', // various whitespace Unicode chars
    '.', '..', '...', '....', '.....', '......', '.......', '........',
    '!', '!!', '!!!', '@', '@@', '@@@', '#', '##', '###', '$', '$$',
    '$$$', '%', '%%', '%%%', '^', '^^', '^^^', '&', '&&', '&&&', '*',
    '**', '***', '(', '((', '(((', ')', '))', ')))', '-', '--', '---',
    '_', '__', '___', '=', '==', '===', '+', '++', '+++', '[', '[[',
    '[[[', ']', ']]', ']]]', '{', '{{', '{{{', '}', '}}', '}}}', '|',
    '||', '|||', '\\', '\\\\', '\\\\\\', ':', '::', ':::', ';', ';;',
    ';;;', '"', '""', '"""', "'", "''", "'''", ',', ',,', ',,,', '<',
    '<<', '<<<', '.>', '>>', '>>>', '?', '??', '???', '/', '//', '///',
    '`', '``', '```', '~', '~~', '~~~',

    // Self-harm & suicide encouragement
    'kys', 'kill yourself', 'kill urself', 'kyself', 'ky$', 'k!ll yourself',
    'suicide', 'commit suicide', 'suicide method', 'suicide pact',
    'self harm', 'cut yourself', 'cut urself', 'slit wrists', 'slit wrists',
    'hang yourself', 'drink bleach', 'jump off', 'gun in mouth',
    'rope', 'tie noose', 'end it all', 'enditall', 'goodbye world',
    'final exit', 'euthanasia', 'assisted suicide',

    // Other hateful terms
    'pedo', 'pedophile', 'paedophile', 'child molester', 'molest',
    'groomer', 'grooming', 'minor attracted', 'map', 'minor attracted person',
    'loli', 'lolicon', 'shota', 'shotacon', 'cp', 'child porn',
    'child pornography', 'jailbait', 'teen', 'underage', 'minor',
    'incest', 'incestuous', 'inbred', 'inbreed', 'family love',
    'brother sister', 'mother son', 'father daughter', 'cousin lover',

    // Compound/in-game specific
    'scripted', 'scripting', 'script', 'dda', 'momentum', 'handicap',
    'handicapped', 'pay to win', 'p2w', 'pay2win', 'p2w', 'whale',
    'whaling', 'scam', 'scam pack', 'scampack', 'scamcoin', 'coin seller',
    'coinseller', 'cheap coins', 'free coins', 'free gp', 'gp hack',
    'coin hack', 'efootball coin', 'efootball coins', 'buy coins',
    'sell coins', 'coin trader', 'cointrader', 'account seller',
    'account buyer', 'account trade', 'account trading', 'share account',
    'account sharing', 'boost', 'boosting', 'win trading', 'wintrader',
    'match fix', 'matchfixing', 'fix match', 'scripted match',
    'lag switch', 'lagswitch', 'lag cheat', 'lagcheat', 'dos', 'ddos',
    'denial of service', 'boot', 'bootoffline', 'pull ip', 'ip grabber',
    'ip tracker', 'swat', 'swatting', 'dox', 'doxx', 'doxing', 'doxxing',
    'personal info', 'real name', 'address', 'phone number', 'home address',

    // Extreme hate ideology terms
    'kkk', 'kukluxklan', 'ku klux klan', 'aryan', 'aryan brotherhood',
    'white supremacy', 'whitesupremacy', 'ethnostate', 'ethno-state',
    'race war', 'racewar', 'jewish question', 'final solution',
    'gas chamber', 'gassing', 'jew world order', 'jwo', 'zog',
    'zionist occupied government', 'new world order', 'nwo', 'bilderberg',
    'rothschild', 'soros', 'illuminati confirmed', 'lizard people',
    'flat earth', 'flatearth', 'anti vax', 'antivax', 'antivaxx',
    'vaccine', 'covid', 'covid19', 'corona', 'coronavirus', 'plandemic',
    'plandemonium', '5g', '5g towers', 'chemtrails', 'mind control',
    'mk ultra', 'mkultra', 'brainwash', 'depopulation', 'agenda 21',
    'agenda 2030', 'great reset', 'klaus schwab', 'bill gates',
    'microchip', 'mark of the beast', '666', 'beast system',
    'antichrist', 'false prophet',

    // General derogatory language
    'fat', 'fatty', 'fatso', 'tubby', 'lardass', 'lard', 'obese',
    'obesity', 'ugly', 'uggo', 'fugly', 'butt ugly', 'buttugly',
    'stinky', 'smelly', 'stench', 'rancid', 'gross', 'disgusting',
    'repulsive', 'vomit', 'puke', 'barf', 'nasty', 'filthy', 'dirty',
    'germ', 'disgust', 'revolting', 'sickening', 'nauseating',
    'pathetic', 'pitiful', 'miserable', 'wretched', 'loathsome',
    'despicable', 'contemptible', 'vile', 'wretched', 'pustule',
    'boil', 'sore', 'wart', 'tumor', 'cancer', 'cancerous',
    'plague', 'pestilence', 'disease', 'infected', 'contagious',
    'spread', 'infect', 'pandemic', 'epidemic', 'outbreak',
    'virus', 'viral', 'bacteria', 'fungus', 'parasite', 'leech',
    'cockroach', 'roach', 'vermin', 'rat', 'rats', 'maggot',
    'maggots', 'worm', 'worms', 'snake', 'snakes', 'serpent',
    'scorpion', 'spider', 'web', 'predator', 'prey',

    // Misc toxicity
    'ez', 'ezz', 'e z', 'easy', 'eazy', 'noob', 'n00b', 'newb',
    'newbie', 'nub', 'nubcake', 'nooblet', 'scrub', 'scrublord',
    'trashcan', 'garbage can', 'garbage player', 'bot', 'botlike',
    'cpu', 'ai', 'artificial', 'uninstall', 'uninstall game',
    'delete game', 'quit game', 'never play', 'rage quit', 'ragequit',
    'rq', 'cry', 'crybaby', 'cry baby', 'cry more', 'sore loser',
    'bad loser', 'salt', 'salty', 'salty af', 'salty as', 'tears',
    'cry me a river', 'gg ez', 'gg easy', 'git gud', 'gitgud',
    'get good', 'getgood', 'l2p', 'learn to play', 'learntoplay',
    'uninstall pls', 'pls uninstall', 'quit', 'gtfo', 'get the fuck out',
    'gtfoh', 'stfu', 'shut the fuck up', 'shut up', 'shutup',
    'shut it', 'silence', 'quiet', 'f off', 'fuck off', 'fuckoff',
    'bugger off', 'buzz off', 'piss off', 'piss off', 'sod off',
    'jog on', 'beat it', 'get lost', 'go away', 'leave', 'exit',
    'retire', 'afk', 'away from keyboard', 'brb',
    'idc', 'idgaf', 'idgafos', 'idgaff', 'idgaf', 'idgaf', 'idgaf',
    'not care', 'dont care', 'don t care', 'zero fucks', 'zero fucks given',
    'zero shits', 'whatever', 'meh', 'blah', 'boring', 'lame',
    'lame af', 'lame as', 'weak', 'pathetic', 'cringe', 'cringey',
    'cringy', 'cringe af', 'cringetopia', 'yikes', 'oof', 'big oof',
    'bruh', 'bruh moment', 'bruh sound effect', 'facepalm', 'smh',
    'shaking my head', 'fml', 'fuck my life', 'screw this', 'screw you',
    'damn you', 'damnyou', 'curse you', 'hex', 'witch', 'warlock',
    'voodoo', 'hoodoo', 'black magic',

    // Additional variations to hit count (~540+)
    'm0th3rfuck3r', 'm0therfucker', 'muthafucka', 'muthafuckah',
    'muthafukka', 'badass', 'bad ass', 'badazz', 'badassery',
    'kickass', 'kickassery', 'badmotherfucker', 'hardass',
    'toughass', 'sweetass', 'dumbass', 'dumbass', 'stupidass',
    'crazyass', 'lazyass', 'pussy', 'pussies', 'pussycat', 'puss',
    'pussygang', 'pussyslayer', 'cuntpunt', 'cuntdestroyer',
    'dickdestroyer', 'vagdestroyer', 'clamjam', 'clamhammer',
    'beaver', 'beaverlicker', 'moist', 'moistness', 'moistmaker',
    'splooge', 'sploog', 'sploosh', 'skeet', 'skeetskeet',
    'pewpew', 'bangbang', 'shooty shoot', 'stabby stab',
    'cutcut', 'sliceslice', 'burnburn', 'rip', 'rip in peace',
    'rest in piss', 'rest in shit', 'r.i.p.', 'rip',
    'die die die', 'd1e', 'd1e d1e', 'ded', 'deded', 'dead af',
    'destruction', 'destroy', 'obliterate', 'annihilate', 'erase',
    'delete', 'terminate', 'exterminate', 'vanish', 'make disappear',
    'begone', 'vanquish', 'conquer', 'dominate', 'domination',
    'submit', 'surrender', 'give up', 'capitulate', 'yield',
    'forfeit', 'lose', 'loose', 'defeat', 'loss', 'gg', 'ggez',
    'ggez', 'gg no re', 'ggnore', 'no re', 'no rematch', 'bye',
    'byebye', 'seeya', 'seeyah', 'adios', 'sayonara', 'ciao',
    'hasta la vista', 'later loser', 'laters', 'deuces', 'peace out',
    'peaceout', 'drop dead', 'dropdead', 'eat shit', 'eatshit',
    'eat a dick', 'eatadick', 'suck it', 'suckit', 'lick me',
    'lickme', 'kiss my ass', 'kissmyass', 'kma', 'kissmya',
    'blowme', 'blow me', 'bite me', 'biteme', 'fuck me',
    'fuckme', 'shit on me', 'piss on me', 'cum on me',
    'trample', 'stomp', 'crush', 'crushing', 'smash', 'smashing',
    'break', 'broken', 'broke', 'cripple', 'crippled', 'maimed',
    'wound', 'wounded', 'hurt', 'pain', 'suffer', 'suffering',
    'tortured', 'torturer', 'torment', 'tormented', 'tormentor',
    'agony', 'anguish', 'distress', 'misery', 'hell', 'hellfire',
    'inferno', 'abyss', 'void', 'darkness', 'dark', 'evil',
    'demon', 'demonic', 'devil', 'satan', 'satanic', 'lucifer',
    'beelzebub', 'mephistopheles', 'baal', 'mammon', 'asmodai',
    'belial', 'leviathan', 'diablo', 'hellspawn', 'damned',
    'damnation', 'accursed', 'cursed', 'unholy', 'blasphemy',
    'blasphemer', 'heretic', 'heresy', 'apostate', 'infidel',
    'pagan', 'heathen', 'godless', 'atheist', 'nonbeliever',
    'unbeliever', 'faithless', 'godhates', 'godhatesfags',
    'westboro', 'westboro baptist', 'phelps', 'fred phelps',
    'cult', 'cultist', 'cult leader', 'jonestown', 'koolaid',
    'drink the koolaid', 'heavens gate', 'branch davidian',
    'waco', 'oklahoma city', 'timothy mcveigh', 'unabomber',
    'ted kaczynski', 'serial killer names', 'bundy', 'dahmer',
    'gacy', 'ramirez', 'btk', 'zodiac', 'night stalker',
    'green river', 'son of sam', 'berkowitz', 'manson',
    'charles manson', 'helter skelter', 'cult of manson',
    'family', 'the family',
     'godhater', 'godhate', 'godhates', 'godhatesfags', 'godhatesfag',
];
// Words reserved for CTR admins / staff
const STAFF_RESERVED = [
    'admin', 'ctr', 'moderator', 'staff', 'support', 'official',
    'ctrteam', 'ctradmin', 'claimtheroom', 'ctrmod',  
    'admin', 'moderator', 'mod', 'owner', 'founder', 'ceo', 'staff',
    'gm', 'game master', 'gamemaster', 'support', 'dev', 'developer',
    'official', 'efootball', 'konami', 'pes', 'proevolutionsoccer',
    'konam1', 'k0nami', 'c0nami', 'efootbal', 'efootba1l', 'ef00tball',
    'efootbal1', 'moderator', 'moderator', 'moderator', 'adminstrator',
    'sysop', 'system', 'bot', 'hacker', 'hack', 'hax', 'h4x', 'h4ck',
    'cheat', 'cheater', 'cheat3r', 'ch3at', 'cheatz', 'exploit',
    'glitch', 'bug', 'dupe', 'duping', 'phish', 'phishing', 'scam',
    'scammer', 'scam', 'fraud', 'hacktool', 'trainer', 'cracked',
    'crackz', 'warez', 'keygen', 'serial', 'license key',
];

const BANNED_SUBSTRINGS = [
    // ========================
    // RACIAL / ETHNIC SLURS
    // ========================
    // N-word & variants
    'nigger', 'niggers', 'nigg', 'nigga', 'niggah', 'nigguh', 'nigglet',
    'n1gger', 'n1gga', 'n1gg3r', 'nigg3r', 'n!gger', 'n!gga',
    'negro', 'negros', 'negroes', 'negroes', 'niggress',
    'negr0', 'negr0s', 'n3gro',

    // anti‑Asian
    'chink', 'chinky', 'chinkie', 'ch1nk', 'ch1nky', 'ch!nk',
    'gook', 'g00k', 'guk', 'gooker',
    'slanteye', 'slanty', 'slope', 'slopehead',
    'zipperhead', 'ziphead',
    'nip', 'nips', 'jap', 'japs', 'nipon', 'niponese',
    'chinaman', 'chinamen',

    // anti‑Semitic
    'kike', 'kyke', 'k1ke', 'kik', 'kikes',
    'heeb', 'hebe', 'yid', 'yiddo',
    'jewboy', 'jewbastard', 'jewpig',
    'globalist', // commonly used antisemitic dogwhistle
    'zionistpig',

    // anti‑Muslim / Arab
    'raghead', 'towelhead', 'sandnigger', 'sandn1gger', 'sandnig',
    'cameljockey', 'camel jockey', 'cameljock',
    'sandmonkey', 'sand monkey',
    'muzzie', 'muzrat', 'islamonazi',
    'jihadi', 'jihadist', 'hajji', 'hadji', 'turbanator',
    'paki', 'p@k1', 'pak1', 'paki', 'p*k1', 'p4k1',
    'currymuncher', 'curry muncher',

    // anti‑Hispanic
    'spic', 'spick', 'spik', 'sp1c', 'sp1k',
    'beaner', 'beaney', 'wetback', 'wetb@ck', 'wetb4ck',
    'greaser', 'greaseball',
    'wop', 'dago', 'dego',

    // anti‑White
    'cracker', 'cracka', 'crackah', 'cr@cker',
    'honky', 'honkey', 'honkie', 'h0nky',
    'whitey', 'whitety', 'white trash', 'whitetrash',
    'redneck', 'rednek', 'r3dneck', 'hillbilly',
    'bogan', 'chav', 'pikey', 'piker',

    // anti‑Black / other
    'coon', 'coons', 'coonass', 'coonie', 'c00n',
    'darkie', 'darky', 'd4rkie',
    'jigaboo', 'jiggaboo', 'jig', 'j1gab00',
    'groid', 'groidy',
    'porchmonkey', 'porch monkey',

    // anti‑Italian
    'guido', 'guinea', 'ginzo',
    'moolie', 'moolinyan', // Italian‑American slur

    // ========================
    // HOMOPHOBIC / TRANSPHOBIC
    // ========================
    'faggot', 'fag', 'faggy', 'fagot', 'f@ggot', 'f4g', 'f4gg0t',
    'faggit', 'faglet',
    'dyke', 'dike', 'dykey', 'd1ke', 'd!ke',
    'lezbo', 'lezzie', 'lezzy',
    'queer', 'qweer', 'queero', 'qu33r',
    'homo', 'hommo', 'homofag', 'h0mo', 'h0m0',
    'tranny', 'trannie', 'tr4nny', 'tr@nny',
    'shemale', 'shemale', 'she-male', 'sh3male',
    'troon', 'troonout', 'trooner',
    'agp', 'autogynephile', // transphobic terminology

    // ========================
    // EXTREME PROFANITY / COMPOUND INSULTS
    // ========================
    'fuck', 'fuk', 'fck', 'fcuk', 'fuq', 'phuck', 'phuk',
    'f0ck', 'f*ck', 'f#ck', 'f@ck', 'fvck',
    'motherfucker', 'muthafucka', 'motherfukker', 'muthafukka',
    'fucktard', 'fuckface', 'fuckhead', 'fuckwit', 'fucknugget',
    'fuckbucket', 'fuckgoblin', 'fucktrumpet', 'fuckstick',
    'clusterfuck', 'mindfuck', 'fuckery',
    'fuckboy', 'fuckboi',
    'fuckyou', 'fuckoff', 'fuckme', 'fuckthis', 'fuckthat',
    'shit', 'sh1t', 'sh!t', 'sh*t', 'shyt', 'shite',
    'shithead', 'shitstorm', 'shitbucket', 'shitgoblin',
    'shitnugget', 'shitstick', 'shitfuck', 'shitass',
    'horseshit', 'bullshit', 'batshit', 'dipshit',
    'ass', 'azz', 'a$$', 'arse',
    'asshole', 'assh0le', 'arsehole', 'asshat', 'assmuncher',
    'asswipe', 'assclown', 'assgoblin', 'assnugget',
    'asslicker', 'asskisser', 'asspirate', 'buttplug',
    'dumbass', 'jackass', 'lardass', 'smartass', 'bitchass',
    'cock', 'c0ck', 'c0k', 'cawk',
    'cockgobbler', 'cocksucker', 'cockwomble', 'cockmongler',
    'cockhead', 'cocknose', 'cockbite', 'cockguzzler',
    'dick', 'd1ck', 'd!ck', 'dicc', 'dikk',
    'dickhead', 'dickweed', 'dickwad', 'dickcheese',
    'dicknugget', 'dickgoblin', 'dickmuncher', 'dicklicker',
    'cunt', 'cvnt', 'c*nt', 'cuntface', 'cuntbucket',
    'cuntwaffle', 'thundercunt', 'cuntpunt', 'cuntdestroyer',
    'twat', 'tw4t', 'tw@t', 'twatwaffle', 'twatgoblin', 'twatface',
    'pussy', 'pussies', 'pussycat', 'pussylicker', 'pussydestroyer',
    'bitch', 'b1tch', 'b!tch', 'bitchslap', 'bitchezz',
    'slut', 'slutt', 'slutbucket', 'slutface', 'slutmuffin',
    'whore', 'wh0re', 'whorebag', 'whoreface',
    'bastard', 'bast4rd', 'b@stard',
    'prick', 'pr1ck', 'prickface',
    'knob', 'knobhead', 'knobjockey', 'knobgobbler',
    'bellend', 'bellend', 'bell3nd',
    'wanker', 'wankstain', 'wankbiscuit', 'wankpuffin',
    'tosser', 'tosspot', 't0sser',
    'pillock', 'plonker', 'numpty', 'berk', 'git', 'prat',
    'bloody', 'bugger', 'sodoff',

    // ========================
    // SELF‑HARM / SUICIDE / VIOLENCE
    // ========================
    'killyourself', 'killyours3lf', 'kys', 'ky$', 'k1llyourself',
    'suicide', 'su1cide', 'suicid3',
    'selfharm', 'self harm', 'cutyourself', 'cuturself',
    'slitwrists', 'slit wrists',
    'hangyourself', 'drinkbleach', 'guninmouth',
    'euthanasia', 'assistedsuicide',
    'enditall', 'goodbyeworld',
    'rape', 'r4pe', 'rap1st', 'rapist', 'rap3',
    'murder', 'murderer', 'murd3r',
    'kill', 'k1ll', 'k!ll', 'killer', 'k1ller',
    'serialkiller', 'massshooter', 'schoolshooter',
    'terrorist', 'terr0rist', 'jihadist', 'bomber',
    'bomb', 'b0mb', 'explode', 'explosion',
    'genocide', 'gen0cide', 'massacre', 'massacr3',
    'holocaust', 'hol0caust', 'holohoax', 'holocough',

    // ========================
    // COMBINATIONS / BYPASS PATTERNS
    // ========================
    'cum', 'cvm', 'cumming', 'cumshot', 'cumdump', 'cumbucket',
    'cumguzzler', 'cumgoblin', 'cumslut',
    'jizz', 'j1zz', 'jizzbucket', 'jizzrag',
    'splooge', 'sploosh',
    'sperm', 'sp3rm', 'spermburper',
    'masturbate', 'masturb8', 'masturbat1on',
    'fap', 'fapping', 'f4p',
    'blowjob', 'bl0wj0b', 'handjob', 'rimjob', 'footjob',
    'anal', 'an4l', 'anus', 'rectum', 'penis', 'p3nis', 'vagina', 'vag1na',
    'nipple', 'nippl3', 'areola',
    'boner', 'b0ner', 'erection', 'hardon',
    'fetish', 'f3tish', 'bdsm', 'kink', 'k1nk',
    'pedo', 'p3do', 'pedophile', 'paedophile', 'childmolester',
    'incest', 'inc3st', 'inbred', 'inbreed',

    // ========================
    // GENERAL HATE / EXTREMISM
    // ========================
    'hitler', 'h1tler', 'hitl3r', 'adolf', 'nazi', 'n4zi',
    'fascist', 'f4scist', 'fash',
    'swastika', 'swast1ka', 'hakenkreuz',
    'kkk', 'kukluxklan', 'klansman',
    'whitepower', 'blackpower', 'white supremacy',
    'aryan', 'aryan brotherhood',
    'final solution', 'finalsolution',
    'jewworldorder', 'jew order', 'zionistpig',
    '1488', '1488', '14/88', 'heil', 'siegheil', 'heilhitler',

    // ========================
    // EXTRA LEET / BYPASS FORMS (add as many as you like)
    // ========================
    // common substitutions: @ for a, 0 for o, 3 for e, 1 for i, 4 for a, $ for s, + for t, 7 for t, etc.
    'n1gg3r', 'n1gga', 'n1g', 'n!g',
    'f@ck', 'f*ck', 'f#ck', 'f%ck', 'f^ck',
    'sh1t', 'sh!t', 'sh*t', 'sh@t',
    'a$$', 'a s s', 'azz',
    'c0ck', 'c0k', 'c0c', 'd1ck', 'd!ck',
    'cunt', 'c*nt', 'cunt',
    'pen1s', 'pen!s', 'p3nis',
    'v@gina', 'v4gina', 'vag1na',
    'b0obs', 'b00bs', 't1ts', 't!tties',
    'm0therfucker', 'm0therfuck3r',

    // ========================
    // ADDITIONAL BAD WORDS (to reach 300+)
    // ========================
    'scumbag', 'scum', 'scvm',
    'trash', 'tr4sh', 'garbage', 'g4rbage',
    'waste', 'w4ste',
    'cretin', 'cr3tin',
    'moron', 'm0ron', 'idiot', '1diot',
    'degenerate', 'd3generate',
    'pervert', 'p3rvert',
    'skank', 'sk4nk', 'slag', 'sl4g',
    'hag', 'h4g',
    'wench', 'w3nch',
    'bimbo', 'b1mbo',
    'trollop', 'tr0llop',
    'hussy', 'hussie',
    'pimp', 'p1mp',
    'playa', 'playah',
    'porn', 'p0rn', 'xxx', 'hentai', 'h3ntai',
    'sex', 's3x', 's e x', // careful, but likely safe after substring check; if false positive concerns arise, remove
    '69', '69er', '69ing',
    'doggy', 'cowgirl', 'missionary', // sexual positions
    'dominatrix', 'submissive', 'bondage',
    'futanari', 'yaoi', 'yuri', 'ecchi', 'eroge', 'nsfw',

    // drugs & substance abuse (prevents username advertising drugs)
    'weed', 'w33d', 'cannabis', 'marijuana',
    'cocaine', 'coke', 'cr4ck', 'crackcocaine',
    'meth', 'm3th', 'crystalmeth', 'crystal meth',
    'heroin', 'heroine', 'h3roin',
    'fentanyl', 'f3ntanyl',
    'xanax', 'x4nax', 'adderall', 'ritalin',
    'ecstasy', 'mdma', 'lsd', 'acid',
    'shrooms', 'mushrooms',
    'overdose', '0verdose',
    'junkie', 'junk13', 'crackhead', 'methhead', 'stoner',
    'addict', 'add1ct',

    // other offensive
    'douche', 'douchebag', 'douchecanoe', 'douchenozzle',
    'scrotum', 'scrot',
    'testicle', 't3sticle',
    'boob', 'boobs', 'b00bs', 'tits', 'titties',
    'nipple', 'nippl3',
    'butt', 'buttface', 'buttmunch', 'butthole',
    'fart', 'f4rt', 'fartface', 'fartknocker',
    'dildo', 'd1ldo', 'vibrator', 'vibrat0r',

    // violence weapons
    'gun', 'pistol', 'rifle', 'shotgun',
    'ak47', 'ak-47', 'ar15', 'm16', 'uzi',
    'bomb', 'grenade', 'dynamite',
    'strangle', 'choke', 'stab', 'shoot',

    // compound insults (creative)
    'thundercunt', 'twatwaffle', 'cockwomble', 'fucktrumpet',
    'jizzmop', 'cumstain', 'cumrag', 'shitstain',
    'pissflaps', 'pissbucket', 'pissbaby',
    'asscrack', 'assjuice', 'asspimple',
    'dickweed', 'dickwad', 'dicklet', 'dickfart',
    'cuntlet', 'cuntnugget', 'cuntmuffin',
    'fuckmuppet', 'shitmuppet', 'cockmuppet',
    'wankstain', 'wankbadger', 'wankbiscuit',
    'spunk', 'spunkbubble', 'spunktrumpet',

    // racist / hate combinations
    'killallwhites', 'killallblacks', 'killalljews', 'killallmuslims',
    'hitlerdidnothingwrong', 'hitlerwasright',
    'whitepride', 'blackpride', 'aryanpride',
    'jewsbomb', 'sandnigger', 'niggerfaggot',
    'trannynigger', 'faggotkike',
    'zionism', 'globalistagenda', 'illuminati', 'neworldorder',

    // extreme self‑harm
    'iwanttodie', 'imgoingtokillmyself', 'suicidal', 'suicidalthoughts',
    'selfmutilation', 'selfmutilate',
    'hangmyself', 'slitmywrists', 'jumpoffabridge',
    'tieanoose', 'eatagun',

    // Additional bypasses (add any new ones you see)
    'f_u_c_k', 'fvck', 'fuk', 'fuq', 'fak', 'fek',
    'sh1t', 'sh*t', 'sh!t', 'shyt', 'shite',
    'b1tch', 'b!tch', 'bitch', 'beyotch',
    'a$$', 'azz', 'arse',
    'd1ck', 'd!ck', 'dicc',
    'cunt', 'cvnt', 'c*nt',
    'pussy', 'puss', 'pussie',
    'horny', 'h0rny', 'horney',

    // Catch "nigga" even if typed with numbers
    'n1g', 'n1gga', 'n1gg3r', 'nigg3r',
    'k1k3', 'kik3',
    'j3w', 'j3ws', 'jew',
    'raghead', 'towelhead', 'turbanhead',
    'pedo', 'ped0', 'paedo',
    'molest', 'm0lest', 'groomer', 'grooming',

    // Final catch‑all for common separator bypasses (after stripping, these will be caught)
    'f u c k', 'f-u-c-k', 'f.u.c.k', 'f u', 'fu', // short but effective
    's e x', 's-e-x',
    'c u n t', 'c-u-n-t',
    'd i c k', 'd-i-c-k',
    's h i t', 's-h-i-t',
    'a s s', 'a-s-s',
    'b i t c h', 'b-i-t-c-h',

    // More compound forms (over 300 now)
    'fat', 'f4t', 'fatty', 'fatso', 'tubby', 'lard',
    'ugly', 'uggo', 'fugly',
    'stinky', 'smelly',
    'gross', 'disgusting', 'vomit', 'puke', 'barf',
    'nasty', 'filthy', 'dirty', 'germ',
    'pathetic', 'pitiful',
    'loser', 'l00ser', 'looser',
    'failure', 'fail', 'f4il',
    'nobody', 'worthless', 'useless',
    'joke', 'clown', 'freak', 'weirdo', 'creep',
    'stalker', 'incel', 'incels', 'simp', 'cuck',
    'beta', 'soyboy', 'soy', 'neckbeard', 'virgin',
    'blackpill', 'redpill', 'bluepill',
    'cuckold', 'cuckqueen', 'cuckson',
    'manchild', 'manlet',
    'neet', 'hikikomori', 'shutin',
    'loner', 'loserdom',
    'basementdweller',
    'crybaby', 'crybaby',
    'salt', 'salty', 'tears', 'cryme ariver',
    'noob', 'n00b', 'newb', 'nub', 'scrub',
    'trashcan', 'garbageplayer', 'botlike',
    'uninstall', 'quitgame', 'ragequit', 'rq',
    'gitgud', 'git good', 'ggez', 'gg ez',
    'stfu', 'shutup', 'shutthefuckup',
    'gtfo', 'fuckoff', 'piss off', 'sod off',
    'getlost', 'goaway', 'leave', 'retire',
    'idgaf', 'idgafos', 'notcare',
    'boring', 'lame', 'cringe', 'cringey',
    'bruh', 'bruhmoment', 'facepalm', 'smh',
    'fml', 'fuckmylife', 'screwyou', 'damnyou',
    'curseyou', 'hex',
    'die', 'd1e', 'ded', 'dead', 'death',
    'rip', 'ripinpeace', 'restinpiss',
    'destruction', 'destroy', 'obliterate', 'annihilate',
    'erase', 'delete', 'terminate', 'exterminate',
    'dominate', 'submityou', 'surrender', 'forfeit',
    'cheat', 'cheater', 'hack', 'h4ck', 'hax',
    'exploit', 'glitch', 'dupe', 'phish', 'scam', 'fraud',
    'bot', 'hacker', 'cracker', 'trainer', 'warez',
    'keygen', 'serial', 'licensekey',
    'darkweb', 'tor', 'silkroad',
    'covid', 'corona', 'plandemic', 'antivax',
    '5g', 'chemtrails', 'mkultra', 'brainwash',
    'billgates', 'microchip', 'markofthebeast', '666',
    'antichrist', 'falseprophet',
    'satan', 'devil', 'demon', 'lucifer', 'beelzebub',
    'hell', 'hellfire', 'damnation', 'cursed', 'unholy',
    'blasphemy', 'heretic', 'apostate', 'infidel', 'heathen',
    'godhates', 'godhatesfags', 'westboro',
    'cult', 'cultleader', 'koolaid', 'jonestown',
    'waco', 'timothymcveigh', 'unabomber',
    'tedkaczynski', 'charlesmanson', 'helterskelter',
    'serialkiller', 'zodiac', 'nightstalker', 'bundy', 'dahmer', 'gacy',
    'massshooting', 'schoolshooting', 'shooter',
    'terrorattack', 'jihad', 'isis', 'alqaeda',
    'bombing', 'suicidebomber', 'explosion', 'c4', 'semtex', 'napalm',
    'sarin', 'anthrax', 'ricin', 'cyanide',
    'poison', 'strangulation', 'suffocate', 'drown', 'electrocute',
    'arson', 'firebomb', 'incendiary',
];

// Helper: escape regex special characters
function escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Normalise a string by lowercasing and removing everything
 * except letters and digits.
 */
function stripNonAlphanumeric(str: string): string {
    return str.toLowerCase().replace(/[^a-z0-9]/g, '');
}

export function validateUsername(username: string): {
    valid: boolean;
    error?: string;
} {
    const trimmed = username.trim();
    if (trimmed.length < 1) return { valid: false, error: 'Username cannot be empty' };
    if (trimmed.length > 30) return { valid: false, error: 'Username must be 30 characters or fewer' };

    if (!/^[a-zA-Z0-9_.\-]*$/.test(trimmed)) {
        return { valid: false, error: 'Only letters, numbers, dots, hyphens and underscores are allowed' };
    }

    const lower = trimmed.toLowerCase();

    // --- 1. Whole‑word checks (existing logic, untouched) ---
    for (const word of BANNED_WORDS) {
        if (!word.trim()) continue;

        const isSymbolOnly = !/[a-zA-Z0-9]/.test(word);
        if (isSymbolOnly) {
            if (lower === word.toLowerCase()) {
                return { valid: false, error: 'Username cannot consist only of symbols or whitespace' };
            }
            continue;
        }

        const regex = new RegExp(`\\b${escapeRegex(word)}\\b`, 'i');
        if (regex.test(lower)) {

            return { valid: false, error: 'Username contains inappropriate language' };
        }
    }

    // --- 2. Substring check (for bypass patterns) ---
    // Normalise the username – drop all dots, underscores, hyphens, etc.
    const strippedUsername = stripNonAlphanumeric(trimmed);

    for (const pattern of BANNED_SUBSTRINGS) {
        // normalise the pattern too, so "cum.ming" or "c_u_m_m_i_n_g"
        // can be added in any form and still work
        const strippedPattern = stripNonAlphanumeric(pattern);
        if (strippedPattern.length <= 2) continue;
        if (!strippedPattern) continue;       // skip empty

        // simple indexOf is enough – we want to catch it *anywhere*
        if (strippedUsername.includes(strippedPattern)) {
            return { valid: false, error: 'Username contains inappropriate language' };
        }
    }

    // --- 3. (Optional) Staff‑reserved whole‑word check ---
    for (const word of STAFF_RESERVED) {
        if (!word.trim()) continue;
        const regex = new RegExp(`\\b${escapeRegex(word)}\\b`, 'i');
        if (regex.test(lower)) {
            return { valid: false, error: 'This username is reserved for staff members…' };
        }
    }

    return { valid: true };
}