# AWS on Air: AMster & The Brit's Code Corner
## Basic Backmasking AWS SAM App

## Included AWS Services
This project includes all the code you need for your own [backmasking service]((https://en.wikipedia.org/wiki/Backmasking). The [CloudFormation template](https://aws.amazon.com/cloudformation/resources/templates/) uses the [Serverless Transform](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/transform-aws-serverless.html) to create an [AWS Lambda function](https://aws.amazon.com/lambda/) with an [AWS Lambda Layer](https://docs.aws.amazon.com/lambda/latest/dg/configuration-layers.html) that includes [FFMPEG](https://ffmpeg.org/). The template also includes an [AWS API Gateway](https://aws.amazon.com/api-gateway/) for interacting with the backmasking service.

## What Does the Project Do?
As a backmasking user, you send text via the AWS API Gateway. The backmasking service sends your text to Amazon Polly to convert your speech to text and then reverses the audio using FFMPEG.

The API responds with an MP3 encoded in a [base64 string](https://en.wikipedia.org/wiki/Base64). You must decode the base64 string and output that result into a `.mp3` file in order to listen to the output.

## Example Usage
**Note:** Some commands are specific to MacOS like `afplay` and some commands must be installed like `jq`.
You can retrieve your AWS API Gateway URL from the [Outputs tab](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/outputs-section-structure.html) in the [CloudFormation Stack created in your AWS Console](https://console.aws.amazon.com/cloudformation).
```sh
curl -X POST https://<insert-your-api-gateway-url> -H 'Content-Type: application/json' -d ' {"message": "Please reverse this audio for me."}' | jq -r .audio | base64 -d > please.mp3 && afplay please.mp3
```

## Build and Deploy the Project
You'll use the [AWS SAM CLI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html) to build and deploy this project to your own AWS Account. 

To build:

`sam build --use-container --build-image amazon/aws-sam-cli-build-image-python3.8`

See this documentation for more info: [https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-sam-cli-using-build.html](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-sam-cli-using-build.html)

To deploy:

`sam deploy --guided`

See this documentation for more info: [https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-deploying.html](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-deploying.html)