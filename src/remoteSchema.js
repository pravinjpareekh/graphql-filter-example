const fetch = require('node-fetch')
const { makeRemoteExecutableSchema, introspectSchema } = require('graphql-tools')
const { GraphQLServer } = require('graphql-yoga')
const { createHttpLink } = require('apollo-link-http')
const { transformSchema } = require('graphql-transform-schema');

async function run() {
    const makeDatabaseServiceLink = () => createHttpLink({
        uri: `https://api.graph.cool/simple/v1/swapi`,
        fetch
    })

    const databaseServiceSchemaDefinition = await introspectSchema(makeDatabaseServiceLink())

    const databaseServiceExecutableSchema = makeRemoteExecutableSchema({
        schema: databaseServiceSchemaDefinition,
        link: makeDatabaseServiceLink()
    })

    const transformedSchema = transformSchema(databaseServiceExecutableSchema, {
        '*': false,
        allAssets: true,
        createAsset: true,
        Asset: true
    })


    const server = new GraphQLServer({ schema: transformedSchema })
    server.start(() => console.log('Server is running on http://localhost:4000'))
}

run()