const fetch = require('node-fetch')
const { makeExecutableSchema } = require('graphql-tools')
const { GraphQLServer, PubSub } = require('graphql-yoga')
const { transformSchema } = require('graphql-transform-schema');
const { find, filter } = require('lodash');

async function run() {

    const typeDefs = `
  type Author {
    id: Int!
    firstName: String
    lastName: String
    posts: [Post]
  }

  type Post {
    id: Int!
    title: String
    author: Author
    votes: Int
  }

  # the schema allows the following query:
  type Query {
    posts: [Post]
    author(id: Int!): Author
  }

  # this schema allows the following mutation:
  type Mutation {
    upvotePost (
      postId: Int!
    ): Post
    downvotePost (
      postId: Int!
    ): Post
  }

  # Subscription
  type Counter {
    count: Int!
    countStr: String
  }
  type Subscription {
    counter: Counter!
  }
`;

    const authors = [
        { id: 1, firstName: 'Tom', lastName: 'Coleman' },
        { id: 2, firstName: 'Sashko', lastName: 'Stubailo' },
        { id: 3, firstName: 'Mikhail', lastName: 'Novikov' },
    ];

    const posts = [
        { id: 1, authorId: 1, title: 'Introduction to GraphQL', votes: 2 },
        { id: 2, authorId: 2, title: 'Welcome to Meteor', votes: 3 },
        { id: 3, authorId: 2, title: 'Advanced GraphQL', votes: 1 },
        { id: 4, authorId: 3, title: 'Launchpad is Cool', votes: 7 },
    ];

    const resolvers = {
        Query: {
            posts: () => posts,
            author: (_, { id }) => find(authors, { id }),
        },

        Mutation: {
            upvotePost: (_, { postId }) => {
                const post = find(posts, { id: postId });
                if (!post) {
                    throw new Error(`Couldn't find post with id ${postId}`);
                }
                post.votes += 1;
                return post;
            },
            downvotePost: (_, { postId }) => {
                const post = find(posts, { id: postId });
                if (!post) {
                    throw new Error(`Couldn't find post with id ${postId}`);
                }
                post.votes -= 1;
                return post;
            },
        },

        Subscription: {
            counter: {
                subscribe: (parent, args, { pubsub }) => {
                    const channel = Math.random().toString(36).substring(2, 15)
                    let count = 0
                    setInterval(() => pubsub.publish(channel, { counter: { count: count++ } }), 2000)
                    return pubsub.asyncIterator(channel)
                },
            }
        },

        Counter: {
            countStr: counter => `Current count: ${counter.count}`,
        },

        Author: {
            posts: author => filter(posts, { authorId: author.id }),
        },

        Post: {
            author: post => find(authors, { id: post.authorId }),
        },
    };


    const schema = makeExecutableSchema({
        typeDefs,
        resolvers,
    });

    const transformedSchema = transformSchema(schema, {
        '*': false,
        // posts: true,
        author: true,
        upvotePost: true,
        // downvotePost: true,  
        //  counter: true
    })

    const pubsub = new PubSub()

    const server = new GraphQLServer({ schema: transformedSchema, context: { pubsub } })
    server.start(() => console.log('Server is running on http://localhost:4000'))
}

run()