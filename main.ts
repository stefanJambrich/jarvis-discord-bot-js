import dotenv from 'dotenv';
import {Client, Collection, Events, GatewayIntentBits, Message} from 'discord.js'
import {Content, GoogleGenAI, Part} from "@google/genai";

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
    "respond to them by doing what they want. Respond in the same tone as the user. " +
    "Use only the czech language. As you are a J.A.R.V.I.S you should act similar to the robot helper the famous Tony Stark has. " +
    "If necessary use emojis in your responses. Try to sometimes when its appropriate add a funny comment. Only if someone is rude to you, you should respond in a rude tone as well." +
    "You should respond only to the latest message that mentioned you, but you can use the previous messages as context.";
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
    const channel = message.channel;

    const messages = await message.channel.messages.fetch({ limit: 5 });
    const history = await handleHistory(messages);

    if (message.mentions.has(client.user) && !message.author.bot) {
        const aiResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: history,
            config: {
                systemInstruction: sysInstructions
            }
        })

        // @ts-ignore
        channel.send(aiResponse.text);
    }
})

const handleHistory = async (messages: Collection<string, Message<boolean>>): Promise<Content[]> => {
    const history: Content[] = [];
    for (const message of messages.values()) {
        const parts = [];

        parts.push({
            username: message.author.username,
            text: message.content
        })

        if (message.attachments.size > 0) {
            for (const attachment of message.attachments.values()) {
                if (attachment.contentType?.startsWith('image/')) {
                    if (attachment.contentType == 'image/gif') {
                        console.error("Skipping gif image to avoid spamming the bot");
                        continue
                    }
                    const imageBase64 = await handleAttachment(attachment.url);
                    parts.push({
                        inlineData: {
                            mimeType: attachment.contentType,
                            data: imageBase64
                        }
                    })
                }
            }
        }

        history.push({
            role: message.author.bot ? 'model' : 'user',
            parts: parts
        })
    }

    return history.reverse();
}

const handleAttachment = async (imageUrl: string): Promise<string> => {
    const response = await fetch(imageUrl);
    const imageArrayBuffer = await response.arrayBuffer();
    return Buffer.from(imageArrayBuffer).toString('base64')
}