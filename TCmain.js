/* Guildmember var */
var MEMBERS = {};

/* Blizzard classtags */
var BLIZZCLASSTAGS = {1:"warrior",2:"paladin",3:"hunter",4:"rogue",5:"priest",6:"deathknight",7:"shaman",8:"mage",9:"warlock",10:"",11:"druid",12:"monk"}

var ACTIVEPAGEID = "#dkpwrapper";

var GUILD = {};

function create_memberlist(arr) {
	outputarr = [];
	for (i = 0; i < arr.length; i++) {
		if (arr[i].character.level == MINLEVEL) {
			outputarr.push(arr[i].character.name);
		}
		else {
		}
	}
	return outputarr;
}

function run_init() {
}

function run_post() {
	jQuery("#loaderwrapper").hide();
	jQuery("#dkplist").show();
}

function handle_guilddata(obj) {
	console.log("Raw obj",obj);
	/* Generate guild */
	memberlist = create_memberlist(obj.members);
	GUILD = new Guild(obj.name,memberlist);

	/* Build guild roster */
	for (i = 0; i < obj.members.length; i++) {
		var level = obj.members[i].character.level;
		if (level >= MINLEVEL) {
			var ranktag = obj.members[i].rank;
			var rank = GUILDRANKS[ranktag];
			var name = obj.members[i].character.name;
			var pclasstag = obj.members[i].character.class;
			var pclass = BLIZZCLASSTAGS[pclasstag];

			if (obj.members[i].character.hasOwnProperty("spec")) {
				var spec = obj.members[i].character.spec.name;
				var role = obj.members[i].character.spec.role;
			}
			else {
				var spec = "Unknown";
			}

			MEMBERS[name] = new Member(name,rank,spec,role);
			MEMBERS[name].pclass = pclass;
			MEMBERS[name].level = level;
		}
	}

	/* Include extramembers in guildroster */
	var extramembers = Object.keys(EXTRAMEMBERS);
	for (i = 0; i < extramembers.length; i++) {
			var name = extramembers[i];
			var rank = EXTRAMEMBERS[name][0];
			var pclass = EXTRAMEMBERS[name][1];
			var spec = EXTRAMEMBERS[name][2];
			var role = EXTRAMEMBERS[name][3];
			MEMBERS[name] = new Member(name,rank,spec,role);
			MEMBERS[name].pclass = pclass;
			MEMBERS[name].level = 100;
	}

	/* Get spreadsheet data and start parser */
	init_tabletop();
}


/* https://"+GUILDLOC+".battle.net/static-render/"+GUILDLOC+"/"+GUILDSERVER+"/"+urlext+"?jsonp=parse_charpic */

/* https://"+GUILDLOC+".battle.net/api/wow/character/"+GUILDSERVER+"/"+name+"?jsonp=parse_chardata */

function get_guilddata(guildname) {
	jQuery.ajax({
		url: "https://"+GUILDLOC+".battle.net/api/wow/guild/"+GUILDSERVER+"/"+guildname+"?fields=members&jsonp=handle_guilddata",
		type: "GET",
		dataType: "jsonp"
	});
}

function parse_MRT(data){
	for (i = 0; i < data.length; i++) {
		/* Log to parserbuffer */
		jQuery("#parserbuffer").html(data[i]["raiddata"]);

		/* Gather data for each raiddata-instance */
		GUILD.raids += 1;
		parse_raid_attendance();
		parse_boss_encounters();
		parse_loot();


	}
	/* Append last raiddata-instance to #lastraid div */
	/*jQuery("#lastraid").html(data[data.length-1]["raiddata"]);/*

	/* Clear last raid */
	jQuery("#lastraid").html();

	/* Run loot calcs based on gathered loot */
	calc_lootcosts();

	/* Calculate guildrank for each guild member */
	calc_guildranks();

	/* Adjust DKP */
	calc_adjustdkp(DKPADJUST);

	/* Post */
	run_post();

	/* Render DKP standings */
	render_dkplist(MEMBERS);
	render_memberlootlist(MEMBERS);
	render_memberraidstats(MEMBERS);

	$WowheadPower.refreshLinks();
	memberdd_listener();



	console.log(GUILD);
	console.log(MEMBERS);
}

function parse_raid_attendance() {
	uniquenames = [];
	jQuery(".attendees").each(function() {
		/* Get attendance list for bosses */
		cvs = jQuery(this).html();
		nospacecvs = cvs.replace(/ /g,'');
		bossattendance = CVS_parser(nospacecvs);

		/* Get list of unique names */
		for (x = 0; x < bossattendance[0].length; x++) {
			var name = bossattendance[0][x];
			if (uniquenames.indexOf(name) == -1) {
				uniquenames.push(name);
				calc_addraid(name);
			}
			else {
			}
		}
	});

	for (n = 0; n < uniquenames.length; n++) {
		/* Grant DKP for each name in list */
		calc_grantdkp(uniquenames[n],RAIDATTEND);
	}
}

function parse_boss_encounters() {
	jQuery(".bossData .attendees").each(function() {
		/* Get attendance list for bosses */
		var bossname = jQuery(this).parent().parent().find(".name").html();
		if (bossname != "Trash Mob") { /* Do not include trash mobs */
			var bossdiff = jQuery(this).parent().parent().find(".difficulty").html();
			cvs = jQuery(this).html();
			nospacecvs = cvs.replace(/ /g,'');
			bossattendance = CVS_parser(nospacecvs);

			if (bossdiff == "Normal") { /* Normal boss */
				if (GUILD.killedbosses.indexOf(bossname) == -1) { /* New boss */
				GUILD.firstkills += 1;
					for (z = 0; z < bossattendance[0].length; z++) {
						calc_grantdkp(bossattendance[0][z],NEWBOSS);
						calc_addbosskill(bossattendance[0][z],"normal","newkill");
					}
				GUILD.killedbosses.push(bossname);
				}
				else { /* Farmboss */
				GUILD.bosskills += 1;
					for (y = 0; y < bossattendance[0].length; y++) {
						calc_grantdkp(bossattendance[0][y],FARMBOSS);
						calc_addbosskill(bossattendance[0][y],"normal","farm");
					}
				}
			}
			else { /* Heroic */
				if (GUILD.hckilledbosses.indexOf(bossname) == -1) { /* New boss */
				GUILD.firsthckills += 1;
					for (z = 0; z < bossattendance[0].length; z++) {
						calc_grantdkp(bossattendance[0][z],HCNEWBOSS);
						calc_addbosskill(bossattendance[0][z],"heroic","newkill");
					}
				GUILD.hckilledbosses.push(bossname);
				}
				else { /* Farmboss */
				GUILD.hcbosskills += 1;
					for (y = 0; y < bossattendance[0].length; y++) {
						calc_grantdkp(bossattendance[0][y],HCFARMBOSS);
						calc_addbosskill(bossattendance[0][y],"heroic","farm");
					}
				}
			}
		}
	});
}

function parse_loot() {
	jQuery(".bossData .loot li").each(function() {
		var name = jQuery(this).children(".looter").html();
		var href = jQuery(this).children("a").attr("href");
		var itemname = jQuery(this).children("a").html();
		var dkpvalue = jQuery(this).children(".value").html();
		value = dkpvalue.substring(0, dkpvalue.length-4);
		calc_addloot(name,href,itemname,parseInt(value));
	});
}

function Guild(name,members) {
	this.name = name;
	this.raids = 0;
	this.killedbosses = [];
	this.hckilledbosses = [];
	this.bosskills = 0;
	this.hcbosskills = 0;
	this.firstkills = 0;
	this.hcfirstkills = 0;
	this.members = members;
}

function Member(name,rank,spec,role) {
	this.name = name;
	this.dkp = 0;
	this.pclass = "";
	this.raids = 0;
	this.bosskills = 0;
	this.hcbosskills = 0;
	this.firstkills = 0;
	this.hcfirstkills = 0;
	this.loot = [];
	this.rank = rank;
	this.level = 0;
	this.spec = spec;
	this.role = role;
}

function calc_adjustdkp(obj) {
	names = Object.keys(obj);
	for (i = 0; i < names.length; i++) {
		var name = names[i];
		var adjustvalue = DKPADJUST[name];
		if (adjustvalue < 0) {
			newadjvalue = Math.sqrt(adjustvalue*adjustvalue);
			calc_deductdkp(name,newadjvalue);
		}
		if (adjustvalue > 0) {
			calc_grantdkp(name,adjustvalue);
		}
		else {
		}
	}
}

function calc_guildranks() {
	/* Perform raid rank corrections for guild members */
	var allraids = GUILD.raids;
	var members = Object.keys(MEMBERS);
	for (i = 0; i < members.length; i++) {
		var name = members[i];
		if (typeof MEMBERS[name] != "undefined") {
			if (MEMBERS[name].rank != "alt" && MEMBERS[name].rank != "pet") {
				var memraids = MEMBERS[name].raids;
				if (memraids/allraids >= ATTREQ) {
					MEMBERS[name].rank = "raider";
				}
				else {
					MEMBERS[name].rank = "casual";
				}
			}
			else {
			}
		}
		else {
			/*console.log("ERROR: Guild member not found: ",name);*/
		}
	}
}

function calc_addraid(name) {
	if (typeof MEMBERS[name] != "undefined") {
		MEMBERS[name].raids += 1;
	}
	else {
		/*console.log("ERROR: Guild member not found: ",name);*/
	}
}

function calc_lootcosts() {
	/* Check looted items for all members and deduct DKP according to costs */
	var raidmembers = Object.keys(MEMBERS);
	for (i = 0; i < raidmembers.length; i++) {
		name = raidmembers[i];
		if (typeof MEMBERS[name] != "undefined") {
			for (y = 0; y < MEMBERS[name].loot.length; y++) {
				cost = MEMBERS[name].loot[y][2];
				calc_deductdkp(name,cost);
			}
		}
		else {
			/* console.log("ERROR: Guild member not found: ",name); */
		}
	}
}

function calc_addloot(name,href,itemname,value) {
	if (name != "disenchanted" || name != "bank") {
		if (typeof MEMBERS[name] != "undefined") {
			MEMBERS[name].loot.push([href,itemname,value]);
		}
		else {
			/* console.log("ERROR: Guild member not found: ",name); */
		}
	}
	else {
		/* Item was disenchanted or banked */
	}
}

function calc_addbosskill(name,mode,status) {

	if (mode == "normal") { /* Normal */
		if (status == "newkill") { /* First kill */
			if (typeof MEMBERS[name] != "undefined") {
				MEMBERS[name].firstkills += 1;
			}
			else {
				/* console.log("ERROR: Guild member not found: ",name); */
			}
		}
		else { /* Farm kill */
			if (typeof MEMBERS[name] != "undefined") {
				MEMBERS[name].bosskills += 1;
			}
			else {
				/* console.log("ERROR: Guild member not found: ",name); */
			}
		}
	}
	if (mode == "heroic") { /* Heroic */
		if (status == "newkill") { /* First HC kill */
			if (typeof MEMBERS[name] != "undefined") {
				MEMBERS[name].hcfirstkills += 1;
			}
			else {
				/* console.log("ERROR: Guild member not found: ",name); */
			}
		}
		else { /* HC farm kill */
			if (typeof MEMBERS[name] != "undefined") {
				MEMBERS[name].hcbosskills += 1;
			}
			else {
				/* console.log("ERROR: Guild member not found: ",name); */
			}
		}
	}
}

function calc_deductdkp(name,amount) {
	if (typeof MEMBERS[name] != "undefined") {
		MEMBERS[name].dkp -= amount;
	}
	else {
		/* console.log("ERROR: Guild member not found: ",name); */
	}
}

function calc_grantdkp(name,amount) {
	if (typeof MEMBERS[name] != "undefined") {
		MEMBERS[name].dkp += amount;
	}
	else {
		/* console.log("ERROR: Guild member not found: ",name); */
	}
}



function render_dkplist(obj) {
	var dkplist = [];
	var keys = Object.keys(obj);
	for (i = 0; i < keys.length; i++) {
		name = keys[i];
		dkp = MEMBERS[name].dkp;
		dkplist[name] = dkp;
	}
	var sorted_dkplist = getSortedKeys(dkplist);

	for (i = 0; i < sorted_dkplist.length; i++) {
		var name = sorted_dkplist[i];
		var memberclass = MEMBERS[name].pclass;
		var dkp = MEMBERS[name].dkp;
		var raidrank = MEMBERS[name].rank;
		var spec = MEMBERS[name].spec;
		var role = MEMBERS[name].role;
		inject_dkpentry(name,memberclass,dkp,i+1,raidrank,spec,role);
	}
}

function memberdd_listener() {
	jQuery(".member").click(function() {
		thisname = jQuery(this).attr("id");
		jQuery("#"+thisname+"_sub").slideToggle(150);
	});
}

function topnav_listener() {
	jQuery(".menuitem").click(function() {
		/* Clear highlight */
		jQuery(".menuitem").removeClass(FACTION+"bgcolor");
		jQuery(".menuitem").removeClass("black");
		jQuery(".menuitem").addClass("white");

		/* Highlight new */
		jQuery(this).addClass(FACTION+"bgcolor");
		jQuery(this).addClass("black");
	});
}

function change_page(newpageid) {
	if (newpageid != ACTIVEPAGEID) {
		jQuery("#bodywrapper").children().hide();
		jQuery(newpageid).show();
		ACTIVEPAGEID = newpageid;
	}
}

function dropdown_listener() {
	jQuery(".dropdown").click(function() {
		jQuery(this).children("i").toggleClass("fa-caret-right");
		jQuery(this).siblings(".dropdown-content").slideToggle(150);
	});
}

function table_listener() {
	jQuery(".toggletableheader").click(function(){
		jQuery(this).children("i").toggleClass("fa-caret-right");
		jQuery(this).siblings(".toggletable").slideToggle(150);
	});
}

function render_memberlootlist(obj) {
	var keys = Object.keys(obj);
	for (i = 0; i < keys.length; i++) {
		name = keys[i];
		if (MEMBERS[name].loot.length > 0) {
			var lootcount = MEMBERS[name].loot.length;
			for (y = 0; y < lootcount; y++) {
				if (y < 5) {
					href = MEMBERS[name].loot[y][0];
					itemname = MEMBERS[name].loot[y][1];
					inject_lootitem(name,itemname,href);
				}
			}
		}
		else {
			inject_lootitem(name,"Ingen loot att visa","http://www.wowhead.com/");
		}
	}
}

function set_theme(faction) {
	jQuery("#background").addClass(FACTION+"bg");
	jQuery("#headerbg").addClass(FACTION+"bgcolor");
	jQuery(".menuitem").eq(0).addClass(FACTION+"bgcolor");
	jQuery(".menuitem").eq(0).addClass("black");
	jQuery("#factionlogo").addClass(FACTION);
	if (FACTION == "alliance") {
		jQuery(".fa-angle-left").addClass("gold");
		jQuery(".fa-angle-right").addClass("gold");
	}
	if (FACTION == "horde") {
		jQuery(".fa-angle-left").addClass("red");
		jQuery(".fa-angle-right").addClass("red");
	}
}

function render_memberraidstats(obj) {
	var keys = Object.keys(obj);
	for (i = 0; i < keys.length; i++) {
		name = keys[i];
		inject_stat(name,MEMBERS[name].hcfirstkills,"hcfirstkills");
		inject_stat(name,MEMBERS[name].hcbosskills,"hcbosskills");
		inject_stat(name,MEMBERS[name].firstkills,"firstkills");
		inject_stat(name,MEMBERS[name].bosskills,"bosskills");
		inject_stat(name,MEMBERS[name].raids,"raids");
	}
}

function inject_stat(name,value,stattype) {
	if (stattype == "firstkills") {
		jQuery("#"+name+"_sub").children(".statswrapper").append("<div class=\"statsitem\"><i class=\"fa fa-star silver\"></i> Guild-first bosskills [N]: "+value+"</div>");
	}
	if (stattype == "hcfirstkills") {
		jQuery("#"+name+"_sub").children(".statswrapper").append("<div class=\"statsitem\"><i class=\"fa fa-star gold\"></i> Guild-first bosskills [H]: "+value+"</div>");
	}
	if (stattype == "bosskills") {
		jQuery("#"+name+"_sub").children(".statswrapper").append("<div class=\"statsitem\"><i class=\"fa fa-star-o silver\"></i> Farmkills [N]: "+value+"</div>");
	}
	if (stattype == "hcbosskills") {
		jQuery("#"+name+"_sub").children(".statswrapper").append("<div class=\"statsitem\"><i class=\"fa fa-star-o gold\"></i> Farmkills [H]: "+value+"</div>");
	}
	if (stattype == "raids") {
		jQuery("#"+name+"_sub").children(".statswrapper").append("<div class=\"statsitem\"><i class=\"fa fa-check silver\"></i> Raids: "+value+"</div>");
	}
}

function inject_lootitem(name,itemname,href) {
	jQuery("#"+name+"_sub").children(".lootwrapper").append("<div class=\"lootitem white sans\"><a href=\""+href+"\">"+itemname+"</a></div>");
}

function inject_dkpentry(name,pclass,dkp,dkprank,raidrank,spec,role) {
	var raidranktext = capitaliseFirstLetter(raidrank);
	outputhtml = "<div class=\"sans member "+pclass+"\" id=\""+name+"\">"+
		"<div class=\"classbar\"></div>"+
		"<div class=\"dkprank\"><div class=\"vertcenter white tinytext\">"+dkprank+"</div></div>"+
		"<div class=\"classiconwrapper\"><div class=\"classicon\"></div></div>"+
		"<div class=\"namewrapper\"><div class=\"vertcenter name mediumtext\">"+name+"</div></div>"+
		"<div class=\"dkpwrapper\"><div class=\"vertcenter dkp white smalltext\">"+dkp+"</div></div>"+
		"<div class=\"raidrankwrapper "+raidrank+"\"><div class=\"raidrank\"><div class=\"ranktext tinytext gold\">"+raidranktext+"</div></div></div>"+
		"<div class=\"rolewrapper\"><div class=\"roleicon "+role+"\"></div></div>"+
		"<div class=\"specwrapper\"><div class=\"vertcenter white mediumtext\">"+spec+"</div></div>"+
	"</div>"+
	"<div class=\"membersub\" id=\""+name+"_sub\">"+
	"<span class=\"white sans smalltext small-header\">Senaste items</span>"+
	"<div class=\"lootwrapper tinytext sans\">"+
	"</div>"+
	"<span class=\"white sans smalltext small-header\">Raidstatistik</span>"+
	"<div class=\"statswrapper tinytext white sans\">"+
	"</div>"+
	"</div>";
	jQuery("#dkplist").append(outputhtml);
}

function capitaliseFirstLetter(string){
	/* Snippet from Steve Harrison */
    return string.charAt(0).toUpperCase() + string.slice(1);
}

function getSortedKeys(obj) {
	/* Snippet */
    var keys = []; for(var key in obj) keys.push(key);
    return keys.sort(function(a,b){return obj[b]-obj[a]});
}

function CVS_parser(strData, strDelimiter) {
	/* Snippet */
	// This will parse a delimited string into an array of
	// arrays. The default delimiter is the comma, but this
	// can be overriden in the second argument.
	// Check to see if the delimiter is defined. If not,
	// then default to comma.
	strDelimiter = (strDelimiter || ",");

	// Create a regular expression to parse the CSV values.
	var objPattern = new RegExp(
		(
			// Delimiters.
			"(\\" + strDelimiter + "|\\r?\\n|\\r|^)" +

			// Quoted fields.
			"(?:\"([^\"]*(?:\"\"[^\"]*)*)\"|" +

			// Standard fields.
			"([^\"\\" + strDelimiter + "\\r\\n]*))"
		),
		"gi"
		);


	// Create an array to hold our data. Give the array
	// a default empty first row.
	var arrData = [[]];

	// Create an array to hold our individual pattern
	// matching groups.
	var arrMatches = null;


	// Keep looping over the regular expression matches
	// until we can no longer find a match.
	while (arrMatches = objPattern.exec( strData )){

		// Get the delimiter that was found.
		var strMatchedDelimiter = arrMatches[ 1 ];

		// Check to see if the given delimiter has a length
		// (is not the start of string) and if it matches
		// field delimiter. If id does not, then we know
		// that this delimiter is a row delimiter.
		if (
			strMatchedDelimiter.length &&
			(strMatchedDelimiter != strDelimiter)
			){

			// Since we have reached a new row of data,
			// add an empty row to our data array.
			arrData.push( [] );

		}


		// Now that we have our delimiter out of the way,
		// let's check to see which kind of value we
		// captured (quoted or unquoted).
		if (arrMatches[ 2 ]){

			// We found a quoted value. When we capture
			// this value, unescape any double quotes.
			var strMatchedValue = arrMatches[ 2 ].replace(
				new RegExp( "\"\"", "g" ),
				"\""
				);

		} else {

			// We found a non-quoted value.
			var strMatchedValue = arrMatches[ 3 ];

		}


		// Now that we have our value string, let's add
		// it to the data array.
		arrData[ arrData.length - 1 ].push( strMatchedValue );
	}

	// Return the parsed data.
	return( arrData );
}

function init_tabletop() {
	Tabletop.init({ 
	key: "1Z4qK7DVFPLWjiJKSwzqKGMiO3IGduZck9Du9Ipc1K9s",
	callback: function(data) { parse_MRT(data) },
	simpleSheet: true
	});
}

function run_scripts() {
	/* Init */
	run_init();

	/* Run static listeners */
	topnav_listener();
	dropdown_listener();
	table_listener();

	/* Set theme */
	set_theme(FACTION);

	/* Get guild data */
	get_guilddata(GUILDNAME);




}
