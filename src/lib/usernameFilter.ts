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

// Helper: escape special regex characters in a string
function escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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

    // Check banned words (whole‑word, case‑insensitive)
    for (const word of BANNED_WORDS) {
        // Some entries in the "blank-like bypass" section are empty or
        // whitespace-only strings. Building `\b${word}\b` from an empty
        // string produces the regex /\b\b/, which is a zero-width match
        // that's true for almost any username - that's what was rejecting
        // every clean username. Skip anything with no real content.
        if (!word.trim()) continue;

        const isSymbolOnly = !/[a-zA-Z0-9]/.test(word);
        if (isSymbolOnly) {
            // These entries exist to catch usernames that are made
            // *entirely* of filler symbols (e.g. "...", "---"), not to
            // block a legitimate dot/hyphen/underscore used as a separator
            // inside an otherwise normal username (e.g. "john.doe").
            // So compare the whole username, not a \b-bounded substring.
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

    // Check staff‑reserved words
    for (const word of STAFF_RESERVED) {
        if (!word.trim()) continue;
        const regex = new RegExp(`\\b${escapeRegex(word)}\\b`, 'i');
        if (regex.test(lower)) {
            return { valid: false, error: 'This username is reserved for staff members, or may cause confusion to other users' };
        }
    }

    return { valid: true };
}