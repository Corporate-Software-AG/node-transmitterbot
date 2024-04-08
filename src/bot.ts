import { ActivityHandler, MessageFactory, ConversationState, UserState } from 'botbuilder';
import fetch from 'node-fetch';

export class EchoBot extends ActivityHandler {
    private conversationState: ConversationState;
    private userState: UserState;

    constructor(userState: UserState, conversationState: ConversationState) {
        super();
        this.conversationState = conversationState;
        this.userState = userState;

        // See https://aka.ms/about-bot-activity-message to learn more about the message and other activity types.
        this.onMessage(async (context, next) => {
            const conversationData = this.conversationState.createProperty('ConversationData');
            const conversationHistory = await conversationData.get(context, { history: [] });
            const requestHeaders: HeadersInit = {
                "Content-Type": "application/json",
                // Other headers as needed
            };

            // Replace this with the primary/secondary key or AMLToken for the endpoint
            const apiKey = "ZLtQ2LEz64dofBfOfTlIj4fCQtNDRvhf";
            if (!apiKey) {
                throw "A key should be provided to invoke the endpoint";
            }
            requestHeaders["Authorization"] = "Bearer " + apiKey;
            requestHeaders["azureml-model-deployment"] = "tvonment-01-chat-01-1";
            const url = "https://tvonment-01-chat-01.switzerlandnorth.inference.ml.azure.com/score";

            await this.userState.saveChanges(context);

            console.log("Sending message to PromptFlow API");
            console.log("History: ", conversationHistory.history);

            try {
                const response = await fetch(url, {
                    method: "POST",
                    body: JSON.stringify({
                        question: context.activity.text,
                        chat_history: conversationHistory.history,
                    }),
                    headers: requestHeaders,
                });

                if (response.ok) {
                    let data = await response.json();
                    await context.sendActivity(MessageFactory.text(data.answer, data.answer));
                    let chat_history = [];
                    chat_history.push(
                        {
                            inputs: {
                                question: context.activity.text,
                            },
                            outputs: {
                                answer: data.answer,
                            },
                            chat_history: conversationHistory.history,
                        });
                    conversationHistory.history = chat_history;
                } else {
                    // Handle non-streaming response (e.g., JSON response)
                    console.error("Non-streaming response received:", await response.text());
                }
            } catch (error) {
                console.error("Error while consuming PromptFlow API:", error);
            }
            // By calling next() you ensure that the next BotHandler is run.
            await next();
        });

        this.onDialog(async (context, next) => {
            // Save any state changes. The load happened during the execution of the Dialog.
            await this.conversationState.saveChanges(context, false);
            await this.userState.saveChanges(context, false);
            await next();
        });

        this.onMembersAdded(async (context, next) => {
            const membersAdded = context.activity.membersAdded;
            const welcomeText = 'Hello and welcome!';
            for (const member of membersAdded) {
                if (member.id !== context.activity.recipient.id) {
                    await context.sendActivity(MessageFactory.text(welcomeText, welcomeText));
                }
            }
            // By calling next() you ensure that the next BotHandler is run.
            await next();
        });
    }
}
