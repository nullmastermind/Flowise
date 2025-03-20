import { Client } from '@opensearch-project/opensearch'
import { AwsSigv4Signer } from '@opensearch-project/opensearch/aws'

export function createAwsOpenSearchClient(accessKeyId: string, secretAccessKey: string, sessionToken?: string): any {
  // Create the client
  return new Client({
    // Ensure domain doesn't include protocol
    node: 'https://mnpas7dxh5ijkq619j3d.us-east-1.aoss.amazonaws.com',
    ...AwsSigv4Signer({
      getCredentials() {
        return Promise.resolve({
          accessKeyId,
          secretAccessKey,
          sessionToken // Optional
        })
      },
      region: 'us-east-1',
      service: 'aoss'
    }),
    ssl: {
      rejectUnauthorized: true // Set to false if you're using a self-signed certificate
    }
  })
}
