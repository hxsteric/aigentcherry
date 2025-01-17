import { shouldInteractWithTweet, containsGiveawayContent } from './utils';
import { Tweet as BaseTweet } from "agent-twitter-client";
import { elizaLogger } from "@elizaos/core";

interface Tweet extends BaseTweet {
    aiFeedback?: string;
}

interface TweetActions {
    like: boolean;
    retweet: boolean;
    quote: boolean;
    reply: boolean;
}

export class TwitterClientInterface {
    private requestQueue: any;
    private twitterClient: any;

    constructor(requestQueue: any, twitterClient: any) {
        this.requestQueue = requestQueue;
        this.twitterClient = twitterClient;
    }

    async handleTweet(tweet: Tweet) {
        // Triple-check no retweets get through
        if (tweet.isRetweet || tweet.isQuoted ||
            (tweet.text || '').toLowerCase().includes('retweet') ||
            (tweet.text || '').toLowerCase().includes('rt')) {
            elizaLogger.debug("Blocking retweet attempt");
            return null;
        }

        if (!shouldInteractWithTweet(tweet)) {
            elizaLogger.debug("Skipping tweet due to validation", { id: tweet.id });
            return null;
        }

        // ... rest of your tweet handling logic ...
    }

    async handleTweetActions(tweet: Tweet, actions: TweetActions) {
        const tweetText = (tweet.text || '').toLowerCase();

        // Check AI feedback for "take no action" response
        if (tweet.aiFeedback?.includes('take no action') ||
            tweet.aiFeedback?.includes('will not engage') ||
            tweet.aiFeedback?.includes('Therefore I will take no action')) {
            elizaLogger.info(`🤖 BLOCKED: AI recommended no action for tweet ${tweet.id}`, {
                aiFeedback: tweet.aiFeedback,
                tweetText: tweet.text
            });

            // Force ALL actions to false
            actions.like = false;
            actions.retweet = false;
            actions.quote = false;
            actions.reply = false;
            return;  // Important: return immediately!
        }

        // Multiple layers of protection
        const isGiveaway = containsGiveawayContent(tweetText);
        const isRetweet = tweet.isRetweet || tweet.isQuoted;
        const hasRetweetText = tweetText.includes('retweet') ||
                             tweetText.includes('rt');

        // IMPORTANT: Block ANY of these conditions BEFORE any actions
        if (isGiveaway || isRetweet || hasRetweetText || !shouldInteractWithTweet(tweet)) {
            elizaLogger.info(`🚫 BLOCKED: Promotional/Retweet content detected in tweet ${tweet.id}`, {
                isGiveaway,
                isRetweet,
                hasRetweetText,
                tweetText: tweet.text
            });

            // Force ALL actions to false
            actions.like = false;
            actions.retweet = false;
            actions.quote = false;
            actions.reply = false;
            return; // Important: return immediately!
        }

        // Only proceed if we passed ALL checks
        if (actions.like) {
            await this.requestQueue.add(() => this.twitterClient.likeTweet(tweet.id));
        }
        if (actions.retweet) {
            await this.requestQueue.add(() => this.twitterClient.retweet(tweet.id));
        }
    }
}