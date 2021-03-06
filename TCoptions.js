/* IMPORTANT: Do not change any class names or variable names unless you're an advanced user */

/* ------------------ GUILD AND GUILD MEMBER SETTINGS -----------------*/

/* Name of guild */
var GUILDNAME = "Three Crowns";
var GUILDSERVER = "neptulon"
var GUILDLOC = "eu"; 
var FACTION = "alliance";

/* Non-server members */
var EXTRAMEMBERS = { /* Input as "name":["rank","class","spec","role"], */
"Mildh-Frostmane":["casual","druid","Restoration","HEALING"],
"Ryzktprillz-Frostmane":["casual","monk","Windwalker","DPS"],
"Kanelbullvar-Frostmane":["casual","paladin","Holy","HEALING"]
};

/* Lowest level to display in DKP list */
var MINLEVEL = 100;

/* Guild rank names */
var GUILDRANKS = {
0:"gm",
1:"raider",
2:"casual",
3:"alt",
4:"pet"
};

/* ----------------------------------------------------------------------*/


/* ------------------ DKP SETTINGS --------------------------------------*/
var DKPADJUST = { /* Minus 50% of DKP gained from boss kills from old data, minus 100% of sign DKP */
"Evilzealot":-27,
"Whipcream":-27,
"Hicky":-27,
"Wezzi":-27,
"Ryzktprillz-Frostmane":-27,
"Chücky":-27,
"Foogel":-27,
"Hanke":-27,
"Mildh-Frostmane":-27,
"Boyakíng":-27,
"Zortxé":-27,
"Totemtastic":-23,
"Zorn":-24,
"Ohhstar":-22,
"Ziqfck":-11,
"Reddax":-11,
"Kanelbullvar-Frostmane":-9
}

/* DKP granted on killing a new boss on normal difficulty */
var NEWBOSS = 4; 

/* DKP granted on killing a farmboss on normal difficulty */
var FARMBOSS = 2;

/* DKP granted on killing a new boss on heroic difficulty */ 
var HCNEWBOSS = 6; 

/* DKP granted on killing a farmboss on heroic difficulty */
var HCFARMBOSS = 3;

/* DKP granted for attending a raid (minimum 1 bosskill required) */
var RAIDATTEND = 6; 
var HCRAIDATTEND = 9;

/* Percentage of raids required to qualify for rank "Raider" */
var ATTREQ = 0.5; /* 50% */

/* ----------------------------------------------------------------------*/
