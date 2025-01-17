interface TweetActions {
  like: boolean;
  retweet: boolean;
  quote: boolean;
  reply: boolean;
}

function parseActions(text: string): TweetActions {
  const actions: TweetActions = {
    like: false,
    retweet: false,
    quote: false,
    reply: false
  };

  // Check if content is giveaway-related
  const giveawayKeywords = [
    'giveaway',
    'giving away',
    'win',
    'contest',
    'raffle',
    'follow to win',
    'rt to win'
  ];

  const isGiveaway = giveawayKeywords.some(keyword =>
    text.toLowerCase().includes(keyword.toLowerCase())
  );

  // If it's a giveaway, return all actions as false
  if (isGiveaway) {
    return actions;
  }

  // Original confidence score parsing
  const confidenceRegex = /\[(LIKE|RETWEET|QUOTE|REPLY)\].*?(\d+)\/10/gi;
  let match;

  while ((match = confidenceRegex.exec(text)) !== null) {
    const action = match[1].toLowerCase();
    const score = parseInt(match[2]);

    if (score > 5) {
      actions[action as keyof TweetActions] = true;
    }
  }

  return actions;
}