import base64
import json
from contextlib import closing
import os
import tempfile
from boto3 import Session
from botocore.exceptions import BotoCoreError, ClientError
from pydub import AudioSegment

max_characters = 3000
session = Session()
polly = session.client("polly")
voice_id = "Justin"


def lambda_handler(event, context):
    if 'body' not in event or event['httpMethod'] != 'POST':
        return {
            'statusCode': 400,
            'headers': {},
            'body': json.dumps({'msg': 'Bad Request'})
        }

    backmask_message = json.loads(event['body'])

    if 'message' in backmask_message and backmask_message['message']:
        print(
            f"attempting backmasking for this message: {backmask_message['message']}"
        )

        if (len(backmask_message['message']) > max_characters):
            return {
                'statusCode': 400,
                'headers': {},
                'body': json.dumps({'msg': f'Maximum text length has been exceeded. Message cannot exceed {max_characters} characters.'})
            }

        return backmask(backmask_message=backmask_message, voice_id=voice_id)
    else:
        print("missing both encoded-mp3 and message fields.")
        return {
            'statusCode': 400,
            'headers': {},
            'body': json.dumps({'msg': 'Bad Request: must provide either encoded-mp3 field or message field in JSON payload.'})
        }


def backmask(backmask_message, voice_id):
    try:
        # Request speech synthesis
        response = polly.synthesize_speech(
            Text=backmask_message['message'],
            OutputFormat="mp3",
            VoiceId=voice_id
        )
    except (BotoCoreError, ClientError) as error:
        # The service returned an error, exit gracefully
        print(error)
        return {
            'statusCode': error.response.get('ResponseMetadata', {}).get('HTTPStatusCode', 500),
            'headers': {},
            'body': json.dumps({'msg': error.response.get('message', "Something went wrong.")})
        }

    if "AudioStream" in response:
        with closing(response["AudioStream"]) as stream:
            return reverse_audio(stream.read())
    else:
        print("Could not stream audio")
        return {
            'statusCode': 500,
            'headers': {},
            'body': json.dumps({'msg': "Error while attempting to stream audio."})
        }


def reverse_audio(file_bytes):
    with tempfile.TemporaryDirectory() as tmpdir:
        os.chdir(tmpdir)
        output = os.path.join(os.getcwd(), "speech.mp3")

        try:
            with open(output, "wb") as file:
                file.write(file_bytes)
            loop = AudioSegment.from_mp3("speech.mp3")
            final = loop.reverse()
            final.export(
                "reversed_speech.mp3",
                format="mp3"
            )
            with open("reversed_speech.mp3", "rb") as rs_file:
                encoded_bytes = base64.b64encode(rs_file.read())
                encoded_string = encoded_bytes.decode("utf-8")
                return {
                    'statusCode': 201,
                    'headers': {},
                    'body': json.dumps({'format': 'mp3', 'audio': encoded_string})
                }
        except IOError as error:
            print(error)

            return {
                'statusCode': 500,
                'headers': {},
                'body': json.dumps({'msg': f"Error while processing file: {error.filename}"})
            }
