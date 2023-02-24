using Amazon.Lambda.Core;
using Amazon.Lambda.APIGatewayEvents;
using Amazon.Polly;
using Amazon.Polly.Model;
using FFMpegCore;
using Backmask.ffmpeg;

// Assembly attribute to enable the Lambda function's JSON input to be converted into a .NET class.
[assembly: LambdaSerializer(typeof(Amazon.Lambda.Serialization.SystemTextJson.DefaultLambdaJsonSerializer))]

namespace Backmask;

public class Functions
{
    const int MaxCharacters = 3000;
    const string DefaultVoiceId = "Justin";
    const string VoiceIdParameter = "voiceId";

    const string TempPath = "/tmp";

    IAmazonPolly PollyClient { get; }

    ILambdaLogger Logger { get; set; }

    /// <summary>
    /// Default constructor that Lambda will invoke.
    /// </summary>
    public Functions()
    {
        // Lambda layer carrying ffmpeg dependencies mounts at /opt
        GlobalFFOptions.Configure(options =>
        {
            options.BinaryFolder = "/opt/bin";
            options.TemporaryFilesFolder = TempPath;
        });

        PollyClient = new AmazonPollyClient();
    }


    /// <summary>
    /// A Lambda function to respond to HTTP POST methods from API Gateway
    /// </summary>
    /// <param name="request"></param>
    /// <returns>The API Gateway response.</returns>
    public async Task<APIGatewayHttpApiV2ProxyResponse> CreateBackmask(APIGatewayHttpApiV2ProxyRequest request, ILambdaContext context)
    {
        Logger = context.Logger;

        if (string.IsNullOrEmpty(request.Body) || request.RequestContext.Http.Method != "POST")
        {
            return new APIGatewayHttpApiV2ProxyResponse
            {
                StatusCode = 400,
                Body = "Invalid request; missing body or invalid verb (expected POST)"
            };
        }

        var voiceId = request.QueryStringParameters?[VoiceIdParameter] ?? DefaultVoiceId;

        var textToBackmask = request.Body;
        if (textToBackmask.Length > MaxCharacters)
        {
            return new APIGatewayHttpApiV2ProxyResponse
            {
                StatusCode = 400,
                Body = $"Invalid request; text to backmask is limited to {MaxCharacters} in length"
            };
        }

        Logger.LogInformation($"Backmasking message: {textToBackmask} using voice: {voiceId}");

        try
        {
            var encodedAudio = await BackmaskText(textToBackmask, voiceId);

            return new APIGatewayHttpApiV2ProxyResponse
            {
                Body = encodedAudio,
                StatusCode = 200,
                Headers = new Dictionary<string, string> { { "Content-Type", "text/plain" } }
            };
        }
        catch (Exception)
        {
            return new APIGatewayHttpApiV2ProxyResponse
            {
                StatusCode = 500,
                Body = "Failed to backmask text, check logs for error details"
            };
        }
    }

    /// <summary>
    /// Backmasks the supplied text by first converting to audio, then calling
    /// ffmpeg to reverse the audio file.
    /// </summary>
    /// <param name="text">The text to backmask</param>
    /// <param name="voiceId">The voice to use in the audio</param>
    /// <returns>Encoded string representing the backmasked audio</returns>
    private async Task<string> BackmaskText(string text, string voiceId)
    {
        string audioFilename = Path.Combine(TempPath, "speech.mp3");
        string reversedAudioFilename = Path.Combine(TempPath, "reversed_speech.mp3");

        try
        {
            await GenerateAudioFile(text, voiceId, audioFilename);

            ReverseAudioFile(audioFilename, reversedAudioFilename);

            return await EncodeAudioFile(reversedAudioFilename);
        }
        catch (AmazonPollyException e)
        {
            Logger.LogError($"Polly exception processing text to audio, {e.Message}");
            throw;
        }
        catch (Exception e)
        {
            Logger.LogError($"Exception processing text to audio, {e.Message}");
            throw;
        }
    }

    private async Task GenerateAudioFile(string text, string voiceId, string outputFile)
    {
        var response = await PollyClient.SynthesizeSpeechAsync(new SynthesizeSpeechRequest
        {
            Text = text,
            OutputFormat = "mp3",
            VoiceId = voiceId
        });

        // write a temporary file containing the audio stream
        using (var outputStream = new FileStream(outputFile, FileMode.Create))
        {
            await response.AudioStream.CopyToAsync(outputStream);
        }

        Logger.LogInformation($"Audio file generated, written to {outputFile}");
    }

    private void ReverseAudioFile(string inputFile, string outputFile)
    {
        FFMpegArguments
            .FromFileInput(inputFile)
            .OutputToFile(outputFile, true, args =>
                args.WithAudioFilters(filters =>
                    filters.Arguments.Add(new AudioReverseArgument())
                )
            )
            .ProcessSynchronously();

        Logger.LogInformation($"Audio file {inputFile} reversed, written to {outputFile}");
    }

    private async Task<string> EncodeAudioFile(string audioFile)
    {
        Logger.LogInformation($"Base64 encoding input file {audioFile} for function return value");

        // note - this is not a practical solution for large files (which is
        // why we have a length limit on the body in this sample)
        var bytes = await File.ReadAllBytesAsync(audioFile);
        return System.Convert.ToBase64String(bytes);
    }
}
