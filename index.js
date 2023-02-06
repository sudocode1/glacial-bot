const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, Events, GatewayIntentBits, EmbedBuilder, ActivityType } = require('discord.js');
const wait = require('util').promisify(setTimeout);
const configs = require('./configs.json');
const fetch = require('node-fetch');
const roles = require('./toggleables.json');
const { URLSearchParams } = require('node:url');
let bypass = JSON.parse(fs.readFileSync('./bypass.json','utf-8'));

let circulateLinks = JSON.parse(fs.readFileSync('./circulatelinks.json', 'utf-8'));

let circulateId = "5596323";
let circulateToken = "1052e2cd-f5fa-4933-baf6-eaa2b24145df";

const token = configs.main.token;
const prefix = configs.main.prefix;


process.on('unhandledRejection', console.error);
process.on('uncaughtException', console.error);
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMembers] });

client.on('ready', () => {
	console.log(`Logged in as ${client.user.tag}!`);
	//client.user.setActivity("glacial hideout", { type: "WATCHING" })
	client.user.setActivity('glacial hideout', { type: ActivityType.Watching });
});

client.on("guildMemberAdd", async member => {
	if ((Date.now() - member.user.createdTimestamp) < 172800000) {
		if (!bypass.includes(member.id)) return member.kick('account too young');
	}
	await wait(600000)
	try {
		await member.roles.add('423264191781273600');
	} catch(e) {
		console.error('there was an error adding the member role');
	}
	
});

client.on("messageCreate", async message => {
	if (!message.content.startsWith(prefix)) return;
	
	let args = message.content.slice(prefix.length).split(' ');

	switch(args[0]) {
		case 'test':
			message.reply('hi');
		break;

		case 'help':
			const helpEmbed = new EmbedBuilder()
			.setColor('#00ccff')
			.setTitle('commands')
			.addFields(
				{name: prefix + "help", value: "this command"},
				{name: prefix + "suggest ...", value: "suggest command"}, 
				{name: prefix + "toggle ...", value: "toggle role (verified/hof/veteran/artist/contest winner)"}, 
				{name: prefix + 'canibeadmin', value: "can i be admin"}
			)
			.setFooter({text: 'roux made bot :)'});

			message.reply({ embeds: [helpEmbed] });
		break;
		
		case 'suggest':
			if (args.length == 1) return message.reply('missing content');
			if (!message.member.roles.cache.has('423264376561074177')) return message.reply('you need to be level 15');
			if (message.member.roles.cache.has('533772358163497010')) return message.reply('banned from suggesting'); 

			const suggestEmbed = new EmbedBuilder()
			.setColor(message.member.displayColor)
			.setAuthor({ name: 'Suggestion from: ' + message.author.tag, iconURL: message.author.avatarURL() })
			.setDescription(args.slice(1).join(' '))
			.setFooter({"text": `ID: ${message.id} • ${new Date(message.createdTimestamp).toLocaleDateString().replace(/\//g, '.')} ${new Date(message.createdTimestamp).toLocaleTimeString()}`});
			

			let msg = await client.channels.cache.get(`743213151692128426`).send({ embeds: [suggestEmbed] });
			msg.react('✅')
			msg.react('❌');
			
			message.react('✅');
		break;

		case 'toggle':
			if (!args[1]) return message.reply('what role?');

			if (args.slice(1).join(" ") == "contest winner") args[1] = "contestwinner";

			if (!roles[args[1]]) return message.reply('i dont recognise that role');
			
			let toggle = roles[args[1]];

			if (!message.member.roles.cache.has(toggle.needs)) return message.reply('you dont have access to that');

			if (message.member.roles.cache.has(toggle.toggles)) {
				message.member.roles.remove(toggle.toggles);
				message.reply('role has been toggled off');
			} else {
				message.member.roles.add(toggle.toggles);
				message.reply('role has been toggled on');
			}

		break;

		case 'raidkickbypass':
			if (!args[1]) return message.reply('no user id specified');
			if (!message.member.roles.cache.has('423266795437424651') && !message.member.roles.cache.has('1029112063043309690')) return message.reply('you dont have permission to do this');

			if (bypass.includes(args[1])) return message.reply('already done');
			bypass.push(args[1]);
			fs.writeFileSync('./bypass.json', JSON.stringify(bypass));
			message.reply('ok');
		break;

		case 'raidkickunbypass':
			if (!args[1]) return message.reply('no user id specified');
			if (!message.member.roles.cache.has('423266795437424651') && !message.member.roles.cache.has('1029112063043309690')) return message.reply('you dont have permission to do this');

			if (!bypass.includes(args[1])) return message.reply('not bypassed');

			bypass = bypass.filter(x => x !== args[1]);
			fs.writeFileSync('./bypass.json', JSON.stringify(bypass));
			message.reply('ok');
		break;

		case 'staffhelp':
			const staffHelpEmbed = new EmbedBuilder()
			.setColor('#00ccff')
			.setTitle('staff commands')
			.addFields(
				{name: prefix + 'raidkickbypass ...', value: "add user (id) to bypass for under 2 day kick"},
				{name: prefix + 'raidkickunbypass ...', value: "remove user (id) from bypass for under 2 day kick"},
				{name: prefix + 'check ...', value: "check if user (id) has raid kick bypass"},
				{name: prefix + 'rolesync @user', value: "sync member role to user if they are missing it"},
				{name: prefix + 'rolesyncall', value: "sync member role to everyone (buggy)"}
			)
			.setFooter({text: 'roux made bot :)'});

			message.reply({ embeds: [staffHelpEmbed] });
		break;

		case 'canibeadmin':
			if (message.author.id == '596879480841043980' || message.author.id == '786166958168080424') {
				message.reply('no, you cant be admin')
			} else {
				message.reply('sure, you can be admin')
			}
		break;

		case 'check':
			if (!args[1]) return message.reply('need a user id');
			if (bypass.includes(args[1])) {
				message.reply('user is raid kick bypassed');
			} else {
				message.reply('user is not raid kick bypassed');
			}
		break;

		case 'rolesync':
			if (!message.mentions.members.first()) return message.reply('no user mentioned');
			if (!message.member.roles.cache.has('423266795437424651') && !message.member.roles.cache.has('1029112063043309690')) return message.reply('you dont have permission to do this');
			let member = message.mentions.members.first();

			if (!member.roles.cache.has('423264191781273600') && ((Date.now() - member.joinedTimestamp) > 600000)) {
				member.roles.add('423264191781273600');
				message.reply('done');
			} else {
				message.reply('nothing to add');
			}
		break;

		case 'rolesyncall':
			if (!message.member.roles.cache.has('423266795437424651') && !message.member.roles.cache.has('1029112063043309690')) return message.reply('you dont have permission to do this');
			//console.log(message.guild.members.cache.length);
			let membersArray = [];
			message.guild.members.cache.forEach(member => {
				membersArray.push(member.id);
				if (!member.roles.cache.has('423264191781273600') && ((Date.now() - member.joinedTimestamp) > 600000)) {
					member.roles.add('423264191781273600');
				}
			});

			message.reply(`\`\`\`js\n[${membersArray}]\n\`\`\``);
		break;

		case 'circulatelink':
			return message.reply('lol');
			if (!args[1]) return message.reply('please specify your circulate user id');
			if (circulateLinks[message.author.id] && circulateLinks[message.author.id].pending) {
				let body = {
					"applicationRequest": "1",
					"sessionId": circulateToken,
					"userBehalf": circulateLinks[message.author.id].circulateUserId
				}

				let check = await fetch(`http://localhost/api/getFeed.php`, {
					method: 'post',
					body: new URLSearchParams(body)
				});
				let resp = check.json();

				if (resp['error']) {
					message.reply('there was an error\n```json\n' + resp + '\n```')
				} else {
					circulateLinks[message.author.id] = {
						"circulateUserId": circulateLinks[message.author.id].circulateUserId,  
						"pending": false
					};
					fs.writeFileSync('./circulatelinks.json', JSON.stringify(circulateLinks));
					message.reply('ok');
				}
			} else {
				circulateLinks[message.author.id] = {
					"circulateUserId": args[1],  
					"pending": true
				};
				fs.writeFileSync('./circulatelinks.json', JSON.stringify(circulateLinks));
				message.reply(`auth here: http://localhost/authoriseapp.php?${circulateId} then run ${prefix}circulatelink again`);
			}
			
		break;

		case 'circulatepost':
			return message.reply('lol');
			if (!circulateLinks[message.author.id]) return message.reply('please link your circulate account');
			if (circulateLinks[message.author.id].pending) return message.reply('your account is pending auth');

			let body = {
				"applicationRequest": "1",
				"sessionId": circulateToken,
				"userBehalf": circulateLinks[message.author.id].circulateUserId,
				"postText": args.slice(1).join(' ')
			};

			let check = await fetch(`http://localhost/api/createPost.php`, {
				method: 'post',
				body: new URLSearchParams(body)
			});

			message.reply('done');
		break;
		}
		
		

	
})

client.login(token);
