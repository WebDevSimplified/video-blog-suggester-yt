## Overall

This app is a tool that ingests all WDS videos and blog articles. These videos/articles are chunked using proper hierarchy and then converted to vector embeddings via AI for easy lookup. Later the user will search for results and their search query will be converted to a vector embedding to search our vector database.

## User Flow

1. User logs in with GitHub so we can properly track/rate limit users to avoid abuse and cost issues
2. User searches for a topic they want to learn
3. User chooses a result from the list to view and it opens that result in a new page at the location where the topic is covered
4. If user sends too many searches in a specified time they will be rate limited

##  UI

- Single page with search bar
- Results show up below search bar with link to go to source material
  - Results have an image, title, description, match %

## Ingestion

The ingestion process will be long running background tasks that utilize the YouTube API for videos and direct HTML processing for the articles. Articles will be chunked in proper hierarchy based on headings while videos will be chunked based on the captions in a sentence by sentence chunking.

Vercel workflows will be used to ensure these ingestion processes are durable and able to retry on failure

## Database

We will need to store the content (articles/videos with title, description, thumbnail, etc.), chunks (vector embeddings), user details, rate limit information, historical search information