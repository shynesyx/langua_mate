[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
Add-Type -AssemblyName System.Speech
$synthesizer = New-Object System.Speech.Synthesis.SpeechSynthesizer
$synthesizer.SelectVoice("Microsoft Haruka Desktop")
$synthesizer.SetOutputToWaveFile("D:\dev\cursor\language_tutor\ai-chat-bot-backend\cache\audio\test_ja.wav")
$synthesizer.Speak("こんにちは！日本語のテストです。")
$synthesizer.Dispose()