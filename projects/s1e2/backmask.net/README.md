# AWS on Air: AMster & The Brit's Code Corner S01E02

## Basic Backmasking AWS SAM App using .NET

This project is a port of the Python-based backmasking application, first shown in the [S01E01](https://www.twitch.tv/videos/1745065555) episode, to .NET.

## Included AWS Services

This project includes all the code you need for your own [backmasking service]((https://en.wikipedia.org/wiki/Backmasking). The [CloudFormation template](https://aws.amazon.com/cloudformation/resources/templates/) uses the [Serverless Transform](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/transform-aws-serverless.html) to create an [AWS Lambda function](https://aws.amazon.com/lambda/) with an [AWS Lambda Layer](https://docs.aws.amazon.com/lambda/latest/dg/configuration-layers.html) that includes [FFMPEG](https://ffmpeg.org/). The template also includes an [AWS API Gateway](https://aws.amazon.com/api-gateway/) for interacting with the backmasking service.

## What Does the Project Do?

As a backmasking user, you send text via the AWS API Gateway. The backmasking service sends your text to Amazon Polly to convert your speech to text and then reverses the audio using FFMPEG.

The API responds with an MP3 encoded in a [base64 string](https://en.wikipedia.org/wiki/Base64). You must decode the base64 string and output that result into a `.mp3` file in order to listen to the output.

## Example Usage

**Note:** Some commands are specific to MacOS like `afplay` and some commands must be installed like `jq`.

You can retrieve your AWS API Gateway URL from the [Outputs tab](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/outputs-section-structure.html) in the [CloudFormation Stack created in your AWS Console](https://console.aws.amazon.com/cloudformation).

Unlike the original Python project, the .NET version makes some changes to the input request. First, the body of the POST request is the text to backmask. The Python version accepts a JSON payload with a _message_ property containing the text. Secondly, the sample's default Polly audio voice (_Justin_) can be overridden by passing a query parameter, _voiceId_, and the required voice name. For example _<https://your>_api-endpoint/backmask?voiceId=Gwyneth_. Supported voices in [Amazon Polly](https://aws.amazon.com/polly) can be found [here](https://docs.aws.amazon.com/polly/latest/dg/voicelist.html).

To run the sample from a terminal shell on macOS or Linux, use the command below, replacing the url shown with your own API Gateway endpoint as output from the deployment.

```sh
curl -X POST https://fi5lj10zqi.execute-api.us-west-2.amazonaws.com/backmask -H 'Content-Type: application/text' -d 'Please reverse this audio for me.' | jq -r .audio | base64 -d > please.mp3 && afplay please.mp3
```

To run the sample from a terminal running PowerShell, use the commands below (you can also use the `curl` command shown above, instead of the `Invoke-WebRequest` cmdlet, to get the encoded audio output if you wish).

```PowerShell
$encodedAudio = (Invoke-WebRequest -Uri https://fi5lj10zqi.execute-api.us-west-2.amazonaws.com/backmask?voiceId=Nicole -ContentType "application/text" -Body "Reverse this text, please" -Method Post).Content
$decodedAudio = [System.Convert]::FromBase64String($encodedAudio)
[System.IO.File]::WriteAllBytes("output-filename.mp3", $decodedAudio)
```

## Build and Deploy the Project

You'll use the [AWS SAM CLI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html) to build and deploy this project to your own AWS Account.

To build, make sure you current folder is the _backmask.net_ folder, containing the template.json file, and run:

`sam build`

See this documentation for more info: [https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-sam-cli-using-build.html](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-sam-cli-using-build.html)

To deploy (from the same folder location):

`sam deploy --guided`

See this documentation for more info: [https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-deploying.html](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-deploying.html)

When deployment completes, the URL to the deployed API endpoint will be output. Use this in the sample commands shown above to invoke and test the function.
