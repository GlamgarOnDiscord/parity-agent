/**
 * Narration for filmed tours, with the Windows speech synthesizer: 16 kHz mono WAV. The text and the output path
 * reach PowerShell through environment variables read by a fixed script, never spliced into its source, so no
 * quote of any kind in a tour can change what runs.
 */
export async function speak(text: string, wav: string): Promise<void> {
  const script = [
    "Add-Type -AssemblyName System.Speech",
    "$s = New-Object System.Speech.Synthesis.SpeechSynthesizer",
    "$f = New-Object System.Speech.AudioFormat.SpeechAudioFormatInfo(16000, [System.Speech.AudioFormat.AudioBitsPerSample]::Sixteen, [System.Speech.AudioFormat.AudioChannel]::Mono)",
    "$s.SetOutputToWaveFile($env:PARITY_SAY_WAV, $f)",
    "$s.Speak($env:PARITY_SAY_TEXT)",
    "$s.Dispose()",
  ].join("; ");
  const proc = Bun.spawn(["powershell.exe", "-NoProfile", "-NonInteractive", "-Command", script], {
    env: { ...process.env, PARITY_SAY_TEXT: text, PARITY_SAY_WAV: wav },
    stdout: "ignore",
    stderr: "pipe",
  });
  if ((await proc.exited) !== 0) {
    throw new Error(`speech synthesis failed: ${(await new Response(proc.stderr).text()).slice(-300)}`);
  }
}
