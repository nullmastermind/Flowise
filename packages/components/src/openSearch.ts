const { Client } = require('@opensearch-project/opensearch')
const { AwsSigv4Signer } = require('@opensearch-project/opensearch/aws')

/**
 * Create an OpenSearch client with AWS Sigv4 authentication
 * @param {string} accessKeyId - AWS access key ID
 * @param {string} secretAccessKey - AWS secret access key
 * @returns {Client} OpenSearch client
 */
function createAwsOpenSearchClient(accessKeyId: string, secretAccessKey: string, sessionToken?: string): any {
  // Create the client
  const client = new Client({
    // Ensure domain doesn't include protocol
    node: 'https://mnpas7dxh5ijkq619j3d.us-east-1.aoss.amazonaws.com',
    ...AwsSigv4Signer({
      region: 'us-east-1',
      service: 'aoss', // OpenSearch service identifier
      credentials: {
        accessKeyId,
        secretAccessKey,
        sessionToken // Optional
      }
    }),
    ssl: {
      rejectUnauthorized: true // Set to false if you're using a self-signed certificate
    }
  })

  return client
}

/**
 * Test connection to OpenSearch
 * @param {any} client - OpenSearch client
 * @returns {Promise<boolean>} True if connection is successful
 */
async function testOpenSearchConnection(client: any): Promise<boolean> {
  try {
    // Send a ping request
    const response = await client.ping()
    return response.statusCode === 200
  } catch (error) {
    console.error('Error connecting to OpenSearch:', error)
    return false
  }
}

/**
 * Create an OpenSearch index if it doesn't exist
 * @param {any} client - OpenSearch client
 * @param {string} index - Index name
 * @returns {Promise<boolean>} True if index was created or already exists
 */
async function createIndexIfNotExists(client: any, index: string): Promise<boolean> {
  try {
    // Check if the index exists
    const indexExists = await client.indices.exists({ index })

    if (!indexExists.body) {
      // Create the index
      await client.indices.create({
        index,
        body: {
          settings: {
            index: {
              number_of_shards: 1,
              number_of_replicas: 1
            }
          }
        }
      })
      console.log(`Index ${index} created`)
    }

    return true
  } catch (error) {
    console.error(`Error creating index ${index}:`, error)
    return false
  }
}

module.exports = {
  createAwsOpenSearchClient,
  testOpenSearchConnection,
  createIndexIfNotExists
}
