@echo off
echo Installing Bark model in Ollama...

REM Create a temporary Modelfile
echo FROM llama2> Modelfile
echo.>> Modelfile
echo PARAMETER temperature 0.7>> Modelfile
echo PARAMETER top_p 0.95>> Modelfile
echo PARAMETER num_ctx 2048>> Modelfile
echo.>> Modelfile
echo SYSTEM """>> Modelfile
echo You are Bark, a text-to-speech model. You can generate high-quality audio in multiple languages.>> Modelfile
echo When given text input, you will return a base64-encoded WAV file containing the synthesized speech.>> Modelfile
echo.>> Modelfile
echo Format your response as:>> Modelfile
echo data:audio/wav;base64,^<base64-encoded-audio-data^>>> Modelfile
echo.>> Modelfile
echo Available voice presets:>> Modelfile
echo - v2/en_speaker_1 (English male)>> Modelfile
echo - v2/en_speaker_2 (English female)>> Modelfile
echo - v2/ja_speaker_6 (Japanese female)>> Modelfile
echo - v2/es_speaker_3 (Spanish male)>> Modelfile
echo - v2/zh_speaker_5 (Chinese female)>> Modelfile
echo """>> Modelfile

REM Create the model
echo Creating Bark model...
ollama create bark -f Modelfile

REM Clean up
del Modelfile

echo Bark model installation complete! 