const awsConfig = {
    Auth: {
      // You can use Cognito Identity Pool ID for unauthenticated access
      region: 'ca-central-1', // Same as your S3 bucket region
    },
    Storage: {
      AWSS3: {
        bucket: 'prospaceapp', // Your bucket name
        region: 'ca-central-1', // Your bucket region
      }
    }
  };
  
  export default awsConfig;