using FFMpegCore.Arguments;

namespace Backmask.ffmpeg;

/// <summary>
/// Custom argument class to provide the 'areverse' audio
/// filter option (not present in current FFMpegCore lib)
/// </summary>
public class AudioReverseArgument : IAudioFilterArgument
{
    public AudioReverseArgument() {}

    // keys are only used for arguments that have suboptions,
    // e.g. highpass=f=5 (highpass is the key)
    public string Key { get; } = string.Empty;

    // areverse has no suboptions, so this value will be used
    // as the argument to the audio filter (-af) option,
    // e.g. af=areverse
    public string Value => "areverse";
}