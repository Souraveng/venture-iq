import { SecretManagerServiceClient } from '@google-cloud/secret-manager';
import dotenv from 'dotenv';
import fs from 'fs';

async function main() {
  // Parse .env
  const envConfig = dotenv.parse(fs.readFileSync('.env'));
  
  // Extract Service Account Key
  const saKeyBase64 = envConfig.GCP_SERVICE_ACCOUNT_KEY;
  if (!saKeyBase64) {
    console.error("GCP_SERVICE_ACCOUNT_KEY not found in .env");
    process.exit(1);
  }

  const saJsonStr = Buffer.from(saKeyBase64, 'base64').toString('utf-8');
  fs.writeFileSync('service-account.json', saJsonStr);

  const projectId = 'venture-iq-499019';
  const client = new SecretManagerServiceClient({
    keyFilename: 'service-account.json',
    projectId: projectId,
  });

  console.log(`Deploying secrets to GCP Project: ${projectId}`);

  const requiredSecrets = [
    'DATABASE_URL', 'NEXTAUTH_SECRET', 'NEXTAUTH_URL', 
    'AZURE_AD_CLIENT_ID', 'AZURE_AD_CLIENT_SECRET', 'AZURE_AD_TENANT_ID', 
    'GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET', 
    'TAVILY_API_KEY', 'GEMINI_API_KEY', 
    'NEXT_PUBLIC_UPLOAD_WORKER_SECRET', 'NEXT_PUBLIC_UPLOAD_WORKER_URL', 
    'GCP_SERVICE_ACCOUNT_KEY', 'FIRECRAWL_API_KEY', 'TRUST_HOST'
  ];

  for (const [key, value] of Object.entries(envConfig)) {
    if (!requiredSecrets.includes(key)) continue;

    const parent = `projects/${projectId}`;
    const secretName = `${parent}/secrets/${key}`;

    try {
      // Check if secret exists
      try {
        await client.getSecret({ name: secretName });
        console.log(`Secret ${key} already exists. Adding new version...`);
      } catch (err) {
        if (err.code === 5 || err.details?.includes("not found")) {
          // Create secret if it doesn't exist
          console.log(`Creating secret ${key}...`);
          await client.createSecret({
            parent: parent,
            secretId: key,
            secret: {
              replication: {
                automatic: {},
              },
            },
          });
        } else {
          throw err;
        }
      }

      // Add a new version
      await client.addSecretVersion({
        parent: secretName,
        payload: {
          data: Buffer.from(value, 'utf8'),
        },
      });
      console.log(`Successfully added version for ${key}`);

    } catch (error) {
      console.error(`Failed to process secret ${key}:`, error.message);
    }
  }

  // Cleanup
  fs.unlinkSync('service-account.json');
  console.log("Secret deployment complete.");
}

main().catch(console.error);
