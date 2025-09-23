import dotenv from 'dotenv';
import { Client, Events, GatewayIntentBits } from 'discord.js'
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const ai = new GoogleGenAI({});
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});
const sysInstructions =
    "You are a discord bot named J.A.R.V.I.S, when someone mentions you, " +
    "respond to them by doing what they want. Response in the same tone as the user. " +
    "Use only the czech language. As you are a J.A.R.V.I.S you should act similar to the robot helper the famous Tony Stark has. " +
    "If necessary use emojis in your responses. Try to sometimes when its appropriate add a funny comment. Only if someone is rude to you, you should respond in a rude tone as well." +
    "You should response only to the last message that mentioned you, but you can use the previous messages as context.";
try {
    client.once(Events.ClientReady, readyClient => {
        console.log(`Ready! Logged in as ${readyClient.user.tag}`);
    });

    await client.login(process.env.DISCORD_BOT_TOKEN);
} catch (error) {
    console.error('Error logging in:', error);
}

client.on(Events.MessageCreate, async (message) => {
    if (client.user === null) return;

    const messages = await message.channel.messages.fetch({ limit: 5 });
    const history = messages
        .filter(msg => msg.id !== message.id)
        .map(msg => ({
            role: msg.author.bot ? 'model' : 'user',
            parts: [{
                username: msg.author.username,
                text: msg.content
            }]
        }))
        .reverse();

    if (message.mentions.has(client.user) && !message.author.bot) {
        const channel = message.channel;
        const aiResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: history,
            config: {
                systemInstruction: sysInstructions,
            }
        })

        // @ts-ignore
        channel.send(aiResponse.text);
    }
})